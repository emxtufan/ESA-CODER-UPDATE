/**
 * Conexiunea la bază de date + migrațiile.
 *
 * - cu `url` (postgres://…): drizzle pe node-postgres, cu Pool;
 * - fără `url`: PGlite local, în memorie (teste) sau în `<dataDir>/pg` (dev).
 *
 * Ambele variante rulează aceleași migrații SQL din `server/db/migrations`.
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzleNodePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate as migrateNodePg } from "drizzle-orm/node-postgres/migrator";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { Pool } from "pg";

import * as schema from "./schema/index";

/** Tipul bazei de date folosit în toată aplicația (driver node-postgres). */
export type Db = NodePgDatabase<typeof schema>;

export interface CreateDbOptions {
  /** Șir de conexiune Postgres; dacă lipsește, se folosește PGlite în `dataDir`. */
  url?: string;
  /** PGlite în memorie (teste) — fără fișiere pe disc. */
  memory?: boolean;
  /** Director pentru date locale; PGlite scrie în `<dataDir>/pg`. */
  dataDir?: string;
}

export interface DbHandle {
  db: Db;
  close: () => Promise<void>;
}

const MIGRATIONS_FOLDER = fileURLToPath(new URL("migrations", import.meta.url));

export async function createDb({
  url,
  memory = false,
  dataDir = "data",
}: CreateDbOptions = {}): Promise<DbHandle> {
  if (url) {
    const pool = new Pool({ connectionString: url });
    const db = drizzleNodePg(pool, { schema });
    await migrateNodePg(db, { migrationsFolder: MIGRATIONS_FOLDER });
    return { db, close: () => pool.end() };
  }

  const pgDir = join(dataDir, "pg");
  if (!memory) await mkdir(pgDir, { recursive: true });

  const client = memory ? new PGlite() : new PGlite(pgDir);
  const pglite = drizzlePglite(client, { schema });
  await migratePglite(pglite, { migrationsFolder: MIGRATIONS_FOLDER });

  // PGlite expune aceeași API drizzle ca node-postgres; aplicația lucrează cu un singur tip `Db`.
  return { db: pglite as unknown as Db, close: () => client.close() };
}
