/**
 * Comentarii polimorfe (`entity_type`/`entity_id`): listare pe entitate, adăugare cu
 * autorul din sesiune și ștergere doar de către autor. Comentariile pe task/proiect
 * lasă o intrare în timeline.
 */
import { and, asc, eq } from "drizzle-orm";
import { Router, type Request } from "express";
import { z } from "zod";

import { users } from "../../db/schema/auth";
import { comments, tasks } from "../../db/schema/core";
import { HttpError, parse } from "../../lib/http";
import { recordActivity } from "../../security/audit";
import { requirePermission } from "../../security/guards";

const idSchema = z.object({ id: z.uuid("Identificator invalid") });

const listQuery = z.object({
  entityType: z.string().trim().min(1, "Tipul entității este obligatoriu").max(40),
  entityId: z.uuid("Identificator invalid"),
});

const commentSchema = z.object({
  entityType: z.string().trim().min(1, "Tipul entității este obligatoriu").max(40),
  entityId: z.uuid("Identificator invalid"),
  body: z.string().trim().min(1, "Comentariul este obligatoriu").max(5000),
});

/** Tipurile de entități ale căror comentarii intră în timeline. */
const ACTIVITY_ENTITIES = new Set(["task", "project"]);

/** Identitatea curentă (gardurile au aruncat deja 401 dacă lipsește). */
function currentUserId(req: Request): string {
  const auth = req.auth;
  if (!auth) throw new HttpError(401, "unauthorized", "Autentificare necesară");
  return auth.user.id;
}

/** Proiectul/clientul comentariului, pentru timeline (taskul le dă, proiectul e el însuși). */
async function activityScope(
  req: Request,
  entityType: string,
  entityId: string,
): Promise<{ projectId: string | null; clientId: string | null }> {
  if (entityType === "project") return { projectId: entityId, clientId: null };

  const [task] = await req.ctx.db
    .select({ projectId: tasks.projectId, clientId: tasks.clientId })
    .from(tasks)
    .where(eq(tasks.id, entityId))
    .limit(1);

  return { projectId: task?.projectId ?? null, clientId: task?.clientId ?? null };
}

export function commentsRouter(): Router {
  const router = Router();

  /** Comentariile unei entități, cele mai vechi primele, cu numele autorului. */
  router.get("/", requirePermission("tasks.view"), async (req, res) => {
    const query = parse(listQuery, req.query);

    const items = await req.ctx.db
      .select({
        id: comments.id,
        entityType: comments.entityType,
        entityId: comments.entityId,
        authorId: comments.authorId,
        authorName: users.name,
        body: comments.body,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
      })
      .from(comments)
      .leftJoin(users, eq(users.id, comments.authorId))
      .where(and(eq(comments.entityType, query.entityType), eq(comments.entityId, query.entityId)))
      .orderBy(asc(comments.createdAt));

    res.json({ items });
  });

  /** Adaugă un comentariu; autorul e cel din sesiune, nu cel din body. */
  router.post("/", requirePermission("tasks.update"), async (req, res) => {
    const data = parse(commentSchema, req.body);
    const authorId = currentUserId(req);
    const { db } = req.ctx;

    const [row] = await db
      .insert(comments)
      .values({ ...data, authorId })
      .returning();

    if (ACTIVITY_ENTITIES.has(data.entityType)) {
      const scope = await activityScope(req, data.entityType, data.entityId);
      await recordActivity(db, {
        projectId: scope.projectId,
        clientId: scope.clientId,
        actorId: authorId,
        type: "comment_added",
        description: `Comentariu adăugat la ${data.entityType}`,
        entityType: data.entityType,
        entityId: data.entityId,
      });
    }

    res.status(201).json({ item: row });
  });

  /** Ștergere fizică, doar de către autor. */
  router.delete("/:id", requirePermission("tasks.update"), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    const userId = currentUserId(req);

    const [row] = await req.ctx.db
      .select({ id: comments.id, authorId: comments.authorId })
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1);
    if (!row) throw new HttpError(404, "not_found", "Comentariul nu există");
    if (row.authorId !== userId) {
      throw new HttpError(403, "forbidden", "Doar autorul poate șterge comentariul");
    }

    await req.ctx.db.delete(comments).where(eq(comments.id, id));

    res.status(204).end();
  });

  return router;
}
