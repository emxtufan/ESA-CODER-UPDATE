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
import { deploymentsRouter } from "./modules/deployments/routes";
import { logsRouter, notificationsRouter, rulesRouter, templatesRouter } from "./modules/notifications/routes";
import { documentsRouter, signedFilesRouter } from "./modules/documents/routes";
import { contractsRouter, maintenanceLogsRouter, maintenancePlansRouter } from "./modules/maintenance/routes";
import { monitoringRouter } from "./modules/monitoring/routes";
import { reportsRouter } from "./modules/reports/routes";
import { dashboardRouter } from "./modules/dashboard/routes";
import { invoicesRouter } from "./modules/finance/invoices";
import { expensesRouter, financeRouter, paymentsRouter, ratesRouter } from "./modules/finance/routes";
import { githubRouter } from "./modules/github/routes";
import { githubWebhookRouter } from "./modules/github/webhook";
import {
  dnsRouter,
  domainsRouter,
  hostingRouter,
  serversRouter,
  servicesRouter,
  sslRouter,
} from "./modules/infra/routes";
import { offersRouter } from "./modules/legal/offers";
import { legalPdfRouter } from "./modules/legal/pdf";
import { legalRouter } from "./modules/legal/routes";
import { catalogRouter } from "./modules/catalog/routes";
import { observationsRouter } from "./modules/observations/routes";
import { projectsRouter } from "./modules/projects/routes";
import { searchRouter } from "./modules/search/routes";
import { tasksRouter } from "./modules/tasks/routes";
import { updatesRouter } from "./modules/updates/routes";
import { vaultRouter } from "./modules/vault/routes";
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

  // JSON doar în afara webhook-urilor (raw body pentru semnătură) și a rutelor cu corp mare
  // (PDF-ul din HTML și arhivarea PDF-ului în base64), care își au propriul parser.
  const jsonBody = express.json({ limit: "1mb" });
  const largeBody = /^\/api\/legal\/(pdf\/?|documents\/[^/]+\/archive\/?)$/;
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/webhooks/") || largeBody.test(req.path)) return next();
    jsonBody(req, res, next);
  });

  // Webhook-urile își verifică semnătura pe raw body, deci se montează înainte de sesiune.
  app.use("/api/webhooks/github", githubWebhookRouter());

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
  app.use("/api/search", searchRouter());
  app.use("/api/servers", serversRouter());
  app.use("/api/services", servicesRouter());
  app.use("/api/domains", domainsRouter());
  app.use("/api/dns-records", dnsRouter());
  app.use("/api/ssl", sslRouter());
  app.use("/api/hosting", hostingRouter());
  app.use("/api/vault", vaultRouter());
  app.use("/api/github", githubRouter());
  app.use("/api/deployments", deploymentsRouter());
  app.use("/api/invoices", invoicesRouter());
  app.use("/api/payments", paymentsRouter());
  app.use("/api/expenses", expensesRouter());
  app.use("/api/exchange-rates", ratesRouter());
  app.use("/api/finance", financeRouter());
  app.use("/api/dashboard", dashboardRouter());
  app.use("/api/reports", reportsRouter());
  app.use("/api/monitoring", monitoringRouter());
  app.use("/api/maintenance/plans", maintenancePlansRouter());
  app.use("/api/maintenance/logs", maintenanceLogsRouter());
  app.use("/api/contracts", contractsRouter());
  app.use("/api/legal/pdf", legalPdfRouter());
  app.use("/api/legal", offersRouter());
  app.use("/api/legal", legalRouter());
  app.use("/api/catalog", catalogRouter());
  app.use("/api/documents", documentsRouter());
  app.use("/api/files", signedFilesRouter());
  app.use("/api/notifications", notificationsRouter());
  app.use("/api/notification-rules", rulesRouter());
  app.use("/api/email-templates", templatesRouter());
  app.use("/api/notification-logs", logsRouter());

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
