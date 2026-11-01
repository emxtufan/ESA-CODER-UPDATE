import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import type { PasswordTokenKind, Role } from "../../../shared/enums";
import type { Permission } from "../../../shared/permissions";

import { clients } from "./core";

/**
 * Helper-e locale pentru convențiile de schema: pk uuid, created_at/updated_at
 * timestamptz cu default now (actualizarea lui updated_at o face serviciul).
 */
const primaryId = () => uuid("id").primaryKey().defaultRandom();

const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Roluri RBAC. `permissions` = lista granulară efectivă a rolului. */
export const roles = pgTable("roles", {
  id: primaryId(),
  key: text("key").$type<Role>().notNull().unique(),
  name: text("name").notNull(),
  permissions: jsonb("permissions").$type<Permission[]>().notNull().default(sql`'[]'::jsonb`),
  isSystem: boolean("is_system").notNull().default(false),
  ...timestamps(),
});

export const users = pgTable(
  "users",
  {
    id: primaryId(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    /** scrypt — null până la acceptarea invitației / setarea parolei. */
    passwordHash: text("password_hash"),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    /** Referință circulară users → clients (clients e definit în core.ts). */
    clientId: uuid("client_id").references((): AnyPgColumn => clients.id, {
      onDelete: "set null",
    }),
    /** Secretul TOTP criptat AES-256-GCM (VAULT_MASTER_KEY), niciodată plaintext. */
    totpSecretEnc: text("totp_secret_enc"),
    totpEnabled: boolean("totp_enabled").notNull().default(false),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index("users_role_id_idx").on(t.roleId),
    index("users_client_id_idx").on(t.clientId),
    index("users_name_idx").on(t.name),
  ],
);

/** Sesiuni în DB: se stochează doar hash-ul tokenului. */
export const sessions = pgTable(
  "sessions",
  {
    id: primaryId(),
    tokenHash: text("token_hash").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ip: text("ip"),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    /** Sesiune creată după parolă, dar înainte de confirmarea celui de-al doilea factor. */
    mfaPending: boolean("mfa_pending").notNull().default(false),
    ...timestamps(),
  },
  (t) => [
    index("sessions_user_id_idx").on(t.userId),
    index("sessions_expires_at_idx").on(t.expiresAt),
  ],
);

/** Istoric login-uri (append-only). user_id rămâne null pentru email inexistent. */
export const loginHistory = pgTable(
  "login_history",
  {
    id: primaryId(),
    userId: uuid("user_id").references((): AnyPgColumn => users.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    success: boolean("success").notNull(),
    reason: text("reason"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("login_history_user_id_idx").on(t.userId),
    index("login_history_email_idx").on(t.email),
    index("login_history_at_idx").on(t.at),
  ],
);

/** Tokeni de invitație / resetare parolă: doar hash, cu expirare și marcare de utilizare. */
export const passwordTokens = pgTable(
  "password_tokens",
  {
    id: primaryId(),
    tokenHash: text("token_hash").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").$type<PasswordTokenKind>().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [index("password_tokens_user_id_idx").on(t.userId)],
);

/** Audit log append-only: create/update/delete, login/logout, acces credentiale, modificări financiare. */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: primaryId(),
    actorId: uuid("actor_id").references((): AnyPgColumn => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    meta: jsonb("meta").$type<Record<string, unknown>>(),
    ip: text("ip"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_logs_actor_id_idx").on(t.actorId),
    index("audit_logs_entity_idx").on(t.entityType, t.entityId),
    index("audit_logs_at_idx").on(t.at),
  ],
);
