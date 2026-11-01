/**
 * Rutele pentru proiecte (§5): CRUD cu slug generat automat și unic, căutare pe
 * nume/slug/URL, filtre pe status/type/client/priority și favoritele utilizatorului
 * curent. Fiecare scriere lasă o intrare în timeline.
 *
 * Scoping pe rol: rolul `developer` vede toate proiectele (fără restricții — nu are
 * `scope`), iar izolarea pe client se face în portalul clientului, nu aici.
 */
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { Router, type Request } from "express";
import { z } from "zod";

import { CURRENCIES, PRIORITIES, PROJECT_STATUSES, PROJECT_TYPES } from "../../../shared/enums";
import type { Db } from "../../db/client";
import { clients, projectFavorites, projects } from "../../db/schema/core";
import { crudRouter, dateStr, moneyInt, optStr } from "../../lib/crud";
import { HttpError, parse } from "../../lib/http";
import { recordActivity } from "../../security/audit";
import { requirePermission } from "../../security/guards";

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
