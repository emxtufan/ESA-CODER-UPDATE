import { Router, type Request } from "express";
import { and, asc, desc, eq, gte, inArray, isNull, lte, notInArray, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { CURRENCIES } from "../../../shared/enums";
import type { Permission } from "../../../shared/permissions";
import type { Db } from "../../db/client";
import { clients, projects, tasks } from "../../db/schema/core";
import { expenses, invoices, payments } from "../../db/schema/finance";
import { domains, servers } from "../../db/schema/infra";
import { maintenancePlans } from "../../db/schema/ops";
import { HttpError, parse } from "../../lib/http";
import { audit } from "../../security/audit";
import { can, requirePermission } from "../../security/guards";
import { profitByProject } from "../finance/routes";
import { toCsv, toXlsx, type Report, type ReportColumn, type ReportRow } from "./export";

// ponytail: plafon fix de rânduri; paginare sau streaming dacă un raport îl atinge.
const MAX_ROWS = 10_000;

const querySchema = z.object({
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  clientId: z.uuid().optional(),
  projectId: z.uuid().optional(),
  status: z.string().trim().min(1).optional(),
  currency: z.enum(CURRENCIES).optional(),
  category: z.string().trim().min(1).optional(),
  format: z.enum(["json", "csv", "xlsx"]).optional(),
});
type Query = z.infer<typeof querySchema>;

const major = (minor: number | null | undefined) => (minor === null || minor === undefined ? null : minor / 100);
const cols = (pairs: [string, string][]): ReportColumn[] => pairs.map(([key, label]) => ({ key, label }));
const dayStart = (d: string) => new Date(`${d}T00:00:00.000Z`);
const dayEnd = (d: string) => new Date(`${d}T23:59:59.999Z`);
const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

/** Condițiile de perioadă pe o coloană de tip dată sau timestamp. */
function dateRange(column: never, q: Query, timestamp: boolean): SQL[] {
  const conds: SQL[] = [];
  if (q.from) conds.push(gte(column, (timestamp ? dayStart(q.from) : q.from) as never));
  if (q.to) conds.push(lte(column, (timestamp ? dayEnd(q.to) : q.to) as never));
  return conds;
}

const projectsOfClient = (clientId: string) =>
  sql`(select ${projects.id} from ${projects} where ${projects.clientId} = ${clientId})` as never;

async function projectsReport(db: Db, q: Query): Promise<Report> {
  const conds: SQL[] = [isNull(projects.deletedAt), ...dateRange(projects.createdAt as never, q, true)];
  if (q.clientId) conds.push(eq(projects.clientId, q.clientId));
  if (q.projectId) conds.push(eq(projects.id, q.projectId));
  if (q.status) conds.push(eq(projects.status, q.status as never));
  if (q.currency) conds.push(eq(projects.currency, q.currency));
  const rows = await db
    .select({ project: projects, client: clients.companyName })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(and(...conds))
    .orderBy(asc(projects.name))
    .limit(MAX_ROWS);
  return {
    columns: cols([["name", "Proiect"], ["client", "Client"], ["type", "Tip"], ["status", "Status"], ["priority", "Prioritate"], ["startDate", "Început"], ["deadline", "Termen"], ["contractValue", "Valoare contract"], ["currency", "Monedă"]]),
    rows: rows.map(({ project: p, client }) => ({ name: p.name, client, type: p.type, status: p.status, priority: p.priority, startDate: p.startDate, deadline: p.deadline, contractValue: major(p.contractValue), currency: p.currency })),
  };
}

async function clientsReport(db: Db, q: Query): Promise<Report> {
  const conds: SQL[] = [isNull(clients.deletedAt)];
  if (q.clientId) conds.push(eq(clients.id, q.clientId));
  if (q.status) conds.push(eq(clients.status, q.status));
  const rows = await db
    .select({
      client: clients,
      projects: sql<string>`(select count(*) from ${projects} where ${projects.clientId} = ${clients.id} and ${projects.deletedAt} is null)`,
    })
    .from(clients)
    .where(and(...conds))
    .orderBy(asc(clients.companyName))
    .limit(MAX_ROWS);
  return {
    columns: cols([["companyName", "Client"], ["status", "Status"], ["city", "Oraș"], ["primaryEmail", "Email"], ["projects", "Proiecte"]]),
    rows: rows.map((r) => ({ companyName: r.client.companyName, status: r.client.status, city: r.client.city, primaryEmail: r.client.primaryEmail, projects: Number(r.projects) })),
  };
}

async function revenueReport(db: Db, q: Query): Promise<Report> {
  const conds: SQL[] = [isNull(invoices.deletedAt), notInArray(invoices.status, ["Draft", "Cancelled"]), ...dateRange(invoices.issueDate as never, q, false)];
  if (q.clientId) conds.push(eq(invoices.clientId, q.clientId));
  if (q.projectId) conds.push(eq(invoices.projectId, q.projectId));
  if (q.status) conds.push(eq(invoices.status, q.status as never));
  if (q.currency) conds.push(eq(invoices.currency, q.currency));
  const rows = await db
    .select({
      invoice: invoices,
      client: clients.companyName,
      paid: sql<string>`(select coalesce(sum(${payments.amount}), 0) from ${payments} where ${payments.invoiceId} = ${invoices.id} and ${payments.deletedAt} is null)`,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .where(and(...conds))
    .orderBy(desc(invoices.issueDate))
    .limit(MAX_ROWS);
  return {
    columns: cols([["number", "Factură"], ["client", "Client"], ["issueDate", "Emisă"], ["dueDate", "Scadență"], ["currency", "Monedă"], ["subtotal", "Fără TVA"], ["vat", "TVA"], ["total", "Total"], ["paid", "Încasat"], ["balance", "Sold"], ["status", "Status"]]),
    rows: rows.map(({ invoice: i, client, paid }) => ({ number: i.number, client, issueDate: i.issueDate, dueDate: i.dueDate, currency: i.currency, subtotal: major(i.subtotal), vat: major(i.vat), total: major(i.total), paid: major(Number(paid)), balance: major(i.total - Number(paid)), status: i.status })),
  };
}

async function expensesReport(db: Db, q: Query): Promise<Report> {
  const conds: SQL[] = [isNull(expenses.deletedAt), ...dateRange(expenses.spentAt as never, q, true)];
  if (q.projectId) conds.push(eq(expenses.projectId, q.projectId));
  if (q.clientId) conds.push(inArray(expenses.projectId, projectsOfClient(q.clientId)));
  if (q.currency) conds.push(eq(expenses.currency, q.currency));
  if (q.category) conds.push(eq(expenses.category, q.category as never));
  const rows = await db
    .select({ expense: expenses, project: projects.name })
    .from(expenses)
    .leftJoin(projects, eq(expenses.projectId, projects.id))
    .where(and(...conds))
    .orderBy(desc(expenses.spentAt))
    .limit(MAX_ROWS);
  return {
    columns: cols([["name", "Cheltuială"], ["category", "Categorie"], ["supplier", "Furnizor"], ["project", "Proiect"], ["amount", "Sumă"], ["currency", "Monedă"], ["spentAt", "Data"]]),
    rows: rows.map(({ expense: e, project }) => ({ name: e.name, category: e.category, supplier: e.supplier, project, amount: major(e.amount), currency: e.currency, spentAt: iso(e.spentAt) })),
  };
}

async function profitabilityReport(db: Db, q: Query): Promise<Report> {
  const items = await profitByProject(db, { from: q.from, to: q.to, clientId: q.clientId, projectId: q.projectId });
  const rows = q.currency ? items.filter((i) => i.currency === q.currency) : items;
  return {
    columns: cols([["projectName", "Proiect"], ["currency", "Monedă"], ["revenue", "Venit fără TVA"], ["expenses", "Cheltuieli"], ["profit", "Profit"]]),
    rows: rows.map((i) => ({ projectName: i.projectName, currency: i.currency, revenue: major(i.revenue), expenses: major(i.expenses), profit: major(i.profit) })),
  };
}

async function maintenanceReport(db: Db, q: Query): Promise<Report> {
  const conds: SQL[] = [isNull(projects.deletedAt)];
  if (q.clientId) conds.push(eq(projects.clientId, q.clientId));
  if (q.projectId) conds.push(eq(maintenancePlans.projectId, q.projectId));
  if (q.currency) conds.push(eq(maintenancePlans.currency, q.currency));
  const rows = await db
    .select({ plan: maintenancePlans, project: projects.name })
    .from(maintenancePlans)
    .innerJoin(projects, eq(maintenancePlans.projectId, projects.id))
    .where(and(...conds))
    .orderBy(asc(maintenancePlans.renewalDate))
    .limit(MAX_ROWS);
  return {
    columns: cols([["project", "Proiect"], ["plan", "Plan"], ["monthlyPrice", "Preț lunar"], ["currency", "Monedă"], ["renewalDate", "Reînnoire"], ["frequency", "Frecvență"], ["contractStatus", "Contract"]]),
    rows: rows.map(({ plan: p, project }) => ({ project, plan: p.plan, monthlyPrice: major(p.monthlyPrice), currency: p.currency, renewalDate: p.renewalDate, frequency: p.frequency, contractStatus: p.contractStatus })),
  };
}

async function tasksReport(db: Db, q: Query): Promise<Report> {
  const conds: SQL[] = [isNull(tasks.deletedAt), ...dateRange(tasks.due as never, q, true)];
  if (q.projectId) conds.push(eq(tasks.projectId, q.projectId));
  if (q.clientId) conds.push(inArray(tasks.projectId, projectsOfClient(q.clientId)));
  if (q.status) conds.push(eq(tasks.status, q.status as never));
  const rows = await db
    .select({ task: tasks, project: projects.name })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(and(...conds))
    .orderBy(asc(tasks.due))
    .limit(MAX_ROWS);
  return {
    columns: cols([["title", "Task"], ["project", "Proiect"], ["priority", "Prioritate"], ["status", "Status"], ["due", "Termen"], ["completedAt", "Finalizat"], ["estimatedHours", "Ore estimate"], ["actualHours", "Ore reale"]]),
    rows: rows.map(({ task: t, project }) => ({ title: t.title, project, priority: t.priority, status: t.status, due: iso(t.due), completedAt: iso(t.completedAt), estimatedHours: t.estimatedHours === null ? null : Number(t.estimatedHours), actualHours: t.actualHours === null ? null : Number(t.actualHours) })),
  };
}

async function serverCostsReport(db: Db, q: Query): Promise<Report> {
  const conds: SQL[] = [isNull(servers.deletedAt)];
  if (q.currency) conds.push(eq(servers.currency, q.currency));
  if (q.status) conds.push(eq(servers.status, q.status));
  const rows = await db.select().from(servers).where(and(...conds)).orderBy(asc(servers.name)).limit(MAX_ROWS);
  return {
    columns: cols([["name", "Server"], ["provider", "Furnizor"], ["ip", "IP"], ["monthlyCost", "Cost lunar"], ["currency", "Monedă"], ["renewalDate", "Reînnoire"], ["status", "Status"]]),
    rows: rows.map((s) => ({ name: s.name, provider: s.provider, ip: s.ip, monthlyCost: major(s.monthlyCost), currency: s.currency, renewalDate: s.renewalDate, status: s.status })),
  };
}

async function domainRenewalsReport(db: Db, q: Query): Promise<Report> {
  const conds: SQL[] = [isNull(domains.deletedAt), ...dateRange(domains.expirationDate as never, q, false)];
  if (q.projectId) conds.push(eq(domains.projectId, q.projectId));
  if (q.clientId) conds.push(inArray(domains.projectId, projectsOfClient(q.clientId)));
  if (q.currency) conds.push(eq(domains.currency, q.currency));
  const rows = await db
    .select({ domain: domains, project: projects.name })
    .from(domains)
    .leftJoin(projects, eq(domains.projectId, projects.id))
    .where(and(...conds))
    .orderBy(asc(domains.expirationDate))
    .limit(MAX_ROWS);
  return {
    columns: cols([["domain", "Domeniu"], ["registrar", "Registrar"], ["expirationDate", "Expiră"], ["autoRenewal", "Reînnoire automată"], ["renewalCost", "Cost"], ["currency", "Monedă"], ["project", "Proiect"]]),
    rows: rows.map(({ domain: d, project }) => ({ domain: d.domain, registrar: d.registrar, expirationDate: d.expirationDate, autoRenewal: d.autoRenewal ? "Da" : "Nu", renewalCost: major(d.renewalCost), currency: d.currency, project })),
  };
}

const REPORTS: Record<string, { perm?: Permission; build: (db: Db, q: Query) => Promise<Report> }> = {
  projects: { build: projectsReport },
  clients: { build: clientsReport },
  revenue: { perm: "finance.view", build: revenueReport },
  expenses: { perm: "finance.view", build: expensesReport },
  profitability: { perm: "finance.profitability", build: profitabilityReport },
  maintenance: { build: maintenanceReport },
  tasks: { build: tasksReport },
  "server-costs": { perm: "infrastructure.view", build: serverCostsReport },
  "domain-renewals": { perm: "infrastructure.view", build: domainRenewalsReport },
};

export function reportsRouter(): Router {
  const router = Router();

  router.get("/:type", requirePermission("reports.view"), async (req: Request, res) => {
    const type = String(req.params.type);
    const report = Object.hasOwn(REPORTS, type) ? REPORTS[type] : undefined;
    if (!report) throw new HttpError(404, "not_found", "Raportul nu există");
    if (report.perm && !can(req, report.perm)) throw new HttpError(403, "forbidden", "Nu ai acces la acest raport");
    const q = parse(querySchema, req.query);
    const result = await report.build(req.ctx.db, q);
    const format = q.format ?? "json";
    if (format === "json") {
      res.json({ ...result, limited: result.rows.length >= MAX_ROWS });
      return;
    }
    await audit(req, "report_export", "report", null, { type, format, rows: result.rows.length });
    if (format === "csv") {
      res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="raport-${type}.csv"` }).send(toCsv(result));
      return;
    }
    res
      .set({ "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="raport-${type}.xlsx"` })
      .send(Buffer.from(toXlsx(result)));
  });

  return router;
}

export type { ReportRow };
