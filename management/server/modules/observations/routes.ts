/**
 * Observațiile (§10): notițe legate de un proiect, cu prioritate și status, care pot fi
 * convertite o singură dată într-un task. Autorul vine din sesiune, niciodată din body.
 */
import { and, eq, isNull } from "drizzle-orm";
import { Router, type Request } from "express";
import { z } from "zod";

import { PRIORITIES } from "../../../shared/enums";
import { observations, tasks } from "../../db/schema/core";
import { crudRouter, optStr } from "../../lib/crud";
import { HttpError, parse } from "../../lib/http";
import { recordActivity } from "../../security/audit";
import { requirePermission } from "../../security/guards";

const idSchema = z.object({ id: z.uuid("Identificator invalid") });

/** Câmpurile observației din §10; `convertedTaskId` se setează doar prin `/convert`. */
const observationSchema = z.object({
  title: z.string().trim().min(1, "Titlul observației este obligatoriu").max(200),
  description: optStr,
  projectId: z.uuid("Identificator invalid"),
  priority: z.enum(PRIORITIES),
  status: optStr,
});

/** Identitatea curentă (gardurile au aruncat deja 401 dacă lipsește). */
function currentUserId(req: Request): string {
  const auth = req.auth;
  if (!auth) throw new HttpError(401, "unauthorized", "Autentificare necesară");
  return auth.user.id;
}

/** Observația după id, doar dacă nu e ștearsă logic. */
async function findObservation(req: Request, id: string): Promise<any> {
  const [row] = await req.ctx.db
    .select()
    .from(observations)
    .where(and(eq(observations.id, id), isNull(observations.deletedAt)))
    .limit(1);
  if (!row) throw new HttpError(404, "not_found", "Observația nu există");
  return row;
}

export function observationsRouter(): Router {
  const router = Router();

  /** Conversia în task: o singură dată per observație; leagă taskul creat prin `convertedTaskId`. */
  router.post("/:id/convert", requirePermission("observations.update"), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    const observation = await findObservation(req, id);

    if (observation.convertedTaskId) {
      throw new HttpError(409, "conflict", "Observația a fost deja convertită");
    }

    const { db } = req.ctx;
    const [task] = await db
      .insert(tasks)
      .values({
        title: observation.title,
        description: observation.description,
        projectId: observation.projectId,
        priority: observation.priority,
        status: "To Do",
      })
      .returning();

    await db
      .update(observations)
      .set({ convertedTaskId: task.id, updatedAt: new Date() })
      .where(eq(observations.id, id));

    await recordActivity(db, {
      projectId: task.projectId,
      clientId: task.clientId,
      actorId: req.auth?.user.id ?? null,
      type: "observation_converted",
      description: `Observație convertită în task: ${task.title}`,
      entityType: "task",
      entityId: task.id,
    });

    res.status(201).json({ item: task });
  });

  router.use(
    crudRouter({
      table: observations,
      entityType: "observation",
      permission: "observations",
      schema: observationSchema,
      searchColumns: [observations.title, observations.description],
      filters: {
        projectId: observations.projectId,
        status: observations.status,
        priority: observations.priority,
      },
      sortable: {
        title: observations.title,
        priority: observations.priority,
        date: observations.date,
        createdAt: observations.createdAt,
      },
      defaultSort: { column: observations.date, dir: "desc" },
      // Autorul se pune doar la creare: la PATCH nu rescriem cine a scris observația.
      toRow: (data: any, req: Request) => {
        const values: Record<string, unknown> = { ...data };
        if (req.method === "POST") values.authorId = currentUserId(req);
        return values;
      },
    }),
  );

  return router;
}
