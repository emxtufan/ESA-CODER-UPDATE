import { Router, type Request } from "express";
import { and, desc, eq, gte, inArray, isNull, lte, notInArray, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { CURRENCIES, EXPENSE_CATEGORIES } from "../../../shared/enums";
import type { Db } from "../../db/client";
import { projects } from "../../db/schema/core";
import { exchangeRates, expenses, invoices, payments } from "../../db/schema/finance";
import { crudRouter, moneyInt, optStr } from "../../lib/crud";
import { HttpError, parse } from "../../lib/http";
import { recordActivity } from "../../security/audit";
import { requirePermission } from "../../security/guards";
import { notify } from "../notifications/service";
import { convertMinor, todayStr } from "./calc";
import { paidAmount, recalcInvoice } from "./invoices";

const when = z.iso.datetime({ local: true, offset: true }).or(z.iso.date());

const paymentSchema = z.object({
  invoiceId: z.uuid(),
  amount: moneyInt,
  paidAt: when,
  method: optStr,
  reference: optStr,
  notes: optStr,
});

/** Plată: doar pe factură emisă, în moneda facturii, fără să depășească soldul. */
export function paymentsRouter(): Router {
  return crudRouter({
    table: payments,
    entityType: "payment",
    permission: "finance",
    softDelete: true,
    schema: paymentSchema,
    updateSchema: paymentSchema.omit({ invoiceId: true }).partial(),
    searchColumns: [payments.reference, payments.method],
    filters: { invoiceId: payments.invoiceId, method: payments.method, currency: payments.currency },
    sortable: { paidAt: payments.paidAt, amount: payments.amount },
    defaultSort: { column: payments.paidAt, dir: "desc" },
    toRow: async (data: Record<string, unknown>, req: Request) => {
      const db = req.ctx.db;
      const paymentId = req.method === "PATCH" ? String(req.params.id) : undefined;
      const [current] = paymentId ? await db.select().from(payments).where(eq(payments.id, paymentId)) : [];
      const invoiceId = (data.invoiceId as string | undefined) ?? current?.invoiceId;
      if (!invoiceId) throw new HttpError(404, "not_found", "Plata nu există");
      const [invoice] = await db.select().from(invoices).where(and(eq(invoices.id, invoiceId), isNull(invoices.deletedAt)));
      if (!invoice) throw new HttpError(422, "validation_error", "Factura nu există", { invoiceId: "Factura nu există" });
      if (invoice.status === "Draft" || invoice.status === "Cancelled") {
        throw new HttpError(409, "invoice_not_payable", "Plățile se înregistrează doar pe facturi emise");
      }
      const amount = (data.amount as number | undefined) ?? current?.amount ?? 0;
      if (amount <= 0) throw new HttpError(422, "validation_error", "Suma trebuie să fie pozitivă", { amount: "Suma trebuie să fie pozitivă" });
      const balance = invoice.total - (await paidAmount(db, invoiceId, paymentId));
      if (amount > balance) throw new HttpError(422, "validation_error", "Plata depășește soldul facturii", { amount: "Plata depășește soldul facturii" });
      const row: Record<string, unknown> = { ...data, currency: invoice.currency };
      if (data.paidAt) row.paidAt = new Date(data.paidAt as string);
      return row;
    },
    afterCreate: async (row: typeof payments.$inferSelect, req: Request) => {
      const db = req.ctx.db;
      await recalcInvoice(db, row.invoiceId);
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, row.invoiceId));
      await recordActivity(db, {
        projectId: invoice?.projectId,
        clientId: invoice?.clientId,
        actorId: req.auth?.user.id,
        type: "payment",
        description: `Plată înregistrată pe factura ${invoice?.number ?? ""}`,
        entityType: "invoice",
        entityId: row.invoiceId,
      });
      await notify(db, req.ctx.env, {
        event: "Payment Received",
        dedupeKey: `payment:${row.id}`,
        title: `Plată primită pe factura ${invoice?.number ?? ""}`,
        link: "/finance",
      });
    },
    afterUpdate: async (row: typeof payments.$inferSelect, req: Request) => recalcInvoice(req.ctx.db, row.invoiceId),
    afterDelete: async (row: typeof payments.$inferSelect, req: Request) => recalcInvoice(req.ctx.db, row.invoiceId),
  } as never);
}

const expenseSchema = z.object({
  name: z.string().trim().min(1),
  category: z.enum(EXPENSE_CATEGORIES),
  supplier: optStr,
  projectId: z.uuid().nullable().optional(),
  amount: moneyInt,
  currency: z.enum(CURRENCIES),
  spentAt: when,
  recurring: z.boolean().optional(),
});

export function expensesRouter(): Router {
  return crudRouter({
    table: expenses,
    entityType: "expense",
    permission: "finance",
    softDelete: true,
    schema: expenseSchema,
    searchColumns: [expenses.name, expenses.supplier],
    filters: { category: expenses.category, projectId: expenses.projectId, currency: expenses.currency },
    sortable: { name: expenses.name, amount: expenses.amount, spentAt: expenses.spentAt },
    defaultSort: { column: expenses.spentAt, dir: "desc" },
    toRow: (data: Record<string, unknown>) => (data.spentAt ? { ...data, spentAt: new Date(data.spentAt as string) } : data),
    listTransform: (async (rows: (typeof expenses.$inferSelect)[], req: Request) => {
      const ids = [...new Set(rows.map((r) => r.projectId).filter((v): v is string => Boolean(v)))];
      const names = ids.length
        ? await req.ctx.db.select({ id: projects.id, name: projects.name }).from(projects).where(inArray(projects.id, ids))
        : [];
      const byId = new Map(names.map((p) => [p.id, p.name]));
      return rows.map((r) => ({ ...r, projectName: r.projectId ? (byId.get(r.projectId) ?? null) : null }));
    }) as never,
  } as never);
}

const rateSchema = z
  .object({
    date: z.iso.date(),
    fromCurrency: z.enum(CURRENCIES),
    toCurrency: z.enum(CURRENCIES),
    rate: z.coerce.number().positive().transform(String),
    source: optStr,
  })
  .refine((v) => v.fromCurrency !== v.toCurrency, { path: ["toCurrency"], message: "Monedele trebuie să difere" });

export function ratesRouter(): Router {
  return crudRouter({
    table: exchangeRates,
    entityType: "exchange_rate",
    permission: "finance",
    schema: rateSchema as never,
    updateSchema: z.object({ rate: z.coerce.number().positive().transform(String).optional(), source: optStr }),
    searchColumns: [exchangeRates.source],
    filters: { fromCurrency: exchangeRates.fromCurrency, toCurrency: exchangeRates.toCurrency },
    sortable: { date: exchangeRates.date },
    defaultSort: { column: exchangeRates.date, dir: "desc" },
  } as never);
}

/** Cel mai recent curs de la `date` sau dinainte; direct sau invers. Fără curs → null, nu estimare. */
async function findRate(db: Db, from: string, to: string, date: string) {
  const latest = (a: string, b: string) =>
    db
      .select()
      .from(exchangeRates)
      .where(and(eq(exchangeRates.fromCurrency, a as never), eq(exchangeRates.toCurrency, b as never), lte(exchangeRates.date, date)))
      .orderBy(desc(exchangeRates.date))
      .limit(1);
  const [direct] = await latest(from, to);
  const [inverse] = await latest(to, from);
  if (direct && (!inverse || direct.date >= inverse.date)) return { rate: Number(direct.rate), date: direct.date };
  if (inverse) return { rate: 1 / Number(inverse.rate), date: inverse.date };
  return null;
}

const summaryQuery = z.object({
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  clientId: z.uuid().optional(),
  projectId: z.uuid().optional(),
  convertTo: z.enum(CURRENCIES).optional(),
  rateDate: z.iso.date().optional(),
});
type SummaryQuery = z.infer<typeof summaryQuery>;

const num = (v: unknown) => Number(v ?? 0);
const dayEnd = (d: string) => new Date(`${d}T23:59:59.999Z`);
const dayStart = (d: string) => new Date(`${d}T00:00:00.000Z`);

/** Filtrele comune pe factură: fără Draft/Cancelled, cu client/proiect. */
function invoiceConds(q: SummaryQuery): SQL[] {
  const conds: SQL[] = [isNull(invoices.deletedAt), notInArray(invoices.status, ["Draft", "Cancelled"])];
  if (q.clientId) conds.push(eq(invoices.clientId, q.clientId));
  if (q.projectId) conds.push(eq(invoices.projectId, q.projectId));
  return conds;
}

function expenseConds(q: SummaryQuery): SQL[] {
  const conds: SQL[] = [isNull(expenses.deletedAt)];
  if (q.from) conds.push(gte(expenses.spentAt, dayStart(q.from)));
  if (q.to) conds.push(lte(expenses.spentAt, dayEnd(q.to)));
  if (q.projectId) conds.push(eq(expenses.projectId, q.projectId));
  if (q.clientId) {
    conds.push(inArray(expenses.projectId, projectsOfClient(q.clientId)));
  }
  return conds;
}

function projectsOfClient(clientId: string) {
  return sql`(select ${projects.id} from ${projects} where ${projects.clientId} = ${clientId})` as never;
}

/** Evidență separată pe monedă. Venit = facturat fără TVA; profit = venit − cheltuieli directe. */
export function financeRouter(): Router {
  const router = Router();

  router.get("/summary", requirePermission("finance.view"), async (req, res) => {
    const db = req.ctx.db;
    const q = parse(summaryQuery, req.query);
    const issued = [...invoiceConds(q)];
    if (q.from) issued.push(gte(invoices.issueDate, q.from));
    if (q.to) issued.push(lte(invoices.issueDate, q.to));

    const invoiced = await db
      .select({ currency: invoices.currency, revenue: sql<string>`sum(${invoices.subtotal})`, invoiced: sql<string>`sum(${invoices.total})` })
      .from(invoices)
      .where(and(...issued))
      .groupBy(invoices.currency);
    const paidOnIssued = await db
      .select({ currency: invoices.currency, paid: sql<string>`sum(${payments.amount})` })
      .from(payments)
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .where(and(isNull(payments.deletedAt), ...issued))
      .groupBy(invoices.currency);
    const collectedConds = [isNull(payments.deletedAt), ...invoiceConds(q)];
    if (q.from) collectedConds.push(gte(payments.paidAt, dayStart(q.from)));
    if (q.to) collectedConds.push(lte(payments.paidAt, dayEnd(q.to)));
    const collected = await db
      .select({ currency: invoices.currency, collected: sql<string>`sum(${payments.amount})` })
      .from(payments)
      .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
      .where(and(...collectedConds))
      .groupBy(invoices.currency);
    const spent = await db
      .select({ currency: expenses.currency, expenses: sql<string>`sum(${expenses.amount})` })
      .from(expenses)
      .where(and(...expenseConds(q)))
      .groupBy(expenses.currency);

    const currencies = [...new Set([...invoiced, ...collected, ...spent].map((r) => r.currency))].sort();
    const rows = await Promise.all(
      currencies.map(async (currency) => {
        const inv = invoiced.find((r) => r.currency === currency);
        const revenue = num(inv?.revenue);
        const total = num(inv?.invoiced);
        const exp = num(spent.find((r) => r.currency === currency)?.expenses);
        const profit = revenue - exp;
        let converted: { currency: string; profit: number; rate: number; rateDate: string } | null = null;
        if (q.convertTo && q.convertTo !== currency) {
          const found = await findRate(db, currency, q.convertTo, q.rateDate ?? todayStr());
          if (found) converted = { currency: q.convertTo, profit: convertMinor(profit, found.rate), rate: found.rate, rateDate: found.date };
        }
        return {
          currency,
          revenue,
          invoiced: total,
          collected: num(collected.find((r) => r.currency === currency)?.collected),
          outstanding: total - num(paidOnIssued.find((r) => r.currency === currency)?.paid),
          expenses: exp,
          profit,
          converted,
        };
      }),
    );
    res.json({ items: rows });
  });

  router.get("/by-project", requirePermission("finance.profitability"), async (req, res) => {
    const db = req.ctx.db;
    const q = parse(summaryQuery, req.query);
    const issued = [...invoiceConds(q)];
    if (q.from) issued.push(gte(invoices.issueDate, q.from));
    if (q.to) issued.push(lte(invoices.issueDate, q.to));
    const revenue = await db
      .select({ projectId: invoices.projectId, currency: invoices.currency, revenue: sql<string>`sum(${invoices.subtotal})` })
      .from(invoices)
      .where(and(...issued))
      .groupBy(invoices.projectId, invoices.currency);
    const spent = await db
      .select({ projectId: expenses.projectId, currency: expenses.currency, expenses: sql<string>`sum(${expenses.amount})` })
      .from(expenses)
      .where(and(...expenseConds(q)))
      .groupBy(expenses.projectId, expenses.currency);
    const keys = new Map<string, { projectId: string; currency: string; revenue: number; expenses: number }>();
    const slot = (projectId: string, currency: string) => {
      const key = `${projectId}|${currency}`;
      if (!keys.has(key)) keys.set(key, { projectId, currency, revenue: 0, expenses: 0 });
      return keys.get(key)!;
    };
    for (const r of revenue) if (r.projectId) slot(r.projectId, r.currency).revenue = num(r.revenue);
    for (const r of spent) if (r.projectId) slot(r.projectId, r.currency).expenses = num(r.expenses);
    const ids = [...new Set([...keys.values()].map((r) => r.projectId))];
    const names = ids.length ? await db.select({ id: projects.id, name: projects.name }).from(projects).where(inArray(projects.id, ids)) : [];
    const byId = new Map(names.map((p) => [p.id, p.name]));
    const items = [...keys.values()]
      .map((r) => ({ ...r, projectName: byId.get(r.projectId) ?? null, profit: r.revenue - r.expenses }))
      .sort((a, b) => b.profit - a.profit);
    res.json({ items });
  });

  return router;
}
