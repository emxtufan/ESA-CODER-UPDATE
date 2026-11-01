/**
 * Rutele GitHub (§8): repository-urile legate de proiecte, sincronizarea lor manuală și
 * citirea commit-urilor, pull request-urilor și release-urilor aduse de webhook-uri.
 *
 * Commits, PR-urile și release-urile sunt strict citire: se scriu doar din webhook sau
 * din sincronizare, niciodată din browser. Un repository nou nu se creează și nu se leagă
 * automat de un proiect — legătura o face utilizatorul, explicit, prin CRUD.
 */
import { eq, inArray, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { Router, type Request } from "express";
import { z } from "zod";

import { projects } from "../../db/schema/core";
import { commits, pullRequests, releases, repositories } from "../../db/schema/github";
import { crudRouter, optStr } from "../../lib/crud";
import { HttpError, parse } from "../../lib/http";
import { audit } from "../../security/audit";
import { requirePermission } from "../../security/guards";

import { syncRepository } from "./sync";

const idSchema = z.object({ id: z.uuid("Identificator invalid") });

/** Câmpurile repository-ului din §8; `visibility`, `status` și `lastSyncAt` vin din sincronizare. */
const repositorySchema = z.object({
  name: z.string().trim().min(1, "Numele repository-ului este obligatoriu").max(200),
  owner: z.string().trim().min(1, "Proprietarul repository-ului este obligatoriu").max(200),
  url: optStr,
  defaultBranch: optStr,
  devBranch: optStr,
  prodBranch: optStr,
  projectId: z.uuid("Identificator invalid").nullable().optional(),
});

/** Repository-ul după id (tabela nu are ștergere logică). */
async function findRepository(req: Request, id: string): Promise<any> {
  const [row] = await req.ctx.db
    .select()
    .from(repositories)
    .where(eq(repositories.id, id))
    .limit(1);
  if (!row) throw new HttpError(404, "not_found", "Repository-ul nu există");
  return row;
}

/** Id-urile nenule (fără duplicate) de pe o coloană a paginii curente. */
function uniqueIds(rows: any[], key: string): string[] {
  const values = rows.map((row) => row[key] as string | null);
  return [...new Set(values.filter((id): id is string => Boolean(id)))];
}

/** Adaugă `projectName` rândurilor paginii, printr-un singur query. */
async function attachProjectNames(rows: any[], req: Request): Promise<any[]> {
  const ids = uniqueIds(rows, "projectId");
  if (ids.length === 0) return rows.map((row) => ({ ...row, projectName: null }));

  const projectRows = await req.ctx.db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(inArray(projects.id, ids));
  const names = new Map(projectRows.map((row) => [row.id, row.name]));

  return rows.map((row) => ({
    ...row,
    projectName: row.projectId ? (names.get(row.projectId) ?? null) : null,
  }));
}

/** Adaugă `repositoryName` rândurilor paginii, printr-un singur query. */
async function attachRepositoryNames(rows: any[], req: Request): Promise<any[]> {
  const ids = uniqueIds(rows, "repositoryId");
  if (ids.length === 0) return rows.map((row) => ({ ...row, repositoryName: null }));

  const repositoryRows = await req.ctx.db
    .select({ id: repositories.id, name: repositories.name })
    .from(repositories)
    .where(inArray(repositories.id, ids));
  const names = new Map(repositoryRows.map((row) => [row.id, row.name]));

  return rows.map((row) => ({
    ...row,
    repositoryName: row.repositoryId ? (names.get(row.repositoryId) ?? null) : null,
  }));
}

/**
 * Filtrarea pe proiect a rândurilor care aparțin unui repository: `?projectId=` valid
 * restrânge la repository-urile acelui proiect, lipsa parametrului nu restrânge nimic.
 */
function projectScope(req: Request, repositoryId: PgColumn): SQL | undefined {
  const raw = typeof req.query.projectId === "string" ? req.query.projectId : undefined;
  if (!raw) return undefined;

  const parsed = z.uuid().safeParse(raw);
  if (!parsed.success) {
    throw new HttpError(422, "validation_error", "Identificator de proiect invalid");
  }

  return inArray(
    repositoryId,
    req.ctx.db
      .select({ id: repositories.id })
      .from(repositories)
      .where(eq(repositories.projectId, parsed.data)),
  );
}

export function githubRouter(): Router {
  const router = Router();

  /** Starea integrării: doar existența token-ului și a secretului, niciodată valorile. */
  router.get("/status", requirePermission("github.view"), (req, res) => {
    res.json({
      token: Boolean(req.ctx.env.GITHUB_TOKEN),
      webhook: Boolean(req.ctx.env.GITHUB_WEBHOOK_SECRET),
    });
  });

  // Sub-rutele proprii stau înainte de `crudRouter`, la fel ca în celelalte module.

  /** Sincronizare manuală: detalii repository, commits, pull requests și releases. */
  router.post("/repositories/:id/sync", requirePermission("github.update"), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    const repository = await findRepository(req, id);

    const result = await syncRepository(req.ctx.db, req.ctx.env, repository);
    await audit(req, "github_sync", "repository", id);

    res.json({ result });
  });

  router.use(
    "/repositories",
    crudRouter({
      table: repositories,
      entityType: "repository",
      permission: "github",
      schema: repositorySchema,
      searchColumns: [repositories.name, repositories.owner],
      filters: {
        projectId: repositories.projectId,
        status: repositories.status,
      },
      sortable: {
        name: repositories.name,
        lastSyncAt: repositories.lastSyncAt,
      },
      defaultSort: { column: repositories.name },
      listTransform: attachProjectNames,
    }),
  );

  router.use(
    "/commits",
    crudRouter({
      table: commits,
      entityType: "commit",
      permission: "github",
      schema: z.object({}),
      readOnly: true,
      searchColumns: [commits.hash, commits.message, commits.author],
      filters: {
        repositoryId: commits.repositoryId,
        branch: commits.branch,
      },
      sortable: {
        date: commits.date,
        hash: commits.hash,
      },
      defaultSort: { column: commits.date, dir: "desc" },
      scope: (req: Request) => projectScope(req, commits.repositoryId),
      listTransform: attachRepositoryNames,
    }),
  );

  router.use(
    "/pull-requests",
    crudRouter({
      table: pullRequests,
      entityType: "pull_request",
      permission: "github",
      schema: z.object({}),
      readOnly: true,
      searchColumns: [pullRequests.title, pullRequests.author],
      filters: {
        repositoryId: pullRequests.repositoryId,
        status: pullRequests.status,
      },
      sortable: {
        createdAt: pullRequests.createdAt,
        number: pullRequests.number,
      },
      defaultSort: { column: pullRequests.createdAt, dir: "desc" },
      scope: (req: Request) => projectScope(req, pullRequests.repositoryId),
      listTransform: attachRepositoryNames,
    }),
  );

  router.use(
    "/releases",
    crudRouter({
      table: releases,
      entityType: "release",
      permission: "github",
      schema: z.object({}),
      readOnly: true,
      searchColumns: [releases.tag, releases.version],
      filters: {
        repositoryId: releases.repositoryId,
      },
      sortable: {
        date: releases.date,
        tag: releases.tag,
      },
      defaultSort: { column: releases.date, dir: "desc" },
      scope: (req: Request) => projectScope(req, releases.repositoryId),
      listTransform: attachRepositoryNames,
    }),
  );

  return router;
}
