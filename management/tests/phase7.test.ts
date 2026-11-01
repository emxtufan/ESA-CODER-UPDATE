import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { strFromU8, unzipSync } from "fflate";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { tasks } from "../server/db/schema/core";
import { incidents, monitoringChecks, monitoringResults, notificationLogs } from "../server/db/schema/ops";
import { periodKey, runDailyChecks } from "../server/jobs/daily";
import { runDueChecks } from "../server/jobs/scheduler";
import { lastMonths } from "../server/modules/dashboard/routes";
import { checkUrl, isBlockedAddress, runCheck, type CheckResult } from "../server/modules/monitoring/check";
import { toCsv, toXlsx } from "../server/modules/reports/export";
import { setup, type Setup } from "./helpers";

let ctx: Setup;
let cookie: string;
let clientId: string;
let projectId: string;
let local: Server;
let localUrl: string;

const up: CheckResult = { ok: true, httpStatus: 200, responseMs: 5, sslExpiresAt: null, dnsOk: true, error: null };
const down: CheckResult = { ok: false, httpStatus: null, responseMs: null, sslExpiresAt: null, dnsOk: null, error: "Nu răspunde" };

async function newCheck(url = "https://exemplu.test") {
  const res = await ctx.api("/api/monitoring/checks", { method: "POST", cookie, body: { projectId, url } });
  expect(res.status).toBe(201);
  const [row] = await ctx.db.select().from(monitoringChecks).where(eq(monitoringChecks.id, res.json.item.id));
  return row!;
}

describe("faza 7", () => {
  beforeAll(async () => {
    ctx = await setup();
    const user = await ctx.makeUser("super_admin");
    cookie = await ctx.loginAs(user);
    clientId = (await ctx.api("/api/clients", { method: "POST", body: { companyName: "Acme" }, cookie })).json.item.id;
    projectId = (await ctx.api("/api/projects", { method: "POST", cookie, body: { name: "Site", clientId, type: "Landing Page", status: "In Development", priority: "Medium" } })).json.item.id;
    local = createServer((req, res) => {
      if (req.url === "/redirect") {
        res.writeHead(302, { location: "http://169.254.169.254/" }).end();
        return;
      }
      res.writeHead(req.url === "/500" ? 500 : 200).end("ok");
    });
    await new Promise<void>((resolve) => local.listen(0, "127.0.0.1", resolve));
    localUrl = `http://127.0.0.1:${(local.address() as AddressInfo).port}`;
  });
  afterAll(async () => {
    local.close();
    await ctx.close();
  });

  describe("SSRF", () => {
    it("clasifică adresele interne ca blocate", () => {
      for (const ip of ["127.0.0.1", "10.1.2.3", "192.168.0.1", "172.16.0.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fe80::1", "fc00::1", "::ffff:127.0.0.1", "nu-e-ip"]) {
        expect(isBlockedAddress(ip), ip).toBe(true);
      }
      for (const ip of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"]) expect(isBlockedAddress(ip), ip).toBe(false);
    });

    it("refuză literal IP intern, forme ocolite și alte protocoale", async () => {
      for (const url of ["http://127.0.0.1/", "http://[::1]/", "http://2130706433/", "http://0x7f.0.0.1/", "http://169.254.169.254/latest/meta-data/", "ftp://exemplu.test/", "file:///etc/passwd"]) {
        const result = await checkUrl(url);
        expect(result.ok, url).toBe(false);
        expect(result.error, url).toBe("Adresă nepermisă");
      }
    });

    it("blochează numele care se rezolvă la localhost", async () => {
      const result = await checkUrl("http://localhost:9/");
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Adresă nepermisă");
    });

    it("nu urmărește redirecturi", async () => {
      const result = await checkUrl(`${localUrl}/redirect`, { allowPrivate: true });
      expect(result.httpStatus).toBe(302);
    });

    it("API-ul refuză URL fără http(s)", async () => {
      const res = await ctx.api("/api/monitoring/checks", { method: "POST", cookie, body: { projectId, url: "ftp://exemplu.test" } });
      expect(res.status).toBe(422);
    });
  });

  it("măsoară status și timp de răspuns", async () => {
    const ok = await checkUrl(localUrl, { allowPrivate: true });
    expect(ok).toMatchObject({ ok: true, httpStatus: 200, dnsOk: true, error: null });
    expect(ok.responseMs).toBeGreaterThanOrEqual(0);
    const bad = await checkUrl(`${localUrl}/500`, { allowPrivate: true });
    expect(bad).toMatchObject({ ok: false, httpStatus: 500, error: "HTTP 500" });
  });

  it("alarmează după două eșecuri, deschide incident și îl închide la revenire", async () => {
    const check = await newCheck("https://cazut.test");
    await runCheck(ctx.db, ctx.env, check, async () => up);
    const reload = async () => (await ctx.db.select().from(monitoringChecks).where(eq(monitoringChecks.id, check.id)))[0]!;
    await runCheck(ctx.db, ctx.env, await reload(), async () => down);
    expect((await reload()).lastStatus).toBe("up");
    await runCheck(ctx.db, ctx.env, await reload(), async () => down);
    expect((await reload()).lastStatus).toBe("down");
    const name = "https://cazut.test nu răspunde";
    const open = await ctx.db.select().from(incidents).where(and(eq(incidents.name, name), eq(incidents.status, "Open")));
    expect(open).toHaveLength(1);
    await runCheck(ctx.db, ctx.env, await reload(), async () => down);
    expect(await ctx.db.select().from(incidents).where(eq(incidents.name, name))).toHaveLength(1);
    await runCheck(ctx.db, ctx.env, await reload(), async () => up);
    const [closed] = await ctx.db.select().from(incidents).where(eq(incidents.name, name));
    expect(closed).toMatchObject({ status: "Resolved", resolution: "Revenit automat" });
    expect(closed!.endedAt).not.toBeNull();
    const logs = await ctx.db.select().from(notificationLogs).where(eq(notificationLogs.event, "Server Down"));
    expect(logs.length).toBeGreaterThan(0);
  });

  it("rulează doar verificările ajunse la termen și activate", async () => {
    await ctx.db.update(monitoringChecks).set({ enabled: false });
    const check = await newCheck("http://127.0.0.1:9/");
    expect(await runDueChecks(ctx.db, ctx.env)).toBe(1);
    expect(await runDueChecks(ctx.db, ctx.env)).toBe(0);
    const results = await ctx.db.select().from(monitoringResults).where(eq(monitoringResults.checkId, check.id));
    expect(results[0]!.error).toBe("Adresă nepermisă");
    await ctx.db.update(monitoringChecks).set({ enabled: false });
  });

  it("serverele fără agent sunt raportate neconectate", async () => {
    await ctx.api("/api/servers", { method: "POST", cookie, body: { name: "VPS", provider: "Hetzner", type: "VPS" } });
    const res = await ctx.api("/api/monitoring/servers", { cookie });
    expect(res.status).toBe(200);
    for (const row of res.json.items) expect(row.agent).toBe("not_connected");
  });

  it("incident manual cu validare", async () => {
    const ok = await ctx.api("/api/monitoring/incidents", { method: "POST", cookie, body: { name: "Downtime", severity: "Critical", status: "Open", projectId, startedAt: "2026-03-05T10:00" } });
    expect(ok.status).toBe(201);
    expect((await ctx.api("/api/monitoring/incidents", { method: "POST", cookie, body: { name: "X", severity: "Foarte", status: "Open" } })).status).toBe(422);
  });

  describe("job zilnic", () => {
    const now = new Date("2026-06-15T12:00:00Z");

    it("anunță termene o singură dată, inclusiv la rulări repetate", async () => {
      const res = await ctx.api("/api/tasks", { method: "POST", cookie, body: { title: "Restant", projectId, priority: "High", status: "To Do", due: "2026-06-01" } });
      expect(res.status).toBe(201);
      const dom = await ctx.api("/api/domains", { method: "POST", cookie, body: { domain: `exp-${Date.now()}.ro`, expirationDate: "2026-06-20" } });
      expect(dom.status).toBe(201);
      await runDailyChecks(ctx.db, ctx.env, now);
      await runDailyChecks(ctx.db, ctx.env, now);
      const overdue = await ctx.db.select().from(notificationLogs).where(eq(notificationLogs.dedupeKey, `task-overdue:${res.json.item.id}:2026-06-01`));
      expect(overdue).toHaveLength(1);
      const domain = await ctx.db.select().from(notificationLogs).where(eq(notificationLogs.dedupeKey, `domain:${dom.json.item.id}:2026-06-20`));
      expect(domain).toHaveLength(1);
    });

    it("creează taskul recurent o singură dată per perioadă", async () => {
      await ctx.api("/api/maintenance/plans", { method: "POST", cookie, body: { projectId, plan: "Basic", monthlyPrice: 1000, currency: "RON", frequency: "Lunar", includedServices: ["Backup"] } });
      await runDailyChecks(ctx.db, ctx.env, now);
      await runDailyChecks(ctx.db, ctx.env, now);
      const rows = await ctx.db.select().from(tasks).where(eq(tasks.title, "Mentenanță Site 2026-06"));
      expect(rows).toHaveLength(1);
      expect(rows[0]!.description).toBe("Backup");
    });

    it("cheia perioadei", () => {
      expect(periodKey("Lunar", now)).toBe("2026-06");
      expect(periodKey("Trimestrial", now)).toBe("2026-T2");
      expect(periodKey("Anual", now)).toBe("2026");
      expect(periodKey("Când e nevoie", now)).toBeNull();
    });
  });

  describe("rapoarte", () => {
    it("CSV neutralizează formulele și păstrează diacriticele", () => {
      const csv = toCsv({ columns: [{ key: "a", label: "Coloană" }], rows: [{ a: "=HYPERLINK(1)" }, { a: 'x,"y"' }, { a: 12.5 }, { a: null }] });
      expect(csv.charCodeAt(0)).toBe(0xfeff);
      expect(csv).toContain("'=HYPERLINK(1)");
      expect(csv).toContain('"x,""y"""');
      expect(csv).toContain("Coloană");
    });

    it("XLSX e un zip valid, cu text escapat și numere", () => {
      const files = unzipSync(toXlsx({ columns: [{ key: "a", label: "A" }, { key: "b", label: "B" }], rows: [{ a: "<x>&", b: 3.5 }] }));
      const sheet = strFromU8(files["xl/worksheets/sheet1.xml"]!);
      expect(sheet).toContain("&lt;x&gt;&amp;");
      expect(sheet).toContain('<c r="B2"><v>3.5</v></c>');
      expect(files["[Content_Types].xml"]).toBeDefined();
    });

    it("toate rapoartele răspund, cu rânduri și coloane", async () => {
      for (const type of ["projects", "clients", "revenue", "expenses", "profitability", "maintenance", "tasks", "server-costs", "domain-renewals"]) {
        const res = await ctx.api(`/api/reports/${type}`, { cookie });
        expect(res.status, type).toBe(200);
        expect(Array.isArray(res.json.rows), type).toBe(true);
        expect(res.json.columns.length, type).toBeGreaterThan(0);
      }
      expect((await ctx.api("/api/reports/inexistent", { cookie })).status).toBe(404);
      expect((await ctx.api("/api/reports/constructor", { cookie })).status).toBe(404);
    });

    it("filtrează și exportă atașament", async () => {
      const filtered = await ctx.api(`/api/reports/projects?status=Archived`, { cookie });
      expect(filtered.json.rows).toHaveLength(0);
      const csv = await fetch(`${ctx.url}/api/reports/projects?format=csv`, { headers: { cookie } });
      expect(csv.headers.get("content-disposition")).toContain("raport-projects.csv");
      expect(await csv.text()).toContain("Site");
      const xlsx = await fetch(`${ctx.url}/api/reports/projects?format=xlsx`, { headers: { cookie } });
      expect(strFromU8(unzipSync(new Uint8Array(await xlsx.arrayBuffer()))["xl/worksheets/sheet1.xml"]!)).toContain("Site");
    });

    it("rapoartele financiare cer permisiune financiară", async () => {
      const dev = await ctx.loginAs(await ctx.makeUser("developer"));
      const res = await ctx.api("/api/reports/revenue", { cookie: dev });
      expect(res.status).toBe(403);
    });
  });

  describe("dashboard", () => {
    it("lunile sunt continue, fără dublură la sfârșit de lună", () => {
      const months = lastMonths(new Date("2026-03-31T12:00:00Z"));
      expect(months).toHaveLength(12);
      expect(months[0]).toBe("2025-04");
      expect(months[11]).toBe("2026-03");
      expect(new Set(months).size).toBe(12);
    });

    it("calculează din baza de date, separat pe monedă", async () => {
      const today = new Date().toISOString().slice(0, 10);
      const make = async (number: string, currency: string, unitPrice: number) => {
        const inv = await ctx.api("/api/invoices", { method: "POST", cookie, body: { number, clientId, issueDate: today, dueDate: "2099-01-01", currency, items: [{ description: "x", quantity: 1, unitPrice, vatRateBp: 0 }] } });
        await ctx.api(`/api/invoices/${inv.json.item.id}/issue`, { method: "POST", cookie });
        return inv.json.item.id as string;
      };
      const ron = await make("D-1", "RON", 10000);
      await make("D-2", "EUR", 5000);
      await ctx.api("/api/payments", { method: "POST", cookie, body: { invoiceId: ron, amount: 10000, paidAt: today } });
      await ctx.api("/api/expenses", { method: "POST", cookie, body: { name: "Hosting", category: "Hosting", amount: 2000, currency: "RON", spentAt: today } });
      const res = await ctx.api("/api/dashboard", { cookie });
      expect(res.status).toBe(200);
      const byCurrency = (c: string) => res.json.finance.currencies.find((r: { currency: string }) => r.currency === c);
      expect(byCurrency("RON")).toMatchObject({ revenue: 10000, collected: 10000, outstanding: 0, expenses: 2000, profit: 8000, monthRevenue: 10000 });
      expect(byCurrency("EUR")).toMatchObject({ revenue: 5000, collected: 0, outstanding: 5000, expenses: 0 });
      expect(byCurrency("RON").series).toHaveLength(12);
      expect(byCurrency("RON").series[11]).toMatchObject({ revenue: 10000, expenses: 2000 });
      expect(res.json.finance.invoices).toMatchObject({ paid: 1, unpaid: 1 });
      expect(res.json.projects.development).toBeGreaterThanOrEqual(1);
      expect(res.json.projects.clients).toBeGreaterThanOrEqual(1);
      expect(res.json.integrations).toMatchObject({ email: false, githubToken: false });
      expect(JSON.stringify(res.json.integrations)).not.toContain(ctx.env.VAULT_MASTER_KEY ?? "—");
    });

    it("ascunde secțiunile fără permisiune", async () => {
      const dev = await ctx.loginAs(await ctx.makeUser("developer"));
      const res = await ctx.api("/api/dashboard", { cookie: dev });
      expect(res.status).toBe(200);
      expect(res.json.finance).toBeNull();
    });
  });
});
