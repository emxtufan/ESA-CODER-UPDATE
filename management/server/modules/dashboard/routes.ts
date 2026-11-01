import { Router, type Request } from "express";
import { and, asc, count, desc, eq, gte, inArray, isNotNull, isNull, lte, ne, notInArray, sql } from "drizzle-orm";
import type { Db } from "../../db/client";
import { activities, clients, projects, tasks } from "../../db/schema/core";
import { expenses, invoices, payments } from "../../db/schema/finance";
import { commits, deployments, repositories } from "../../db/schema/github";
import { domains, sslCertificates } from "../../db/schema/infra";
import { incidents, monitoringChecks } from "../../db/schema/ops";
import { isEmailConfigured } from "../../integrations/smtp";
import { can, requireAuth } from "../../security/guards";
import { refreshOverdue } from "../finance/invoices";

const LIST_LIMIT = 8;
const MONTHS = 12;
const WATCH_DAYS = 30;

const num = (v: unknown) => Number(v ?? 0);
const dayStr = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000);

/** Ultimele 12 luni, cea curentă ultima, ca `YYYY-MM`. */
export function lastMonths(now: Date, months = MONTHS): string[] {
  const out: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}

async function projectSection(db: Db, now: Date, months: string[]) {
  const byStatus = await db
    .select({ status: projects.status, count: count() })
    .from(projects)
    .where(isNull(projects.deletedAt))
    .groupBy(projects.status);
  const month = sql<string>`to_char(${projects.createdAt} at time zone 'UTC', 'YYYY-MM')`;
  const created = await db
    .select({ month, count: count() })
    .from(projects)
    .where(and(isNull(projects.deletedAt), gte(projects.createdAt, new Date(`${months[0]}-01T00:00:00Z`))))
    .groupBy(month);
  const [clientTotal] = await db.select({ n: count() }).from(clients).where(isNull(clients.deletedAt));
  const of = (status: string) => byStatus.find((r) => r.status === status)?.count ?? 0;
  const development = of("In Development");
  const maintenance = of("Active Maintenance");
  const suspended = of("Suspended");
  const total = byStatus.reduce((sum, r) => sum + r.count, 0);
  const deadlines = await db
    .select({ id: projects.id, name: projects.name, deadline: projects.deadline, status: projects.status })
    .from(projects)
    .where(
      and(
        isNull(projects.deletedAt),
        isNotNull(projects.deadline),
        notInArray(projects.status, ["Completed", "Archived"]),
        lte(projects.deadline, dayStr(addDays(now, WATCH_DAYS))),
      ),
    )
    .orderBy(asc(projects.deadline))
    .limit(LIST_LIMIT);
  return {
    total,
    active: total - of("Archived") - of("Completed") - suspended - of("Lead"),
    development,
    maintenance,
    suspended,
    clients: clientTotal?.n ?? 0,
    byStatus,
    growth: months.map((m) => ({ month: m, count: created.find((r) => r.month === m)?.count ?? 0 })),
    deadlines,
  };
}

/** Fiecare monedă rămâne separată; nimic nu se adună între monede. */
async function financeSection(db: Db, now: Date, months: string[]) {
  await refreshOverdue(db);
  const live = and(isNull(invoices.deletedAt), notInArray(invoices.status, ["Draft", "Cancelled"]));
  const thisMonth = months[months.length - 1]!;
  const issuedMonth = sql<string>`to_char(${invoices.issueDate}, 'YYYY-MM')`;
  const spentMonth = sql<string>`to_char(${expenses.spentAt} at time zone 'UTC', 'YYYY-MM')`;
  const since = `${months[0]}-01`;

  const invoiced = await db
    .select({ currency: invoices.currency, revenue: sql<string>`sum(${invoices.subtotal})`, total: sql<string>`sum(${invoices.total})` })
    .from(invoices)
    .where(live)
    .groupBy(invoices.currency);
  const collected = await db
    .select({ currency: invoices.currency, paid: sql<string>`sum(${payments.amount})` })
    .from(payments)
    .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
    .where(and(isNull(payments.deletedAt), live))
    .groupBy(invoices.currency);
  const spent = await db
    .select({ currency: expenses.currency, amount: sql<string>`sum(${expenses.amount})` })
    .from(expenses)
    .where(isNull(expenses.deletedAt))
    .groupBy(expenses.currency);
  const revenueByMonth = await db
    .select({ month: issuedMonth, currency: invoices.currency, amount: sql<string>`sum(${invoices.subtotal})` })
    .from(invoices)
    .where(and(live, gte(invoices.issueDate, since)))
    .groupBy(issuedMonth, invoices.currency);
  const expensesByMonth = await db
    .select({ month: spentMonth, currency: expenses.currency, amount: sql<string>`sum(${expenses.amount})` })
    .from(expenses)
    .where(and(isNull(expenses.deletedAt), gte(expenses.spentAt, new Date(`${since}T00:00:00Z`))))
    .groupBy(spentMonth, expenses.currency);
  const states = await db
    .select({ status: invoices.status, n: count() })
    .from(invoices)
    .where(live)
    .groupBy(invoices.status);
  const pending = await db
    .select({
      id: invoices.id,
      number: invoices.number,
      dueDate: invoices.dueDate,
      total: invoices.total,
      currency: invoices.currency,
      status: invoices.status,
      client: clients.companyName,
      paid: sql<string>`(select coalesce(sum(${payments.amount}), 0) from ${payments} where ${payments.invoiceId} = ${invoices.id} and ${payments.deletedAt} is null)`,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .where(and(isNull(invoices.deletedAt), inArray(invoices.status, ["Issued", "Partially Paid", "Overdue"])))
    .orderBy(asc(invoices.dueDate))
    .limit(LIST_LIMIT);

  const currencies = [...new Set([...invoiced, ...spent].map((r) => r.currency))].sort();
  const pick = (rows: { month: string; currency: string; amount: string }[], currency: string, month: string) =>
    num(rows.find((r) => r.currency === currency && r.month === month)?.amount);
  const of = (status: string) => states.find((r) => r.status === status)?.n ?? 0;

  return {
    currencies: currencies.map((currency) => {
      const inv = invoiced.find((r) => r.currency === currency);
      const revenue = num(inv?.revenue);
      const exp = num(spent.find((r) => r.currency === currency)?.amount);
      const paid = num(collected.find((r) => r.currency === currency)?.paid);
      return {
        currency,
        revenue,
        collected: paid,
        outstanding: num(inv?.total) - paid,
        expenses: exp,
        profit: revenue - exp,
        monthRevenue: pick(revenueByMonth, currency, thisMonth),
        series: months.map((month) => ({ month, revenue: pick(revenueByMonth, currency, month), expenses: pick(expensesByMonth, currency, month) })),
      };
    }),
    invoices: { paid: of("Paid"), unpaid: of("Issued") + of("Partially Paid"), overdue: of("Overdue") },
    pending: pending.map(({ paid, ...row }) => ({ ...row, balance: row.total - num(paid) })),
  };
}

async function taskSection(db: Db, now: Date) {
  const open = and(isNull(tasks.deletedAt), ne(tasks.status, "Completed"));
  const urgentCond = inArray(tasks.priority, ["High", "Critical"]);
  const [active] = await db.select({ n: count() }).from(tasks).where(open);
  const [urgent] = await db.select({ n: count() }).from(tasks).where(and(open, urgentCond));
  const attention = await db
    .select({ id: tasks.id, title: tasks.title, due: tasks.due, priority: tasks.priority, status: tasks.status, projectId: tasks.projectId, project: projects.name })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(and(open, sql`(${tasks.due} <= ${addDays(now, 3)} or ${tasks.priority} in ('High', 'Critical') or ${tasks.status} = 'Blocked')`))
    .orderBy(sql`${tasks.due} asc nulls last`)
    .limit(LIST_LIMIT);
  return { active: active?.n ?? 0, urgent: urgent?.n ?? 0, attention };
}

async function infraSection(db: Db, now: Date) {
  const limit = dayStr(addDays(now, WATCH_DAYS));
  const domainRows = await db
    .select({ id: domains.id, domain: domains.domain, expirationDate: domains.expirationDate })
    .from(domains)
    .where(and(isNull(domains.deletedAt), isNotNull(domains.expirationDate), lte(domains.expirationDate, limit)))
    .orderBy(asc(domains.expirationDate))
    .limit(LIST_LIMIT);
  const sslRows = await db
    .select({ id: sslCertificates.id, domain: domains.domain, expirationDate: sslCertificates.expirationDate })
    .from(sslCertificates)
    .innerJoin(domains, eq(sslCertificates.domainId, domains.id))
    .where(and(isNotNull(sslCertificates.expirationDate), lte(sslCertificates.expirationDate, limit)))
    .orderBy(asc(sslCertificates.expirationDate))
    .limit(LIST_LIMIT);
  return { domains: domainRows, ssl: sslRows };
}

async function monitoringSection(db: Db) {
  const down = await db
    .select({ id: monitoringChecks.id, url: monitoringChecks.url, lastCheckedAt: monitoringChecks.lastCheckedAt })
    .from(monitoringChecks)
    .where(eq(monitoringChecks.lastStatus, "down"))
    .limit(LIST_LIMIT);
  const open = await db
    .select({ id: incidents.id, name: incidents.name, severity: incidents.severity, startedAt: incidents.startedAt })
    .from(incidents)
    .where(ne(incidents.status, "Resolved"))
    .orderBy(desc(incidents.startedAt))
    .limit(LIST_LIMIT);
  return { down, incidents: open };
}

async function developmentSection(db: Db, req: Request) {
  const recentCommits = can(req, "github.view")
    ? await db
        .select({ id: commits.id, hash: commits.hash, message: commits.message, date: commits.date, repository: repositories.name })
        .from(commits)
        .innerJoin(repositories, eq(commits.repositoryId, repositories.id))
        .orderBy(sql`${commits.date} desc nulls last`)
        .limit(LIST_LIMIT)
    : null;
  const recentDeployments = can(req, "deployments.view")
    ? await db
        .select({ id: deployments.id, status: deployments.status, environment: deployments.environment, deployedAt: deployments.deployedAt, projectId: deployments.projectId, project: projects.name })
        .from(deployments)
        .innerJoin(projects, eq(deployments.projectId, projects.id))
        .orderBy(desc(deployments.deployedAt))
        .limit(LIST_LIMIT)
    : null;
  return { commits: recentCommits, deployments: recentDeployments };
}

/** Dashboard-ul: doar date din baza de date; o secțiune fără permisiune întoarce `null`. */
export function dashboardRouter(): Router {
  const router = Router();
  router.get("/", requireAuth, async (req, res) => {
    const db = req.ctx.db;
    const env = req.ctx.env;
    const now = new Date();
    const months = lastMonths(now);
    res.json({
      months,
      projects: can(req, "projects.view") ? await projectSection(db, now, months) : null,
      finance: can(req, "finance.view") ? await financeSection(db, now, months) : null,
      tasks: can(req, "tasks.view") ? await taskSection(db, now) : null,
      infrastructure: can(req, "infrastructure.view") ? await infraSection(db, now) : null,
      monitoring: can(req, "monitoring.view") ? await monitoringSection(db) : null,
      development: await developmentSection(db, req),
      recentActivity: can(req, "projects.view")
        ? await db.select().from(activities).orderBy(desc(activities.at)).limit(LIST_LIMIT)
        : null,
      integrations: {
        email: isEmailConfigured(env),
        githubToken: Boolean(env.GITHUB_TOKEN),
        githubWebhook: Boolean(env.GITHUB_WEBHOOK_SECRET),
        vault: Boolean(env.VAULT_MASTER_KEY),
        fileSigning: Boolean(env.FILE_SIGNING_KEY),
      },
    });
  });
  return router;
}
