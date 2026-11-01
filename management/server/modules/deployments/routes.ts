/**
 * Deployments (§9): doar înregistrarea lansărilor — un rând cu commit, mediu, status și
 * log-uri. Execuția efectivă (build, upload, rollback) nu se face de aici; rutele doar
 * păstrează urma fiecărei lansări și o trec în timeline-ul proiectului.
 */
import { inArray } from "drizzle-orm";
import { Router, type Request } from "express";
import { z } from "zod";

import { DEPLOYMENT_STATUSES } from "../../../shared/enums";
import { projects } from "../../db/schema/core";
import { deployments, repositories } from "../../db/schema/github";
import { crudRouter, optStr } from "../../lib/crud";
import { recordActivity } from "../../security/audit";
import { notify } from "../notifications/service";

/** Câmpurile lansării din §9; `externalId` se completează doar din integrări. */
const deploymentSchema = z.object({
  projectId: z.uuid("Identificator invalid"),
  repositoryId: z.uuid("Identificator invalid").nullable().optional(),
  serverId: z.uuid("Identificator invalid").nullable().optional(),
  commitHash: optStr,
  branch: optStr,
  environment: optStr,
  logs: optStr,
  url: optStr,
  deployedAt: z
    .preprocess(
      (v) => (v === "" ? null : v),
      z.iso.datetime({ local: true, offset: true }).or(z.iso.date()).nullable().optional(),
    ),
  status: z.enum(DEPLOYMENT_STATUSES),
});

/** Id-urile nenule (fără duplicate) de pe o coloană a paginii curente. */
function uniqueIds(rows: any[], key: string): string[] {
  const values = rows.map((row) => row[key] as string | null);
  return [...new Set(values.filter((id): id is string => Boolean(id)))];
}

/** Adaugă `projectName` și `repositoryName` rândurilor paginii, printr-un query pe fiecare. */
async function attachNames(rows: any[], req: Request): Promise<any[]> {
  const projectIds = uniqueIds(rows, "projectId");
  const repositoryIds = uniqueIds(rows, "repositoryId");

  const projectRows = projectIds.length
    ? await req.ctx.db
        .select({ id: projects.id, name: projects.name })
        .from(projects)
        .where(inArray(projects.id, projectIds))
    : [];
  const repositoryRows = repositoryIds.length
    ? await req.ctx.db
        .select({ id: repositories.id, name: repositories.name })
        .from(repositories)
        .where(inArray(repositories.id, repositoryIds))
    : [];

  const projectNames = new Map(projectRows.map((row) => [row.id, row.name]));
  const repositoryNames = new Map(repositoryRows.map((row) => [row.id, row.name]));

  return rows.map((row) => ({
    ...row,
    projectName: row.projectId ? (projectNames.get(row.projectId) ?? null) : null,
    repositoryName: row.repositoryId ? (repositoryNames.get(row.repositoryId) ?? null) : null,
  }));
}

/** Intrarea de timeline a unei lansări: tipul `deploy`, legată de proiect și de rând. */
async function deployActivity(req: Request, row: any, description: string): Promise<void> {
  await recordActivity(req.ctx.db, {
    projectId: row.projectId,
    actorId: req.auth?.user.id ?? null,
    type: "deploy",
    description,
    entityType: "deployment",
    entityId: row.id,
  });
}

export function deploymentsRouter(): Router {
  const router = Router();

  router.use(
    crudRouter({
      table: deployments,
      entityType: "deployment",
      permission: "deployments",
      schema: deploymentSchema,
      searchColumns: [deployments.commitHash, deployments.branch, deployments.environment],
      filters: {
        projectId: deployments.projectId,
        status: deployments.status,
        environment: deployments.environment,
        repositoryId: deployments.repositoryId,
      },
      sortable: {
        deployedAt: deployments.deployedAt,
        status: deployments.status,
      },
      defaultSort: { column: deployments.deployedAt, dir: "desc" },
      listTransform: attachNames,
      toRow: (data: any, req: Request) => {
        const values: Record<string, unknown> = { ...data };

        // `deployedAt` vine din formular ca dată ISO: coloana e `timestamp not null`, deci
        // la creare fără dată punem momentul curent, iar la modificare o valoare goală nu
        // are ce să golească — rândul păstrează data pe care o are deja.
        if (values.deployedAt) {
          values.deployedAt = new Date(String(values.deployedAt));
        } else if (req.method === "POST") {
          values.deployedAt = new Date();
        } else {
          delete values.deployedAt;
        }

        // Autorul lansării se pune doar la creare, din sesiune, niciodată din body.
        if (req.method === "POST") values.triggeredById = req.auth?.user.id ?? null;

        return values;
      },
      afterCreate: async (row: any, req: Request) => {
        await deployActivity(
          req,
          row,
          `Deployment înregistrat: ${row.environment ?? "fără mediu"} (${row.status})`,
        );
        if (row.status === "Failed") {
          await notify(req.ctx.db, req.ctx.env, {
            event: "Failed Deployment",
            dedupeKey: `deployment:${row.id}:failed`,
            title: `Deployment eșuat: ${row.environment ?? ""}`,
            link: "/deployments",
          });
        }
      },
      // Timeline doar când se schimbă statusul: o simplă notă pe log-uri nu e un eveniment.
      afterUpdate: async (row: any, req: Request, before: any) => {
        if (before.status === row.status) return;
        await deployActivity(req, row, `Status deployment: ${before.status} → ${row.status}`);
        if (row.status === "Failed") {
          await notify(req.ctx.db, req.ctx.env, {
            event: "Failed Deployment",
            dedupeKey: `deployment:${row.id}:failed`,
            title: `Deployment eșuat: ${row.environment ?? ""}`,
            link: "/deployments",
          });
        }
      },
    }),
  );

  return router;
}
