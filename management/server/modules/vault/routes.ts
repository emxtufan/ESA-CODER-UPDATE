/**
 * Seiful de credențiale (§7): secretele stau doar criptate AES-256-GCM în `secret_enc` și
 * sunt legate prin AAD de id-ul rândului, deci un blob mutat pe alt rând nu mai poate fi
 * decriptat. Listarea și detaliile întorc exclusiv metadate; singura cale de a citi un
 * secret e `POST /:id/reveal`, cu parolă (+ al doilea factor) și cu urmă în audit.
 */
import { randomUUID } from "node:crypto";

import { and, count, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { Router, type Request } from "express";
import { z } from "zod";

import { CREDENTIAL_TYPES } from "../../../shared/enums";
import { users } from "../../db/schema/auth";
import { projects } from "../../db/schema/core";
import { credentials, servers } from "../../db/schema/infra";
import { optStr } from "../../lib/crud";
import { HttpError, pageQuery, paged, parse } from "../../lib/http";
import { audit } from "../../security/audit";
import { decryptSecret, encryptSecret } from "../../security/crypto";
import { requirePermission } from "../../security/guards";
import { verifyPassword } from "../../security/password";
import { createLimiter } from "../../security/ratelimit";
import { verifyTotp } from "../../security/totp";

/** Dezvăluirea unui secret: 5 încercări / 15 minute pe utilizator. */
const revealLimiter = createLimiter(5, 15 * 60 * 1000);

const idSchema = z.object({ id: z.uuid("Identificator invalid") });

/** Secretul în clar, acceptat doar la creare și la rotație; nu se loghează niciodată. */
const secretSchema = z
  .string()
  .min(1, "Secretul este obligatoriu")
  .max(8192, "Maximum 8192 caractere");

const passwordSchema = z.string().min(1).max(200);
const totpCodeSchema = z.string().trim().regex(/^\d{6}$/, "Codul are exact 6 cifre");

/** Metadatele credențialei — fără `secret`: acesta se scrie doar prin creare/rotație. */
const metadataSchema = {
  name: z.string().trim().min(1, "Numele credențialei este obligatoriu").max(200),
  type: z.enum(CREDENTIAL_TYPES),
  projectId: z.uuid("Identificator invalid").nullable().optional(),
  serverId: z.uuid("Identificator invalid").nullable().optional(),
  username: optStr,
  url: optStr,
  notes: optStr,
};

const createSchema = z.object({ ...metadataSchema, secret: secretSchema });
const updateSchema = z.object({
  name: metadataSchema.name.optional(),
  type: metadataSchema.type.optional(),
  projectId: metadataSchema.projectId,
  serverId: metadataSchema.serverId,
  username: metadataSchema.username,
  url: metadataSchema.url,
  notes: metadataSchema.notes,
});

const rotateSchema = z.object({ secret: secretSchema, password: passwordSchema });
const revealSchema = z.object({ password: passwordSchema, code: totpCodeSchema.optional() });

const listQuery = pageQuery.extend({
  type: z.enum(CREDENTIAL_TYPES).optional(),
  projectId: z.uuid("Identificator invalid").optional(),
  serverId: z.uuid("Identificator invalid").optional(),
});

/** Rândul credențialei + numele proiectului/serverului (pentru listare și detaliu). */
type CredentialRecord = typeof credentials.$inferSelect & {
  projectName: string | null;
  serverName: string | null;
};

/** AAD-ul care leagă blob-ul criptat de rândul lui. */
function credentialAad(id: string): string {
  return `credential:${id}`;
}

/** Identitatea curentă (gardurile au aruncat deja 401 dacă lipsește). */
function currentAuth(req: Request): NonNullable<Request["auth"]> {
  const auth = req.auth;
  if (!auth) throw new HttpError(401, "unauthorized", "Autentificare necesară");
  return auth;
}

/** Forma publică a credențialei: fără blob, doar `hasSecret`. */
function publicRow(row: CredentialRecord) {
  const { secretEnc, ...rest } = row;
  return { ...rest, hasSecret: Boolean(secretEnc) };
}

/** Credențiala după id, doar dacă nu e ștearsă logic (altfel 404, fără scurgeri de ID). */
async function findCredential(req: Request, id: string): Promise<CredentialRecord> {
  const [row] = await req.ctx.db
    .select({ credential: credentials, projectName: projects.name, serverName: servers.name })
    .from(credentials)
    .leftJoin(projects, eq(projects.id, credentials.projectId))
    .leftJoin(servers, eq(servers.id, credentials.serverId))
    .where(and(eq(credentials.id, id), isNull(credentials.deletedAt)))
    .limit(1);
  if (!row) throw new HttpError(404, "not_found", "Credențiala nu există");

  return { ...row.credential, projectName: row.projectName, serverName: row.serverName };
}

export function vaultRouter(): Router {
  const router = Router();

  /** Listare paginată; `secret_enc` nu părăsește niciodată serverul. */
  router.get("/", requirePermission("vault.view"), async (req, res) => {
    const query = parse(listQuery, req.query);
    const { db } = req.ctx;
    const search = query.q ? `%${query.q}%` : undefined;

    const where = and(
      isNull(credentials.deletedAt),
      query.type ? eq(credentials.type, query.type) : undefined,
      query.projectId ? eq(credentials.projectId, query.projectId) : undefined,
      query.serverId ? eq(credentials.serverId, query.serverId) : undefined,
      search
        ? or(
            ilike(credentials.name, search),
            ilike(credentials.username, search),
            ilike(credentials.url, search),
          )
        : undefined,
    );

    const rows = await db
      .select({ credential: credentials, projectName: projects.name, serverName: servers.name })
      .from(credentials)
      .leftJoin(projects, eq(projects.id, credentials.projectId))
      .leftJoin(servers, eq(servers.id, credentials.serverId))
      .where(where)
      .orderBy(desc(credentials.createdAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);

    const [totals] = await db.select({ total: count() }).from(credentials).where(where);

    const items = rows.map((row) => ({
      ...publicRow({ ...row.credential, projectName: row.projectName, serverName: row.serverName }),
    }));

    res.json(paged(items, totals?.total ?? 0, query));
  });

  /** Detaliul: aceleași metadate ca în listare, fără secret. */
  router.get("/:id", requirePermission("vault.view"), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    const credential = await findCredential(req, id);
    res.json({ item: publicRow(credential) });
  });

  /** Creare: id-ul se generează înainte de insert ca să intre în AAD-ul criptării. */
  router.post("/", requirePermission("vault.manage"), async (req, res) => {
    const data = parse(createSchema, req.body);
    const { db, env } = req.ctx;

    const id = randomUUID();
    const secretEnc = encryptSecret(data.secret, env.VAULT_MASTER_KEY, credentialAad(id));

    await db.insert(credentials).values({
      id,
      name: data.name,
      type: data.type,
      projectId: data.projectId ?? null,
      serverId: data.serverId ?? null,
      username: data.username ?? null,
      secretEnc,
      url: data.url ?? null,
      notes: data.notes ?? null,
    });

    await audit(req, "credential_created", "credential", id, { name: data.name, type: data.type });

    const credential = await findCredential(req, id);
    res.status(201).json({ item: publicRow(credential) });
  });

  /** Modificare de metadate: secretul are fluxurile lui (creare, rotație). */
  router.patch("/:id", requirePermission("vault.manage"), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    const data = parse(updateSchema, req.body);
    await findCredential(req, id);

    const now = new Date();
    await req.ctx.db
      .update(credentials)
      .set({ ...data, updatedAt: now })
      .where(eq(credentials.id, id));

    await audit(req, "credential_updated", "credential", id, { fields: Object.keys(data) });

    const credential = await findCredential(req, id);
    res.json({ item: publicRow(credential) });
  });

  /** Rotație: cere parola curentă, re-criptează secretul și marchează `rotatedAt`. */
  router.post("/:id/rotate", requirePermission("vault.manage"), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    const { secret, password } = parse(rotateSchema, req.body);
    const auth = currentAuth(req);
    await findCredential(req, id);

    if (!(await verifyPassword(password, auth.user.passwordHash))) {
      throw new HttpError(401, "invalid_password", "Parolă incorectă");
    }

    const secretEnc = encryptSecret(secret, req.ctx.env.VAULT_MASTER_KEY, credentialAad(id));
    const now = new Date();
    await req.ctx.db
      .update(credentials)
      .set({ secretEnc, rotatedAt: now, updatedAt: now })
      .where(eq(credentials.id, id));

    const credential = await findCredential(req, id);
    await audit(req, "credential_rotated", "credential", id, { name: credential.name });

    res.json({ item: publicRow(credential) });
  });

  /** Revocare: un secret revocat nu mai poate fi dezvăluit. */
  router.post("/:id/revoke", requirePermission("vault.manage"), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    await findCredential(req, id);

    const now = new Date();
    await req.ctx.db
      .update(credentials)
      .set({ revokedAt: now, updatedAt: now })
      .where(eq(credentials.id, id));

    const credential = await findCredential(req, id);
    await audit(req, "credential_revoked", "credential", id, { name: credential.name });

    res.json({ item: publicRow(credential) });
  });

  /** Ștergere logică: rândul rămâne în DB (audit-ul poate avea nevoie de el). */
  router.delete("/:id", requirePermission("vault.manage"), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    await findCredential(req, id);

    const now = new Date();
    await req.ctx.db
      .update(credentials)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(credentials.id, id));

    await audit(req, "credential_deleted", "credential", id);

    res.status(204).end();
  });

  /**
   * Dezvăluirea secretului — singura rută care îl întoarce în clar. Cere parola
   * utilizatorului curent și, dacă are 2FA, un cod TOTP valid (cu anti-replay).
   */
  router.post("/:id/reveal", requirePermission("vault.reveal"), async (req, res) => {
    const auth = currentAuth(req);
    const { id } = parse(idSchema, req.params);
    const { password, code } = parse(revealSchema, req.body);
    const { db, env } = req.ctx;

    if (!revealLimiter.hit(auth.user.id)) {
      throw new HttpError(429, "rate_limited", "Prea multe încercări. Reîncearcă în 15 minute.");
    }

    const credential = await findCredential(req, id);

    if (!(await verifyPassword(password, auth.user.passwordHash))) {
      await audit(req, "credential_reveal_denied", "credential", id, { reason: "invalid_password" });
      throw new HttpError(401, "invalid_password", "Parolă incorectă");
    }

    if (auth.user.totpEnabled) {
      const step =
        code && auth.user.totpSecretEnc
          ? verifyTotp(
              decryptSecret(
                auth.user.totpSecretEnc,
                env.VAULT_MASTER_KEY,
                `totp:${auth.user.id}`,
              ),
              code,
              auth.user.totpLastStep,
            )
          : null;

      if (step === null) {
        await audit(req, "credential_reveal_denied", "credential", id, { reason: "invalid_code" });
        throw new HttpError(401, "invalid_code", "Cod de verificare incorect");
      }

      const now = new Date();
      await db
        .update(users)
        .set({ totpLastStep: step, updatedAt: now })
        .where(eq(users.id, auth.user.id));
    }

    if (credential.revokedAt) {
      throw new HttpError(409, "credential_revoked", "Credențiala a fost revocată");
    }

    let secret: string;
    try {
      secret = decryptSecret(credential.secretEnc, env.VAULT_MASTER_KEY, credentialAad(id));
    } catch {
      throw new HttpError(500, "secret_unreadable", "Secretul nu poate fi citit");
    }

    await audit(req, "credential_revealed", "credential", id, { name: credential.name });

    res.setHeader("Cache-Control", "no-store");
    res.json({ secret });
  });

  return router;
}
