/**
 * Garduri de autorizare pentru rutele de management: sesiune validă, al doilea
 * factor confirmat, permisiuni granulare, separarea staff/client și protecția CSRF.
 */
import type { NextFunction, Request, RequestHandler, Response } from "express";

import type { Permission } from "../../shared/permissions";
import { HttpError } from "../lib/http";

/** Identitatea autentificată completă sau 401 (`unauthorized` / `mfa_required`). */
function authenticated(req: Request): NonNullable<Request["auth"]> {
  const auth = req.auth;
  if (!auth) throw new HttpError(401, "unauthorized", "Autentificare necesară");
  if (auth.mfaPending) throw new HttpError(401, "mfa_required", "Al doilea factor nu a fost confirmat");
  return auth;
}

/** Cere sesiune validă cu al doilea factor confirmat. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  authenticated(req);
  next();
}

/** Cere doar sesiune validă (permite starea `mfaPending`, ex: pasul TOTP). */
export function allowMfaPending(req: Request, _res: Response, next: NextFunction): void {
  if (!req.auth) throw new HttpError(401, "unauthorized", "Autentificare necesară");
  next();
}

/** `super_admin` are toate permisiunile; ceilalți doar ce e în rolul lor. */
export function can(req: Request, permission: Permission): boolean {
  const auth = req.auth;
  if (!auth) return false;
  if (auth.role.key === "super_admin") return true;
  return auth.permissions.includes(permission);
}

/** Cere sesiune validă + toate permisiunile date. */
export function requirePermission(...perms: Permission[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    authenticated(req);
    if (!perms.every((permission) => can(req, permission))) {
      throw new HttpError(403, "forbidden", "Permisiuni insuficiente");
    }
    next();
  };
}

/** Rutele interne: rolul `client` nu are acces. */
export function requireStaff(req: Request, _res: Response, next: NextFunction): void {
  const auth = authenticated(req);
  if (auth.role.key === "client") throw new HttpError(403, "forbidden", "Acces interzis");
  next();
}

/** Portalul clientului: doar rolul `client`, legat de un `clientId`. */
export function requireClient(req: Request, _res: Response, next: NextFunction): void {
  const auth = authenticated(req);
  if (auth.role.key !== "client" || !auth.user.clientId) {
    throw new HttpError(403, "forbidden", "Acces doar pentru clienți");
  }
  next();
}

/** Metodele fără efecte secundare nu au nevoie de token CSRF. */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Protecție CSRF: header `x-requested-with: esa` + `Origin` (dacă există) pe hostul
 * aplicației. Webhook-urile integrărilor sunt scutite (au semnătura proprie).
 */
export function csrfGuard(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method.toUpperCase())) return next();
  if (req.path.startsWith("/api/webhooks/")) return next();

  if (req.get("x-requested-with") !== "esa") {
    throw new HttpError(403, "csrf_failed", "Cerere fără token CSRF");
  }

  const origin = req.get("origin");
  if (origin) {
    let originHost: string;
    try {
      originHost = new URL(origin).host;
    } catch {
      throw new HttpError(403, "csrf_failed", "Origin invalid");
    }

    const appUrl = req.ctx.env.APP_URL;
    const expectedHost = appUrl ? new URL(appUrl).host : req.headers.host;
    if (originHost !== expectedHost) {
      throw new HttpError(403, "csrf_failed", "Cerere cross-site blocată");
    }
  }

  next();
}
