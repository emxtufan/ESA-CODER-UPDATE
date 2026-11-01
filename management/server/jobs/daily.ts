import { and, eq, inArray, isNotNull, isNull, lt, lte, ne } from "drizzle-orm";
import type { Db } from "../db/client";
import { projects, tasks } from "../db/schema/core";
import { invoices } from "../db/schema/finance";
import { domains, sslCertificates } from "../db/schema/infra";
import { maintenancePlans, monitoringResults } from "../db/schema/ops";
import type { Env } from "../env";
import { refreshOverdue } from "../modules/finance/invoices";
import { notify } from "../modules/notifications/service";

const dayStr = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86_400_000);

const RESULT_RETENTION_DAYS = 30;

/** Cheia perioadei pentru taskurile recurente; alte frecvențe nu creează taskuri. */
export function periodKey(frequency: string | null, now: Date): string | null {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  if (frequency === "Lunar") return `${year}-${String(month).padStart(2, "0")}`;
  if (frequency === "Trimestrial") return `${year}-T${Math.ceil(month / 3)}`;
  if (frequency === "Anual") return String(year);
  return null;
}

/** Verificări pe termene. Se poate rula oricând: cheile de dedupe opresc dublurile. */
export async function runDailyChecks(db: Db, env: Env, now = new Date()): Promise<void> {
  const today = dayStr(now);

  const openTasks = await db
    .select({ id: tasks.id, title: tasks.title, due: tasks.due })
    .from(tasks)
    .where(and(isNull(tasks.deletedAt), isNotNull(tasks.due), ne(tasks.status, "Completed"), lte(tasks.due, addDays(now, 2))));
  for (const task of openTasks) {
    const overdue = task.due! < now;
    await notify(db, env, {
      event: overdue ? "Overdue Task" : "Task Deadline",
      dedupeKey: `${overdue ? "task-overdue" : "task-deadline"}:${task.id}:${dayStr(task.due!)}`,
      title: overdue ? `Task restant: ${task.title}` : `Termen apropiat: ${task.title}`,
      link: "/tasks",
    });
  }

  const expiringDomains = await db
    .select({ id: domains.id, domain: domains.domain, expirationDate: domains.expirationDate })
    .from(domains)
    .where(and(isNull(domains.deletedAt), isNotNull(domains.expirationDate), lte(domains.expirationDate, dayStr(addDays(now, 30)))));
  for (const row of expiringDomains) {
    await notify(db, env, {
      event: "Domain Expiration",
      dedupeKey: `domain:${row.id}:${row.expirationDate}`,
      title: `Domeniul ${row.domain} expiră la ${row.expirationDate}`,
      link: "/infrastructure?tab=domains",
    });
  }

  const expiringSsl = await db
    .select({ id: sslCertificates.id, domain: domains.domain, expirationDate: sslCertificates.expirationDate })
    .from(sslCertificates)
    .innerJoin(domains, eq(sslCertificates.domainId, domains.id))
    .where(and(isNotNull(sslCertificates.expirationDate), lte(sslCertificates.expirationDate, dayStr(addDays(now, 30)))));
  for (const row of expiringSsl) {
    await notify(db, env, {
      event: "SSL Expiration",
      dedupeKey: `ssl:${row.id}:${row.expirationDate}`,
      title: `Certificatul SSL pentru ${row.domain} expiră la ${row.expirationDate}`,
      link: "/infrastructure?tab=domains",
    });
  }

  await refreshOverdue(db);
  const unpaid = await db
    .select({ id: invoices.id, number: invoices.number, status: invoices.status, dueDate: invoices.dueDate })
    .from(invoices)
    .where(
      and(
        isNull(invoices.deletedAt),
        inArray(invoices.status, ["Issued", "Partially Paid", "Overdue"]),
        lte(invoices.dueDate, dayStr(addDays(now, 3))),
      ),
    );
  for (const row of unpaid) {
    const overdue = row.status === "Overdue";
    await notify(db, env, {
      event: overdue ? "Invoice Overdue" : "Invoice Due",
      dedupeKey: `${overdue ? "invoice-overdue" : "invoice-due"}:${row.id}`,
      title: overdue ? `Factura ${row.number} e restantă` : `Factura ${row.number} e scadentă la ${row.dueDate}`,
      link: "/finance",
    });
  }

  const plans = await db
    .select({ plan: maintenancePlans, projectName: projects.name, clientId: projects.clientId })
    .from(maintenancePlans)
    .innerJoin(projects, eq(maintenancePlans.projectId, projects.id))
    .where(isNull(projects.deletedAt));
  for (const { plan, projectName, clientId } of plans) {
    if (plan.renewalDate && plan.renewalDate <= dayStr(addDays(now, 14)) && plan.renewalDate >= today) {
      await notify(db, env, {
        event: "Maintenance Reminder",
        dedupeKey: `maintenance:${plan.id}:${plan.renewalDate}`,
        title: `Mentenanța pentru ${projectName} se reînnoiește la ${plan.renewalDate}`,
        link: "/maintenance",
      });
    }
    const period = periodKey(plan.frequency, now);
    if (!period || plan.contractStatus === "Cancelled") continue;
    const title = `Mentenanță ${projectName} ${period}`;
    const [existing] = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.projectId, plan.projectId), eq(tasks.title, title)))
      .limit(1);
    if (!existing) {
      await db.insert(tasks).values({
        title,
        projectId: plan.projectId,
        clientId,
        priority: "Medium",
        status: "To Do",
        description: plan.includedServices.join(", ") || null,
      });
    }
  }

  await db.delete(monitoringResults).where(lt(monitoringResults.at, addDays(now, -RESULT_RETENTION_DAYS)));
}