/**
 * Rutele de administrare a utilizatorilor și rolurilor: listare paginată, invitații,
 * modificare rol/client/dezactivare, ștergere logică, revocarea sesiunilor,
 * istoricul de login și permisiunile pe rol. Fiecare modificare ajunge în audit.
 */
import { createHash, randomBytes } from "node:crypto";

import { and, asc, count, desc, eq, ilike, isNull, ne, or } from "drizzle-orm";
import { Router, type Request } from "express";
import { z } from "zod";

import { ROLES, type Role } from "../../../shared/enums";
import { PERMISSIONS } from "../../../shared/permissions";
import type { Db } from "../../db/client";
import { loginHistory, passwordTokens, roles, users } from "../../db/schema/auth";
import { clients } from "../../db/schema/core";
import type { Env } from "../../env";
import { sendEmail } from "../../integrations/resend";
import { HttpError, pageQuery, paged, parse } from "../../lib/http";
import { audit } from "../../security/audit";
import { requirePermission } from "../../security/guards";
import { revokeUserSessions } from "../../security/session";

/** Invitația e valabilă 7 zile. */
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const idSchema = z.object({ id: z.uuid("Identificator invalid") });
const roleKeySchema = z.enum(ROLES);

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalid"),
  name: z.string().trim().min(1).max(160),
  roleKey: roleKeySchema,
  clientId: z.uuid("Identificator invalid").optional(),
});

const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    roleKey: roleKeySchema.optional(),
    clientId: z.uuid("Identificator invalid").nullable().optional(),
    disabled: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.roleKey !== undefined ||
      value.clientId !== undefined ||
      value.disabled !== undefined,
    "Niciun câmp de modificat",
  );

const rolePermissionsSchema = z.object({ permissions: z.array(z.enum(PERMISSIONS)) });
const roleParamsSchema = z.object({ key: roleKeySchema });

/** SHA-256 hex — formatul în care se stochează tokenii din `password_tokens`. */
function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Baza URL-urilor din emailuri: `APP_URL`, altfel adresa configurată a serverului. */
function appBaseUrl(env: Env): string {
  const base = env.APP_URL ?? `http://${env.HOST}:${env.PORT}`;
  return base.replace(/\/+$/, "");
}

/** Identitatea atașată de `loadSession` (gardurile au aruncat deja 401 dacă lipsește). */
function currentAuth(req: Request): NonNullable<Request["auth"]> {
  const auth = req.auth;
  if (!auth) throw new HttpError(401, "unauthorized", "Autentificare necesară");
  return auth;
}

/** Utilizatorul așa cum iese din API: fără hash de parolă și fără secrete TOTP. */
function userView(user: typeof users.$inferSelect, roleKey: Role) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: roleKey,
    clientId: user.clientId,
    totpEnabled: user.totpEnabled,
    invitedAt: user.invitedAt,
    disabledAt: user.disabledAt,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

/** Rolul după cheie; o cheie fără rând în DB este o configurare lipsă (400). */
async function roleByKey(db: Db, key: Role): Promise<typeof roles.$inferSelect> {
  const [role] = await db.select().from(roles).where(eq(roles.key, key)).limit(1);
  if (!role) throw new HttpError(400, "unknown_role", "Rolul nu există");
  return role;
}

/** Clientul trebuie să existe și să nu fie șters logic. */
async function ensureClient(db: Db, clientId: string): Promise<void> {
  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, clientId), isNull(clients.deletedAt)))
    .limit(1);
  if (!client) {
    throw new HttpError(422, "validation_error", "Clientul nu există", { clientId: "Client inexistent" });
  }
}

/** Câți alți super_admin activi există (protecția ultimului super_admin). */
async function otherActiveSuperAdmins(db: Db, userId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(users)
    .innerJoin(roles, eq(roles.id, users.roleId))
    .where(
      and(
        eq(roles.key, "super_admin"),
        isNull(users.deletedAt),
        isNull(users.disabledAt),
        ne(users.id, userId),
      ),
    );
  return row?.total ?? 0;
}

export function usersRouter(): Router {
  const router = Router();

  /** Listare paginată, fără conturi șterse, cu rolul fiecăruia. */
  router.get("/", requirePermission("users.view"), async (req, res) => {
    const query = parse(pageQuery, req.query);
    const { db } = req.ctx;
    const search = query.q ? `%${query.q}%` : undefined;

    const where = and(
      isNull(users.deletedAt),
      search ? or(ilike(users.name, search), ilike(users.email, search)) : undefined,
    );

    const items = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: roles.key,
        roleName: roles.name,
        clientId: users.clientId,
        totpEnabled: users.totpEnabled,
        invitedAt: users.invitedAt,
        disabledAt: users.disabledAt,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(roles, eq(roles.id, users.roleId))
      .where(where)
      .orderBy(asc(users.name))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);

    const [totals] = await db.select({ total: count() }).from(users).where(where);

    res.json(paged(items, totals?.total ?? 0, query));
  });

  /** Invitație: cont fără parolă + token de 7 zile prin email (sau în răspuns, dacă emailul lipsește). */
  router.post("/invite", requirePermission("users.create"), async (req, res) => {
    const input = parse(inviteSchema, req.body);
    const auth = currentAuth(req);
    const { db, env } = req.ctx;

    if (input.roleKey === "super_admin" && auth.role.key !== "super_admin") {
      throw new HttpError(403, "forbidden", "Doar un super admin poate acorda rolul super_admin");
    }
    if (input.clientId && input.roleKey !== "client") {
      throw new HttpError(422, "validation_error", "Doar rolul client poate fi legat de un client", {
        clientId: "Nu se aplică acestui rol",
      });
    }
    if (input.roleKey === "client" && !input.clientId) {
      throw new HttpError(422, "validation_error", "Rolul client cere un client", {
        clientId: "Obligatoriu pentru rolul client",
      });
    }
    if (input.clientId) await ensureClient(db, input.clientId);

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);
    if (existing) {
      throw new HttpError(409, "email_taken", "Există deja un utilizator cu acest email");
    }

    const role = await roleByKey(db, input.roleKey);
    const now = new Date();
    const [created] = await db
      .insert(users)
      .values({
        email: input.email,
        name: input.name,
        roleId: role.id,
        clientId: input.clientId ?? null,
        invitedAt: now,
      })
      .returning();

    const token = randomBytes(32).toString("base64url");
    await db.insert(passwordTokens).values({
      tokenHash: sha256(token),
      userId: created.id,
      kind: "invite",
      expiresAt: new Date(now.getTime() + INVITE_TTL_MS),
    });

    const inviteUrl = `${appBaseUrl(env)}/reset-password?token=${token}&invite=1`;
    const sent = await sendEmail(env, {
      to: created.email,
      subject: "Invitație în ESA Management",
      html: [
        `<h1>Bine ai venit, ${created.name}!</h1>`,
        "<p>Ai fost invitat în panoul de management ESA. Setează-ți parola din linkul de mai jos; invitația expiră în 7 zile.</p>",
        `<p><a href="${inviteUrl}">Acceptă invitația</a></p>`,
      ].join(""),
    });

    await audit(req, "user_invited", "user", created.id, { email: created.email, role: role.key });

    const body = { user: userView(created, role.key) };
    res.status(201).json(sent.status === "not_configured" ? { ...body, inviteUrl } : body);
  });

  /** Rolurile existente și permisiunile lor (înaintea rutelor cu `/:id`). */
  router.get("/roles", requirePermission("users.view"), async (req, res) => {
    const rows = await req.ctx.db
      .select({
        key: roles.key,
        name: roles.name,
        permissions: roles.permissions,
        isSystem: roles.isSystem,
      })
      .from(roles)
      .orderBy(asc(roles.key));

    res.json({ items: rows });
  });

  /** Permisiunile unui rol; `super_admin` le are pe toate, deci nu se editează. */
  router.patch("/roles/:key", requirePermission("users.update"), async (req, res) => {
    const { key } = parse(roleParamsSchema, req.params);
    const { permissions } = parse(rolePermissionsSchema, req.body);
    const { db } = req.ctx;

    if (key === "super_admin") {
      throw new HttpError(403, "forbidden", "Rolul super_admin nu poate fi modificat");
    }

    const [role] = await db.select().from(roles).where(eq(roles.key, key)).limit(1);
    if (!role) throw new HttpError(404, "not_found", "Rolul nu există");

    const before = role.permissions;
    const after = Array.from(new Set(permissions));

    await db
      .update(roles)
      .set({ permissions: after, updatedAt: new Date() })
      .where(eq(roles.id, role.id));

    await audit(req, "permission_change", "role", role.id, { before, after });
    res.json({ role: { key: role.key, name: role.name, permissions: after, isSystem: role.isSystem } });
  });

  /** Modificare utilizator: nume, rol, client, dezactivare — cu protecțiile de rigoare. */
  router.patch("/:id", requirePermission("users.update"), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    const input = parse(updateUserSchema, req.body);
    const auth = currentAuth(req);
    const { db } = req.ctx;

    const [target] = await db
      .select({ user: users, roleKey: roles.key })
      .from(users)
      .innerJoin(roles, eq(roles.id, users.roleId))
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);
    if (!target) throw new HttpError(404, "not_found", "Utilizatorul nu există");

    if (input.disabled === true && target.user.id === auth.user.id) {
      throw new HttpError(400, "self_disable", "Nu te poți dezactiva pe tine");
    }

    const nextRoleKey = input.roleKey ?? target.roleKey;
    const roleChanged = input.roleKey !== undefined && input.roleKey !== target.roleKey;

    if (roleChanged && input.roleKey === "super_admin" && auth.role.key !== "super_admin") {
      throw new HttpError(403, "forbidden", "Doar un super admin poate acorda rolul super_admin");
    }

    const targetIsActiveSuperAdmin = target.roleKey === "super_admin" && !target.user.disabledAt;
    const losesSuperAdmin =
      targetIsActiveSuperAdmin && (nextRoleKey !== "super_admin" || input.disabled === true);
    if (losesSuperAdmin && (await otherActiveSuperAdmins(db, target.user.id)) === 0) {
      throw new HttpError(409, "last_super_admin", "Nu poți retrograda ultimul super admin");
    }

    const clientId =
      nextRoleKey === "client"
        ? input.clientId !== undefined
          ? input.clientId
          : target.user.clientId
        : null;

    if (nextRoleKey === "client") {
      if (!clientId) {
        throw new HttpError(422, "validation_error", "Rolul client cere un client", {
          clientId: "Obligatoriu pentru rolul client",
        });
      }
      await ensureClient(db, clientId);
    }

    const now = new Date();
    const values: Partial<typeof users.$inferInsert> = { updatedAt: now };
    if (input.name !== undefined) values.name = input.name;
    if (roleChanged) values.roleId = (await roleByKey(db, nextRoleKey)).id;
    if (input.roleKey !== undefined || input.clientId !== undefined) values.clientId = clientId;
    if (input.disabled !== undefined) values.disabledAt = input.disabled ? now : null;

    await db.update(users).set(values).where(eq(users.id, target.user.id));

    // Rol schimbat sau cont dezactivat → sesiunile deschise nu mai sunt valide.
    if (roleChanged || input.disabled === true) await revokeUserSessions(db, target.user.id);

    const before = {
      name: target.user.name,
      role: target.roleKey,
      clientId: target.user.clientId,
      disabled: target.user.disabledAt !== null,
    };
    const after = {
      name: values.name ?? before.name,
      role: nextRoleKey,
      clientId: values.clientId !== undefined ? values.clientId : before.clientId,
      disabled: input.disabled ?? before.disabled,
    };

    await audit(
      req,
      roleChanged || input.disabled !== undefined ? "permission_change" : "user_updated",
      "user",
      target.user.id,
      { before, after },
    );

    res.json({ user: userView({ ...target.user, ...values } as typeof users.$inferSelect, nextRoleKey) });
  });

  /** Ștergere logică: contul dispare din listări, sesiunile sunt revocate. */
  router.delete("/:id", requirePermission("users.delete"), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    const auth = currentAuth(req);
    const { db } = req.ctx;

    if (id === auth.user.id) throw new HttpError(400, "self_delete", "Nu îți poți șterge propriul cont");

    const [target] = await db
      .select({ user: users, roleKey: roles.key })
      .from(users)
      .innerJoin(roles, eq(roles.id, users.roleId))
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);
    if (!target) throw new HttpError(404, "not_found", "Utilizatorul nu există");

    if (target.roleKey === "super_admin" && (await otherActiveSuperAdmins(db, target.user.id)) === 0) {
      throw new HttpError(409, "last_super_admin", "Nu poți șterge ultimul super admin");
    }

    const now = new Date();
    await db.update(users).set({ deletedAt: now, updatedAt: now }).where(eq(users.id, target.user.id));
    await revokeUserSessions(db, target.user.id);

    await audit(req, "user_deleted", "user", target.user.id, { email: target.user.email });
    res.json({ ok: true });
  });

  /** Închide toate sesiunile unui utilizator (ex: dispozitiv pierdut). */
  router.post("/:id/revoke-sessions", requirePermission("users.update"), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    const { db } = req.ctx;

    const [target] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);
    if (!target) throw new HttpError(404, "not_found", "Utilizatorul nu există");

    await revokeUserSessions(db, target.id);
    await audit(req, "sessions_revoked", "user", target.id);
    res.json({ ok: true });
  });

  /** Istoricul de login al unui utilizator, cel mai recent primul. */
  router.get("/:id/login-history", requirePermission("users.view"), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    const query = parse(pageQuery, req.query);
    const { db } = req.ctx;

    const [target] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);
    if (!target) throw new HttpError(404, "not_found", "Utilizatorul nu există");

    const items = await db
      .select({
        id: loginHistory.id,
        email: loginHistory.email,
        ip: loginHistory.ip,
        userAgent: loginHistory.userAgent,
        success: loginHistory.success,
        reason: loginHistory.reason,
        at: loginHistory.at,
      })
      .from(loginHistory)
      .where(eq(loginHistory.userId, target.id))
      .orderBy(desc(loginHistory.at))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);

    const [totals] = await db
      .select({ total: count() })
      .from(loginHistory)
      .where(eq(loginHistory.userId, target.id));

    res.json(paged(items, totals?.total ?? 0, query));
  });

  return router;
}
