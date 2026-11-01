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
import { loadEnv, type Env } from "../server/env";
import { crudRouter } from "../server/lib/crud";
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
