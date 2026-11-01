import { Router, type Request } from "express";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { CURRENCIES, MAINTENANCE_ACTIVITIES, MAINTENANCE_PLANS } from "../../../shared/enums";
import { clients, projects } from "../../db/schema/core";
import { contracts, maintenanceLogs, maintenancePlans } from "../../db/schema/ops";
import { crudRouter, dateStr, moneyInt, optStr } from "../../lib/crud";
import { recordActivity } from "../../security/audit";

const when = z.preprocess(
  (v) => (v === "" ? null : v),
  z.iso.datetime({ local: true, offset: true }).or(z.iso.date()).nullable().optional(),
);

const toDate = (v: unknown) => (typeof v === "string" ? new Date(v) : v);

/** Adaugă numele proiectului (și clientului, dacă rândul îl are). */
async function attachNames<T extends { projectId?: string | null; clientId?: string | null }>(rows: T[], req: Request) {
  const db = req.ctx.db;
  const projectIds = [...new Set(rows.map((r) => r.projectId).filter((v): v is string => Boolean(v)))];
  const clientIds = [...new Set(rows.map((r) => r.clientId).filter((v): v is string => Boolean(v)))];
  const projectRows = projectIds.length ? await db.select({ id: projects.id, name: projects.name }).from(projects).where(inArray(projects.id, projectIds)) : [];
  const clientRows = clientIds.length ? await db.select({ id: clients.id, name: clients.companyName }).from(clients).where(inArray(clients.id, clientIds)) : [];
  const projectNames = new Map(projectRows.map((p) => [p.id, p.name]));
  const clientNames = new Map(clientRows.map((c) => [c.id, c.name]));
  return rows.map((r) => ({
    ...r,
    projectName: r.projectId ? (projectNames.get(r.projectId) ?? null) : null,
    clientName: r.clientId ? (clientNames.get(r.clientId) ?? null) : null,
  }));
}

export function maintenancePlansRouter(): Router {
  return crudRouter({
    table: maintenancePlans,
    entityType: "maintenance_plan",
    permission: "maintenance",
    schema: z.object({
      projectId: z.uuid(),
      plan: z.enum(MAINTENANCE_PLANS),
      monthlyPrice: moneyInt,
      currency: z.enum(CURRENCIES),
      startDate: dateStr,
      renewalDate: dateStr,
      includedServices: z.array(z.string().trim().min(1)).optional(),
      frequency: optStr,
      contractStatus: optStr,
    }),
    searchColumns: [maintenancePlans.frequency, maintenancePlans.contractStatus],
    filters: { projectId: maintenancePlans.projectId, plan: maintenancePlans.plan },
    sortable: { renewalDate: maintenancePlans.renewalDate, monthlyPrice: maintenancePlans.monthlyPrice },
    defaultSort: { column: maintenancePlans.renewalDate },
    listTransform: attachNames as never,
  });
}

export function maintenanceLogsRouter(): Router {
  return crudRouter({
    table: maintenanceLogs,
    entityType: "maintenance_log",
    permission: "maintenance",
    schema: z.object({
      planId: z.uuid(),
      activity: z.enum(MAINTENANCE_ACTIVITIES),
      performedAt: when,
      notes: optStr,
    }),
    searchColumns: [maintenanceLogs.notes],
    filters: { planId: maintenanceLogs.planId, activity: maintenanceLogs.activity },
    sortable: { performedAt: maintenanceLogs.performedAt },
    defaultSort: { column: maintenanceLogs.performedAt, dir: "desc" },
    toRow: ((data: Record<string, unknown>, req: Request) => {
      const row: Record<string, unknown> = { ...data };
      if (req.method === "POST") row.performedById = req.auth?.user.id ?? null;
      if (data.performedAt) row.performedAt = toDate(data.performedAt);
      else delete row.performedAt;
      return row;
    }) as never,
    afterCreate: (async (row: typeof maintenanceLogs.$inferSelect, req: Request) => {
      const [plan] = await req.ctx.db.select().from(maintenancePlans).where(eq(maintenancePlans.id, row.planId));
      await recordActivity(req.ctx.db, {
        projectId: plan?.projectId,
        actorId: req.auth?.user.id,
        type: "maintenance",
        description: `Mentenanță: ${row.activity}`,
        entityType: "maintenance_log",
        entityId: row.id,
      });
    }) as never,
  });
}

export function contractsRouter(): Router {
  return crudRouter({
    table: contracts,
    entityType: "contract",
    permission: "documents",
    schema: z.object({
      clientId: z.uuid(),
      projectId: z.uuid().nullable().optional(),
      documentId: z.uuid().nullable().optional(),
      title: z.string().trim().min(1),
      value: moneyInt.nullable().optional(),
      currency: z.enum(CURRENCIES).nullable().optional(),
      signedAt: when,
      expiresAt: when,
      status: optStr,
    }),
    searchColumns: [contracts.title, contracts.status],
    filters: { clientId: contracts.clientId, projectId: contracts.projectId, status: contracts.status },
    sortable: { title: contracts.title, expiresAt: contracts.expiresAt },
    defaultSort: { column: contracts.title },
    toRow: ((data: Record<string, unknown>) => {
      const row: Record<string, unknown> = { ...data };
      if ("signedAt" in data) row.signedAt = data.signedAt ? toDate(data.signedAt) : null;
      if ("expiresAt" in data) row.expiresAt = data.expiresAt ? toDate(data.expiresAt) : null;
      return row;
    }) as never,
    listTransform: attachNames as never,
  });
}
