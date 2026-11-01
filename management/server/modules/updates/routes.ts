/**
 * Manual Update Log (§10): intrări de text legate de un proiect și, opțional, de un
 * commit, un deployment sau un task. Fiecare creare lasă o intrare în timeline.
 */
import { Router, type Request } from "express";
import { z } from "zod";

import { projectUpdates } from "../../db/schema/core";
import { crudRouter } from "../../lib/crud";
import { recordActivity } from "../../security/audit";

/** Identificator opțional: string-ul gol devine `null`, câmpul absent rămâne `undefined`. */
const optionalId = z.preprocess(
  (value) => (value === "" ? null : value),
  z.uuid("Identificator invalid").nullable().optional(),
);

/** Câmpurile update-ului manual din §10. */
const projectUpdateSchema = z.object({
  projectId: z.uuid("Identificator invalid"),
  text: z.string().trim().min(1, "Textul actualizării este obligatoriu").max(5000),
  commitId: optionalId,
  deploymentId: optionalId,
  taskId: optionalId,
});

export function updatesRouter(): Router {
  const router = Router();

  router.use(
    crudRouter({
      table: projectUpdates,
      entityType: "project_update",
      permission: "projects",
      schema: projectUpdateSchema,
      searchColumns: [projectUpdates.text],
      filters: { projectId: projectUpdates.projectId, taskId: projectUpdates.taskId },
      sortable: { createdAt: projectUpdates.createdAt },
      defaultSort: { column: projectUpdates.createdAt, dir: "desc" },
      afterCreate: async (row: any, req: Request) => {
        await recordActivity(req.ctx.db, {
          projectId: row.projectId,
          actorId: req.auth?.user.id ?? null,
          type: "update_logged",
          description: row.text,
          entityType: "project_update",
          entityId: row.id,
        });
      },
    }),
  );

  return router;
}
