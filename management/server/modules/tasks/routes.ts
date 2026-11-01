/**
 * Rutele pentru taskuri (§10): CRUD cu termen (`due`), ore estimate/reale și prioritate,
 * dependențe între taskuri (fără auto-referință și fără cicluri directe) și vederea de
 * calendar după `due`. Trecerea pe `Completed` ține `completedAt` sincronizat.
 */
import { and, asc, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import { Router, type Request } from "express";
import { z } from "zod";

import { PRIORITIES, TASK_STATUSES } from "../../../shared/enums";
import { projects, taskDependencies, tasks } from "../../db/schema/core";
import { crudRouter, optStr } from "../../lib/crud";
import { HttpError, parse } from "../../lib/http";
import { recordActivity } from "../../security/audit";
import { requirePermission } from "../../security/guards";

const idSchema = z.object({ id: z.uuid("Identificator invalid") });

/** Identificator opțional: string-ul gol devine `null`, câmpul absent rămâne `undefined`. */
const optionalId = z.preprocess(
  (value) => (value === "" ? null : value),
  z.uuid("Identificator invalid").nullable().optional(),
);

/** Termen opțional: acceptă `YYYY-MM-DD` sau ISO complet; string-ul gol devine `null`. */
const dueDate = z.preprocess(
  (value) => {
    if (value === "" || value === null) return null;
    if (typeof value === "string") return new Date(value);
    return value;
  },
  z.date("Dată invalidă").nullable().optional(),
);

/** Ore opționale (2 zecimale): acceptă și string din formulare, string-ul gol devine `null`. */
const hoursNum = z.preprocess(
  (value) => (value === "" ? null : value),
  z.coerce
    .number()
    .min(0, "Orele nu pot fi negative")
    .max(9999.99, "Valoare prea mare")
    .nullable()
    .optional(),
);

/** Câmpurile taskului din §10 (fără `completedAt`, care se derivă din `status`). */
const taskSchema = z.object({
  title: z.string().trim().min(1, "Titlul taskului este obligatoriu").max(200),
  description: optStr,
  projectId: z.uuid("Identificator invalid"),
  clientId: optionalId,
  priority: z.enum(PRIORITIES),
  status: z.enum(TASK_STATUSES),
  due: dueDate,
  estimatedHours: hoursNum,
  actualHours: hoursNum,
});

const dependencyBody = z.object({ dependsOnId: z.uuid("Identificator invalid") });

const dependencyParams = z.object({
  id: z.uuid("Identificator invalid"),
  depId: z.uuid("Identificator invalid"),
});

const calendarQuery = z.object({
  from: z.iso.date("Dată invalidă").optional(),
  to: z.iso.date("Dată invalidă").optional(),
});

/** Orele ajung în `numeric(6,2)` ca string cu două zecimale. */
function hoursValue(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return value as null | undefined;
  return Number(value).toFixed(2);
}

/** Taskul după id, doar dacă nu e șters logic. */
async function findTask(req: Request, id: string): Promise<any> {
  const [row] = await req.ctx.db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), isNull(tasks.deletedAt)))
    .limit(1);
  if (!row) throw new HttpError(404, "not_found", "Taskul nu există");
  return row;
}

/** Intrare în timeline-ul proiectului/clientului taskului. */
async function taskActivity(
  req: Request,
  type: string,
  row: any,
  description: string,
): Promise<void> {
  await recordActivity(req.ctx.db, {
    projectId: row.projectId,
    clientId: row.clientId,
    actorId: req.auth?.user.id ?? null,
    type,
    description,
    entityType: "task",
    entityId: row.id,
  });
}

export function tasksRouter(): Router {
  const router = Router();

  // Sub-rutele proprii stau înainte de `crudRouter`, ca `/calendar` să nu ajungă la `/:id`.

  /** Taskurile cu termen în intervalul `from`…`to` (inclusiv), pentru calendar. */
  router.get("/calendar", requirePermission("tasks.view"), async (req, res) => {
    const query = parse(calendarQuery, req.query);
    const from = query.from ? new Date(`${query.from}T00:00:00.000Z`) : undefined;
    const to = query.to ? new Date(`${query.to}T23:59:59.999Z`) : undefined;

    const items = await req.ctx.db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        due: tasks.due,
        completedAt: tasks.completedAt,
        projectId: tasks.projectId,
        clientId: tasks.clientId,
        projectName: projects.name,
      })
      .from(tasks)
      .leftJoin(projects, eq(projects.id, tasks.projectId))
      .where(
        and(
          isNull(tasks.deletedAt),
          from ? gte(tasks.due, from) : undefined,
          to ? lte(tasks.due, to) : undefined,
        ),
      )
      .orderBy(asc(tasks.due));

    res.json({ items });
  });

  /** Dependențele directe ale taskului: taskurile de care depinde. */
  router.get("/:id/dependencies", requirePermission("tasks.view"), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    await findTask(req, id);

    const items = await req.ctx.db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        due: tasks.due,
        completedAt: tasks.completedAt,
      })
      .from(taskDependencies)
      .innerJoin(tasks, eq(tasks.id, taskDependencies.dependsOnTaskId))
      .where(and(eq(taskDependencies.taskId, id), isNull(tasks.deletedAt)))
      .orderBy(asc(tasks.title));

    res.json({ items });
  });

  /** Adaugă o dependență; auto-referința și ciclul direct sunt respinse cu 422. */
  router.post("/:id/dependencies", requirePermission("tasks.update"), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    const { dependsOnId } = parse(dependencyBody, req.body);

    await findTask(req, id);
    if (dependsOnId === id) {
      throw new HttpError(422, "validation_error", "Un task nu poate depinde de el însuși", {
        dependsOnId: "Un task nu poate depinde de el însuși",
      });
    }
    await findTask(req, dependsOnId);

    const { db } = req.ctx;
    const [existing] = await db
      .select({ taskId: taskDependencies.taskId })
      .from(taskDependencies)
      .where(
        and(
          eq(taskDependencies.taskId, id),
          eq(taskDependencies.dependsOnTaskId, dependsOnId),
        ),
      )
      .limit(1);
    if (existing) throw new HttpError(409, "conflict", "Dependența există deja");

    // Ciclu direct: taskul de care depindem ar depinde, la rândul lui, de acest task.
    const [cycle] = await db
      .select({ taskId: taskDependencies.taskId })
      .from(taskDependencies)
      .where(
        and(
          eq(taskDependencies.taskId, dependsOnId),
          eq(taskDependencies.dependsOnTaskId, id),
        ),
      )
      .limit(1);
    if (cycle) {
      throw new HttpError(422, "validation_error", "Dependența ar forma un ciclu", {
        dependsOnId: "Dependența ar forma un ciclu",
      });
    }

    await db.insert(taskDependencies).values({ taskId: id, dependsOnTaskId: dependsOnId });

    res.status(201).json({ item: { taskId: id, dependsOnId } });
  });

  /** Scoate o dependență (idempotent, ca favoritele de proiect). */
  router.delete("/:id/dependencies/:depId", requirePermission("tasks.update"), async (req, res) => {
    const { id, depId } = parse(dependencyParams, req.params);

    await req.ctx.db
      .delete(taskDependencies)
      .where(
        and(eq(taskDependencies.taskId, id), eq(taskDependencies.dependsOnTaskId, depId)),
      );

    res.status(204).end();
  });

  router.use(
    crudRouter({
      table: tasks,
      entityType: "task",
      permission: "tasks",
      schema: taskSchema,
      searchColumns: [tasks.title, tasks.description],
      filters: {
        projectId: tasks.projectId,
        clientId: tasks.clientId,
        status: tasks.status,
        priority: tasks.priority,
      },
      sortable: {
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        due: tasks.due,
        createdAt: tasks.createdAt,
      },
      defaultSort: { column: tasks.createdAt, dir: "desc" },
      // Orele ajung în `numeric(6,2)` ca string; restul câmpurilor trec neschimbate.
      toRow: (data: any) => {
        const values: Record<string, unknown> = { ...data };
        if ("estimatedHours" in values) values.estimatedHours = hoursValue(values.estimatedHours);
        if ("actualHours" in values) values.actualHours = hoursValue(values.actualHours);
        return values;
      },
      // Lista adaugă numele proiectului, printr-un singur query pe pagina curentă.
      listTransform: async (rows: any[], req: Request) => {
        const ids = [...new Set(rows.map((row) => row.projectId as string).filter(Boolean))];
        if (ids.length === 0) return rows;

        const projectRows = await req.ctx.db
          .select({ id: projects.id, name: projects.name })
          .from(projects)
          .where(inArray(projects.id, ids));
        const names = new Map(projectRows.map((row) => [row.id, row.name]));

        return rows.map((row) => ({ ...row, projectName: names.get(row.projectId) ?? null }));
      },
      afterCreate: (row: any, req: Request) =>
        taskActivity(req, "task_created", row, `Task creat: ${row.title}`),
      afterUpdate: async (row: any, req: Request, before: any) => {
        const enteredCompleted = row.status === "Completed" && before.status !== "Completed";
        const leftCompleted = row.status !== "Completed" && before.status === "Completed";

        // `completedAt` urmează statusul: setat la intrarea pe Completed, golit la ieșire.
        if (enteredCompleted || leftCompleted) {
          const [updated] = await req.ctx.db
            .update(tasks)
            .set({ completedAt: enteredCompleted ? new Date() : null })
            .where(eq(tasks.id, row.id))
            .returning();
          if (updated) Object.assign(row, updated);
        }

        if (enteredCompleted) {
          await taskActivity(req, "task_completed", row, `Task finalizat: ${row.title}`);
        }
      },
    }),
  );

  return router;
}
