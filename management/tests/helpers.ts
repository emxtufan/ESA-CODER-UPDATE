/**
 * Helper-e pentru testele de integrare: aplicația reală pe un port efemer,
 * PGlite în memorie (fără fișiere) și un client HTTP minimal.
 */
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import type { AddressInfo } from "node:net";

import { eq } from "drizzle-orm";

import { createApp } from "../server/app";
import { createDb, type Db } from "../server/db/client";
import { roles, users } from "../server/db/schema/auth";
import { seedRoles } from "../server/db/seed";
import { loadEnv } from "../server/env";
import { seedCatalog } from "../server/modules/catalog/seed";
import { hashPassword } from "../server/security/password";
import type { Role } from "../shared/enums";

/** Parola implicită a utilizatorilor de test (peste limita minimă de 12 caractere). */
export const TEST_PASSWORD = "Parola-teste-123";

/** Utilizator de test: rândul din DB + parola în clar (pentru login). */
export type TestUser = typeof users.$inferSelect & { password: string };

export interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Valoarea header-ului `Cookie` (ex: cea întoarsă de `loginAs`). */
  cookie?: string;
}

export interface ApiResult {
  status: number;
  json: any;
  /** Cookie-ul setat de server, deja redus la `name=value`. */
  setCookie: string | undefined;
}

export async function setup() {
  // Environment de test: cheile sunt fixe, ca testele să nu depindă de `.env`.
  const env = loadEnv({
    NODE_ENV: "test",
    VAULT_MASTER_KEY: "a".repeat(64),
  });

  const { db, close: closeDb } = await createDb({ memory: true });
  await seedRoles(db);
  await seedCatalog(db);

  const app = await createApp({ db, env });

  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  /** Cerere către API, cu CSRF-ul și JSON-ul pregătite deja. */
  async function api(path: string, { method = "GET", body, cookie }: ApiOptions = {}): Promise<ApiResult> {
    const headers: Record<string, string> = { "x-requested-with": "esa" };
    if (body !== undefined) headers["content-type"] = "application/json";
    if (cookie) headers.cookie = cookie;

    const response = await fetch(`${url}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const setCookie = response.headers.getSetCookie()[0]?.split(";")[0] ?? undefined;
    const text = await response.text();
    let json: any = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = text;
      }
    }

    return { status: response.status, json, setCookie };
  }

  /** Utilizator inserat direct în DB (fără fluxul de invitație). */
  async function makeUser(
    roleKey: Role,
    { password = TEST_PASSWORD }: { password?: string } = {},
  ): Promise<TestUser> {
    const [role] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.key, roleKey))
      .limit(1);
    if (!role) throw new Error(`Rolul ${roleKey} nu există (seedRoles a rulat?)`);

    const [user] = await db
      .insert(users)
      .values({
        email: `${roleKey}-${randomUUID()}@test.local`,
        name: `Test ${roleKey}`,
        roleId: role.id,
        passwordHash: await hashPassword(password),
      })
      .returning();

    return { ...user, password };
  }

  /** Login real prin API; întoarce valoarea header-ului `Cookie`. */
  async function loginAs(user: { email: string; password: string }): Promise<string> {
    const result = await api("/api/auth/login", {
      method: "POST",
      body: { email: user.email, password: user.password },
    });
    if (!result.setCookie) {
      throw new Error(`Login eșuat pentru ${user.email}: ${result.status} ${JSON.stringify(result.json)}`);
    }
    return result.setCookie;
  }

  async function close(): Promise<void> {
    // Conexiunile keep-alive ale lui fetch ar ține `close` în loc.
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await closeDb();
  }

  return { url, db, env, api, makeUser, loginAs, close };
}

export type Setup = Awaited<ReturnType<typeof setup>>;

/** Acces la `db` tipat, ca să nu importe fiecare test `Db`. */
export type TestDb = Db;
