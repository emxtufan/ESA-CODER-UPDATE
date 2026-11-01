/**
 * Rutele de autentificare: login (cu rate limiting și istoric), al doilea factor TOTP,
 * logout, profilul curent, sesiunile active și fluxurile de parolă (schimbare, resetare).
 * Mesajele sunt în română, iar fiecare acțiune semnificativă ajunge în audit.
 */
import { createHash, randomBytes } from "node:crypto";

import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { Router, type Request } from "express";
import { z } from "zod";

import type { Role } from "../../../shared/enums";
import { loginHistory, passwordTokens, roles, sessions, users } from "../../db/schema/auth";
import type { Env } from "../../env";
import { sendEmail } from "../../integrations/smtp";
import { HttpError, parse } from "../../lib/http";
import { audit } from "../../security/audit";
import { decryptSecret, encryptSecret } from "../../security/crypto";
import { allowMfaPending, requireAuth } from "../../security/guards";
import { hashPassword, passwordSchema, verifyPassword } from "../../security/password";
import { createLimiter } from "../../security/ratelimit";
import {
  clearSessionCookie,
  createSession,
  revokeSession,
  revokeUserSessions,
  setSessionCookie,
} from "../../security/session";
import { generateSecret, otpauthUrl, verifyTotp } from "../../security/totp";

/** Linkul de resetare expiră într-o oră. */
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
/** Limita user-agentului, identică cu cea din `sessions`. */
const MAX_USER_AGENT_LENGTH = 300;

/** Login: 10 încercări / 15 minute pe combinația ip + email. */
const loginLimiter = createLimiter(10, 15 * 60 * 1000);
/** Codul 2FA: 5 încercări / 5 minute pe utilizator. */
const totpLimiter = createLimiter(5, 5 * 60 * 1000);
/** Cererile de resetare: 5 / oră pe ip. */
const forgotLimiter = createLimiter(5, 60 * 60 * 1000);

/**
 * Hash scrypt de umplutură, dar cu format valid: îl folosim când emailul nu există
 * sau contul e inactiv, ca verificarea să dureze la fel în toate cazurile.
 */
const DUMMY_PASSWORD_HASH = [
  "scrypt",
  "32768",
  "8",
  "1",
  "0".repeat(32),
  "0".repeat(128),
].join("$");

const emailSchema = z.string().trim().toLowerCase().email("Email invalid");
const totpCodeSchema = z.string().trim().regex(/^\d{6}$/, "Codul are exact 6 cifre");
const idSchema = z.object({ id: z.uuid("Identificator invalid") });

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(200),
});
const passwordOnlySchema = z.object({ password: z.string().min(1).max(200) });
const changePasswordSchema = z.object({
  current: z.string().min(1).max(200),
  next: passwordSchema,
});
const forgotPasswordSchema = z.object({ email: emailSchema });
const resetPasswordSchema = z.object({
  token: z.string().min(1).max(500),
  password: passwordSchema,
});
const verifyCodeSchema = z.object({ code: totpCodeSchema });
const disableTotpSchema = z.object({
  password: z.string().min(1).max(200),
  code: totpCodeSchema,
});

/** User-agent-ul brut, trunchiat ca în `sessions`. */
function userAgentOf(req: Request): string | null {
  const value = req.get("user-agent");
  return value ? value.slice(0, MAX_USER_AGENT_LENGTH) : null;
}

/** SHA-256 hex — formatul în care se stochează tokenii din `password_tokens`. */
function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Baza URL-urilor din emailuri: `APP_URL`, altfel adresa configurată a serverului. */
function appBaseUrl(env: Env): string {
  const base = env.APP_URL ?? `http://${env.HOST}:${env.PORT}`;
  return base.replace(/\/+$/, "");
}

/** Profilul public al utilizatorului: fără hash de parolă și fără secrete TOTP. */
function profile(user: typeof users.$inferSelect, roleKey: Role) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: roleKey,
    totpEnabled: user.totpEnabled,
  };
}

/** Identitatea atașată de `loadSession` (gardurile au aruncat deja 401 dacă lipsește). */
function currentAuth(req: Request): NonNullable<Request["auth"]> {
  const auth = req.auth;
  if (!auth) throw new HttpError(401, "unauthorized", "Autentificare necesară");
  return auth;
}

/** Email simplu cu un singur link — fără resurse externe, ca să nu fie blocat. */
function actionEmail(title: string, intro: string, label: string, link: string): string {
  return [
    `<h1>${title}</h1>`,
    `<p>${intro}</p>`,
    `<p><a href="${link}">${label}</a></p>`,
    `<p>Dacă nu tu ai făcut această cerere, ignoră acest email.</p>`,
  ].join("");
}

/** Verifică un cod TOTP pentru utilizatorul dat; întoarce pasul acceptat sau aruncă eroare. */
function acceptedStep(req: Request, user: typeof users.$inferSelect, code: string): number {
  if (!user.totpSecretEnc) {
    throw new HttpError(400, "totp_not_setup", "Pornește configurarea celui de-al doilea factor");
  }

  const secret = decryptSecret(user.totpSecretEnc, req.ctx.env.VAULT_MASTER_KEY, `totp:${user.id}`);
  const step = verifyTotp(secret, code, user.totpLastStep);
  if (step === null) throw new HttpError(401, "invalid_code", "Cod de verificare incorect");
  return step;
}

export function authRouter(): Router {
  const router = Router();

  /** Login cu parolă; dacă utilizatorul are 2FA, sesiunea rămâne în starea `mfaPending`. */
  router.post("/login", async (req, res) => {
    const { email, password } = parse(loginSchema, req.body);
    const { db, env } = req.ctx;

    if (!loginLimiter.hit(`${req.ip ?? "unknown"}|${email}`)) {
      throw new HttpError(429, "rate_limited", "Prea multe încercări. Reîncearcă în 15 minute.");
    }

    const [found] = await db
      .select({ user: users, role: roles })
      .from(users)
      .innerJoin(roles, eq(roles.id, users.roleId))
      .where(eq(users.email, email))
      .limit(1);

    const active = Boolean(found && !found.user.deletedAt && !found.user.disabledAt);
    const verifiable = active && found?.user.passwordHash ? found.user.passwordHash : DUMMY_PASSWORD_HASH;
    const passwordOk = active && (await verifyPassword(password, verifiable));

    if (!found || !active || !passwordOk) {
      await db.insert(loginHistory).values({
        userId: found?.user.id ?? null,
        email,
        ip: req.ip ?? null,
        userAgent: userAgentOf(req),
        success: false,
        reason: !found || !active ? "user_inactive" : "invalid_password",
      });
      await audit(req, "login_failed", "user", found?.user.id ?? null, { email });
      throw new HttpError(401, "invalid_credentials", "Email sau parolă incorectă");
    }

    const { user, role } = found;

    await db.insert(loginHistory).values({
      userId: user.id,
      email,
      ip: req.ip ?? null,
      userAgent: userAgentOf(req),
      success: true,
      reason: user.totpEnabled ? "mfa_pending" : "password",
    });

    if (user.totpEnabled) {
      const pending = await createSession(db, user.id, req, { mfaPending: true });
      setSessionCookie(res, env, pending);
      await audit(req, "login_mfa_pending", "user", user.id);
      res.json({ mfaRequired: true });
      return;
    }

    const token = await createSession(db, user.id, req);
    setSessionCookie(res, env, token);

    const now = new Date();
    await db.update(users).set({ lastLoginAt: now, updatedAt: now }).where(eq(users.id, user.id));

    await audit(req, "login", "user", user.id);
    res.json({ user: profile(user, role.key) });
  });

  /** Pasul al doilea: codul TOTP transformă sesiunea `mfaPending` într-una completă. */
  router.post("/2fa/verify", allowMfaPending, async (req, res) => {
    const { code } = parse(verifyCodeSchema, req.body);
    const auth = currentAuth(req);
    const { db, env } = req.ctx;

    if (!totpLimiter.hit(auth.user.id)) {
      throw new HttpError(429, "rate_limited", "Prea multe încercări. Reîncearcă în 5 minute.");
    }
    if (!auth.user.totpEnabled || !auth.user.totpSecretEnc) {
      throw new HttpError(400, "totp_not_enabled", "Al doilea factor nu este activat");
    }

    const secret = decryptSecret(auth.user.totpSecretEnc, env.VAULT_MASTER_KEY, `totp:${auth.user.id}`);
    const step = verifyTotp(secret, code, auth.user.totpLastStep);

    if (step === null) {
      await audit(req, "mfa_failed", "user", auth.user.id);
      throw new HttpError(401, "invalid_code", "Cod de verificare incorect");
    }

    totpLimiter.reset(auth.user.id);

    const now = new Date();
    await db
      .update(users)
      .set({ totpLastStep: step, lastLoginAt: now, updatedAt: now })
      .where(eq(users.id, auth.user.id));

    // Sesiunea care aștepta al doilea factor nu mai poate fi folosită: o revocăm.
    await revokeSession(db, auth.session.id);
    const token = await createSession(db, auth.user.id, req);
    setSessionCookie(res, env, token);

    await audit(req, "login", "user", auth.user.id, { mfa: true });
    res.json({ user: profile(auth.user, auth.role.key) });
  });

  /** Logout idempotent: revocă sesiunea curentă (dacă există) și șterge cookie-ul. */
  router.post("/logout", async (req, res) => {
    const { db, env } = req.ctx;

    if (req.auth) {
      await revokeSession(db, req.auth.session.id);
      await audit(req, "logout", "user", req.auth.user.id);
    }

    clearSessionCookie(res, env);
    res.json({ ok: true });
  });

  /** Profilul curent + permisiunile efective (rolul `super_admin` le are pe toate). */
  router.get("/me", requireAuth, async (req, res) => {
    const auth = currentAuth(req);
    res.json({ user: profile(auth.user, auth.role.key), permissions: auth.permissions });
  });

  /** Pregătește un secret TOTP nou (neactivat până la confirmarea unui cod). */
  router.post("/2fa/setup", requireAuth, async (req, res) => {
    const { password } = parse(passwordOnlySchema, req.body);
    const auth = currentAuth(req);
    const { db, env } = req.ctx;

    if (!(await verifyPassword(password, auth.user.passwordHash))) {
      throw new HttpError(401, "invalid_password", "Parolă incorectă");
    }
    if (auth.user.totpEnabled) {
      throw new HttpError(409, "totp_already_enabled", "Al doilea factor este deja activat");
    }

    const secret = generateSecret();
    const now = new Date();
    await db
      .update(users)
      .set({
        totpSecretEnc: encryptSecret(secret, env.VAULT_MASTER_KEY, `totp:${auth.user.id}`),
        totpEnabled: false,
        totpLastStep: null,
        updatedAt: now,
      })
      .where(eq(users.id, auth.user.id));

    await audit(req, "mfa_setup", "user", auth.user.id);
    res.json({ secret, otpauthUrl: otpauthUrl(secret, auth.user.email) });
  });

  /** Activează 2FA după ce utilizatorul confirmă un cod din aplicația de autentificare. */
  router.post("/2fa/enable", requireAuth, async (req, res) => {
    const { code } = parse(verifyCodeSchema, req.body);
    const auth = currentAuth(req);
    const { db } = req.ctx;

    if (auth.user.totpEnabled) {
      throw new HttpError(409, "totp_already_enabled", "Al doilea factor este deja activat");
    }

    const step = acceptedStep(req, auth.user, code);
    const now = new Date();
    await db
      .update(users)
      .set({ totpEnabled: true, totpLastStep: step, updatedAt: now })
      .where(eq(users.id, auth.user.id));

    await audit(req, "mfa_enabled", "user", auth.user.id);
    res.json({ totpEnabled: true });
  });

  /** Dezactivează 2FA: cere și parola, și un cod valid. */
  router.post("/2fa/disable", requireAuth, async (req, res) => {
    const { password, code } = parse(disableTotpSchema, req.body);
    const auth = currentAuth(req);
    const { db } = req.ctx;

    if (!(await verifyPassword(password, auth.user.passwordHash))) {
      throw new HttpError(401, "invalid_password", "Parolă incorectă");
    }
    acceptedStep(req, auth.user, code);

    const now = new Date();
    await db
      .update(users)
      .set({ totpEnabled: false, totpSecretEnc: null, totpLastStep: null, updatedAt: now })
      .where(eq(users.id, auth.user.id));

    await audit(req, "mfa_disabled", "user", auth.user.id);
    res.json({ totpEnabled: false });
  });

  /** Sesiunile active ale utilizatorului curent; `current` marchează sesiunea din request. */
  router.get("/sessions", requireAuth, async (req, res) => {
    const auth = currentAuth(req);
    const now = new Date();

    const rows = await req.ctx.db
      .select({
        id: sessions.id,
        ip: sessions.ip,
        userAgent: sessions.userAgent,
        lastSeenAt: sessions.lastSeenAt,
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, auth.user.id),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, now),
        ),
      )
      .orderBy(desc(sessions.lastSeenAt));

    res.json({
      items: rows.map((row) => ({ ...row, current: row.id === auth.session.id })),
    });
  });

  /** Revocă o sesiune proprie (alta decât cea curentă nu e interzisă, doar dezirabilă). */
  router.delete("/sessions/:id", requireAuth, async (req, res) => {
    const { id } = parse(idSchema, req.params);
    const auth = currentAuth(req);
    const { db } = req.ctx;

    const [own] = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(and(eq(sessions.id, id), eq(sessions.userId, auth.user.id)))
      .limit(1);
    if (!own) throw new HttpError(404, "not_found", "Sesiunea nu există");

    await revokeSession(db, id);
    await audit(req, "session_revoked", "session", id);
    res.json({ ok: true });
  });

  /** Schimbarea parolei: verifică parola curentă și închide toate celelalte sesiuni. */
  router.post("/change-password", requireAuth, async (req, res) => {
    const { current, next } = parse(changePasswordSchema, req.body);
    const auth = currentAuth(req);
    const { db } = req.ctx;

    if (!(await verifyPassword(current, auth.user.passwordHash))) {
      throw new HttpError(401, "invalid_password", "Parola actuală este incorectă");
    }

    const now = new Date();
    await db
      .update(users)
      .set({ passwordHash: await hashPassword(next), updatedAt: now })
      .where(eq(users.id, auth.user.id));

    await revokeUserSessions(db, auth.user.id, auth.session.id);
    await audit(req, "password_change", "user", auth.user.id);
    res.json({ ok: true });
  });

  /**
   * Cerere de resetare: răspunsul e mereu 202, ca să nu dezvăluie dacă emailul există.
   * Dacă utilizatorul există, primește un link valid o oră (în DB doar hash-ul tokenului).
   */
  router.post("/forgot-password", async (req, res) => {
    const { email } = parse(forgotPasswordSchema, req.body);
    const { db, env } = req.ctx;

    if (!forgotLimiter.hit(req.ip ?? "unknown")) {
      throw new HttpError(429, "rate_limited", "Prea multe cereri. Reîncearcă mai târziu.");
    }

    const [found] = await db
      .select({ user: users })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let delivery = "no_user";

    if (found && !found.user.deletedAt) {
      const token = randomBytes(32).toString("base64url");
      const now = new Date();

      await db.insert(passwordTokens).values({
        tokenHash: sha256(token),
        userId: found.user.id,
        kind: "reset",
        expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MS),
      });

      const link = `${appBaseUrl(env)}/reset-password?token=${token}`;
      const result = await sendEmail(env, {
        to: found.user.email,
        subject: "Resetarea parolei — ESA Management",
        html: actionEmail(
          "Resetarea parolei",
          "Ai cerut resetarea parolei contului tău. Linkul este valabil o oră.",
          "Setează o parolă nouă",
          link,
        ),
      });
      delivery = result.status;
    }

    await audit(req, "password_reset_requested", "user", found?.user.id ?? null, { email, delivery });
    res.status(202).json({ ok: true });
  });

  /** Consumă tokenul de resetare: parolă nouă, token marcat folosit, sesiuni revocate. */
  router.post("/reset-password", async (req, res) => {
    const { token, password } = parse(resetPasswordSchema, req.body);
    const { db } = req.ctx;
    const now = new Date();

    const [found] = await db
      .select({ token: passwordTokens, user: users })
      .from(passwordTokens)
      .innerJoin(users, eq(users.id, passwordTokens.userId))
      .where(eq(passwordTokens.tokenHash, sha256(token)))
      .limit(1);

    if (
      !found ||
      found.token.usedAt ||
      found.token.expiresAt <= now ||
      found.token.kind !== "reset" ||
      found.user.deletedAt
    ) {
      throw new HttpError(400, "invalid_token", "Linkul de resetare este invalid sau expirat");
    }

    await db
      .update(users)
      .set({ passwordHash: await hashPassword(password), updatedAt: now })
      .where(eq(users.id, found.user.id));

    await db
      .update(passwordTokens)
      .set({ usedAt: now, updatedAt: now })
      .where(eq(passwordTokens.id, found.token.id));

    await revokeUserSessions(db, found.user.id);
    await audit(req, "password_reset", "user", found.user.id, { kind: found.token.kind });
    res.json({ ok: true });
  });

  return router;
}
