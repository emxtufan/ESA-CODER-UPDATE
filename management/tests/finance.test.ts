import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { auditLogs } from "../server/db/schema/auth";
import { deriveStatus, invoiceTotals, lineNet } from "../server/modules/finance/calc";
import { setup, type Setup } from "./helpers";

let ctx: Setup;
let cookie: string;
let clientId: string;
let projectId: string;
let seq = 0;

const item = { description: "Dezvoltare", quantity: 2, unitPrice: 10000, vatRateBp: 1900 };

async function createInvoice(over: Record<string, unknown> = {}) {
  seq += 1;
  return ctx.api("/api/invoices", {
    method: "POST",
    cookie,
    body: { number: `F-${seq}`, clientId, projectId, issueDate: "2026-01-10", dueDate: "2099-01-10", currency: "RON", items: [item], ...over },
  });
}

async function issued(over: Record<string, unknown> = {}) {
  const created = await createInvoice(over);
  expect(created.status).toBe(201);
  const res = await ctx.api(`/api/invoices/${created.json.item.id}/issue`, { method: "POST", cookie });
  expect(res.status).toBe(200);
  return res.json.item;
}

const pay = (invoiceId: string, amount: number) =>
  ctx.api("/api/payments", { method: "POST", cookie, body: { invoiceId, amount, paidAt: "2026-01-15" } });

const statusOf = async (id: string) => (await ctx.api(`/api/invoices/${id}`, { cookie })).json.item;

describe("calcule", () => {
  it("calculează pe întregi, cu cantități fracționare", () => {
    expect(lineNet(1.5, 3333)).toBe(5000);
    expect(lineNet(0.1, 3)).toBe(0);
    expect(invoiceTotals([{ description: "x", quantity: 3, unitPrice: 3333, vatRateBp: 1900 }])).toEqual({ subtotal: 9999, vat: 1900, total: 11899 });
  });

  it("derivă statusul din sume și scadență", () => {
    const today = "2026-06-01";
    expect(deriveStatus("Draft", 100, 100, "2026-01-01", today)).toBe("Draft");
    expect(deriveStatus("Cancelled", 100, 0, "2026-01-01", today)).toBe("Cancelled");
    expect(deriveStatus("Issued", 100, 100, "2026-01-01", today)).toBe("Paid");
    expect(deriveStatus("Issued", 100, 40, "2026-12-01", today)).toBe("Partially Paid");
    expect(deriveStatus("Partially Paid", 100, 40, "2026-01-01", today)).toBe("Overdue");
    expect(deriveStatus("Paid", 100, 0, "2026-12-01", today)).toBe("Issued");
  });
});

describe("finanțe", () => {
  beforeAll(async () => {
    ctx = await setup();
    const user = await ctx.makeUser("super_admin");
    cookie = await ctx.loginAs(user);
    clientId = (await ctx.api("/api/clients", { method: "POST", body: { companyName: "Acme" }, cookie })).json.item.id;
    projectId = (
      await ctx.api("/api/projects", {
        method: "POST",
        cookie,
        body: { name: "Site", clientId, type: "Landing Page", status: "Planned", priority: "Medium" },
      })
    ).json.item.id;
  });
  afterAll(() => ctx.close());

  it("calculează totalurile pe server, ignorând ce trimite clientul", async () => {
    const res = await createInvoice({ total: 1, subtotal: 1, status: "Paid" });
    expect(res.status).toBe(201);
    expect(res.json.item).toMatchObject({ subtotal: 20000, vat: 3800, total: 23800, status: "Draft" });
  });

  it("refuză număr duplicat, scadență înainte de emitere și proiect străin", async () => {
    const first = await createInvoice();
    const dup = await createInvoice({ number: first.json.item.number });
    expect(dup.status).toBe(409);
    expect((await createInvoice({ dueDate: "2026-01-01" })).status).toBe(422);
    const other = await ctx.api("/api/clients", { method: "POST", body: { companyName: "Alt client" }, cookie });
    expect((await createInvoice({ clientId: other.json.item.id })).status).toBe(422);
    expect((await createInvoice({ items: [] })).status).toBe(422);
  });

  it("nu modifică și nu șterge o factură emisă; un Draft se poate șterge", async () => {
    const inv = await issued();
    const patch = await ctx.api(`/api/invoices/${inv.id}`, {
      method: "PATCH",
      cookie,
      body: { number: inv.number, clientId, issueDate: "2026-01-10", dueDate: "2099-01-10", currency: "RON", items: [item] },
    });
    expect(patch.status).toBe(409);
    expect((await ctx.api(`/api/invoices/${inv.id}`, { method: "DELETE", cookie })).status).toBe(409);
    const draft = await createInvoice();
    expect((await ctx.api(`/api/invoices/${draft.json.item.id}`, { method: "DELETE", cookie })).status).toBe(204);
    expect((await ctx.api(`/api/invoices/${draft.json.item.id}`, { cookie })).status).toBe(404);
  });

  it("modifică un Draft și înlocuiește liniile", async () => {
    const draft = await createInvoice();
    const res = await ctx.api(`/api/invoices/${draft.json.item.id}`, {
      method: "PATCH",
      cookie,
      body: { number: draft.json.item.number, clientId, issueDate: "2026-01-10", dueDate: "2099-01-10", currency: "RON", items: [{ ...item, quantity: 1 }] },
    });
    expect(res.status).toBe(200);
    expect(res.json.item.total).toBe(11900);
    expect((await statusOf(draft.json.item.id)).items).toHaveLength(1);
  });

  it("plăți parțiale: sold și status se recalculează, inclusiv la ștergere", async () => {
    const inv = await issued();
    expect((await pay(inv.id, 10000)).status).toBe(201);
    let now = await statusOf(inv.id);
    expect(now).toMatchObject({ status: "Partially Paid", paid: 10000, balance: 13800 });
    const second = await pay(inv.id, 13800);
    expect(second.status).toBe(201);
    now = await statusOf(inv.id);
    expect(now).toMatchObject({ status: "Paid", balance: 0 });
    expect((await ctx.api(`/api/payments/${second.json.item.id}`, { method: "DELETE", cookie })).status).toBe(204);
    expect((await statusOf(inv.id)).status).toBe("Partially Paid");
  });

  it("refuză plata peste sold, zero, pe Draft și pe anulată", async () => {
    const inv = await issued();
    expect((await pay(inv.id, 23801)).status).toBe(422);
    expect((await pay(inv.id, 0)).status).toBe(422);
    const draft = await createInvoice();
    expect((await pay(draft.json.item.id, 100)).status).toBe(409);
    const toCancel = await issued();
    expect((await ctx.api(`/api/invoices/${toCancel.id}/cancel`, { method: "POST", cookie })).status).toBe(200);
    expect((await pay(toCancel.id, 100)).status).toBe(409);
    expect((await statusOf(toCancel.id)).balance).toBe(0);
  });

  it("la modificarea plății, soldul exclude plata însăși", async () => {
    const inv = await issued();
    const p = await pay(inv.id, 23800);
    const ok = await ctx.api(`/api/payments/${p.json.item.id}`, { method: "PATCH", cookie, body: { amount: 23800 } });
    expect(ok.status).toBe(200);
    const over = await ctx.api(`/api/payments/${p.json.item.id}`, { method: "PATCH", cookie, body: { amount: 23801 } });
    expect(over.status).toBe(422);
  });

  it("plata moștenește moneda facturii", async () => {
    const inv = await issued({ currency: "EUR" });
    const res = await ctx.api("/api/payments", { method: "POST", cookie, body: { invoiceId: inv.id, amount: 100, currency: "RON", paidAt: "2026-01-15" } });
    expect(res.status).toBe(201);
    expect(res.json.item.currency).toBe("EUR");
  });

  it("anularea e refuzată dacă există plăți", async () => {
    const inv = await issued();
    await pay(inv.id, 100);
    expect((await ctx.api(`/api/invoices/${inv.id}/cancel`, { method: "POST", cookie })).status).toBe(409);
  });

  it("factura scadentă devine Overdue la citire", async () => {
    const inv = await issued({ issueDate: "2020-01-01", dueDate: "2020-02-01" });
    expect(inv.status).toBe("Overdue");
    const list = await ctx.api("/api/invoices?status=Overdue", { cookie });
    expect(list.json.items.some((r: { id: string }) => r.id === inv.id)).toBe(true);
  });

  it("schimbările financiare ajung în audit", async () => {
    const inv = await issued();
    const rows = await ctx.db.select().from(auditLogs).where(eq(auditLogs.entityId, inv.id));
    expect(rows.map((r) => r.action)).toEqual(expect.arrayContaining(["invoice_create", "invoice_issue"]));
  });

  it("rezumatul ține monedele separate și convertește doar cu curs datat", async () => {
    const fresh = await ctx.api("/api/clients", { method: "POST", body: { companyName: "Rezumat" }, cookie });
    const id = fresh.json.item.id;
    const ron = await issued({ clientId: id, projectId: null });
    await pay(ron.id, 10000);
    await issued({ clientId: id, projectId: null, currency: "EUR" });
    const project = await ctx.api("/api/projects", {
      method: "POST",
      cookie,
      body: { name: "P", clientId: id, type: "Landing Page", status: "Planned", priority: "Medium" },
    });
    const expense = await ctx.api("/api/expenses", {
      method: "POST",
      cookie,
      body: { name: "Server", category: "Hosting", amount: 5000, currency: "RON", spentAt: "2026-01-12", projectId: project.json.item.id },
    });
    expect(expense.status).toBe(201);

    const noRate = await ctx.api(`/api/finance/summary?clientId=${id}&convertTo=RON`, { cookie });
    const eur = noRate.json.items.find((r: { currency: string }) => r.currency === "EUR");
    const r = noRate.json.items.find((x: { currency: string }) => x.currency === "RON");
    expect(noRate.json.items).toHaveLength(2);
    expect(r).toMatchObject({ revenue: 20000, invoiced: 23800, collected: 10000, outstanding: 13800, expenses: 5000, profit: 15000 });
    expect(eur).toMatchObject({ revenue: 20000, expenses: 0, converted: null });

    const rate = await ctx.api("/api/exchange-rates", { method: "POST", cookie, body: { date: "2026-01-01", fromCurrency: "EUR", toCurrency: "RON", rate: "5" } });
    expect(rate.status).toBe(201);
    const before = await ctx.api(`/api/finance/summary?clientId=${id}&convertTo=RON&rateDate=2025-12-31`, { cookie });
    expect(before.json.items.find((x: { currency: string }) => x.currency === "EUR").converted).toBeNull();
    const after = await ctx.api(`/api/finance/summary?clientId=${id}&convertTo=RON&rateDate=2026-02-01`, { cookie });
    expect(after.json.items.find((x: { currency: string }) => x.currency === "EUR").converted).toMatchObject({ currency: "RON", profit: 100000, rateDate: "2026-01-01" });
    const inverse = await ctx.api(`/api/finance/summary?clientId=${id}&convertTo=EUR&rateDate=2026-02-01`, { cookie });
    expect(inverse.json.items.find((x: { currency: string }) => x.currency === "RON").converted.profit).toBe(3000);
  });

  it("refuză curs între aceeași monedă și curs duplicat", async () => {
    const body = { date: "2026-05-01", fromCurrency: "USD", toCurrency: "RON", rate: 4.5 };
    expect((await ctx.api("/api/exchange-rates", { method: "POST", cookie, body: { ...body, toCurrency: "USD" } })).status).toBe(422);
    expect((await ctx.api("/api/exchange-rates", { method: "POST", cookie, body })).status).toBe(201);
    expect((await ctx.api("/api/exchange-rates", { method: "POST", cookie, body })).status).toBe(409);
  });

  it("profit pe proiect", async () => {
    const c = await ctx.api("/api/clients", { method: "POST", body: { companyName: "Profit" }, cookie });
    const p = await ctx.api("/api/projects", {
      method: "POST",
      cookie,
      body: { name: "Profitabil", clientId: c.json.item.id, type: "Landing Page", status: "Planned", priority: "Medium" },
    });
    await issued({ clientId: c.json.item.id, projectId: p.json.item.id });
    await ctx.api("/api/expenses", { method: "POST", cookie, body: { name: "Licență", category: "Licenses", amount: 2000, currency: "RON", spentAt: "2026-01-12", projectId: p.json.item.id } });
    const res = await ctx.api(`/api/finance/by-project?projectId=${p.json.item.id}`, { cookie });
    expect(res.json.items).toEqual([expect.objectContaining({ projectName: "Profitabil", currency: "RON", revenue: 20000, expenses: 2000, profit: 18000 })]);
  });

  it("developer nu vede finanțele", async () => {
    const dev = await ctx.makeUser("developer");
    const devCookie = await ctx.loginAs(dev);
    expect((await ctx.api("/api/invoices", { cookie: devCookie })).status).toBe(403);
    expect((await ctx.api("/api/finance/summary", { cookie: devCookie })).status).toBe(403);
  });
});
