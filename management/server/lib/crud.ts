/**
 * Router CRUD generic peste o tabelă drizzle: listare paginată (căutare, filtre, sortare
 * pe whitelist), citire pe id în limitele `scope`-ului (anti-IDOR), creare, modificare și
 * ștergere logică sau fizică. Fiecare scriere trece prin `requirePermission` și lasă o
 * intrare în audit; erorile de constrângere Postgres devin conflicte 409.
 *
 * Tipurile de coloane nu sunt cunoscute la compilare, deci query-urile pe tabelă trec
 * prin `any`; tot ce ține de validare, condiții și răspuns rămâne tipat.
 */
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  ilike,
  inArray,
  isNull,
  or,
  type SQL,
} from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { Router, type Request } from "express";
import { z } from "zod";

import type { Permission, PermissionModule } from "../../shared/permissions";
import { audit } from "../security/audit";
import { requirePermission } from "../security/guards";

import { HttpError, pageQuery, paged, parse } from "./http";

/** Tabela lucrată de router; coloanele ei nu sunt cunoscute la compilare. */
type AnyTable = PgTable;

/** Permisiunile rutelor: fie modul (`clients` → `clients.view/create/update/delete`), fie explicite. */
export type CrudPermission =
  | PermissionModule
  | { view: Permission; create: Permission; update: Permission; delete: Permission };

/** Configurarea unui router CRUD. */
export interface CrudConfig {
  table: AnyTable;
  /** Tipul entității în audit (`client`, `contact`, …). */
  entityType: string;
  permission: CrudPermission;
  /** Schema de creare; actualizarea folosește `schema.partial()` dacă nu e dată alta. */
  schema: z.ZodObject<any>;
  updateSchema?: z.ZodObject<any>;
  /** Coloanele căutate de `q` (`ilike`, cu `%` și `_` escapate). */
  searchColumns: PgColumn[];
  /** Filtre simple: numele din query → coloană (`eq`, sau `inArray` pentru valori CSV). */
  filters?: Record<string, PgColumn>;
  /** Whitelist de sortare: numele din query → coloană. Orice alt nume este ignorat. */
  sortable: Record<string, PgColumn>;
  /** Sortarea când cererea nu trimite `sort` (sau trimite un nume necunoscut). */
  defaultSort?: { column: PgColumn; dir?: "asc" | "desc" };
  /** Ștergere logică; implicit `true` dacă tabela are coloana `deletedAt`. */
  softDelete?: boolean;
  /** Restrânge rândurile vizibile (ex. un singur client); se aplică pe toate rutele. */
  scope?: (req: Request) => SQL | undefined;
  /** Transformă datele validate înainte de scriere (normalizări, denormalizări). */
  toRow?: (data: any, req: Request) => Record<string, unknown>;
  /** Forma rândului în răspuns (ex. ascunde câmpuri interne). */
  fromRow?: (row: any, req: Request) => unknown;
  afterCreate?: (row: any, req: Request) => Promise<void>;
  afterUpdate?: (row: any, req: Request, before: any) => Promise<void>;
  afterDelete?: (row: any, req: Request) => Promise<void>;
  beforeDelete?: (row: any, req: Request) => Promise<void>;
  /** Cheile ale căror valori nu ajung în audit (lista cheilor modificate rămâne). */
  sensitiveFields?: string[];
}

const idSchema = z.object({ id: z.uuid("Identificator invalid") });

/** Dată ISO (`YYYY-MM-DD`): string-ul gol devine `null`, câmpul absent rămâne `undefined`. */
export const dateStr = z.preprocess(
  (value) => (value === "" ? null : value),
  z.iso.date().nullable().optional(),
);

/** Text opțional: `trim`, iar string-ul gol devine `null`. */
export const optStr = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional();

/** Sume în unitatea minimă a monedei: întreg nenegativ (acceptă și string din formulare). */
export const moneyInt = z.coerce
  .number()
  .int("Sumă invalidă")
  .min(0, "Suma nu poate fi negativă");

/** Permisiunile efective ale celor patru rute. */
function permissionsFor(permission: CrudPermission): {
  view: Permission;
  create: Permission;
  update: Permission;
  delete: Permission;
} {
  if (typeof permission === "string") {
    return {
      view: `${permission}.view` as Permission,
      create: `${permission}.create` as Permission,
      update: `${permission}.update` as Permission,
      delete: `${permission}.delete` as Permission,
    };
  }
  return permission;
}

/** `%text%` pentru `ilike`, cu metacaracterele utilizatorului escapate. */
function likePattern(value: string): string {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}

/** Condiția unui filtru din query: `eq`, sau `inArray` când valoarea e o listă CSV. */
function filterCondition(column: PgColumn, raw: unknown): SQL | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return undefined;

  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return undefined;
  if (parts.length === 1) return eq(column, parts[0]);
  return inArray(column, parts);
}

/** Codul de eroare Postgres, inclusiv când drizzle îl împachetează în `cause`. */
function pgCode(error: unknown): string | undefined {
  let current: unknown = error;
  for (let depth = 0; current && depth < 5; depth += 1) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string") return code;
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
}

/** Traduce erorile de constrângere cunoscute în conflicte 409; restul trec mai departe. */
function translateDbError(error: unknown, foreignKeyMessage = "Referința nu există"): never {
  const code = pgCode(error);
  if (code === "23505") {
    throw new HttpError(409, "conflict", "Există deja o înregistrare cu aceste date");
  }
  if (code === "23503") {
    throw new HttpError(409, "conflict", foreignKeyMessage);
  }
  throw error;
}

export function crudRouter(cfg: CrudConfig): Router {
  const router = Router();
  const columns = getTableColumns(cfg.table) as Record<string, PgColumn>;
  const permissions = permissionsFor(cfg.permission);
  const softDelete = cfg.softDelete ?? Boolean(columns.deletedAt);

  /** Rândurile vizibile pentru cererea curentă: `scope` + fără ștergeri logice. */
  function visible(req: Request): SQL | undefined {
    const deletedAt = columns.deletedAt as PgColumn | undefined;
    if (softDelete && deletedAt) return and(cfg.scope?.(req), isNull(deletedAt));
    return cfg.scope?.(req);
  }

  /** Rândul după id, doar în limitele `scope`-ului: altfel 404 (fără scurgeri IDOR). */
  async function find(req: Request, id: string): Promise<any> {
    const db = req.ctx.db as any;
    const [row] = await db
      .select()
      .from(cfg.table)
      .where(and(eq(columns.id, id), visible(req)))
      .limit(1);
    if (!row) throw new HttpError(404, "not_found", "Înregistrarea nu există");
    return row;
  }

  /** Insert cu traducerea erorilor de constrângere; întoarce rândul creat. */
  async function insert(req: Request, values: Record<string, unknown>): Promise<any> {
    const db = req.ctx.db as any;
    try {
      const rows = await db.insert(cfg.table).values(values).returning();
      return rows[0];
    } catch (error) {
      return translateDbError(error);
    }
  }

  /** Update după id cu traducerea erorilor de constrângere; întoarce rândul actualizat. */
  async function updateRow(
    req: Request,
    id: string,
    values: Record<string, unknown>,
  ): Promise<any> {
    const db = req.ctx.db as any;
    try {
      const rows = await db
        .update(cfg.table)
        .set(values)
        .where(eq(columns.id, id))
        .returning();
      return rows[0];
    } catch (error) {
      return translateDbError(error);
    }
  }

  /** Rândul așa cum iese din API (eventual mascat de `fromRow`). */
  function toResponse(row: any, req: Request): unknown {
    return cfg.fromRow ? cfg.fromRow(row, req) : row;
  }

  /** Listare paginată: `scope`, filtre, căutare liberă și sortare din whitelist. */
  router.get("/", requirePermission(permissions.view), async (req, res) => {
    const query = parse(pageQuery, req.query);

    const conditions: (SQL | undefined)[] = [visible(req)];
    for (const [name, column] of Object.entries(cfg.filters ?? {})) {
      conditions.push(filterCondition(column, req.query[name]));
    }
    if (query.q) {
      const pattern = likePattern(query.q);
      conditions.push(or(...cfg.searchColumns.map((column) => ilike(column, pattern))));
    }
    const where = and(...conditions);

    const db = req.ctx.db as any;
    const [totals] = await db.select({ total: count() }).from(cfg.table).where(where);

    // Sortarea vine doar din whitelist; un nume necunoscut cade pe `defaultSort`.
    const sortColumn =
      (query.sort ? cfg.sortable[query.sort] : undefined) ?? cfg.defaultSort?.column;
    const dir = query.dir ?? cfg.defaultSort?.dir ?? "asc";

    const base = db.select().from(cfg.table).where(where);
    const ordered = sortColumn
      ? base.orderBy(dir === "desc" ? desc(sortColumn) : asc(sortColumn))
      : base;
    const rows = await ordered.limit(query.pageSize).offset((query.page - 1) * query.pageSize);

    res.json(
      paged(
        rows.map((row: any) => toResponse(row, req)),
        totals?.total ?? 0,
        query,
      ),
    );
  });

  /** Citire după id; invalid → 422, inexistent sau în afara `scope`-ului → 404. */
  router.get("/:id", requirePermission(permissions.view), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    const row = await find(req, id);
    res.json({ item: toResponse(row, req) });
  });

  /** Creare: validare Zod (422), insert, audit cu id-ul noului rând. */
  router.post("/", requirePermission(permissions.create), async (req, res) => {
    const input = parse(cfg.schema, req.body);
    const values = cfg.toRow ? cfg.toRow(input, req) : (input as Record<string, unknown>);

    const row = await insert(req, values);
    await audit(req, `${cfg.entityType}_created`, cfg.entityType, row.id, { id: row.id });
    await cfg.afterCreate?.(row, req);

    res.status(201).json({ item: toResponse(row, req) });
  });

  /** Modificare: rândul trebuie să existe în `scope`, `updatedAt` se pune aici. */
  router.patch("/:id", requirePermission(permissions.update), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    const input = parse(cfg.updateSchema ?? cfg.schema.partial(), req.body) as Record<
      string,
      unknown
    >;
    const before = await find(req, id);

    const values = cfg.toRow ? cfg.toRow(input, req) : { ...input };
    if (columns.updatedAt) values.updatedAt = new Date();

    const row = await updateRow(req, id, values);

    // Audit: doar cheile schimbate; valorile câmpurilor sensibile rămân ascunse.
    const changed = Object.keys(values).filter((key) => key !== "updatedAt");
    const sensitive = new Set(cfg.sensitiveFields ?? []);
    const audited: Record<string, unknown> = {};
    for (const key of changed) {
      if (!sensitive.has(key)) audited[key] = values[key];
    }
    await audit(req, `${cfg.entityType}_updated`, cfg.entityType, id, {
      changed,
      values: audited,
    });
    await cfg.afterUpdate?.(row, req, before);

    res.json({ item: toResponse(row, req) });
  });

  /** Ștergere logică (dacă tabela are `deletedAt`) sau fizică; FK blocat → 409. */
  router.delete("/:id", requirePermission(permissions.delete), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    const row = await find(req, id);
    await cfg.beforeDelete?.(row, req);

    if (softDelete && columns.deletedAt) {
      await updateRow(req, id, { deletedAt: new Date() });
    } else {
      const db = req.ctx.db as any;
      try {
        await db.delete(cfg.table).where(eq(columns.id, id));
      } catch (error) {
        translateDbError(error, "Are înregistrări asociate");
      }
    }

    await audit(req, `${cfg.entityType}_deleted`, cfg.entityType, id);
    await cfg.afterDelete?.(row, req);

    res.status(204).end();
  });

  return router;
}
