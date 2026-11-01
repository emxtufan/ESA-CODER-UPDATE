/**
 * Teste pentru routerul CRUD generic (`crudRouter`): creare cu audit, validare, listare
 * cu paginare/căutare/sortare, izolarea pe `scope` (anti-IDOR), ștergerea logică,
 * conflictele de constrângeri și permisiunile.
 *
 * Aplicația Express este construită local, cu `req.ctx` și `req.auth` injectate:
 * testul acoperă exact routerul, fără sesiune reală.
 */
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import type { AddressInfo } from "node:net";

import { eq } from "drizzle-orm";
import express, { type Request } from "express";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { createDb, type Db } from "../server/db/client";
import { auditLogs, roles, sessions, users } from "../server/db/schema/auth";
import { clients } from "../server/db/schema/core";
import { seedRoles } from "../server/db/seed";
import { crudRouter, type CrudConfig } from "../server/lib/crud";
import { errorHandler } from "../server/lib/http";
import type { Role } from "../shared/enums";

/** Datele de creare acceptate de clientul de test. */
const clientSchema = z.object({
  companyName: z.string().trim().min(1),
  city: z.string().trim().min(1).nullable().optional(),
  status: z.string().trim().min(1).nullable().optional(),
  internalNotes: z.string().trim().min(1).nullable().optional(),
});

/** Tabela `users` are `email` unic — folosită pentru conflictul 409. */
const userSchema = z.object({
  email: z.string().trim().min(1),
  name: z.string().trim().min(1),
  roleId: z.uuid("Identificator invalid"),
});

interface ApiResult {
  status: number;
  json: any;
}

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

type Auth = NonNullable<Request["auth"]>;

/** Conexiunea la DB, refăcută pentru fiecare test. */
let db: Db;
/** Închide baza în memorie; se apelează la `afterEach`. */
let closeDb: () => Promise<void>;

/** Serverele pornite în testul curent, închise la `afterEach`. */
const openServers: Array<() => Promise<void>> = [];

/**
 * Pornește o aplicație Express locală, fără sesiune reală: `req.ctx` (db + env) și
 * `req.auth` sunt injectate, routerul e montat pe `/x`, iar erorile trec prin `errorHandler`.
 */
async function serve(router: express.Router, auth: Auth) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.ctx = { db, env: {} as any } as NonNullable<Request["ctx"]>;
    req.auth = auth;
    next();
  });
  app.use("/x", router);
  app.use(errorHandler);

  const server = app.listen(0);
  await once(server, "listening");
  const { port } = server.address() as AddressInfo;

  const close = () =>
    new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  openServers.push(close);

  return { base: `http://127.0.0.1:${port}/x`, close };
}

/** Cerere HTTP cu JSON către serverul de test. */
async function api(base: string, path: string, options: ApiOptions = {}): Promise<ApiResult> {
  const response = await fetch(`${base}${path}`, {
    method: options.method ?? "GET",
    headers: { "content-type": "application/json", ...options.headers },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  return { status: response.status, json: text ? JSON.parse(text) : null };
}

/** Rândurile dintr-un răspuns de listare (`items` — forma folosită de `crudRouter`). */
function rowsOf(json: any): any[] {
  return json?.items ?? [];
}

/** Utilizatorul + rolul lui (cheie și permisiuni citite din DB), în forma așteptată de `req.auth`. */
async function authFor(key: Role): Promise<Auth> {
  const [role] = await db.select().from(roles).where(eq(roles.key, key)).limit(1);
  if (!role) throw new Error(`Rolul „${key}” lipsește din DB (seed incomplet)`);

  const [user] = await db
    .insert(users)
    .values({
      email: `user-${randomUUID()}@test.local`,
      name: `Utilizator ${key}`,
      roleId: role.id,
    })
    .returning();

  // Sesiunea nu e folosită de router (auth-ul e injectat), dar `req.auth` o cere.
  const [session] = await db
    .insert(sessions)
    .values({
      tokenHash: `test-${randomUUID()}`,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      lastSeenAt: new Date(),
    })
    .returning();

  return {
    session,
    user,
    role,
    permissions: role.permissions,
    mfaPending: session.mfaPending,
  };
}

/** Routerul CRUD peste `clients`, cu opțiunile folosite de majoritatea testelor. */
function clientsRouter(options: Partial<CrudConfig> = {}) {
  return crudRouter({
    table: clients,
    entityType: "client",
    permission: "clients",
    schema: clientSchema,
    searchColumns: [clients.companyName, clients.city],
    sortable: {
      companyName: clients.companyName,
      city: clients.city,
      createdAt: clients.createdAt,
    },
    ...options,
  });
}

/** Inserează clienți direct în DB, ocolind routerul. */
async function seedClients(rows: Array<{ companyName: string; city?: string | null }>): Promise<void> {
  await db.insert(clients).values(rows);
}

beforeEach(async () => {
  const handle = await createDb({ memory: true });
  db = handle.db;
  closeDb = handle.close;
  await seedRoles(db);
});

afterEach(async () => {
  await Promise.all(openServers.splice(0).map((close) => close()));
  await closeDb();
});

describe("crudRouter — creare și validare", () => {
  it("creează clientul (201) și scrie evenimentul în audit_logs", async () => {
    const auth = await authFor("super_admin");
    const { base } = await serve(clientsRouter(), auth);

    const created = await api(base, "/", {
      method: "POST",
      body: { companyName: "ACME SRL", city: "Cluj" },
    });

    expect(created.status).toBe(201);
    expect(created.json.item.companyName).toBe("ACME SRL");

    const logs = await db.select().from(auditLogs).where(eq(auditLogs.action, "client_created"));
    expect(logs.length).toBe(1);
    expect(logs[0].entityId).toBe(created.json.item.id);
  });

  it("respinge crearea fără companyName cu 422", async () => {
    const auth = await authFor("super_admin");
    const { base } = await serve(clientsRouter(), auth);

    const response = await api(base, "/", { method: "POST", body: { city: "Cluj" } });

    expect(response.status).toBe(422);
    const stored = await db.select().from(clients);
    expect(stored.length).toBe(0);
  });
});

describe("crudRouter — listare", () => {
  it("paginatează cu pageSize și întoarce totalul", async () => {
    await seedClients([{ companyName: "Alfa" }, { companyName: "Beta" }, { companyName: "Gama" }]);
    const auth = await authFor("super_admin");
    const { base } = await serve(clientsRouter(), auth);

    const page = await api(base, "/?page=1&pageSize=2");

    expect(page.status).toBe(200);
    expect(rowsOf(page.json).length).toBe(2);
    expect(page.json.total).toBe(3);

    const secondPage = await api(base, "/?page=2&pageSize=2");
    expect(secondPage.status).toBe(200);
    expect(rowsOf(secondPage.json).length).toBe(1);
  });

  it("filtrează după q", async () => {
    await seedClients([{ companyName: "Alfa Construct" }, { companyName: "Beta Media" }]);
    const auth = await authFor("super_admin");
    const { base } = await serve(clientsRouter(), auth);

    const response = await api(base, "/?q=Alfa");

    expect(response.status).toBe(200);
    const rows = rowsOf(response.json);
    expect(rows.length).toBe(1);
    expect(rows[0].companyName).toBe("Alfa Construct");
    expect(response.json.total).toBe(1);
  });

  it("ignoră o coloană de sortare necunoscută, fără eroare", async () => {
    await seedClients([{ companyName: "Alfa" }, { companyName: "Beta" }]);
    const auth = await authFor("super_admin");
    const { base } = await serve(clientsRouter(), auth);

    const response = await api(base, "/?sort=coloana_inexistenta&dir=asc");

    expect(response.status).toBe(200);
    expect(rowsOf(response.json).length).toBe(2);
  });
});

describe("crudRouter — citire după id", () => {
  it("întoarce 404 pentru un id inexistent", async () => {
    const auth = await authFor("super_admin");
    const { base } = await serve(clientsRouter(), auth);

    const response = await api(base, `/${randomUUID()}`);

    expect(response.status).toBe(404);
  });

  it("întoarce 4xx pentru un id invalid", async () => {
    const auth = await authFor("super_admin");
    const { base } = await serve(clientsRouter(), auth);

    const response = await api(base, "/nu-e-un-uuid");

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });

  it("izolează pe scope: clientul din alt oraș nu e vizibil (404)", async () => {
    await seedClients([
      { companyName: "Din Scope", city: "X" },
      { companyName: "În Afara Scope-ului", city: "Y" },
    ]);
    const auth = await authFor("super_admin");
    const { base } = await serve(clientsRouter({ scope: () => eq(clients.city, "X") }), auth);

    const list = await api(base, "/");
    expect(list.status).toBe(200);
    expect(rowsOf(list.json).length).toBe(1);

    const [outside] = await db.select().from(clients).where(eq(clients.city, "Y"));
    const response = await api(base, `/${outside.id}`);
    expect(response.status).toBe(404);
  });
});

describe("crudRouter — ștergere logică", () => {
  it("scoate rândul din listă, dar îl păstrează în DB cu deletedAt", async () => {
    await seedClients([{ companyName: "De Șters" }, { companyName: "De Păstrat" }]);
    const auth = await authFor("super_admin");
    const { base } = await serve(clientsRouter(), auth);

    const [target] = await db.select().from(clients).where(eq(clients.companyName, "De Șters"));
    const deleted = await api(base, `/${target.id}`, { method: "DELETE" });
    expect([200, 204]).toContain(deleted.status);

    const list = await api(base, "/");
    expect(list.status).toBe(200);
    const names = rowsOf(list.json).map((row) => row.companyName);
    expect(names).toEqual(["De Păstrat"]);

    const [row] = await db.select().from(clients).where(eq(clients.id, target.id));
    expect(row).toBeTruthy();
    expect(row.deletedAt).not.toBeNull();
  });
});

describe("crudRouter — conflicte și permisiuni", () => {
  it("întoarce 409 la duplicat pe users.email", async () => {
    const auth = await authFor("super_admin");
    const [role] = await db.select().from(roles).where(eq(roles.key, "developer")).limit(1);
    const router = crudRouter({
      table: users,
      entityType: "user",
      permission: "users",
      schema: userSchema,
      searchColumns: [users.email, users.name],
    });
    const { base } = await serve(router, auth);

    const payload = {
      email: `duplicat-${randomUUID()}@test.local`,
      name: "Primul",
      roleId: role.id,
    };

    const first = await api(base, "/", { method: "POST", body: payload });
    expect(first.status).toBe(201);

    const second = await api(base, "/", { method: "POST", body: { ...payload, name: "Al Doilea" } });
    expect(second.status).toBe(409);
  });

  it("developer primește 403 la POST și 200 la GET", async () => {
    await seedClients([{ companyName: "Vizibil" }]);
    const auth = await authFor("developer");
    const { base } = await serve(clientsRouter(), auth);

    const read = await api(base, "/");
    expect(read.status).toBe(200);
    expect(rowsOf(read.json).length).toBe(1);

    const write = await api(base, "/", { method: "POST", body: { companyName: "Interzis" } });
    expect(write.status).toBe(403);
  });
});
