/**
 * Exportul și importul catalogului (categorii, servicii, pachete) ca JSON portabil, fără
 * id-uri interne: categoriile și serviciile se identifică prin `code`, pachetele prin `name`.
 * Importul face upsert pe loc (id-urile serviciilor rămân, deci ofertele existente rămân
 * valide) și nu șterge nimic.
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { BILLINGS } from "../../../shared/offers";
import type { Db } from "../../db/client";
import { catalogCategories, catalogPackageItems, catalogPackages, catalogServices } from "../../db/schema/legal";
import { HttpError, parse } from "../../lib/http";
import { currency, minor, serviceCode, serviceFields, text } from "./schemas";

export const CATALOG_FORMAT = "esa-catalog";
export const CATALOG_VERSION = 1;
/** Limita corpului cererii de import. */
export const IMPORT_BODY_LIMIT = "5mb";

const categorySchema = z.strictObject({
  code: serviceFields.categoryCode,
  name: text(200).min(1, "Câmp obligatoriu"),
  note: text(2000),
  sort: serviceFields.sort,
  archived: z.boolean(),
});

const serviceSchema = z.strictObject({
  code: serviceCode,
  categoryCode: serviceFields.categoryCode,
  name: serviceFields.name,
  shortDescription: serviceFields.shortDescription,
  description: serviceFields.description,
  deliverables: serviceFields.deliverables,
  acceptance: serviceFields.acceptance,
  unit: serviceFields.unit,
  defaultQuantity: serviceFields.defaultQuantity,
  recommendedPrice: serviceFields.recommendedPrice,
  currency: serviceFields.currency,
  billing: serviceFields.billing,
  defaultPeriods: serviceFields.defaultPeriods,
  defaultStatus: serviceFields.defaultStatus,
  advanced: serviceFields.advanced,
  duration: serviceFields.duration,
  conditions: serviceFields.conditions,
  sort: serviceFields.sort,
  archived: z.boolean(),
});

const packageSchema = z.strictObject({
  name: text(200).min(1, "Câmp obligatoriu"),
  description: text(2000),
  billing: z.enum(BILLINGS),
  recommendedPrice: minor.nullable(),
  currency: currency.nullable(),
  sort: serviceFields.sort,
  archived: z.boolean(),
  serviceCodes: z.array(serviceCode).max(300),
});

const duplicates = (values: string[]) => values.filter((v, i) => values.indexOf(v) !== i);

export const catalogFileSchema = z
  .strictObject({
    format: z.literal(CATALOG_FORMAT, "Fișierul nu este un export de catalog ESA"),
    version: z.literal(CATALOG_VERSION, `Versiune nesuportată (se acceptă versiunea ${CATALOG_VERSION})`),
    exportedAt: z.string().optional(),
    categories: z.array(categorySchema).max(200),
    services: z.array(serviceSchema).max(5000),
    packages: z.array(packageSchema).max(500),
  })
  .superRefine((file, ctx) => {
    const checks: [string, string[]][] = [
      ["categories", file.categories.map((c) => c.code)],
      ["services", file.services.map((s) => s.code)],
      ["packages", file.packages.map((p) => p.name.toLowerCase())],
    ];
    for (const [path, values] of checks) {
      const dup = [...new Set(duplicates(values))];
      if (dup.length) ctx.addIssue({ code: "custom", path: [path], message: `Duplicate în fișier: ${dup.join(", ")}` });
    }
  });

export type CatalogFile = z.infer<typeof catalogFileSchema>;

export const importBodySchema = z.object({ data: z.unknown(), dryRun: z.boolean().default(false) });

/** Validează conținutul fișierului (422 cu câmpurile invalide). */
export function parseCatalogFile(data: unknown): CatalogFile {
  return parse(catalogFileSchema, data);
}

export async function exportCatalog(db: Db): Promise<CatalogFile> {
  const categories = await db.select().from(catalogCategories).orderBy(asc(catalogCategories.sort), asc(catalogCategories.code));
  const services = await db.select().from(catalogServices).orderBy(asc(catalogServices.categoryCode), asc(catalogServices.sort), asc(catalogServices.code));
  const packages = await db.select().from(catalogPackages).orderBy(asc(catalogPackages.sort), asc(catalogPackages.name));
  const links = await db
    .select({ packageId: catalogPackageItems.packageId, code: catalogServices.code })
    .from(catalogPackageItems)
    .innerJoin(catalogServices, eq(catalogServices.id, catalogPackageItems.serviceId))
    .orderBy(asc(catalogPackageItems.sort), asc(catalogServices.code));

  return {
    format: CATALOG_FORMAT,
    version: CATALOG_VERSION,
    exportedAt: new Date().toISOString(),
    categories: categories.map((c) => ({ code: c.code, name: c.name, note: c.note, sort: c.sort, archived: c.archivedAt !== null })),
    services: services.map((s) => ({
      code: s.code,
      categoryCode: s.categoryCode,
      name: s.name,
      shortDescription: s.shortDescription,
      description: s.description,
      deliverables: s.deliverables,
      acceptance: s.acceptance,
      unit: s.unit,
      defaultQuantity: s.defaultQuantity,
      recommendedPrice: s.recommendedPrice,
      currency: s.currency,
      billing: s.billing,
      defaultPeriods: s.defaultPeriods,
      defaultStatus: s.defaultStatus,
      advanced: s.advanced,
      duration: s.duration,
      conditions: s.conditions,
      sort: s.sort,
      archived: s.archivedAt !== null,
    })),
    packages: packages.map((p) => ({
      name: p.name,
      description: p.description,
      billing: p.billing,
      recommendedPrice: p.recommendedPrice,
      currency: p.currency,
      sort: p.sort,
      archived: p.archivedAt !== null,
      serviceCodes: links.filter((l) => l.packageId === p.id).map((l) => l.code),
    })),
  };
}

export interface ImportCounts {
  created: number;
  updated: number;
  unchanged: number;
}

export interface ImportResult {
  dryRun: boolean;
  categories: ImportCounts;
  services: ImportCounts;
  packages: ImportCounts;
  warnings: string[];
}

export interface ImportOptions {
  dryRun?: boolean;
  /** Doar creează ce lipsește; ce există în DB rămâne neatins. */
  createOnly?: boolean;
}

/** Aruncată în tranzacție ca să o anuleze la `dryRun`. */
class Rollback extends Error {
  constructor(readonly result: ImportResult) {
    super("rollback");
  }
}

const counts = (): ImportCounts => ({ created: 0, updated: 0, unchanged: 0 });
const same = (a: object, b: Record<string, unknown>) => Object.entries(b).every(([k, v]) => (a as Record<string, unknown>)[k] === v);

/** Păstrează data arhivării existente când starea nu se schimbă. */
function archivedValue(current: Date | null, archived: boolean, now: Date): Date | null {
  return archived ? (current ?? now) : null;
}

export async function importCatalog(db: Db, file: CatalogFile, { dryRun = false, createOnly = false }: ImportOptions = {}): Promise<ImportResult> {
  const result: ImportResult = { dryRun, categories: counts(), services: counts(), packages: counts(), warnings: [] };

  try {
    await db.transaction(async (raw) => {
      const tx = raw as unknown as Db;
      const now = new Date();

      // --- Validări fără scrieri: categorii și coduri de servicii cunoscute ---
      const dbCategories = new Map((await tx.select().from(catalogCategories)).map((c) => [c.code, c]));
      const dbServices = new Map((await tx.select().from(catalogServices)).map((s) => [s.code, s]));
      const knownCategories = new Set([...dbCategories.keys(), ...file.categories.map((c) => c.code)]);
      const knownServices = new Set([...dbServices.keys(), ...file.services.map((s) => s.code)]);

      const badCategories = [...new Set(file.services.map((s) => s.categoryCode).filter((c) => !knownCategories.has(c)))];
      if (badCategories.length) {
        throw new HttpError(422, "validation_error", `Categorii necunoscute în servicii: ${badCategories.join(", ")}`, {
          categoryCode: badCategories.join(", "),
        });
      }
      const unknown = [...new Set(file.packages.flatMap((p) => p.serviceCodes).filter((c) => !knownServices.has(c)))];
      if (unknown.length) {
        throw new HttpError(422, "validation_error", `Coduri de servicii necunoscute în pachete: ${unknown.join(", ")}`, {
          serviceCodes: unknown.join(", "),
        });
      }

      // --- Categorii ---
      for (const c of file.categories) {
        const before = dbCategories.get(c.code);
        if (!before) {
          await tx.insert(catalogCategories).values({ code: c.code, name: c.name, note: c.note, sort: c.sort, archivedAt: c.archived ? now : null });
          result.categories.created += 1;
        } else if (createOnly || (same(before, { name: c.name, note: c.note, sort: c.sort }) && (before.archivedAt !== null) === c.archived)) {
          result.categories.unchanged += 1;
        } else {
          await tx
            .update(catalogCategories)
            .set({ name: c.name, note: c.note, sort: c.sort, archivedAt: archivedValue(before.archivedAt, c.archived, now) })
            .where(eq(catalogCategories.code, c.code));
          result.categories.updated += 1;
        }
      }

      // --- Servicii ---
      for (const s of file.services) {
        const { archived, ...fields } = s;
        const before = dbServices.get(s.code);
        if (!before) {
          const [row] = await tx.insert(catalogServices).values({ ...fields, archivedAt: archived ? now : null }).returning();
          dbServices.set(s.code, row!);
          result.services.created += 1;
        } else if (createOnly || (same(before, fields) && (before.archivedAt !== null) === archived)) {
          result.services.unchanged += 1;
        } else {
          await tx
            .update(catalogServices)
            .set({ ...fields, archivedAt: archivedValue(before.archivedAt, archived, now), updatedAt: now })
            .where(eq(catalogServices.id, before.id));
          result.services.updated += 1;
        }
      }

      // --- Pachete ---
      const dbPackages = new Map((await tx.select().from(catalogPackages)).map((p) => [p.name, p]));
      const dbLinks = await tx
        .select({ packageId: catalogPackageItems.packageId, code: catalogServices.code })
        .from(catalogPackageItems)
        .innerJoin(catalogServices, eq(catalogServices.id, catalogPackageItems.serviceId))
        .orderBy(asc(catalogPackageItems.sort), asc(catalogServices.code));

      for (const p of file.packages) {
        const { archived, serviceCodes, ...fields } = p;
        const codes = [...new Set(serviceCodes)];
        const before = dbPackages.get(p.name);
        let packageId: string;
        if (!before) {
          const [row] = await tx.insert(catalogPackages).values({ ...fields, archivedAt: archived ? now : null }).returning({ id: catalogPackages.id });
          packageId = row!.id;
          result.packages.created += 1;
        } else {
          const current = dbLinks.filter((l) => l.packageId === before.id).map((l) => l.code);
          const unchanged =
            createOnly ||
            (same(before, fields) && (before.archivedAt !== null) === archived && current.length === codes.length && current.every((c, i) => c === codes[i]));
          if (unchanged) {
            result.packages.unchanged += 1;
            continue;
          }
          await tx
            .update(catalogPackages)
            .set({ ...fields, archivedAt: archivedValue(before.archivedAt, archived, now), updatedAt: now })
            .where(eq(catalogPackages.id, before.id));
          packageId = before.id;
          result.packages.updated += 1;
          await tx.delete(catalogPackageItems).where(eq(catalogPackageItems.packageId, packageId));
        }
        if (codes.length) {
          await tx.insert(catalogPackageItems).values(codes.map((code, i) => ({ packageId, serviceId: dbServices.get(code)!.id, sort: (i + 1) * 10 })));
        }
      }

      if (dryRun) throw new Rollback(result);
    });
  } catch (error) {
    if (error instanceof Rollback) return error.result;
    throw error;
  }
  return result;
}

/**
 * Import la pornire din `CATALOG_IMPORT_FILE`: doar creează ce lipsește. Erorile se loghează
 * și nu opresc pornirea. Întoarce rezultatul, sau `null` dacă fișierul lipsește/e invalid.
 */
export async function importCatalogFile(db: Db, path: string): Promise<ImportResult | null> {
  try {
    if (!existsSync(path)) {
      console.warn(`CATALOG_IMPORT_FILE: fișierul nu există (${path}), import omis`);
      return null;
    }
    const file = parseCatalogFile(JSON.parse(await readFile(path, "utf8")));
    const result = await importCatalog(db, file, { createOnly: true });
    console.log(
      `Catalog importat din ${path}: servicii +${result.services.created}, pachete +${result.packages.created}, categorii +${result.categories.created}`,
    );
    return result;
  } catch (error) {
    console.error(`CATALOG_IMPORT_FILE: importul a eșuat (${path}):`, error instanceof Error ? error.message : error);
    return null;
  }
}
