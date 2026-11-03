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
import { seedCatalog } from "./modules/catalog/seed";
import { importCatalogFile } from "./modules/catalog/transfer";
import { startScheduler } from "./jobs/scheduler";
import { closePdfBrowser } from "./lib/pdf";

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
  // Fișierul de catalog rulează ÎNAINTEA seed-ului: pe o bază nouă creează serviciile și pachetele
  // cu prețurile proprietarului; seed-ul completează apoi doar ce lipsește. Pe o bază existentă,
  // importul de la pornire creează doar ce lipsește și nu suprascrie modificările făcute în aplicație.
  if (env.CATALOG_IMPORT_FILE) await importCatalogFile(db, env.CATALOG_IMPORT_FILE);
  await seedCatalog(db);

  const app = await createApp({
    db,
    env,
    frontend: env.NODE_ENV === "production" ? serveFrontend : serveVite,
  });

  const server = app.listen(env.PORT, env.HOST, () => {
    console.log(`ESA Management pe http://${env.HOST}:${env.PORT}`);
    if (!env.DATABASE_URL) console.log("PGlite (dev)");
  });

  const stopScheduler = startScheduler(db, env);

  process.on("SIGTERM", () => {
    stopScheduler();
    void closePdfBrowser();
    server.close(() => {
      void close().finally(() => process.exit(0));
    });
    server.closeAllConnections();
  });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
