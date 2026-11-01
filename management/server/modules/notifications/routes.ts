import { Router, type Request } from "express";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { NOTIFICATION_EVENTS } from "../../../shared/enums";
import { emailTemplates, notificationLogs, notificationRules, notifications } from "../../db/schema/ops";
import { isEmailConfigured, sendEmail } from "../../integrations/smtp";
import { crudRouter } from "../../lib/crud";
import { HttpError, pageQuery, paged, parse } from "../../lib/http";
import { requireAuth, requirePermission } from "../../security/guards";

function currentUser(req: Request) {
  if (!req.auth) throw new HttpError(401, "unauthorized", "Autentificare necesară");
  return req.auth.user;
}

const optionalInt = (min: number, max: number) =>
  z.preprocess((v) => (v === "" ? null : v), z.coerce.number().int().min(min).max(max).nullable().optional());

/** Notification Center: fiecare interogare e filtrată pe utilizatorul curent. */
export function notificationsRouter(): Router {
  const router = Router();

  router.get("/status", requirePermission("notifications.view"), (req, res) => {
    res.json({ email: isEmailConfigured(req.ctx.env) });
  });

  router.get("/unread-count", requireAuth, async (req, res) => {
    const user = currentUser(req);
    const [row] = await req.ctx.db
      .select({ n: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
    res.json({ count: row?.n ?? 0 });
  });

  router.get("/", requireAuth, async (req, res) => {
    const user = currentUser(req);
    const q = parse(pageQuery, req.query);
    const where = eq(notifications.userId, user.id);
    const items = await req.ctx.db
      .select()
      .from(notifications)
      .where(where)
      .orderBy(desc(notifications.createdAt))
      .limit(q.pageSize)
      .offset((q.page - 1) * q.pageSize);
    const [total] = await req.ctx.db.select({ n: count() }).from(notifications).where(where);
    res.json(paged(items, total?.n ?? 0, q));
  });

  router.post("/read-all", requireAuth, async (req, res) => {
    const user = currentUser(req);
    const updated = await req.ctx.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)))
      .returning({ id: notifications.id });
    res.json({ updated: updated.length });
  });

  router.post("/test", requirePermission("notifications.update"), async (req, res) => {
    const user = currentUser(req);
    const result = await sendEmail(req.ctx.env, {
      to: user.email,
      subject: "Test ESA Management",
      html: "<p>Emailurile din ESA Management funcționează.</p>",
    });
    if (result.status === "not_configured") {
      throw new HttpError(503, "email_not_configured", "Emailul nu este configurat: setează SMTP_HOST, SMTP_USER, SMTP_PASS și EMAIL_FROM");
    }
    if (result.status === "failed") throw new HttpError(502, "email_failed", "Emailul de test nu a putut fi trimis");
    res.json({ status: "sent" });
  });

  router.post("/:id/read", requireAuth, async (req, res) => {
    const user = currentUser(req);
    const id = parse(z.uuid(), req.params.id);
    const [row] = await req.ctx.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)))
      .returning();
    if (!row) throw new HttpError(404, "not_found", "Notificarea nu există");
    res.json({ item: row });
  });

  return router;
}

export function rulesRouter(): Router {
  return crudRouter({
    table: notificationRules,
    entityType: "notification_rule",
    permission: "notifications",
    schema: z.object({
      event: z.enum(NOTIFICATION_EVENTS),
      recipients: z.array(z.email()).optional(),
      enabled: z.boolean().optional(),
      frequencyMinutes: optionalInt(1, 525_600),
      maxRetries: optionalInt(0, 10),
    }),
    searchColumns: [notificationRules.event],
    filters: { event: notificationRules.event, enabled: notificationRules.enabled },
    sortable: { event: notificationRules.event },
    defaultSort: { column: notificationRules.event },
  });
}

export function templatesRouter(): Router {
  return crudRouter({
    table: emailTemplates,
    entityType: "email_template",
    permission: "notifications",
    schema: z.object({
      event: z.enum(NOTIFICATION_EVENTS),
      subject: z.string().trim().min(1),
      html: z.string().trim().min(1),
      enabled: z.boolean().optional(),
    }),
    searchColumns: [emailTemplates.subject],
    sortable: { event: emailTemplates.event },
    defaultSort: { column: emailTemplates.event },
  });
}

export function logsRouter(): Router {
  return crudRouter({
    table: notificationLogs,
    entityType: "notification_log",
    permission: "notifications",
    readOnly: true,
    schema: z.object({}),
    searchColumns: [notificationLogs.recipient],
    filters: { event: notificationLogs.event, status: notificationLogs.status },
    sortable: { createdAt: notificationLogs.createdAt, status: notificationLogs.status },
    defaultSort: { column: notificationLogs.createdAt, dir: "desc" },
    listTransform: ((rows: (typeof notificationLogs.$inferSelect)[]) => rows.map(({ payload: _payload, ...rest }) => rest)) as never,
  });
}
