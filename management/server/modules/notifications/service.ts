import { and, desc, eq, gte, inArray, isNull, lt, sql } from "drizzle-orm";
import type { NotificationEvent } from "../../../shared/enums";
import type { Db } from "../../db/client";
import { roles, users } from "../../db/schema/auth";
import { emailTemplates, notificationLogs, notificationRules, notifications } from "../../db/schema/ops";
import type { Env } from "../../env";
import { sendEmail } from "../../integrations/resend";

export interface NotifyInput {
  event: NotificationEvent;
  /** Aceeași cheie nu se trimite de două ori aceluiași destinatar. */
  dedupeKey: string;
  title: string;
  body?: string;
  /** Cale din aplicație, ex. `/projects/123`. */
  link?: string;
}

/** Evenimente produse chiar de proprietar sau foarte dese: fără regulă explicită rămân doar în aplicație. */
const IN_APP_BY_DEFAULT = new Set<NotificationEvent>([
  "New Project",
  "New Task",
  "New Commit",
  "Invoice Issued",
  "Payment Received",
]);
const DEFAULT_SUBJECT = "{{title}}";
const DEFAULT_HTML = '<p><strong>{{title}}</strong></p><p>{{body}}</p><p><a href="{{link}}">Deschide în ESA Management</a></p>';
const MAX_EMAILS_PER_HOUR = 60;
const DEFAULT_MAX_RETRIES = 3;

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => ENTITIES[c]!);

/** Înlocuiește `{{var}}`; în HTML valorile se escapează, ca datele să nu devină markup. */
export function renderTemplate(template: string, vars: Record<string, string>, html: boolean): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = vars[key] ?? "";
    return html ? escapeHtml(value) : value;
  });
}

async function owners(db: Db) {
  return db
    .select({ id: users.id, email: users.email })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(and(eq(roles.key, "super_admin"), isNull(users.disabledAt)));
}

async function deliver(db: Db, env: Env, logId: string, recipient: string, event: NotificationEvent, vars: Record<string, string>): Promise<void> {
  const hourAgo = new Date(Date.now() - 3_600_000);
  const [sentLastHour] = await db
    .select({ n: sql<string>`count(*)` })
    .from(notificationLogs)
    .where(and(eq(notificationLogs.status, "sent"), gte(notificationLogs.sentAt, hourAgo)));
  if (Number(sentLastHour?.n ?? 0) >= MAX_EMAILS_PER_HOUR) {
    await db.update(notificationLogs).set({ status: "rate_limited" }).where(eq(notificationLogs.id, logId));
    return;
  }
  const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.event, event));
  if (template && !template.enabled) {
    await db.update(notificationLogs).set({ status: "skipped" }).where(eq(notificationLogs.id, logId));
    return;
  }
  const result = await sendEmail(env, {
    to: recipient,
    subject: renderTemplate(template?.subject ?? DEFAULT_SUBJECT, vars, false),
    html: renderTemplate(template?.html ?? DEFAULT_HTML, vars, true),
  });
  const attempts = sql`${notificationLogs.attempts} + 1`;
  if (result.status === "sent") {
    await db.update(notificationLogs).set({ status: "sent", attempts, sentAt: new Date(), error: null }).where(eq(notificationLogs.id, logId));
  } else if (result.status === "not_configured") {
    await db.update(notificationLogs).set({ status: "not_configured" }).where(eq(notificationLogs.id, logId));
  } else {
    await db.update(notificationLogs).set({ status: "failed", attempts, error: result.error }).where(eq(notificationLogs.id, logId));
  }
}

/** Notificare în aplicație + email, cu dedupe și limite. Nu aruncă: o notificare nu strică fluxul care a produs-o. */
export async function notify(db: Db, env: Env, input: NotifyInput): Promise<void> {
  try {
    const [rule] = await db.select().from(notificationRules).where(eq(notificationRules.event, input.event)).limit(1);
    if (rule && !rule.enabled) return;

    if (rule?.frequencyMinutes) {
      const since = new Date(Date.now() - rule.frequencyMinutes * 60_000);
      const [recent] = await db
        .select({ id: notificationLogs.id })
        .from(notificationLogs)
        .where(and(eq(notificationLogs.event, input.event), gte(notificationLogs.createdAt, since)))
        .limit(1);
      if (recent) return;
    }

    const ownerRows = await owners(db);
    const recipients = rule?.recipients.length ? rule.recipients : ownerRows.map((o) => o.email);
    const link = input.link && env.APP_URL ? new URL(input.link, env.APP_URL).href : "";
    const vars = { title: input.title, body: input.body ?? "", link };
    const emailEnabled = Boolean(rule) || !IN_APP_BY_DEFAULT.has(input.event);

    const fresh: { id: string; recipient: string }[] = [];
    for (const recipient of recipients) {
      const inserted = await db
        .insert(notificationLogs)
        .values({ event: input.event, dedupeKey: input.dedupeKey, recipient, status: emailEnabled ? "pending" : "in_app", payload: vars })
        .onConflictDoNothing()
        .returning({ id: notificationLogs.id, recipient: notificationLogs.recipient });
      fresh.push(...inserted);
    }
    if (fresh.length === 0) return;

    if (ownerRows.length > 0) {
      await db.insert(notifications).values(
        ownerRows.map((o) => ({ userId: o.id, title: input.title, body: input.body ?? null, link: input.link ?? null })),
      );
    }
    if (!emailEnabled) return;
    for (const entry of fresh) await deliver(db, env, entry.id, entry.recipient, input.event, vars);
  } catch (err) {
    console.error(`Notificare eșuată (${input.event}):`, err instanceof Error ? err.message : "eroare necunoscută");
  }
}

/** Reîncearcă emailurile eșuate, până la `maxRetries`. O apelează job-ul periodic. */
export async function retryFailed(db: Db, env: Env): Promise<number> {
  const failed = await db
    .select()
    .from(notificationLogs)
    .where(and(eq(notificationLogs.status, "failed"), lt(notificationLogs.attempts, 10)))
    .orderBy(desc(notificationLogs.createdAt))
    .limit(50);
  const events = [...new Set(failed.map((f) => f.event))];
  const rules = events.length ? await db.select().from(notificationRules).where(inArray(notificationRules.event, events)) : [];
  const limit = new Map(rules.map((r) => [r.event, r.maxRetries ?? DEFAULT_MAX_RETRIES]));
  let retried = 0;
  for (const log of failed) {
    if (log.attempts >= (limit.get(log.event) ?? DEFAULT_MAX_RETRIES)) continue;
    await deliver(db, env, log.id, log.recipient, log.event, log.payload ?? {});
    retried += 1;
  }
  return retried;
}
