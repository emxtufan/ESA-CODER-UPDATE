/**
 * Punctul de intrare al serverului: environment, bază de date, seed-uri, aplicația
 * Express cu frontend-ul potrivit mediului și pornirea efectivă.
 */
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import express, { type Express, type RequestHandler } from "express";

import { createApp } from "./app";
import { createDb } from "./db/client";
import { seedRoles } from "./db/seed";
import { loadEnv } from "./env";

/** Directorul build-ului de client (`vite build` scrie în `<repo>/dist`). */
const DIST_DIR = fileURLToPath(new URL("../dist", import.meta.url));

/** Producție: fișierele statice + fallback pe `index.html` pentru rutele SPA. */
function serveFrontend(app: Express): void {
  app.use(express.static(DIST_DIR));

  const indexHtml = join(DIST_DIR, "index.html");
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(indexHtml, (error) => {
      if (error) next(error);
    });
  });
}

/** Dev: Vite în middleware mode (root-ul `client` vine din vite.config.ts). */
async function serveVite(app: Express): Promise<void> {
  const { createServer } = await import("vite");
  const vite = await createServer({ server: { middlewareMode: true }, appType: "spa" });
  app.use(vite.middlewares as unknown as RequestHandler);
}

async function main(): Promise<void> {
  const env = loadEnv();
  const { db, close } = await createDb({ url: env.DATABASE_URL, dataDir: env.DATA_DIR });

  await seedRoles(db);

  const app = await createApp({
    db,
    env,
    frontend: env.NODE_ENV === "production" ? serveFrontend : serveVite,
  });

  const server = app.listen(env.PORT, env.HOST, () => {
    console.log(`ESA Management pe http://${env.HOST}:${env.PORT}`);
    if (!env.DATABASE_URL) console.log("PGlite (dev)");
  });

  process.on("SIGTERM", () => {
    server.close(() => {
      void close().finally(() => process.exit(0));
    });
  });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
