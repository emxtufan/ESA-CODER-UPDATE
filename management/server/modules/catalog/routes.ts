/**
 * Catalogul de servicii: categorii, servicii și pachete reutilizabile (șabloane fără prețuri
 * presupuse). Se refolosesc permisiunile `documents.*`; toate scrierile lasă urme în audit.
 */
import { and, asc, eq, ilike, inArray, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { Router } from "express";
import { z } from "zod";

import { CURRENCIES } from "../../../shared/enums";
import { BILLINGS } from "../../../shared/offers";
import type { Db } from "../../db/client";
import { catalogCategories, catalogPackageItems, catalogPackages, catalogServices } from "../../db/schema/legal";
import { HttpError, pageQuery, parse } from "../../lib/http";
import { audit } from "../../security/audit";
import { requirePermission } from "../../security/guards";

/** Sub acest prag lista serviciilor se întoarce întreagă, fără paginare. */
const NO_PAGING_LIMIT = 500;

const idSchema = z.object({ id: z.uuid("Identificator invalid") });
const codeParam = z.object({ code: z.string().regex(/^[A-Z]$/, "Cod de categorie invalid") });

const text = (max: number) => z.string().trim().max(max, `Maximum ${max} de caractere`);
/** Sumă în unități minore: întreg, ≥ 0. */
const minor = z.number().finite().int("Suma trebuie să fie în unități minore (întreg)").min(0).max(2_000_000_000);
const currency = z.enum(CURRENCIES);

const serviceFields = {
  categoryCode: z.string().regex(/^[A-Z]$/, "Cod de categorie invalid"),
  name: text(200).min(1, "Câmp obligatoriu"),
  shortDescription: text(300),
  description: text(4000),
  deliverables: text(2000),
  acceptance: text(2000),
  unit: text(40).min(1, "Câmp obligatoriu"),
  defaultQuantity: z.number().finite().min(0).max(1_000_000_000),
  recommendedPrice: minor.nullable(),
  currency: currency.nullable(),
  billing: z.enum(BILLINGS),
  defaultPeriods: z.number().int().min(1).max(600),
  defaultStatus: z.enum(["accepted", "optional", "client_direct"]),
  advanced: z.boolean(),
  duration: text(200),
  conditions: text(2000),
  sort: z.number().int().min(0).max(1_000_000),
};

const serviceCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9][A-Z0-9_-]{0,19}$/, "Cod invalid (litere, cifre, - sau _, maximum 20)");

const serviceCreateSchema = z.object({
  code: serviceCode.optional(),
  categoryCode: serviceFields.categoryCode,
  name: serviceFields.name,
  shortDescription: serviceFields.shortDescription.default(""),
  description: serviceFields.description.default(""),
  deliverables: serviceFields.deliverables.default(""),
  acceptance: serviceFields.acceptance.default(""),
  unit: serviceFields.unit.default("serviciu"),
  defaultQuantity: serviceFields.defaultQuantity.default(1),
  recommendedPrice: serviceFields.recommendedPrice.default(null),
  currency: serviceFields.currency.default(null),
  billing: serviceFields.billing.default("one_time"),
  defaultPeriods: serviceFields.defaultPeriods.default(1),
  defaultStatus: serviceFields.defaultStatus.default("accepted"),
  advanced: serviceFields.advanced.default(false),
  duration: serviceFields.duration.default(""),
  conditions: serviceFields.conditions.default(""),
  sort: serviceFields.sort.optional(),
});

const serviceUpdateSchema = z
  .object({ code: serviceCode, ...serviceFields })
  .partial();

const categoryUpdateSchema = z
  .object({ name: text(200).min(1, "Câmp obligatoriu"), note: text(2000), sort: serviceFields.sort })
  .partial();

const packageSchema = z.object({
  name: text(200).min(1, "Câmp obligatoriu"),
  description: text(2000).default(""),
  billing: z.enum(BILLINGS).default("one_time"),
  recommendedPrice: minor.nullable().default(null),
  currency: currency.nullable().default(null),
  sort: serviceFields.sort.optional(),
  serviceIds: z.array(z.uuid("Identificator invalid")).max(300).default([]),
});

const archivedFilter = z.enum(["true", "false", "all"]).default("false");

const servicesQuery = pageQuery.extend({
  category: z.string().regex(/^[A-Z]$/).optional(),
  archived: archivedFilter,
});

const packagesQuery = z.object({ archived: archivedFilter });

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

/** Elimină diacriticele românești (pentru căutare), în SQL. */
const unaccent = (column: AnyPgColumn) =>
  sql`translate(lower(coalesce(${column}, '')), 'ăâîșşțţĂÂÎȘŞȚŢ', 'aaisstt' || 'aaisstt')`;

const stripDiacritics = (value: string) =>
  value
    .replace(/[ăâĂÂ]/g, "a")
    .replace(/[îÎ]/g, "i")
    .replace(/[șşȘŞ]/g, "s")
    .replace(/[țţȚŢ]/g, "t")
    .toLowerCase();

const withArchived = (column: AnyPgColumn, filter: "true" | "false" | "all") =>
  filter === "all" ? undefined : filter === "true" ? isNotNull(column) : isNull(column);

/** Următorul cod liber din categorie: litera categoriei + număr pe 2 cifre (ex. „B16”). */
async function nextServiceCode(db: Db, category: string): Promise<string> {
  const rows = await db
    .select({ code: catalogServices.code })
    .from(catalogServices)
    .where(eq(catalogServices.categoryCode, category));
  let max = 0;
  for (const { code } of rows) {
    const match = new RegExp(`^${category}(\\d+)$`).exec(code);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${category}${String(max + 1).padStart(2, "0")}`;
}

async function assertCategory(db: Db, code: string) {
  const [row] = await db.select({ code: catalogCategories.code }).from(catalogCategories).where(eq(catalogCategories.code, code)).limit(1);
  if (!row) throw new HttpError(422, "validation_error", "Date invalide", { categoryCode: "Categoria nu există" });
}

async function findService(db: Db, id: string) {
  const [row] = await db.select().from(catalogServices).where(eq(catalogServices.id, id)).limit(1);
  if (!row) throw new HttpError(404, "not_found", "Serviciul nu există");
  return row;
}

type PackageRow = typeof catalogPackages.$inferSelect;

/** Pachetele cu componentele (serviciile) ordonate. */
async function withItems(db: Db, rows: PackageRow[]) {
  if (rows.length === 0) return [];
  const links = await db
    .select({ packageId: catalogPackageItems.packageId, sort: catalogPackageItems.sort, service: catalogServices })
    .from(catalogPackageItems)
    .innerJoin(catalogServices, eq(catalogServices.id, catalogPackageItems.serviceId))
    .where(inArray(catalogPackageItems.packageId, rows.map((r) => r.id)))
    .orderBy(asc(catalogPackageItems.sort), asc(catalogServices.code));
  return rows.map((row) => {
    const items = links.filter((l) => l.packageId === row.id).map((l) => l.service);
    return { ...row, serviceIds: items.map((s) => s.id), items };
  });
}

async function findPackage(db: Db, id: string) {
  const [row] = await db.select().from(catalogPackages).where(eq(catalogPackages.id, id)).limit(1);
  if (!row) throw new HttpError(404, "not_found", "Pachetul nu există");
  return row;
}

async function writeItems(tx: Db, packageId: string, serviceIds: string[]) {
  await tx.delete(catalogPackageItems).where(eq(catalogPackageItems.packageId, packageId));
  const unique = [...new Set(serviceIds)];
  if (unique.length) {
    await tx.insert(catalogPackageItems).values(unique.map((serviceId, i) => ({ packageId, serviceId, sort: (i + 1) * 10 })));
  }
}

export function catalogRouter(): Router {
  const router = Router();

  // --- Categorii ---
  router.get("/categories", requirePermission("documents.view"), async (req, res) => {
    const items = await req.ctx.db.select().from(catalogCategories).orderBy(asc(catalogCategories.sort), asc(catalogCategories.code));
    res.json({ items });
  });

  router.put("/categories/:code", requirePermission("documents.update"), async (req, res) => {
    const db = req.ctx.db;
    const { code } = parse(codeParam, req.params);
    const input = parse(categoryUpdateSchema, req.body);
    const [before] = await db.select().from(catalogCategories).where(eq(catalogCategories.code, code)).limit(1);
    if (!before) throw new HttpError(404, "not_found", "Categoria nu există");
    const patch = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));
    if (Object.keys(patch).length) await db.update(catalogCategories).set(patch).where(eq(catalogCategories.code, code));
    await audit(req, "catalog_category_updated", "catalog_category", null, { code, changed: Object.keys(patch) });
    const [item] = await db.select().from(catalogCategories).where(eq(catalogCategories.code, code)).limit(1);
    res.json({ item });
  });

  // --- Servicii ---
  router.get("/services", requirePermission("documents.view"), async (req, res) => {
    const db = req.ctx.db;
    const query = parse(servicesQuery, req.query);

    const conditions: (SQL | undefined)[] = [withArchived(catalogServices.archivedAt, query.archived)];
    if (query.category) conditions.push(eq(catalogServices.categoryCode, query.category));
    if (query.q) {
      const pattern = `%${stripDiacritics(query.q).replace(/[\\%_]/g, "\\$&")}%`;
      conditions.push(
        or(
          ilike(catalogServices.code, `%${query.q.replace(/[\\%_]/g, "\\$&")}%`),
          sql`${unaccent(catalogServices.name)} like ${pattern}`,
          sql`${unaccent(catalogServices.shortDescription)} like ${pattern}`,
          sql`${unaccent(catalogServices.description)} like ${pattern}`,
        ),
      );
    }
    const where = and(...conditions);

    const [counted] = await db.select({ total: sql<number>`count(*)::int` }).from(catalogServices).where(where);
    const total = counted?.total ?? 0;
    const base = db.select().from(catalogServices).where(where).orderBy(asc(catalogServices.categoryCode), asc(catalogServices.sort), asc(catalogServices.code));

    if (total <= NO_PAGING_LIMIT) {
      res.json({ items: await base, total, page: 1, pageSize: Math.max(total, 1) });
      return;
    }
    const items = await base.limit(query.pageSize).offset((query.page - 1) * query.pageSize);
    res.json({ items, total, page: query.page, pageSize: query.pageSize });
  });

  router.get("/services/:id", requirePermission("documents.view"), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    res.json({ item: await findService(req.ctx.db, id) });
  });

  router.post("/services", requirePermission("documents.create"), async (req, res) => {
    const db = req.ctx.db;
    const input = parse(serviceCreateSchema, req.body);
    await assertCategory(db, input.categoryCode);

    const { code: givenCode, sort: givenSort, ...rest } = input;
    let created: typeof catalogServices.$inferSelect | undefined;
    // Codul generat poate intra în conflict cu o cerere simultană: reîncercăm cu următorul.
    for (let attempt = 0; attempt < 3 && !created; attempt += 1) {
      const code = givenCode ?? (await nextServiceCode(db, input.categoryCode));
      try {
        const [row] = await db
          .insert(catalogServices)
          .values({ ...rest, code, sort: givenSort ?? (Number(/\d+$/.exec(code)?.[0] ?? 0) || 0) * 10 })
          .returning();
        created = row;
      } catch (error) {
        if (pgCode(error) === "23505") {
          if (givenCode) throw new HttpError(409, "conflict", "Există deja un serviciu cu acest cod");
          continue;
        }
        throw error;
      }
    }
    if (!created) throw new HttpError(409, "conflict", "Codul serviciului nu a putut fi alocat");
    await audit(req, "catalog_service_created", "catalog_service", created.id, { code: created.code, name: created.name });
    res.status(201).json({ item: created });
  });

  router.put("/services/:id", requirePermission("documents.update"), async (req, res) => {
    const db = req.ctx.db;
    const { id } = parse(idSchema, req.params);
    const input = parse(serviceUpdateSchema, req.body);
    await findService(db, id);
    if (input.categoryCode) await assertCategory(db, input.categoryCode);
    const patch = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));
    try {
      await db
        .update(catalogServices)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(catalogServices.id, id));
    } catch (error) {
      if (pgCode(error) === "23505") throw new HttpError(409, "conflict", "Există deja un serviciu cu acest cod");
      throw error;
    }
    await audit(req, "catalog_service_updated", "catalog_service", id, { changed: Object.keys(patch) });
    res.json({ item: await findService(db, id) });
  });

  for (const [path, archived] of [["archive", true], ["unarchive", false]] as const) {
    router.post(`/services/:id/${path}`, requirePermission("documents.update"), async (req, res) => {
      const db = req.ctx.db;
      const { id } = parse(idSchema, req.params);
      await findService(db, id);
      await db
        .update(catalogServices)
        .set({ archivedAt: archived ? new Date() : null, updatedAt: new Date() })
        .where(eq(catalogServices.id, id));
      await audit(req, archived ? "catalog_service_archived" : "catalog_service_unarchived", "catalog_service", id);
      res.json({ item: await findService(db, id) });
    });
  }

  router.delete("/services/:id", requirePermission("documents.delete"), async (req, res) => {
    const db = req.ctx.db;
    const { id } = parse(idSchema, req.params);
    const before = await findService(db, id);
    const used = await db
      .select({ name: catalogPackages.name })
      .from(catalogPackageItems)
      .innerJoin(catalogPackages, eq(catalogPackages.id, catalogPackageItems.packageId))
      .where(eq(catalogPackageItems.serviceId, id));
    if (used.length) {
      throw new HttpError(
        409,
        "in_use",
        `Serviciul face parte din ${used.length === 1 ? "pachetul" : "pachetele"} ${used.map((p) => `„${p.name}”`).join(", ")} și nu poate fi șters. Arhivează-l în loc să-l ștergi.`,
      );
    }
    await db.delete(catalogServices).where(eq(catalogServices.id, id));
    await audit(req, "catalog_service_deleted", "catalog_service", id, { code: before.code });
    res.status(204).end();
  });

  // --- Pachete ---
  router.get("/packages", requirePermission("documents.view"), async (req, res) => {
    const db = req.ctx.db;
    const { archived } = parse(packagesQuery, req.query);
    const rows = await db
      .select()
      .from(catalogPackages)
      .where(withArchived(catalogPackages.archivedAt, archived))
      .orderBy(asc(catalogPackages.sort), asc(catalogPackages.name));
    res.json({ items: await withItems(db, rows) });
  });

  router.get("/packages/:id", requirePermission("documents.view"), async (req, res) => {
    const db = req.ctx.db;
    const { id } = parse(idSchema, req.params);
    const [item] = await withItems(db, [await findPackage(db, id)]);
    res.json({ item });
  });

  /** Erorile de constrângere ale pachetelor devin 409 cu mesaj în română. */
  function packageError(error: unknown): never {
    const code = pgCode(error);
    if (code === "23505") throw new HttpError(409, "conflict", "Există deja un pachet cu acest nume");
    if (code === "23503") throw new HttpError(409, "conflict", "Unul dintre serviciile alese nu există");
    throw error;
  }

  router.post("/packages", requirePermission("documents.create"), async (req, res) => {
    const db = req.ctx.db;
    const { serviceIds, sort, ...input } = parse(packageSchema, req.body);
    let id: string;
    try {
      id = await db.transaction(async (raw) => {
        const tx = raw as unknown as Db;
        const [row] = await tx
          .insert(catalogPackages)
          .values({ ...input, sort: sort ?? 1000 })
          .returning({ id: catalogPackages.id });
        await writeItems(tx, row!.id, serviceIds);
        return row!.id;
      });
    } catch (error) {
      return packageError(error);
    }
    await audit(req, "catalog_package_created", "catalog_package", id, { name: input.name, services: serviceIds.length });
    const [item] = await withItems(db, [await findPackage(db, id)]);
    res.status(201).json({ item });
  });

  router.put("/packages/:id", requirePermission("documents.update"), async (req, res) => {
    const db = req.ctx.db;
    const { id } = parse(idSchema, req.params);
    const { serviceIds, sort, ...input } = parse(packageSchema, req.body);
    const before = await findPackage(db, id);
    try {
      await db.transaction(async (raw) => {
        const tx = raw as unknown as Db;
        await tx
          .update(catalogPackages)
          .set({ ...input, sort: sort ?? before.sort, updatedAt: new Date() })
          .where(eq(catalogPackages.id, id));
        await writeItems(tx, id, serviceIds);
      });
    } catch (error) {
      return packageError(error);
    }
    await audit(req, "catalog_package_updated", "catalog_package", id, { name: input.name, services: serviceIds.length });
    const [item] = await withItems(db, [await findPackage(db, id)]);
    res.json({ item });
  });

  for (const [path, archived] of [["archive", true], ["unarchive", false]] as const) {
    router.post(`/packages/:id/${path}`, requirePermission("documents.update"), async (req, res) => {
      const db = req.ctx.db;
      const { id } = parse(idSchema, req.params);
      await findPackage(db, id);
      await db
        .update(catalogPackages)
        .set({ archivedAt: archived ? new Date() : null, updatedAt: new Date() })
        .where(eq(catalogPackages.id, id));
      await audit(req, archived ? "catalog_package_archived" : "catalog_package_unarchived", "catalog_package", id);
      const [item] = await withItems(db, [await findPackage(db, id)]);
      res.json({ item });
    });
  }

  router.delete("/packages/:id", requirePermission("documents.delete"), async (req, res) => {
    const db = req.ctx.db;
    const { id } = parse(idSchema, req.params);
    const before = await findPackage(db, id);
    await db.delete(catalogPackages).where(eq(catalogPackages.id, id));
    await audit(req, "catalog_package_deleted", "catalog_package", id, { name: before.name });
    res.status(204).end();
  });

  return router;
}
