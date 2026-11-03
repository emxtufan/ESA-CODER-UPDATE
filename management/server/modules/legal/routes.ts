/**
 * Rutele modulului Legal: datele prestatorului (ESA), numerotarea automată și CRUD-ul
 * contractelor-cadru generate. Contractele stau în tabelul `contracts` (`kind = 'generated'`),
 * cu valorile formularului în `data`. Se refolosesc permisiunile `documents.*`.
 */
import { and, desc, eq, ilike, like, or, sql, type SQL } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";

import type { Db } from "../../db/client";
import { clients, projects } from "../../db/schema/core";
import { appSettings, contracts } from "../../db/schema/ops";
import { HttpError, pageQuery, paged, parse } from "../../lib/http";
import { audit } from "../../security/audit";
import { requirePermission } from "../../security/guards";

const idSchema = z.object({ id: z.uuid("Identificator invalid") });

const PROVIDER_KEY = "legal.provider";

/** Datele ESA implicite (din generatorul original). */
export const PROVIDER_DEFAULTS = {
  esaMarca: "ESA Coder Solutions",
  esaNume: "ELEXA SOCIETY S.R.L.",
  esaCui: "52745149",
  esaRc: "J2025080665008",
  esaAdresa: "București, Sector 6, Bulevardul Timișoara nr. 101V, ap. 4",
  esaIban: "",
  esaBanca: "",
  esaEmail: "support@esa-coder-solutions.com",
  esaTel: "0748 452 215",
  esaSite: "https://esa-coder-solutions.com",
  esaRep: "Tufan Constantin Emanuel",
  esaFunctie: "administrator",
};

type Provider = typeof PROVIDER_DEFAULTS;

const providerText = z.string().max(500, "Maximum 500 de caractere");

const providerSchema = z.object({
  esaMarca: providerText.optional(),
  esaNume: providerText.optional(),
  esaCui: providerText.optional(),
  esaRc: providerText.optional(),
  esaAdresa: providerText.optional(),
  esaIban: providerText.optional(),
  esaBanca: providerText.optional(),
  esaEmail: providerText.optional(),
  esaTel: providerText.optional(),
  esaSite: providerText.optional(),
  esaRep: providerText.optional(),
  esaFunctie: providerText.optional(),
});

export const CONTRACT_STATUSES = ["draft", "trimis", "semnat"] as const;

/** Mărimea maximă a valorilor formularului (serializate), în caractere. */
const MAX_DATA_SIZE = 200_000;

const contractData = z
  .record(z.string().max(100), z.string())
  .refine((value) => JSON.stringify(value).length <= MAX_DATA_SIZE, "Datele contractului sunt prea mari");

const contractSchema = z.object({
  clientId: z.uuid("Identificator invalid"),
  projectId: z.uuid("Identificator invalid").nullable().optional(),
  number: z
    .string()
    .trim()
    .max(60)
    .transform((value) => (value === "" ? undefined : value))
    .optional(),
  status: z.enum(CONTRACT_STATUSES).optional(),
  data: contractData,
});

const listQuery = pageQuery.extend({ clientId: z.uuid("Identificator invalid").optional() });

/** Datele prestatorului: cele salvate, peste valorile implicite. */
export async function loadProvider(db: Db): Promise<Provider> {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, PROVIDER_KEY)).limit(1);
  const saved = providerSchema.safeParse(row?.value);
  return { ...PROVIDER_DEFAULTS, ...(saved.success ? stripUndefined(saved.data) : {}) };
}

function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/** Următorul număr pe anul curent: `ESA-AAAA-NNN` (maximul existent + 1). */
export async function nextNumber(db: Db): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ESA-${year}-`;
  const rows = await db
    .select({ number: contracts.number })
    .from(contracts)
    .where(like(contracts.number, `${prefix}%`));

  let max = 0;
  for (const { number } of rows) {
    const suffix = number?.slice(prefix.length) ?? "";
    if (/^\d+$/.test(suffix)) max = Math.max(max, Number(suffix));
  }
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
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

/** Erorile de constrângere devin 409 cu mesaje în română. */
function translate(error: unknown): never {
  const code = pgCode(error);
  if (code === "23505") throw new HttpError(409, "conflict", "Există deja un contract cu acest număr");
  if (code === "23503") throw new HttpError(409, "conflict", "Clientul sau proiectul nu există");
  throw error;
}

/** `signedAt` = data contractului când statusul e „semnat”, altfel null. */
function signedAtFor(status: string, data: Record<string, string>): Date | null {
  if (status !== "semnat") return null;
  const parsed = data.data ? new Date(`${data.data}T00:00:00`) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date();
}

export async function assertProjectOfClient(db: Db, projectId: string | null | undefined, clientId: string) {
  if (!projectId) return;
  const [project] = await db
    .select({ clientId: projects.clientId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  if (!project) throw new HttpError(409, "conflict", "Proiectul nu există");
  if (project.clientId !== clientId) {
    throw new HttpError(409, "conflict", "Proiectul nu aparține clientului ales");
  }
}

const withNames = {
  id: contracts.id,
  number: contracts.number,
  title: contracts.title,
  status: contracts.status,
  clientId: contracts.clientId,
  projectId: contracts.projectId,
  signedAt: contracts.signedAt,
  createdAt: contracts.createdAt,
  updatedAt: contracts.updatedAt,
  date: sql<string | null>`${contracts.data}->>'data'`,
  clientName: clients.companyName,
  projectName: projects.name,
};

export function legalRouter(): Router {
  const router = Router();

  // --- Prestatorul ---
  router.get("/provider", requirePermission("documents.view"), async (req, res) => {
    res.json({ item: await loadProvider(req.ctx.db) });
  });

  router.put("/provider", requirePermission("documents.update"), async (req, res) => {
    const db = req.ctx.db;
    const input = stripUndefined(parse(providerSchema, req.body));
    const merged = { ...(await loadProvider(db)), ...input };
    const now = new Date();
    await db
      .insert(appSettings)
      .values({ key: PROVIDER_KEY, value: merged, updatedAt: now })
      .onConflictDoUpdate({ target: appSettings.key, set: { value: merged, updatedAt: now } });
    await audit(req, "legal_provider_updated", "app_setting", null, { changed: Object.keys(input) });
    res.json({ item: merged });
  });

  // --- Contracte ---
  router.get("/contracts/next-number", requirePermission("documents.view"), async (req, res) => {
    res.json({ number: await nextNumber(req.ctx.db) });
  });

  router.get("/contracts", requirePermission("documents.view"), async (req, res) => {
    const db = req.ctx.db;
    const query = parse(listQuery, req.query);

    const conditions: (SQL | undefined)[] = [eq(contracts.kind, "generated")];
    if (query.clientId) conditions.push(eq(contracts.clientId, query.clientId));
    if (query.q) {
      const pattern = `%${query.q.replace(/[\\%_]/g, "\\$&")}%`;
      conditions.push(
        or(
          ilike(contracts.number, pattern),
          ilike(contracts.title, pattern),
          ilike(clients.companyName, pattern),
          ilike(projects.name, pattern),
        ),
      );
    }
    const where = and(...conditions);

    const base = db
      .select(withNames)
      .from(contracts)
      .innerJoin(clients, eq(clients.id, contracts.clientId))
      .leftJoin(projects, eq(projects.id, contracts.projectId))
      .where(where);

    const [totals] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(contracts)
      .innerJoin(clients, eq(clients.id, contracts.clientId))
      .leftJoin(projects, eq(projects.id, contracts.projectId))
      .where(where);

    const items = await base
      .orderBy(desc(contracts.updatedAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);

    res.json(paged(items, totals?.total ?? 0, query));
  });

  /** Contractul generat după id, cu numele clientului și proiectului. */
  async function findContract(db: Db, id: string) {
    const [row] = await db
      .select({ ...withNames, data: contracts.data, kind: contracts.kind, offerId: contracts.offerId })
      .from(contracts)
      .innerJoin(clients, eq(clients.id, contracts.clientId))
      .leftJoin(projects, eq(projects.id, contracts.projectId))
      .where(and(eq(contracts.id, id), eq(contracts.kind, "generated")))
      .limit(1);
    if (!row) throw new HttpError(404, "not_found", "Contractul nu există");
    return row;
  }

  router.get("/contracts/:id", requirePermission("documents.view"), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    res.json({ item: await findContract(req.ctx.db, id) });
  });

  router.post("/contracts", requirePermission("documents.create"), async (req, res) => {
    const db = req.ctx.db;
    const input = parse(contractSchema, req.body);
    await assertProjectOfClient(db, input.projectId, input.clientId);
    const status = input.status ?? "draft";

    let id: string;
    let number: string;
    try {
      const created = await db.transaction(async (raw) => {
        const tx = raw as unknown as Db;
        const num = input.number ?? (await nextNumber(tx));
        const [row] = await tx
          .insert(contracts)
          .values({
            clientId: input.clientId,
            projectId: input.projectId ?? null,
            title: `Contract-cadru nr. ${num}`,
            number: num,
            kind: "generated",
            data: input.data,
            status,
            signedAt: signedAtFor(status, input.data),
          })
          .returning({ id: contracts.id, number: contracts.number });
        return row!;
      });
      id = created.id;
      number = created.number ?? "";
    } catch (error) {
      return translate(error);
    }

    await audit(req, "contract_created", "contract", id, { number, kind: "generated" });
    res.status(201).json({ item: await findContract(db, id) });
  });

  router.put("/contracts/:id", requirePermission("documents.update"), async (req, res) => {
    const db = req.ctx.db;
    const { id } = parse(idSchema, req.params);
    const input = parse(contractSchema.partial(), req.body);
    const before = await findContract(db, id);

    const clientId = input.clientId ?? before.clientId;
    const projectId = input.projectId === undefined ? before.projectId : input.projectId;
    await assertProjectOfClient(db, projectId, clientId);

    const number = input.number ?? before.number ?? (await nextNumber(db));
    const status = input.status ?? before.status ?? "draft";
    const data = input.data ?? (before.data as Record<string, string>);

    try {
      await db
        .update(contracts)
        .set({
          clientId,
          projectId,
          number,
          title: `Contract-cadru nr. ${number}`,
          status,
          data,
          signedAt: signedAtFor(status, data),
          updatedAt: new Date(),
        })
        .where(eq(contracts.id, id));
    } catch (error) {
      return translate(error);
    }

    await audit(req, "contract_updated", "contract", id, { number, status });
    res.json({ item: await findContract(db, id) });
  });

  router.delete("/contracts/:id", requirePermission("documents.delete"), async (req, res) => {
    const db = req.ctx.db;
    const { id } = parse(idSchema, req.params);
    const before = await findContract(db, id);
    await db.delete(contracts).where(eq(contracts.id, id));
    await audit(req, "contract_deleted", "contract", id, { number: before.number });
    res.status(204).end();
  });

  return router;
}
