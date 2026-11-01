import { Router, type Request } from "express";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { INCIDENT_SEVERITIES, INCIDENT_STATUSES } from "../../../shared/enums";
import { projects } from "../../db/schema/core";
import { servers } from "../../db/schema/infra";
import { incidents, monitoringChecks, monitoringResults } from "../../db/schema/ops";
import { crudRouter, optStr } from "../../lib/crud";
import { HttpError, parse } from "../../lib/http";
import { audit } from "../../security/audit";
import { requirePermission } from "../../security/guards";
import { runCheck } from "./check";

const httpUrl = z.url({ protocol: /^https?$/ });
const when = z.preprocess(
  (v) => (v === "" ? null : v),
  z.iso.datetime({ local: true, offset: true }).or(z.iso.date()).nullable().optional(),
);

async function attachProjectNames<T extends { projectId?: string | null }>(rows: T[], req: Request) {
  const ids = [...new Set(rows.map((r) => r.projectId).filter((v): v is string => Boolean(v)))];
  const names = ids.length ? await req.ctx.db.select({ id: projects.id, name: projects.name }).from(projects).where(inArray(projects.id, ids)) : [];
  const byId = new Map(names.map((p) => [p.id, p.name]));
  return rows.map((r) => ({ ...r, projectName: r.projectId ? (byId.get(r.projectId) ?? null) : null }));
}

export function monitoringRouter(): Router {
  const router = Router();

  router.post("/checks/:id/run", requirePermission("monitoring.update"), async (req, res) => {
    const id = parse(z.uuid(), req.params.id);
    const [check] = await req.ctx.db.select().from(monitoringChecks).where(eq(monitoringChecks.id, id));
    if (!check) throw new HttpError(404, "not_found", "Verificarea nu există");
    const result = await runCheck(req.ctx.db, req.ctx.env, check);
    await audit(req, "monitoring_run", "monitoring_check", id, { ok: result.ok });
    res.json({ result });
  });

  /** Metricile de server cer agent securizat, care nu există încă: nu se simulează. */
  router.get("/servers", requirePermission("monitoring.view"), async (req, res) => {
    const rows = await req.ctx.db.select({ id: servers.id, name: servers.name, ip: servers.ip }).from(servers);
    res.json({ items: rows.map((r) => ({ ...r, agent: "not_connected" })) });
  });

  router.use(
    "/checks",
    crudRouter({
      table: monitoringChecks,
      entityType: "monitoring_check",
      permission: "monitoring",
      schema: z.object({
        projectId: z.uuid(),
        url: httpUrl,
        type: z.enum(["http"]).optional(),
        intervalSeconds: z.coerce.number().int().min(60).max(86_400).optional(),
        enabled: z.boolean().optional(),
      }),
      searchColumns: [monitoringChecks.url],
      filters: { projectId: monitoringChecks.projectId, lastStatus: monitoringChecks.lastStatus },
      sortable: { url: monitoringChecks.url, lastCheckedAt: monitoringChecks.lastCheckedAt },
      defaultSort: { column: monitoringChecks.url },
      toRow: ((data: Record<string, unknown>, req: Request) =>
        req.method === "POST" ? { type: "http", intervalSeconds: 300, ...data } : data) as never,
      listTransform: attachProjectNames as never,
    }),
  );

  router.use(
    "/results",
    crudRouter({
      table: monitoringResults,
      entityType: "monitoring_result",
      permission: "monitoring",
      readOnly: true,
      schema: z.object({}),
      searchColumns: [monitoringResults.error],
      filters: { checkId: monitoringResults.checkId },
      sortable: { at: monitoringResults.at },
      defaultSort: { column: monitoringResults.at, dir: "desc" },
    }),
  );

  router.use(
    "/incidents",
    crudRouter({
      table: incidents,
      entityType: "incident",
      permission: "monitoring",
      schema: z.object({
        name: z.string().trim().min(1),
        projectId: z.uuid().nullable().optional(),
        serverId: z.uuid().nullable().optional(),
        startedAt: when,
        endedAt: when,
        severity: z.enum(INCIDENT_SEVERITIES),
        status: z.enum(INCIDENT_STATUSES),
        description: optStr,
        resolution: optStr,
      }),
      searchColumns: [incidents.name, incidents.description],
      filters: { projectId: incidents.projectId, serverId: incidents.serverId, status: incidents.status, severity: incidents.severity },
      sortable: { startedAt: incidents.startedAt, name: incidents.name },
      defaultSort: { column: incidents.startedAt, dir: "desc" },
      toRow: ((data: Record<string, unknown>) => {
        const row: Record<string, unknown> = { ...data };
        if (data.startedAt) row.startedAt = new Date(data.startedAt as string);
        else delete row.startedAt;
        if ("endedAt" in data) row.endedAt = data.endedAt ? new Date(data.endedAt as string) : null;
        return row;
      }) as never,
      listTransform: attachProjectNames as never,
    }),
  );

  return router;
}