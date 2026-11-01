import { Router, type Request } from "express";
import { and, asc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { CURRENCIES } from "../../../shared/enums";
import type { Db } from "../../db/client";
import { clients, projects } from "../../db/schema/core";
import { invoiceItems, invoices, payments } from "../../db/schema/finance";
import { crudRouter, moneyInt, optStr } from "../../lib/crud";
import { HttpError, parse } from "../../lib/http";
import { audit, recordActivity } from "../../security/audit";
import { requirePermission } from "../../security/guards";
import { deriveStatus, invoiceTotals, lineNet, todayStr, type ItemInput } from "./calc";

const MAX_INT = 2_147_483_647;

const itemSchema = z.object({
  description: z.string().trim().min(1),
  quantity: z.coerce.number().positive().max(999_999_999),
  unitPrice: moneyInt,
  vatRateBp: z.coerce.number().int().min(0).max(10000),
});

const invoiceBody = z
  .object({
    number: z.string().trim().min(1),
    clientId: z.uuid(),
    projectId: z.uuid().nullable().optional(),
    issueDate: z.iso.date(),
    dueDate: z.iso.date(),
    currency: z.enum(CURRENCIES),
    externalId: optStr,
    items: z.array(itemSchema).min(1),
  })
  .refine((v) => v.dueDate >= v.issueDate, { path: ["dueDate"], message: "Scadența nu poate fi înainte de emitere" });

type InvoiceBody = z.infer<typeof invoiceBody>;
type InvoiceRow = typeof invoices.$inferSelect;

/** Sumele încasate per factură, doar din plățile nesterse. */
async function paidByInvoice(db: Db, ids: string[]): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({ id: payments.invoiceId, paid: sql<string>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(and(inArray(payments.invoiceId, ids), isNull(payments.deletedAt)))
    .groupBy(payments.invoiceId);
  return new Map(rows.map((r) => [r.id, Number(r.paid)]));
}

const balanceOf = (row: InvoiceRow, paid: number) => (row.status === "Cancelled" ? 0 : row.total - paid);

export async function paidAmount(db: Db, id: string, exceptPaymentId?: string): Promise<number> {
  const conds = [eq(payments.invoiceId, id), isNull(payments.deletedAt)];
  if (exceptPaymentId) conds.push(sql`${payments.id} <> ${exceptPaymentId}`);
  const [row] = await db.select({ paid: sql<string>`coalesce(sum(${payments.amount}), 0)` }).from(payments).where(and(...conds));
  return Number(row?.paid ?? 0);
}

/** Recalculează statusul după orice schimbare de plăți sau emitere. */
export async function recalcInvoice(db: Db, id: string): Promise<void> {
  const [row] = await db.select().from(invoices).where(eq(invoices.id, id));
  if (!row) return;
  const status = deriveStatus(row.status, row.total, await paidAmount(db, id), row.dueDate, todayStr());
  if (status !== row.status) await db.update(invoices).set({ status, updatedAt: new Date() }).where(eq(invoices.id, id));
}

// ponytail: restanțele se marchează la citire, nu din cron; suficient pentru un singur utilizator.
export async function refreshOverdue(db: Db): Promise<void> {
  await db
    .update(invoices)
    .set({ status: "Overdue", updatedAt: new Date() })
    .where(and(inArray(invoices.status, ["Issued", "Partially Paid"]), lt(invoices.dueDate, todayStr()), isNull(invoices.deletedAt)));
}

async function load(db: Db, rawId: unknown): Promise<InvoiceRow> {
  const id = parse(z.uuid(), rawId);
  const [row] = await db.select().from(invoices).where(and(eq(invoices.id, id), isNull(invoices.deletedAt)));
  if (!row) throw new HttpError(404, "not_found", "Factura nu există");
  return row;
}

/** Clientul trebuie să existe, iar proiectul (dacă e ales) să fie al acelui client. */
async function assertRefs(db: Db, body: InvoiceBody): Promise<void> {
  const [client] = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, body.clientId));
  if (!client) throw new HttpError(422, "validation_error", "Clientul nu există", { clientId: "Clientul nu există" });
  if (body.projectId) {
    const [project] = await db.select({ clientId: projects.clientId }).from(projects).where(eq(projects.id, body.projectId));
    if (!project || project.clientId !== body.clientId) {
      throw new HttpError(422, "validation_error", "Proiectul nu aparține clientului", { projectId: "Proiectul nu aparține clientului" });
    }
  }
}

async function assertNumberFree(db: Db, number: string, exceptId?: string): Promise<void> {
  const [row] = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.number, number));
  if (row && row.id !== exceptId) throw new HttpError(409, "invoice_number_taken", `Numărul ${number} este deja folosit`);
}

function totalsOrThrow(items: ItemInput[]) {
  const totals = invoiceTotals(items);
  if (totals.total > MAX_INT) throw new HttpError(422, "amount_too_large", "Suma facturii este prea mare");
  return totals;
}

const itemRows = (invoiceId: string, items: ItemInput[]) =>
  items.map((i) => ({
    invoiceId,
    description: i.description,
    quantity: String(i.quantity),
    unitPrice: i.unitPrice,
    vatRateBp: i.vatRateBp,
    total: lineNet(i.quantity, i.unitPrice),
  }));

function assertDraft(row: InvoiceRow): void {
  if (row.status !== "Draft") throw new HttpError(409, "invoice_not_draft", "Doar o factură Draft se poate modifica");
}

async function attachNames(rows: InvoiceRow[], req: Request) {
  const db = req.ctx.db;
  const clientIds = [...new Set(rows.map((r) => r.clientId))];
  const projectIds = [...new Set(rows.map((r) => r.projectId).filter((v): v is string => Boolean(v)))];
  const clientRows = clientIds.length
    ? await db.select({ id: clients.id, name: clients.companyName }).from(clients).where(inArray(clients.id, clientIds))
    : [];
  const projectRows = projectIds.length
    ? await db.select({ id: projects.id, name: projects.name }).from(projects).where(inArray(projects.id, projectIds))
    : [];
  const clientNames = new Map(clientRows.map((c) => [c.id, c.name]));
  const projectNames = new Map(projectRows.map((p) => [p.id, p.name]));
  const paid = await paidByInvoice(db, rows.map((r) => r.id));
  return rows.map((r) => {
    const sum = paid.get(r.id) ?? 0;
    return {
      ...r,
      clientName: clientNames.get(r.clientId) ?? null,
      projectName: r.projectId ? (projectNames.get(r.projectId) ?? null) : null,
      paid: sum,
      balance: balanceOf(r, sum),
    };
  });
}

/** Facturile: scrierile sunt explicite fiindcă totalurile și liniile merg împreună, în tranzacție. */
export function invoicesRouter(): Router {
  const router = Router();

  router.get("/", requirePermission("finance.view"), async (req, _res, next) => {
    await refreshOverdue(req.ctx.db);
    next();
  });

  router.get("/:id", requirePermission("finance.view"), async (req, res) => {
    const db = req.ctx.db;
    const row = await load(db, req.params.id);
    const [named] = await attachNames([row], req);
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, row.id)).orderBy(asc(invoiceItems.createdAt));
    const paymentRows = await db
      .select()
      .from(payments)
      .where(and(eq(payments.invoiceId, row.id), isNull(payments.deletedAt)))
      .orderBy(asc(payments.paidAt));
    res.json({ item: { ...named, items, payments: paymentRows } });
  });

  router.post("/", requirePermission("finance.create"), async (req, res) => {
    const db = req.ctx.db;
    const body = parse(invoiceBody, req.body);
    await assertRefs(db, body);
    await assertNumberFree(db, body.number);
    const totals = totalsOrThrow(body.items);
    const item = await db.transaction(async (raw) => {
      const tx = raw as unknown as Db;
      const [row] = await tx
        .insert(invoices)
        .values({
          number: body.number,
          clientId: body.clientId,
          projectId: body.projectId ?? null,
          issueDate: body.issueDate,
          dueDate: body.dueDate,
          currency: body.currency,
          externalId: body.externalId ?? null,
          status: "Draft",
          ...totals,
        })
        .returning();
      await tx.insert(invoiceItems).values(itemRows(row!.id, body.items));
      return row!;
    });
    await audit(req, "invoice_create", "invoice", item.id, { number: item.number, total: item.total, currency: item.currency });
    res.status(201).json({ item });
  });

  router.patch("/:id", requirePermission("finance.update"), async (req, res) => {
    const db = req.ctx.db;
    const before = await load(db, req.params.id);
    assertDraft(before);
    const body = parse(invoiceBody, req.body);
    await assertRefs(db, body);
    await assertNumberFree(db, body.number, before.id);
    const totals = totalsOrThrow(body.items);
    const item = await db.transaction(async (raw) => {
      const tx = raw as unknown as Db;
      const [row] = await tx
        .update(invoices)
        .set({
          number: body.number,
          clientId: body.clientId,
          projectId: body.projectId ?? null,
          issueDate: body.issueDate,
          dueDate: body.dueDate,
          currency: body.currency,
          externalId: body.externalId ?? null,
          ...totals,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, before.id))
        .returning();
      await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, before.id));
      await tx.insert(invoiceItems).values(itemRows(before.id, body.items));
      return row!;
    });
    await audit(req, "invoice_update", "invoice", item.id, { number: item.number, total: item.total, currency: item.currency });
    res.json({ item });
  });

  router.post("/:id/issue", requirePermission("finance.update"), async (req, res) => {
    const db = req.ctx.db;
    const row = await load(db, req.params.id);
    assertDraft(row);
    await db.update(invoices).set({ status: "Issued", updatedAt: new Date() }).where(eq(invoices.id, row.id));
    await recalcInvoice(db, row.id);
    await audit(req, "invoice_issue", "invoice", row.id, { number: row.number });
    await recordActivity(db, {
      projectId: row.projectId,
      clientId: row.clientId,
      actorId: req.auth?.user.id,
      type: "invoice",
      description: `Factura ${row.number} a fost emisă`,
      entityType: "invoice",
      entityId: row.id,
    });
    res.json({ item: await load(db, row.id) });
  });

  router.post("/:id/cancel", requirePermission("finance.update"), async (req, res) => {
    const db = req.ctx.db;
    const row = await load(db, req.params.id);
    if ((await paidAmount(db, row.id)) > 0) throw new HttpError(409, "invoice_has_payments", "Factura are plăți; șterge-le întâi");
    await db.update(invoices).set({ status: "Cancelled", updatedAt: new Date() }).where(eq(invoices.id, row.id));
    await audit(req, "invoice_cancel", "invoice", row.id, { number: row.number });
    res.json({ item: await load(db, row.id) });
  });

  router.delete("/:id", requirePermission("finance.delete"), async (req, res) => {
    const db = req.ctx.db;
    const row = await load(db, req.params.id);
    assertDraft(row);
    await db.update(invoices).set({ deletedAt: new Date() }).where(eq(invoices.id, row.id));
    await audit(req, "invoice_delete", "invoice", row.id, { number: row.number });
    res.status(204).end();
  });

  router.use(
    crudRouter({
      table: invoices,
      entityType: "invoice",
      permission: "finance",
      readOnly: true,
      softDelete: true,
      schema: z.object({}),
      searchColumns: [invoices.number, invoices.externalId],
      filters: { status: invoices.status, clientId: invoices.clientId, projectId: invoices.projectId, currency: invoices.currency },
      sortable: { number: invoices.number, issueDate: invoices.issueDate, dueDate: invoices.dueDate, total: invoices.total, status: invoices.status },
      defaultSort: { column: invoices.issueDate, dir: "desc" },
      listTransform: attachNames as never,
    }),
  );

  return router;
}
