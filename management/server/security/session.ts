/**
 * Sesiuni de management: token opac în cookie HttpOnly, doar hash-ul SHA-256 în DB.
 * `loadSession` e middleware-ul care atașează `req.auth` (session + user + role).
 */
import { createHash, randomBytes } from "node:crypto";

import { and, eq, gt, isNull, ne } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";

import type { Db } from "../db/client";
import { roles, sessions, users } from "../db/schema/auth";
import type { Env } from "../env";

/** Durata de viață a sesiunii: 12 ore, prelungită la activitate. */
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
/** Sub acest prag nu rescriem `lastSeenAt` (evită un UPDATE la fiecare request). */
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;
const TOKEN_BYTES = 32;
const MAX_USER_AGENT_LENGTH = 300;

/**
 * Numele cookie-ului. Prefixul `__Host-` (doar în producție) impune Secure,
 * Path=/ și fără Domain — deci nu poate fi suprascris de un subdomeniu.
 */
export function cookieName(env: Env): string {
  return env.NODE_ENV === "production" ? "__Host-esa_mgmt" : "esa_mgmt";
}

/** Setează cookie-ul de sesiune: HttpOnly, SameSite=Strict, Path=/, Secure în producție. */
export function setSessionCookie(res: Response, env: Env, token: string): void {
  res.cookie(cookieName(env), token, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure: env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS,
  });
}

/** Șterge cookie-ul de sesiune (aceleași atribute, ca browserul să-l potrivească). */
export function clearSessionCookie(res: Response, env: Env): void {
  res.clearCookie(cookieName(env), {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure: env.NODE_ENV === "production",
  });
}

/** Hash-ul stocat în DB pentru un token: SHA-256 hex. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Citește tokenul sesiunii din headerul `Cookie` (parsare manuală, fără dependențe). */
function readSessionToken(req: Request, env: Env): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;

  const name = cookieName(env);
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() !== name) continue;

    const raw = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  return undefined;
}

/** Creează o sesiune nouă și întoarce tokenul în clar (în DB rămâne doar hash-ul). */
export async function createSession(
  db: Db,
  userId: string,
  req: Request,
  { mfaPending = false }: { mfaPending?: boolean } = {},
): Promise<string> {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  const now = new Date();
  const userAgent = req.get("user-agent");

  await db.insert(sessions).values({
    tokenHash: hashToken(token),
    userId,
    ip: req.ip ?? null,
    userAgent: userAgent ? userAgent.slice(0, MAX_USER_AGENT_LENGTH) : null,
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
    lastSeenAt: now,
    mfaPending,
  });

  return token;
}

/** Revocă o sesiune (idempotent: o sesiune deja revocată rămâne cu `revokedAt` inițial). */
export async function revokeSession(db: Db, id: string): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(sessions.id, id), isNull(sessions.revokedAt)));
}

/** Revocă toate sesiunile unui utilizator, opțional cu excepția uneia (ex: cea curentă). */
export async function revokeUserSessions(db: Db, userId: string, exceptId?: string): Promise<void> {
  const now = new Date();
  await db
    .update(sessions)
    .set({ revokedAt: now, updatedAt: now })
    .where(
      and(
        eq(sessions.userId, userId),
        isNull(sessions.revokedAt),
        exceptId ? ne(sessions.id, exceptId) : undefined,
      ),
    );
}

/**
 * Middleware de autentificare: fără cookie valid nu setează `req.auth` și lasă
 * requestul să continue (rutele publice rămân accesibile).
 */
export async function loadSession(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = readSessionToken(req, req.ctx.env);
    if (!token) return next();

    const now = new Date();
    const [row] = await req.ctx.db
      .select({ session: sessions, user: users, role: roles })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .innerJoin(roles, eq(roles.id, users.roleId))
      .where(
        and(
          eq(sessions.tokenHash, hashToken(token)),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, now),
        ),
      )
      .limit(1);

    if (!row) return next();

    const { session, user, role } = row;
    if (user.deletedAt || user.disabledAt) return next();

    req.auth = {
      session,
      user,
      role,
      permissions: role.permissions,
      mfaPending: session.mfaPending,
    };

    // Sesiune activă: prelungește expirarea, dar fără UPDATE la fiecare request.
    const lastSeenAt = session.lastSeenAt?.getTime() ?? 0;
    if (now.getTime() - lastSeenAt > TOUCH_INTERVAL_MS) {
      await req.ctx.db
        .update(sessions)
        .set({ lastSeenAt: now, expiresAt: new Date(now.getTime() + SESSION_TTL_MS), updatedAt: now })
        .where(eq(sessions.id, session.id));
    }

    next();
  } catch (error) {
    next(error);
  }
}
