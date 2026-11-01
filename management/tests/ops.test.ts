import { createHmac, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { auditLogs } from "../server/db/schema/auth";
import { notificationLogs, notifications } from "../server/db/schema/ops";
import { verifyLink, signLink } from "../server/modules/documents/files";
import { notify, renderTemplate, retryFailed } from "../server/modules/notifications/service";
import { setup, type Setup } from "./helpers";

let ctx: Setup;
let cookie: string;
let userId: string;
let projectId: string;
let clientId: string;

const PDF = Buffer.from("%PDF-1.7 test");
const fileKey = "b".repeat(64);

function upload(docId: string, data: Buffer, mime: string, withCookie = cookie) {
  return fetch(`${ctx.url}/api/documents/${docId}/versions`, {
    method: "POST",
    headers: {
      cookie: withCookie,
      "content-type": "application/octet-stream",
      "x-file-mime": mime,
      "x-requested-with": "esa",
      origin: ctx.url,
    },
    body: new Uint8Array(data),
  });
}

async function newDocument() {
  const res = await ctx.api("/api/documents", { method: "POST", cookie, body: { name: `Contract ${randomUUID()}`, type: "Contracts", clientId } });
  expect(res.status).toBe(201);
  return res.json.item.id as string;
}

function stubResend(handler: () => Response) {
  const real = globalThis.fetch;
  vi.stubGlobal("fetch", async (input: string | URL, init?: RequestInit) => {
    if (String(input).startsWith("https://api.resend.com")) return handler();
    return real(input, init);
  });
}

describe("operațiuni", () => {
  beforeAll(async () => {
    ctx = await setup();
    ctx.env.FILE_SIGNING_KEY = fileKey;
    const user = await ctx.makeUser("super_admin");
    userId = user.id;
    cookie = await ctx.loginAs(user);
    clientId = (await ctx.api("/api/clients", { method: "POST", body: { companyName: "Acme" }, cookie })).json.item.id;
    projectId = (
      await ctx.api("/api/projects", { method: "POST", cookie, body: { name: "Site", clientId, type: "Landing Page", status: "Planned", priority: "Medium" } })
    ).json.item.id;
  });
  afterAll(() => ctx.close());
  afterEach(() => {
    vi.unstubAllGlobals();
    ctx.env.RESEND_API_KEY = undefined;
    ctx.env.EMAIL_FROM = undefined;
  });

  describe("documente", () => {
    it("versionează fișierele și descarcă versiunea cerută", async () => {
      const id = await newDocument();
      const first = await upload(id, PDF, "application/pdf");
      expect(first.status).toBe(201);
      const firstBody = (await first.json()) as { item: { id: string; version: number; storageKey?: string } };
      expect(firstBody.item.version).toBe(1);
      expect(firstBody.item.storageKey).toBeUndefined();
      const second = await upload(id, Buffer.from("%PDF-2.0 nou"), "application/pdf");
      expect(((await second.json()) as { item: { version: number } }).item.version).toBe(2);

      const versions = await ctx.api(`/api/documents/${id}/versions`, { cookie });
      expect(versions.json.items).toHaveLength(2);
      expect(JSON.stringify(versions.json)).not.toContain("storageKey");

      const current = await fetch(`${ctx.url}/api/documents/${id}/download`, { headers: { cookie } });
      expect(await current.text()).toBe("%PDF-2.0 nou");
      expect(current.headers.get("content-disposition")).toContain("attachment");
      expect(current.headers.get("x-content-type-options")).toBe("nosniff");
      const old = await fetch(`${ctx.url}/api/documents/${id}/download?version=${firstBody.item.id}`, { headers: { cookie } });
      expect(await old.text()).toBe("%PDF-1.7 test");

      const logs = await ctx.db.select().from(auditLogs).where(eq(auditLogs.entityId, id));
      expect(logs.map((l) => l.action)).toEqual(expect.arrayContaining(["document_upload", "document_download"]));
    });

    it("refuză tipuri nepermise și conținut care nu corespunde", async () => {
      const id = await newDocument();
      expect((await upload(id, Buffer.from("<svg onload=alert(1)>"), "image/svg+xml")).status).toBe(415);
      expect((await upload(id, Buffer.from("<html>"), "text/html")).status).toBe(415);
      expect((await upload(id, Buffer.from("<html>"), "application/pdf")).status).toBe(415);
      expect((await upload(id, Buffer.alloc(0), "application/pdf")).status).toBe(422);
    });

    it("nu servește o versiune a altui document", async () => {
      const a = await newDocument();
      const b = await newDocument();
      const up = await upload(a, PDF, "application/pdf");
      const version = ((await up.json()) as { item: { id: string } }).item.id;
      await upload(b, PDF, "application/pdf");
      const res = await fetch(`${ctx.url}/api/documents/${b}/download?version=${version}`, { headers: { cookie } });
      expect(res.status).toBe(404);
    });

    it("linkul temporar merge fără sesiune, dar nu expirat sau modificat", async () => {
      const id = await newDocument();
      await upload(id, PDF, "application/pdf");
      const link = await ctx.api(`/api/documents/${id}/link`, { method: "POST", cookie, body: { minutes: 5 } });
      expect(link.status).toBe(200);
      const ok = await fetch(`${ctx.url}${link.json.url}`);
      expect(ok.status).toBe(200);
      expect(await ok.text()).toBe("%PDF-1.7 test");
      const tampered = String(link.json.url).replace(/sig=(.)/, (_m, c) => `sig=${c === "a" ? "b" : "a"}`);
      expect((await fetch(`${ctx.url}${tampered}`)).status).toBe(403);
      const extended = String(link.json.url).replace(/expires=\d+/, `expires=${Date.now() + 9_999_999}`);
      expect((await fetch(`${ctx.url}${extended}`)).status).toBe(403);
      const v = randomUUID();
      const past = Date.now() - 1000;
      expect(verifyLink(fileKey, v, past, signLink(fileKey, v, past))).toBe(false);
    });

    it("fără cheie de semnare spune clar ce lipsește", async () => {
      const id = await newDocument();
      await upload(id, PDF, "application/pdf");
      ctx.env.FILE_SIGNING_KEY = undefined;
      try {
        const res = await ctx.api(`/api/documents/${id}/link`, { method: "POST", cookie, body: {} });
        expect(res.status).toBe(503);
      } finally {
        ctx.env.FILE_SIGNING_KEY = fileKey;
      }
    });
  });

  describe("notificări", () => {
    it("escapează datele în HTML, nu și în subiect", () => {
      expect(renderTemplate("<b>{{t}}</b>", { t: "<img src=x>" }, true)).toBe("<b>&lt;img src=x&gt;</b>");
      expect(renderTemplate("{{t}}", { t: "A & B" }, false)).toBe("A & B");
    });

    it("creează notificare în aplicație, o singură dată per cheie", async () => {
      const key = `test:${randomUUID()}`;
      const input = { event: "Server Down" as const, dedupeKey: key, title: "Server căzut", link: "/infrastructure" };
      await notify(ctx.db, ctx.env, input);
      await notify(ctx.db, ctx.env, input);
      const logs = await ctx.db.select().from(notificationLogs).where(eq(notificationLogs.dedupeKey, key));
      expect(logs).toHaveLength(1);
      expect(logs[0]!.status).toBe("not_configured");
      const mine = await ctx.db.select().from(notifications).where(eq(notifications.title, "Server căzut"));
      expect(mine).toHaveLength(1);
      expect(mine[0]!.userId).toBe(userId);
    });

    it("evenimentele proprii rămân în aplicație fără regulă explicită", async () => {
      const res = await ctx.api("/api/projects", { method: "POST", cookie, body: { name: "Tăcut", clientId, type: "Landing Page", status: "Planned", priority: "Medium" } });
      const logs = await ctx.db.select().from(notificationLogs).where(eq(notificationLogs.dedupeKey, `project:${res.json.item.id}`));
      expect(logs[0]!.status).toBe("in_app");
    });

    it("trimite email și reîncearcă eșecurile până la limită", async () => {
      ctx.env.RESEND_API_KEY = "re_test";
      ctx.env.EMAIL_FROM = "esa@test.ro";
      let answer = new Response("{}", { status: 500 });
      stubResend(() => answer.clone());
      const key = `retry:${randomUUID()}`;
      await notify(ctx.db, ctx.env, { event: "SSL Expiration", dedupeKey: key, title: "SSL expiră" });
      const [failed] = await ctx.db.select().from(notificationLogs).where(eq(notificationLogs.dedupeKey, key));
      expect(failed!.status).toBe("failed");
      expect(failed!.attempts).toBe(1);
      answer = new Response(JSON.stringify({ id: "m1" }), { status: 200 });
      await retryFailed(ctx.db, ctx.env);
      const [sent] = await ctx.db.select().from(notificationLogs).where(eq(notificationLogs.dedupeKey, key));
      expect(sent!.status).toBe("sent");
      expect(sent!.sentAt).not.toBeNull();
    });

    it("o regulă dezactivată oprește notificarea", async () => {
      const rule = await ctx.api("/api/notification-rules", { method: "POST", cookie, body: { event: "Backup Failed", enabled: false } });
      expect(rule.status).toBe(201);
      const key = `off:${randomUUID()}`;
      await notify(ctx.db, ctx.env, { event: "Backup Failed", dedupeKey: key, title: "Backup" });
      expect(await ctx.db.select().from(notificationLogs).where(eq(notificationLogs.dedupeKey, key))).toHaveLength(0);
    });

    it("frecvența limitează notificările aceluiași eveniment", async () => {
      await ctx.api("/api/notification-rules", { method: "POST", cookie, body: { event: "Invoice Overdue", frequencyMinutes: 60 } });
      const first = `freq:${randomUUID()}`;
      const second = `freq:${randomUUID()}`;
      await notify(ctx.db, ctx.env, { event: "Invoice Overdue", dedupeKey: first, title: "A" });
      await notify(ctx.db, ctx.env, { event: "Invoice Overdue", dedupeKey: second, title: "B" });
      expect(await ctx.db.select().from(notificationLogs).where(eq(notificationLogs.dedupeKey, first))).toHaveLength(1);
      expect(await ctx.db.select().from(notificationLogs).where(eq(notificationLogs.dedupeKey, second))).toHaveLength(0);
    });

    it("Notification Center e izolat pe utilizator", async () => {
      await notify(ctx.db, ctx.env, { event: "Domain Expiration", dedupeKey: `iso:${randomUUID()}`, title: "Domeniu" });
      const list = await ctx.api("/api/notifications", { cookie });
      const target = list.json.items[0];
      const other = await ctx.makeUser("developer");
      const otherCookie = await ctx.loginAs(other);
      expect((await ctx.api("/api/notifications", { cookie: otherCookie })).json.items).toHaveLength(0);
      expect((await ctx.api(`/api/notifications/${target.id}/read`, { method: "POST", cookie: otherCookie })).status).toBe(404);
      const before = (await ctx.api("/api/notifications/unread-count", { cookie })).json.count;
      expect((await ctx.api(`/api/notifications/${target.id}/read`, { method: "POST", cookie })).status).toBe(200);
      expect((await ctx.api("/api/notifications/unread-count", { cookie })).json.count).toBe(before - 1);
    });

    it("emailul de test spune că lipsește configurarea", async () => {
      const res = await ctx.api("/api/notifications/test", { method: "POST", cookie });
      expect(res.status).toBe(503);
    });

    it("jurnalul nu expune conținutul emailurilor", async () => {
      const res = await ctx.api("/api/notification-logs", { cookie });
      expect(res.status).toBe(200);
      expect(JSON.stringify(res.json)).not.toContain("payload");
    });

    it("webhook-ul GitHub anunță deployment-ul eșuat", async () => {
      ctx.env.GITHUB_WEBHOOK_SECRET = "s";
      const name = `n${randomUUID().slice(0, 6)}`;
      const repo = await ctx.api("/api/github/repositories", { method: "POST", cookie, body: { owner: "esa", name, projectId } });
      expect(repo.status).toBe(201);
      const id = Math.floor(Math.random() * 1e9);
      const body = JSON.stringify({ repository: { full_name: `esa/${name}` }, deployment: { id, environment: "prod" }, deployment_status: { state: "failure" } });
      const sig = `sha256=${createHmac("sha256", "s").update(body).digest("hex")}`;
      const res = await fetch(`${ctx.url}/api/webhooks/github`, {
        method: "POST",
        headers: { "x-github-event": "deployment_status", "x-github-delivery": randomUUID(), "x-hub-signature-256": sig, "content-type": "application/json" },
        body,
      });
      expect(res.status).toBe(200);
      const logs = await ctx.db.select().from(notificationLogs).where(eq(notificationLogs.dedupeKey, `deployment:${id}:failed`));
      expect(logs).toHaveLength(1);
    });
  });

  describe("mentenanță și contracte", () => {
    it("plan cu jurnal de intervenții, în timeline", async () => {
      const plan = await ctx.api("/api/maintenance/plans", { method: "POST", cookie, body: { projectId, plan: "Standard", monthlyPrice: 15000, currency: "EUR", includedServices: ["Backup"] } });
      expect(plan.status).toBe(201);
      const log = await ctx.api("/api/maintenance/logs", { method: "POST", cookie, body: { planId: plan.json.item.id, activity: "SSL Checks", notes: "ok" } });
      expect(log.status).toBe(201);
      expect(log.json.item.performedById).toBe(userId);
      expect((await ctx.api(`/api/maintenance/plans?projectId=${projectId}`, { cookie })).json.items[0].projectName).toBe("Site");
      expect((await ctx.api("/api/maintenance/logs", { method: "POST", cookie, body: { planId: plan.json.item.id, activity: "Inventat" } })).status).toBe(422);
    });

    it("contract legat de client", async () => {
      const res = await ctx.api("/api/contracts", { method: "POST", cookie, body: { clientId, title: "Contract cadru", value: 100000, currency: "RON", signedAt: "2026-01-10", expiresAt: "2027-01-10" } });
      expect(res.status).toBe(201);
      expect((await ctx.api(`/api/contracts?clientId=${clientId}`, { cookie })).json.items[0].clientName).toBe("Acme");
    });
  });
});
