/**
 * Audit și timeline: `audit` scrie în `audit_logs` (append-only, cu secrete
 * redactate), `recordActivity` scrie în `activities` (timeline-ul proiectului/clientului).
 */
import type { Request } from "express";

import type { Db } from "../db/client";
import { auditLogs } from "../db/schema/auth";
import { activities } from "../db/schema/core";

/** Cheile ale căror valori nu trebuie să ajungă niciodată în audit. */
const SENSITIVE_KEY = /password|secret|token|key/i;

const REDACTED = "[redacted]";

/** Curăță recursiv obiectele/array-urile de valori sensibile. */
function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactValue);
  if (value instanceof Date) return value;
  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const cleaned: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(source)) {
      cleaned[key] = SENSITIVE_KEY.test(key) ? REDACTED : redactValue(inner);
    }
    return cleaned;
  }
  return value;
}

/** Copie a meta cu valorile cheilor `/password|secret|token|key/i` înlocuite. */
export function redact(meta: Record<string, unknown>): Record<string, unknown> {
  return redactValue(meta) as Record<string, unknown>;
}

/** Scrie o intrare de audit pentru requestul curent (actorul vine din sesiune). */
export async function audit(
  req: Request,
  action: string,
  entityType: string,
  entityId: string | null | undefined,
  meta?: Record<string, unknown>,
): Promise<void> {
  const now = new Date();

  await req.ctx.db.insert(auditLogs).values({
    actorId: req.auth?.user.id ?? null,
    action,
    entityType,
    entityId: entityId ?? null,
    meta: meta ? redact(meta) : null,
    ip: req.ip ?? null,
    at: now,
  });
}

/** Intrare de timeline; acțiunile din integrări nu au `actorId`, doar `actorLabel`. */
export interface ActivityInput {
  projectId?: string | null;
  clientId?: string | null;
  actorId?: string | null;
  actorLabel?: string | null;
  type: string;
  description: string;
  entityType?: string | null;
  entityId?: string | null;
}

/** Adaugă o intrare în timeline-ul proiectului/clientului. */
export async function recordActivity(db: Db, input: ActivityInput): Promise<void> {
  await db.insert(activities).values({
    projectId: input.projectId ?? null,
    clientId: input.clientId ?? null,
    actorId: input.actorId ?? null,
    actorLabel: input.actorLabel ?? null,
    type: input.type,
    description: input.description,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
  });
}
