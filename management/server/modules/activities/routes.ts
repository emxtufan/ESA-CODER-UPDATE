/**
 * Timeline-ul (§5) — append-only: listare paginată cu numele actorului și intrări manuale
 * de tip `note`. Nu există PATCH sau DELETE.
 */
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";

import { users } from "../../db/schema/auth";
import { activities, projects } from "../../db/schema/core";
import { HttpError, pageQuery, paged, parse } from "../../lib/http";
import { requirePermission } from "../../security/guards";

/** Identificator opțional: string-ul gol e ignorat, ca filtrele să poată veni din UI. */
const optionalId = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.uuid("Identificator invalid").optional(),
);

const listQuery = pageQuery.extend({
  projectId: optionalId,
  clientId: optionalId,
  type: z.string().trim().min(1).optional(),
});

/** Intrare manuală de timeline: doar textul și proiectul; restul se completează aici. */
const noteSchema = z.object({
  projectId: z.uuid("Identificator invalid"),
  description: z.string().trim().min(1, "Descrierea este obligatorie").max(2000),
});

export function activitiesRouter(): Router {
  const router = Router();

  /** Intrările din timeline, cele mai recente primele, cu numele actorului din `users`. */
  router.get("/", requirePermission("projects.view"), async (req, res) => {
    const query = parse(listQuery, req.query);
    const { db } = req.ctx;

    const where = and(
      query.projectId ? eq(activities.projectId, query.projectId) : undefined,
      query.clientId ? eq(activities.clientId, query.clientId) : undefined,
      query.type ? eq(activities.type, query.type) : undefined,
    );

    const items = await db
      .select({
        id: activities.id,
        projectId: activities.projectId,
        clientId: activities.clientId,
        actorId: activities.actorId,
        actorName: users.name,
        actorLabel: activities.actorLabel,
        type: activities.type,
        description: activities.description,
        entityType: activities.entityType,
        entityId: activities.entityId,
        at: activities.at,
      })
      .from(activities)
      .leftJoin(users, eq(users.id, activities.actorId))
      .where(where)
      .orderBy(desc(activities.at))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);

    const [totals] = await db.select({ total: count() }).from(activities).where(where);

    res.json(paged(items, totals?.total ?? 0, query));
  });

  /** Notă manuală în timeline-ul unui proiect existent; autorul e cel din sesiune. */
  router.post("/", requirePermission("projects.update"), async (req, res) => {
    const data = parse(noteSchema, req.body);
    const { db } = req.ctx;

    const [project] = await db
      .select({ id: projects.id, clientId: projects.clientId })
      .from(projects)
      .where(and(eq(projects.id, data.projectId), isNull(projects.deletedAt)))
      .limit(1);
    if (!project) throw new HttpError(404, "not_found", "Proiectul nu există");

    const [row] = await db
      .insert(activities)
      .values({
        projectId: project.id,
        clientId: project.clientId,
        actorId: req.auth?.user.id ?? null,
        type: "note",
        description: data.description,
        entityType: "project",
        entityId: project.id,
      })
      .returning();

    res.status(201).json({ item: row });
  });

  return router;
}
