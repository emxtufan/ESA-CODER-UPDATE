/**
 * Configurarea aplicației Express: securitate, context pe request, parsare de body,
 * sesiune, protecție CSRF, rutele modulelor și handler-ul global de erori.
 *
 * Frontend-ul (SPA static în producție / Vite în dev) se montează prin `frontend`,
 * ca să fie ultimul lucru înainte de `errorHandler` (și să nu prindă rutele `/api`).
 */
import express, { type Express } from "express";
import helmet from "helmet";

import type { Db } from "./db/client";
import type { Env } from "./env";
import { errorHandler } from "./lib/http";
import { activitiesRouter } from "./modules/activities/routes";
import { auditRouter } from "./modules/audit/routes";
import { authRouter } from "./modules/auth/routes";
import { clientsRouter, contactsRouter } from "./modules/clients/routes";
import { commentsRouter } from "./modules/comments/routes";
import { observationsRouter } from "./modules/observations/routes";
import { projectsRouter } from "./modules/projects/routes";
import { tasksRouter } from "./modules/tasks/routes";
import { updatesRouter } from "./modules/updates/routes";
import { csrfGuard } from "./security/guards";
import { loadSession } from "./security/session";

export interface CreateAppOptions {
  db: Db;
  env: Env;
  /** Montează frontend-ul (static + fallback SPA, sau middleware-ele Vite în dev). */
  frontend?: (app: Express) => Promise<void> | void;
}

/** Aplicația Express completă, gata de `listen` (fără pornirea efectivă). */
export async function createApp({ db, env, frontend }: CreateAppOptions): Promise<Express> {
  const app = express();

  app.disable("x-powered-by");
  // Doar proxy-ul local (nginx) e de încredere pentru `req.ip`.
  app.set("trust proxy", "loopback");

  app.use(
    helmet({
      // În dev CSP-ul ar bloca HMR-ul Vite; în producție e restrâns la same-origin.
      contentSecurityPolicy:
        env.NODE_ENV === "production"
          ? {
              directives: {
                defaultSrc: ["'self'"],
                imgSrc: ["'self'", "data:"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                connectSrc: ["'self'"],
              },
            }
          : false,
    }),
  );

  // Contextul fiecărui request: db + env (rutele nu ating niciodată globaluri).
  app.use((req, _res, next) => {
    req.ctx = { db, env };
    next();
  });

  // JSON doar în afara webhook-urilor: acelea își verifică semnătura pe raw body.
  const jsonBody = express.json({ limit: "1mb" });
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/webhooks/")) return next();
    jsonBody(req, res, next);
  });

  app.use(loadSession);
  app.use("/api", csrfGuard);

  // MODULE ROUTES
  app.use("/api/auth", authRouter());
  app.use("/api/clients", clientsRouter());
  app.use("/api/contacts", contactsRouter());
  app.use("/api/projects", projectsRouter());
  app.use("/api/tasks", tasksRouter());
  app.use("/api/observations", observationsRouter());
  app.use("/api/updates", updatesRouter());
  app.use("/api/comments", commentsRouter());
  app.use("/api/activities", activitiesRouter());
  app.use("/api/audit", auditRouter());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Orice rută `/api` nemontată rămâne 404 JSON (nu ajunge la fallback-ul SPA).
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: { code: "not_found", message: "Ruta nu există" } });
  });

  if (frontend) await frontend(app);

  app.use(errorHandler);

  return app;
}
