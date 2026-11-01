/**
 * Rutele pentru proiecte (§5): CRUD cu slug generat automat și unic, căutare pe
 * nume/slug/URL, filtre pe status/type/client/priority și favoritele utilizatorului
 * curent. Fiecare scriere lasă o intrare în timeline.
 *
 * Scoping pe rol: rolul `developer` vede toate proiectele (fără restricții — nu are
 * `scope`), iar izolarea pe client se face în portalul clientului, nu aici.
 */
import { and, asc, count, desc, eq, inArray, isNull, ne, notInArray, sql } from "drizzle-orm";
import { Router, type Request } from "express";
import { z } from "zod";

import { CURRENCIES, PRIORITIES, PROJECT_STATUSES, PROJECT_TYPES } from "../../../shared/enums";
import type { Db } from "../../db/client";
import { activities, clients, projectFavorites, projects, tasks } from "../../db/schema/core";
import { expenses, invoices, payments } from "../../db/schema/finance";
import { commits, deployments, repositories } from "../../db/schema/github";
import { incidents, maintenancePlans, monitoringChecks } from "../../db/schema/ops";
import { crudRouter, dateStr, moneyInt, optStr } from "../../lib/crud";
import { HttpError, parse } from "../../lib/http";
import { recordActivity } from "../../security/audit";
import { can, requirePermission } from "../../security/guards";
import { notify } from "../notifications/service";

const idSchema = z.object({ id: z.uuid("Identificator invalid") });

/** URL opțional, validat ca URL absolut. */
const webUrl = z.preprocess(
  (value) => (value === "" ? null : value),
  z.url("URL invalid").nullable().optional(),
);

/** Câmpurile proiectului din §5; `slug` lipsește → se generează din `name`. */
const projectSchema = z.object({
  name: z.string().trim().min(1, "Numele proiectului este obligatoriu").max(200),
  slug: optStr,
  clientId: z.uuid("Identificator invalid"),
  description: optStr,
  type: z.enum(PROJECT_TYPES),
  websiteUrl: webUrl,
  adminUrl: webUrl,
  status: z.enum(PROJECT_STATUSES),
  priority: z.enum(PRIORITIES),
  startDate: dateStr,
  deadline: dateStr,
  deliveryDate: dateStr,
  contractValue: moneyInt.nullable().optional(),
  currency: z.enum(CURRENCIES).nullable().optional(),
  maintenanceStatus: optStr,
  internalNotes: optStr,
  tags: z.array(z.string().trim().min(1)).optional(),
});

/** Normalizează numele într-un slug: lowercase, fără diacritice, doar `a-z0-9-`. */
function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Slug unic: baza + sufix `-2`, `-3`, … până nu mai există în DB (inclusiv șterse logic). */
async function uniqueSlug(db: Db, name: string): Promise<string> {
  const base = slugify(name) || "proiect";
  for (let suffix = 1; ; suffix += 1) {
    const candidate = suffix === 1 ? base : `${base}-${suffix}`;
    const [existing] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.slug, candidate))
      .limit(1);
    if (!existing) return candidate;
  }
}

/** Identitatea curentă (gardurile au aruncat deja 401 dacă lipsește). */
function currentUserId(req: Request): string {
  const auth = req.auth;
  if (!auth) throw new HttpError(401, "unauthorized", "Autentificare necesară");
  return auth.user.id;
}

/** Intrare în timeline-ul proiectului (creare/modificare/status). */
async function projectActivity(
  req: Request,
  type: string,
  row: any,
  description: string,
): Promise<void> {
  await recordActivity(req.ctx.db, {
    projectId: row.id,
    clientId: row.clientId,
    actorId: req.auth?.user.id ?? null,
    type,
    description,
    entityType: "project",
    entityId: row.id,
  });
}

/** Compară două valori de rând (date, array-uri, primitive) pentru câmpurile schimbate. */
function sameValue(before: unknown, after: unknown): boolean {
  if (before instanceof Date && after instanceof Date) return before.getTime() === after.getTime();
  if (Array.isArray(before) && Array.isArray(after)) {
    return before.length === after.length && before.every((value, index) => value === after[index]);
  }
  return before === after;
}

/** Cheile diferite între rândul dinainte și cel de după update (`updatedAt` nu contează). */
function changedFields(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  return Object.keys(after).filter(
    (key) => key !== "updatedAt" && !sameValue(before[key], after[key]),
  );
}

/** Proiectul după id, doar dacă nu e șters logic. */
async function findProject(req: Request, id: string): Promise<any> {
  const [row] = await req.ctx.db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), isNull(projects.deletedAt)))
    .limit(1);
  if (!row) throw new HttpError(404, "not_found", "Proiectul nu există");
  return row;
}

/** Ultimul commit al proiectului, prin repository-urile lui; cele fără dată la final. */
async function lastCommitOf(db: Db, projectId: string) {
  const [row] = await db
    .select({ hash: commits.hash, message: commits.message, date: commits.date })
    .from(commits)
    .innerJoin(repositories, eq(repositories.id, commits.repositoryId))
    .where(eq(repositories.projectId, projectId))
    .orderBy(sql`${commits.date} desc nulls last`)
    .limit(1);
  return row ?? null;
}

/** Ultimul deployment al proiectului, după momentul lansării. */
async function lastDeploymentOf(db: Db, projectId: string) {
  const [row] = await db
    .select({
      status: deployments.status,
      environment: deployments.environment,
      deployedAt: deployments.deployedAt,
    })
    .from(deployments)
    .where(eq(deployments.projectId, projectId))
    .orderBy(desc(deployments.deployedAt))
    .limit(1);
  return row ?? null;
}

/**
 * Facturile și cheltuielile proiectului, per monedă: nimic nu se adună între monede.
 * `balance` = facturat − încasat (doar plățile nesterse ale acelor facturi).
 */
async function projectFinance(db: Db, projectId: string) {
  const live = and(
    eq(invoices.projectId, projectId),
    isNull(invoices.deletedAt),
    notInArray(invoices.status, ["Draft", "Cancelled"]),
  );

  const invoiced = await db
    .select({ currency: invoices.currency, total: sql<string>`sum(${invoices.total})` })
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
    .select({ currency: expenses.currency, total: sql<string>`sum(${expenses.amount})` })
    .from(expenses)
    .where(and(eq(expenses.projectId, projectId), isNull(expenses.deletedAt)))
    .groupBy(expenses.currency);

  return {
    invoices: invoiced.map((row) => {
      const total = Number(row.total ?? 0);
      const paid = Number(collected.find((r) => r.currency === row.currency)?.paid ?? 0);
      return { currency: row.currency, total, paid, balance: total - paid };
    }),
    expenses: spent.map((row) => ({ currency: row.currency, total: Number(row.total ?? 0) })),
  };
}

/** Primul plan de mentenanță al proiectului (dacă există). */
async function projectMaintenance(db: Db, projectId: string) {
  const [row] = await db
    .select({
      plan: maintenancePlans.plan,
      monthlyPrice: maintenancePlans.monthlyPrice,
      currency: maintenancePlans.currency,
      renewalDate: maintenancePlans.renewalDate,
    })
    .from(maintenancePlans)
    .where(eq(maintenancePlans.projectId, projectId))
    .orderBy(asc(maintenancePlans.createdAt))
    .limit(1);
  return row ?? null;
}

/** Incidentele nerezolvate și verificările căzute ale proiectului. */
async function projectProblems(db: Db, projectId: string) {
  const [open] = await db
    .select({ n: count() })
    .from(incidents)
    .where(and(eq(incidents.projectId, projectId), ne(incidents.status, "Resolved")));
  const [down] = await db
    .select({ n: count() })
    .from(monitoringChecks)
    .where(
      and(eq(monitoringChecks.projectId, projectId), eq(monitoringChecks.lastStatus, "down")),
    );

  return { incidents: open?.n ?? 0, down: down?.n ?? 0 };
}

export function projectsRouter(): Router {
  const router = Router();

  // Sub-rutele proprii stau înainte de `crudRouter`, ca `/favorites/mine` să nu ajungă la `/:id`.

  /** Proiectele favorite ale utilizatorului curent. */
  router.get("/favorites/mine", requirePermission("projects.view"), async (req, res) => {
    const rows = await req.ctx.db
      .select({
        id: projects.id,
        name: projects.name,
        slug: projects.slug,
        status: projects.status,
        clientId: projects.clientId,
      })
      .from(projectFavorites)
      .innerJoin(projects, eq(projects.id, projectFavorites.projectId))
      .where(and(eq(projectFavorites.userId, currentUserId(req)), isNull(projects.deletedAt)))
      .orderBy(asc(projects.name));

    res.json({ items: rows });
  });

  /** Adaugă proiectul la favoritele utilizatorului curent (idempotent). */
  router.post("/:id/favorite", requirePermission("projects.view"), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    await findProject(req, id);

    await req.ctx.db
      .insert(projectFavorites)
      .values({ projectId: id, userId: currentUserId(req) })
      .onConflictDoNothing();

    res.status(201).json({ favorite: true });
  });

  /** Scoate proiectul din favoritele utilizatorului curent (idempotent). */
  router.delete("/:id/favorite", requirePermission("projects.view"), async (req, res) => {
    const { id } = parse(idSchema, req.params);

    await req.ctx.db
      .delete(projectFavorites)
      .where(
        and(eq(projectFavorites.projectId, id), eq(projectFavorites.userId, currentUserId(req))),
      );

    res.status(204).end();
  });

  /**
   * Sumarul proiectului: clientul, statisticile taskurilor, ultima intrare în timeline,
   * ultimul commit/deployment, finanțele și mentenanța proiectului. Secțiunile pentru
   * care utilizatorul nu are permisiune întorc `null`.
   */
  router.get("/:id/overview", requirePermission("projects.view"), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    const { db } = req.ctx;

    const project = await findProject(req, id);

    const [client] = await db
      .select({ id: clients.id, companyName: clients.companyName })
      .from(clients)
      .where(eq(clients.id, project.clientId))
      .limit(1);

    const [totals] = await db
      .select({ total: count() })
      .from(tasks)
      .where(and(eq(tasks.projectId, id), isNull(tasks.deletedAt)));
    const [done] = await db
      .select({ completed: count() })
      .from(tasks)
      .where(and(eq(tasks.projectId, id), isNull(tasks.deletedAt), eq(tasks.status, "Completed")));

    const total = totals?.total ?? 0;
    const completed = done?.completed ?? 0;

    const [lastActivity] = await db
      .select({ at: activities.at, description: activities.description, type: activities.type })
      .from(activities)
      .where(eq(activities.projectId, id))
      .orderBy(desc(activities.at))
      .limit(1);

    const lastCommit = can(req, "github.view") ? await lastCommitOf(db, id) : null;
    const lastDeployment = can(req, "deployments.view") ? await lastDeploymentOf(db, id) : null;
    const finance = can(req, "finance.view") ? await projectFinance(db, id) : null;
    const maintenance = can(req, "maintenance.view") ? await projectMaintenance(db, id) : null;
    const problems = can(req, "monitoring.view") ? await projectProblems(db, id) : null;

    res.json({
      project,
      client: client ?? null,
      tasks: { total, open: total - completed, completed },
      lastActivity: lastActivity ?? null,
      lastCommit,
      lastDeployment,
      finance,
      maintenance,
      problems,
    });
  });

  router.use(
    crudRouter({
      table: projects,
      entityType: "project",
      permission: "projects",
      schema: projectSchema,
      searchColumns: [projects.name, projects.slug, projects.websiteUrl],
      filters: {
        status: projects.status,
        type: projects.type,
        clientId: projects.clientId,
        priority: projects.priority,
      },
      sortable: {
        name: projects.name,
        status: projects.status,
        deadline: projects.deadline,
        createdAt: projects.createdAt,
        priority: projects.priority,
      },
      defaultSort: { column: projects.createdAt, dir: "desc" },
      // Creare: slug-ul lipsește → generat din nume (la PATCH slug-ul rămâne neatins).
      toRow: async (data: any, req: Request) => {
        const values: Record<string, unknown> = { ...data };
        if (req.method === "POST" && !values.slug) {
          values.slug = await uniqueSlug(req.ctx.db, String(data.name));
        }
        return values;
      },
      // Lista adaugă numele clientului, printr-un singur query pe pagina curentă.
      listTransform: async (rows: any[], req: Request) => {
        const ids = [...new Set(rows.map((row) => row.clientId as string).filter(Boolean))];
        if (ids.length === 0) return rows;

        const clientRows = await req.ctx.db
          .select({ id: clients.id, companyName: clients.companyName })
          .from(clients)
          .where(inArray(clients.id, ids));
        const names = new Map(clientRows.map((row) => [row.id, row.companyName]));

        return rows.map((row) => ({ ...row, clientName: names.get(row.clientId) ?? null }));
      },
      afterCreate: async (row: any, req: Request) => {
        await projectActivity(req, "project_created", row, `Proiect creat: ${row.name}`);
        await notify(req.ctx.db, req.ctx.env, {
          event: "New Project",
          dedupeKey: `project:${row.id}`,
          title: `Proiect nou: ${row.name}`,
          link: `/projects/${row.id}`,
        });
      },
      afterUpdate: async (row: any, req: Request, before: any) => {
        const changed = changedFields(before, row);
        await projectActivity(
          req,
          "project_updated",
          row,
          `Proiect actualizat: ${changed.join(", ") || "fără modificări"}`,
        );

        if (changed.includes("status")) {
          await projectActivity(req, "status_changed", row, `Status: ${before.status} → ${row.status}`);
        }
      },
    }),
  );

  return router;
}
