/**
 * Ofertele și dosarul contractual: oferte cu versiuni, acceptare cu snapshot nemodificabil,
 * acte adiționale (amendamente), contractul generat din ofertă și documentele din dosar.
 * Se montează sub `/api/legal`. Totalurile se calculează întotdeauna pe server
 * (`computeTotals`) și nu se acceptă niciodată de la client.
 */
import { createHash, randomUUID } from "node:crypto";

import { and, desc, eq, ilike, inArray, like, ne, or, sql, type SQL } from "drizzle-orm";
import express, { Router } from "express";
import { z } from "zod";

import { CURRENCIES, type Currency } from "../../../shared/enums";
import {
  BILLINGS,
  DISCOUNT_TYPES,
  DOSSIER_DOC_LABELS,
  DOSSIER_DOC_TYPES,
  LINE_STATUSES,
  OFFER_KINDS,
  OFFER_STATUSES,
  computeTotals,
  contractedLines,
  formatMoney,
  lineAmounts,
  type ClientValues,
  type DossierDocType,
  type OfferConfig,
  type OfferSnapshot,
} from "../../../shared/offers";
import type { Db } from "../../db/client";
import { clients } from "../../db/schema/core";
import { dossierDocuments, offerVersions, offers } from "../../db/schema/legal";
import { contracts, documents, documentVersions } from "../../db/schema/ops";
import { HttpError, pageQuery, paged, parse } from "../../lib/http";
import { putFile } from "../../lib/storage";
import { audit } from "../../security/audit";
import { requirePermission } from "../../security/guards";
import { assertAllowedFile } from "../documents/files";
import { shortOf } from "../catalog/seed";

import { assertProjectOfClient, loadProvider, nextNumber as nextContractNumber } from "./routes";

const idSchema = z.object({ id: z.uuid("Identificator invalid") });
const versionParams = z.object({ id: z.uuid("Identificator invalid"), version: z.coerce.number().int().min(1) });

const text = (max: number) => z.string().trim().max(max, `Maximum ${max} de caractere`);
const minor = z.number().finite().int("Suma trebuie să fie în unități minore (întreg)").min(0).max(2_000_000_000);

/** Dată calendaristică reală `AAAA-LL-ZZ`. */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Dată invalidă (AAAA-LL-ZZ)")
  .refine((value) => {
    const d = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
  }, "Dată invalidă");

// --- Configurația ofertei ---

const lineSchema = z
  .object({
    id: text(64).min(1),
    serviceId: z.uuid().nullable(),
    code: text(20).nullable(),
    category: text(4).nullable(),
    name: text(200).min(1, "Câmp obligatoriu"),
    description: text(4000),
    deliverables: text(2000),
    acceptance: text(2000),
    unit: text(40),
    quantity: z.number().finite().min(0).max(1_000_000_000),
    unitPrice: minor,
    discountType: z.enum(DISCOUNT_TYPES),
    discountValue: z.number().finite().min(0).max(2_000_000_000),
    billing: z.enum(BILLINGS),
    periods: z.number().int().min(1).max(600),
    status: z.enum(LINE_STATUSES),
    isPackage: z.boolean(),
    packageLineId: text(64).nullable(),
    duration: text(200),
    conditions: text(2000),
    advanced: z.boolean(),
  })
  .refine((l) => l.discountType !== "percent" || l.discountValue <= 100, {
    path: ["discountValue"],
    message: "Procentul trebuie să fie între 0 și 100",
  })
  .refine((l) => l.discountType !== "fixed" || Number.isInteger(l.discountValue), {
    path: ["discountValue"],
    message: "Reducerea fixă trebuie să fie în unități minore (întreg)",
  });

const stageSchema = z.object({
  id: text(64).min(1),
  name: text(200),
  deliverables: text(2000),
  term: text(200),
  firm: z.boolean(),
});

const installmentSchema = z.object({
  id: text(64).min(1),
  label: text(200),
  percent: z.number().finite().min(0).max(100),
  due: text(200),
});

const configSchema = z
  .object({
    currency: z.enum(CURRENCIES),
    vatRate: z.number().finite().min(0).max(100),
    lines: z.array(lineSchema).max(500),
    stages: z.array(stageSchema).max(100),
    installments: z.array(installmentSchema).max(50),
    intro: text(4000),
    notes: text(4000),
    validityDays: z.number().int().min(0).max(3650).nullable(),
    timeline: text(500),
    paymentTerms: text(2000),
    projectName: text(200),
    website: text(300),
  })
  .superRefine((config, ctx) => {
    const ids = new Set<string>();
    for (const [i, line] of config.lines.entries()) {
      if (ids.has(line.id)) ctx.addIssue({ code: "custom", path: ["lines", i, "id"], message: "Identificator duplicat" });
      ids.add(line.id);
    }
    for (const [i, line] of config.lines.entries()) {
      if (line.packageLineId && !config.lines.some((l) => l.id === line.packageLineId && l.isPackage)) {
        ctx.addIssue({ code: "custom", path: ["lines", i, "packageLineId"], message: "Linia de pachet nu există" });
      }
    }
  });

const createSchema = z.object({
  clientId: z.uuid("Identificator invalid"),
  projectId: z.uuid("Identificator invalid").nullable().optional(),
  title: text(200).optional(),
  date: isoDate,
  number: text(60)
    .transform((value) => (value === "" ? undefined : value))
    .optional(),
  data: configSchema,
});

const updateSchema = z.object({
  projectId: z.uuid("Identificator invalid").nullable().optional(),
  title: text(200).optional(),
  date: isoDate.optional(),
  data: configSchema.optional(),
});

const listQuery = pageQuery.extend({
  clientId: z.uuid("Identificator invalid").optional(),
  status: z.enum(OFFER_STATUSES).optional(),
  kind: z.enum(OFFER_KINDS).optional(),
});

const statusSchema = z.object({ status: z.enum(["sent", "rejected", "expired", "draft"]) });

const MAX_DATA_SIZE = 200_000;
const createDocumentSchema = z.object({
  type: z.enum(DOSSIER_DOC_TYPES),
  date: isoDate.optional(),
  data: z
    .record(z.string().max(100), z.unknown())
    .refine((value) => JSON.stringify(value).length <= MAX_DATA_SIZE, "Datele documentului sunt prea mari")
    .optional(),
});

const updateDocumentSchema = z.object({
  data: z
    .record(z.string().max(100), z.unknown())
    .refine((value) => JSON.stringify(value).length <= MAX_DATA_SIZE, "Datele documentului sunt prea mari")
    .optional(),
  date: isoDate.optional(),
  status: z.enum(["draft", "final"]).optional(),
});

const MAX_PDF_BYTES = 25 * 1024 * 1024;
const archiveSchema = z.object({
  pdfBase64: z.string().min(8).max(Math.ceil((MAX_PDF_BYTES * 4) / 3) + 16, "PDF-ul este prea mare"),
  filename: text(200).min(1, "Câmp obligatoriu"),
});

// --- Utilitare ---

type OfferRow = typeof offers.$inferSelect;
type DossierRow = typeof dossierDocuments.$inferSelect;

const str = (value: unknown): string => (typeof value === "string" ? value : "");

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function pgCode(error: unknown): string | undefined {
  let current: unknown = error;
  for (let depth = 0; current && depth < 5; depth += 1) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string") return code;
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
}

/** Datele clientului din fișă, mapate pe câmpurile contractului (la fel ca în ContractGeneratorPage). */
function clientValues(client: typeof clients.$inferSelect): ClientValues {
  const address = [client.address, client.city, client.postalCode]
    .map((part) => str(part).trim())
    .filter(Boolean)
    .join(", ");
  return {
    clNume: str(client.legalName) || str(client.companyName),
    clSediu: address,
    clRc: str(client.regCom),
    clCui: str(client.cui),
    clIban: str(client.iban),
    clBanca: str(client.bank),
    clEmail: str(client.primaryEmail) || str(client.billingEmail),
    clTel: str(client.phone),
    clRep: str(client.contactPerson),
    clFunctie: str(client.position),
  };
}

async function findClient(db: Db, id: string) {
  const [row] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  if (!row || row.deletedAt) throw new HttpError(409, "conflict", "Clientul nu există");
  return row;
}

async function findOffer(db: Db, id: string): Promise<OfferRow> {
  const [row] = await db.select().from(offers).where(eq(offers.id, id)).limit(1);
  if (!row) throw new HttpError(404, "not_found", "Oferta nu există");
  return row;
}

async function findDossierDoc(db: Db, id: string): Promise<DossierRow> {
  const [row] = await db.select().from(dossierDocuments).where(eq(dossierDocuments.id, id)).limit(1);
  if (!row) throw new HttpError(404, "not_found", "Documentul nu există");
  return row;
}

/** Următorul număr de ofertă pe anul curent: `OF-AAAA-NNN` (maximul existent + 1). */
async function nextOfferNumber(db: Db): Promise<string> {
  const prefix = `OF-${new Date().getFullYear()}-`;
  const rows = await db.select({ number: offers.number }).from(offers).where(like(offers.number, `${prefix}%`));
  let max = 0;
  for (const { number } of rows) {
    const suffix = number.slice(prefix.length);
    if (/^\d+$/.test(suffix)) max = Math.max(max, Number(suffix));
  }
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

/** Următorul număr PV pe anul curent: `PV-AAAA-NNN`. */
async function nextPvNumber(db: Db): Promise<string> {
  const prefix = `PV-${new Date().getFullYear()}-`;
  const rows = await db
    .select({ number: dossierDocuments.number })
    .from(dossierDocuments)
    .where(and(eq(dossierDocuments.type, "handover_pv"), like(dossierDocuments.number, `${prefix}%`)));
  let max = 0;
  for (const { number } of rows) {
    const suffix = number?.slice(prefix.length) ?? "";
    if (/^\d+$/.test(suffix)) max = Math.max(max, Number(suffix));
  }
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

const AMENDMENT_SUFFIX = /-AA(\d+)$/;

/** Numărul următorului act adițional al unui contract (maximul existent + 1). */
async function nextAmendmentIndex(db: Db, contractId: string): Promise<number> {
  const rows = await db
    .select({ number: offers.number })
    .from(offers)
    .where(and(eq(offers.contractId, contractId), eq(offers.kind, "amendment")));
  let max = 0;
  for (const { number } of rows) {
    const match = AMENDMENT_SUFFIX.exec(number);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return max + 1;
}

/** Snapshot-ul unei oferte: din datele curente (ciornă) sau cu data acceptării. */
async function buildSnapshot(db: Db, offer: OfferRow, acceptedAt: Date | null): Promise<OfferSnapshot> {
  const client = await findClient(db, offer.clientId);
  const provider = await loadProvider(db);
  return {
    offer: { id: offer.id, number: offer.number, date: offer.date, version: offer.version, kind: offer.kind, title: offer.title },
    config: offer.data,
    totals: computeTotals(offer.data),
    client: clientValues(client),
    provider,
    acceptedAt: acceptedAt ? acceptedAt.toISOString() : null,
  };
}

/** Configurația acceptată în vigoare pentru un contract: cea mai recent acceptată ofertă a lui. */
async function currentInForce(db: Db, offer: OfferRow): Promise<OfferRow> {
  if (!offer.contractId) {
    if (offer.status !== "accepted") throw new HttpError(409, "conflict", "Oferta nu este acceptată");
    return offer;
  }
  const [row] = await db
    .select()
    .from(offers)
    .where(and(eq(offers.contractId, offer.contractId), eq(offers.status, "accepted")))
    .orderBy(desc(offers.acceptedAt), desc(offers.createdAt))
    .limit(1);
  if (!row) throw new HttpError(409, "conflict", "Oferta nu este acceptată");
  return row;
}

function requireAcceptedSnapshot(offer: OfferRow): OfferSnapshot {
  if (offer.status !== "accepted" || !offer.acceptedSnapshot) {
    throw new HttpError(409, "conflict", "Oferta trebuie să fie acceptată");
  }
  return offer.acceptedSnapshot;
}

const MONEDA: Record<Currency, string> = { EUR: "euro", RON: "lei", USD: "USD" };

const fmtPercent = (n: number): string => (Number.isInteger(n) ? String(n) : String(n).replace(".", ","));

/** Valorile precompletate pentru generatorul de contracte, din snapshot-ul ofertei. */
function contractData(snapshot: OfferSnapshot, contractNumber: string, offerTitle: string): Record<string, string> {
  const { config, totals } = snapshot;
  const today = todayIso();
  const lines = contractedLines(config.lines);
  const net = totals.net / 100;

  const recurring = lines
    .filter((l) => l.status !== "included" && l.billing !== "one_time")
    .map((l) => {
      const a = lineAmounts(l, config.lines);
      const per = l.billing === "monthly" ? "lună" : "an";
      const unit = l.billing === "monthly" ? (a.periods === 1 ? "lună" : "luni") : a.periods === 1 ? "an" : "ani";
      return `${l.name} – ${formatMoney(a.net, config.currency)}/${per}, ${a.periods} ${unit}`;
    });

  const clientDirect = config.lines
    .filter((l) => l.status === "client_direct")
    .map((l) => `${l.name}: Beneficiar direct (${formatMoney(lineAmounts(l, config.lines).total, config.currency)})`);

  const data: Record<string, string> = {
    ...snapshot.client,
    ...snapshot.provider,
    nr: contractNumber,
    data: today,
    cmdNr: "1",
    cmdData: today,
    proiect: config.projectName || offerTitle,
    tip: "",
    spec: lines.map((l) => (l.description ? `${l.name} – ${shortOf(l.description)}` : l.name)).join("\n"),
    livrabile: lines.filter((l) => l.deliverables.trim())
      .slice(0, 1)
      .map(() => "Conform Anexei nr. 1.1 – Servicii și deviz (secțiunea „Livrabile și criterii de recepție”), parte integrantă din prezenta Comandă.")
      .join("\n"),
    pret: Number.isInteger(net) ? String(net) : net.toFixed(2),
    moneda: MONEDA[config.currency],
    plati: config.installments.map((i) => `${fmtPercent(i.percent)}% ${i.due}`.trim()).join("; "),
    etape: config.stages.map((s) => `${s.name}${s.term ? ` – ${s.term}` : ""} (${s.firm ? "ferm" : "estimativ"})`).join("\n"),
    mentenanta: recurring.join("\n"),
    terti: clientDirect.join("\n"),
    inc1: "1",
    inc2: "1",
    inc3: "1",
  };
  return data;
}

const listFields = {
  id: offers.id,
  number: offers.number,
  kind: offers.kind,
  status: offers.status,
  title: offers.title,
  netTotal: offers.netTotal,
  currency: offers.currency,
  date: offers.date,
  version: offers.version,
  clientId: offers.clientId,
  projectId: offers.projectId,
  contractId: offers.contractId,
  parentOfferId: offers.parentOfferId,
  sentAt: offers.sentAt,
  acceptedAt: offers.acceptedAt,
  createdAt: offers.createdAt,
  updatedAt: offers.updatedAt,
  clientName: clients.companyName,
};

/** Rândurile din dosar, fără snapshot (care poate fi mare). */
const dossierListFields = {
  id: dossierDocuments.id,
  type: dossierDocuments.type,
  number: dossierDocuments.number,
  offerId: dossierDocuments.offerId,
  contractId: dossierDocuments.contractId,
  clientId: dossierDocuments.clientId,
  date: dossierDocuments.date,
  data: dossierDocuments.data,
  version: dossierDocuments.version,
  status: dossierDocuments.status,
  documentId: dossierDocuments.documentId,
  createdAt: dossierDocuments.createdAt,
  updatedAt: dossierDocuments.updatedAt,
};

const DOCUMENT_TYPE_OF: Record<DossierDocType, "Commercial Offers" | "Contracts" | "Delivery Reports"> = {
  offer: "Commercial Offers",
  contract: "Contracts",
  services_annex: "Contracts",
  schedule_annex: "Contracts",
  handover_pv: "Delivery Reports",
  amendment: "Contracts",
  maintenance_annex: "Contracts",
  summary: "Contracts",
};

export function offersRouter(): Router {
  const router = Router();

  // --- Oferte ---
  router.get("/offers/next-number", requirePermission("documents.view"), async (req, res) => {
    res.json({ number: await nextOfferNumber(req.ctx.db) });
  });

  router.get("/offers", requirePermission("documents.view"), async (req, res) => {
    const db = req.ctx.db;
    const query = parse(listQuery, req.query);

    const conditions: (SQL | undefined)[] = [];
    if (query.clientId) conditions.push(eq(offers.clientId, query.clientId));
    if (query.status) conditions.push(eq(offers.status, query.status));
    if (query.kind) conditions.push(eq(offers.kind, query.kind));
    if (query.q) {
      const pattern = `%${query.q.replace(/[\\%_]/g, "\\$&")}%`;
      conditions.push(or(ilike(offers.number, pattern), ilike(offers.title, pattern), ilike(clients.companyName, pattern)));
    }
    const where = and(...conditions);

    const [counted] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(offers)
      .innerJoin(clients, eq(clients.id, offers.clientId))
      .where(where);
    const items = await db
      .select(listFields)
      .from(offers)
      .innerJoin(clients, eq(clients.id, offers.clientId))
      .where(where)
      .orderBy(desc(offers.date), desc(offers.createdAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);
    res.json(paged(items, counted?.total ?? 0, query));
  });

  /** Oferta cu numele clientului și numerele ofertei-părinte și contractului. */
  async function detail(db: Db, offer: OfferRow) {
    const [client] = await db.select({ id: clients.id, name: clients.companyName }).from(clients).where(eq(clients.id, offer.clientId)).limit(1);
    const parent = offer.parentOfferId
      ? ((await db.select({ id: offers.id, number: offers.number }).from(offers).where(eq(offers.id, offer.parentOfferId)).limit(1))[0] ?? null)
      : null;
    const contract = offer.contractId
      ? ((await db.select({ id: contracts.id, number: contracts.number }).from(contracts).where(eq(contracts.id, offer.contractId)).limit(1))[0] ?? null)
      : null;
    return { ...offer, client: client ?? null, parent, contract };
  }

  router.get("/offers/:id", requirePermission("documents.view"), async (req, res) => {
    const db = req.ctx.db;
    const { id } = parse(idSchema, req.params);
    res.json({ item: await detail(db, await findOffer(db, id)) });
  });

  router.post("/offers", requirePermission("documents.create"), async (req, res) => {
    const db = req.ctx.db;
    const input = parse(createSchema, req.body);
    await findClient(db, input.clientId);
    await assertProjectOfClient(db, input.projectId, input.clientId);

    const totals = computeTotals(input.data);
    const userId = req.auth?.user.id ?? null;
    let id = "";
    for (let attempt = 0; attempt < 3 && !id; attempt += 1) {
      try {
        id = await db.transaction(async (raw) => {
          const tx = raw as unknown as Db;
          const number = input.number ?? (await nextOfferNumber(tx));
          const [row] = await tx
            .insert(offers)
            .values({
              number,
              kind: "offer",
              clientId: input.clientId,
              projectId: input.projectId ?? null,
              status: "draft",
              date: input.date,
              title: input.title ?? "",
              currency: input.data.currency,
              netTotal: totals.net,
              data: input.data,
              totals,
              version: 1,
            })
            .returning({ id: offers.id });
          await tx.insert(offerVersions).values({
            offerId: row!.id,
            version: 1,
            status: "draft",
            data: input.data,
            totals,
            createdBy: userId,
          });
          return row!.id;
        });
      } catch (error) {
        if (pgCode(error) === "23505") {
          if (input.number) throw new HttpError(409, "conflict", "Există deja o ofertă cu acest număr");
          continue;
        }
        if (pgCode(error) === "23503") throw new HttpError(409, "conflict", "Clientul sau proiectul nu există");
        throw error;
      }
    }
    if (!id) throw new HttpError(409, "conflict", "Numărul ofertei nu a putut fi alocat");
    const created = await findOffer(db, id);
    await audit(req, "offer_created", "offer", id, { number: created.number, net: totals.net });
    res.status(201).json({ item: await detail(db, created) });
  });

  router.put("/offers/:id", requirePermission("documents.update"), async (req, res) => {
    const db = req.ctx.db;
    const { id } = parse(idSchema, req.params);
    const input = parse(updateSchema, req.body);
    const before = await findOffer(db, id);
    if (before.status !== "draft" && before.status !== "sent") {
      throw new HttpError(409, "conflict", "Oferta acceptată nu se mai modifică. Creează un act adițional.");
    }
    if (input.projectId !== undefined) await assertProjectOfClient(db, input.projectId, before.clientId);
    if (input.data && before.parentOfferId && input.data.currency !== before.currency) {
      throw new HttpError(409, "conflict", "Moneda unui act adițional nu se poate schimba");
    }

    const data = input.data ?? before.data;
    const totals = computeTotals(data);
    const version = before.version + 1;
    await db.transaction(async (raw) => {
      const tx = raw as unknown as Db;
      const updated = await tx
        .update(offers)
        .set({
          projectId: input.projectId === undefined ? before.projectId : input.projectId,
          title: input.title ?? before.title,
          date: input.date ?? before.date,
          currency: data.currency,
          netTotal: totals.net,
          data,
          totals,
          version,
          updatedAt: new Date(),
        })
        .where(and(eq(offers.id, id), inArray(offers.status, ["draft", "sent"]), eq(offers.version, before.version)))
        .returning({ id: offers.id });
      if (updated.length === 0) {
        throw new HttpError(409, "conflict", "Oferta a fost modificată sau acceptată între timp. Reîncarcă și încearcă din nou.");
      }
      await tx.insert(offerVersions).values({
        offerId: id,
        version,
        status: before.status,
        data,
        totals,
        createdBy: req.auth?.user.id ?? null,
      });
    });
    await audit(req, "offer_updated", "offer", id, { number: before.number, version, net: totals.net });
    res.json({ item: await detail(db, await findOffer(db, id)) });
  });

  router.get("/offers/:id/versions", requirePermission("documents.view"), async (req, res) => {
    const db = req.ctx.db;
    const { id } = parse(idSchema, req.params);
    await findOffer(db, id);
    const items = await db
      .select({
        id: offerVersions.id,
        version: offerVersions.version,
        status: offerVersions.status,
        totals: offerVersions.totals,
        createdAt: offerVersions.createdAt,
        createdBy: offerVersions.createdBy,
      })
      .from(offerVersions)
      .where(eq(offerVersions.offerId, id))
      .orderBy(desc(offerVersions.version));
    res.json({ items });
  });

  router.get("/offers/:id/versions/:version", requirePermission("documents.view"), async (req, res) => {
    const db = req.ctx.db;
    const { id, version } = parse(versionParams, req.params);
    const [item] = await db
      .select()
      .from(offerVersions)
      .where(and(eq(offerVersions.offerId, id), eq(offerVersions.version, version)))
      .limit(1);
    if (!item) throw new HttpError(404, "not_found", "Versiunea nu există");
    res.json({ item });
  });

  router.post("/offers/:id/status", requirePermission("documents.update"), async (req, res) => {
    const db = req.ctx.db;
    const { id } = parse(idSchema, req.params);
    const { status } = parse(statusSchema, req.body);
    const before = await findOffer(db, id);
    if (before.status === "accepted") {
      throw new HttpError(409, "conflict", "Oferta acceptată nu își mai schimbă starea.");
    }
    const changed = await db
      .update(offers)
      .set({ status, sentAt: status === "sent" ? new Date() : before.sentAt, updatedAt: new Date() })
      .where(and(eq(offers.id, id), ne(offers.status, "accepted")))
      .returning({ id: offers.id });
    if (changed.length === 0) {
      throw new HttpError(409, "conflict", "Oferta a fost acceptată între timp și nu își mai schimbă starea.");
    }
    await audit(req, "offer_status_changed", "offer", id, { number: before.number, from: before.status, to: status });
    res.json({ item: await detail(db, await findOffer(db, id)) });
  });

  router.post("/offers/:id/accept", requirePermission("documents.update"), async (req, res) => {
    const db = req.ctx.db;
    const { id } = parse(idSchema, req.params);
    const before = await findOffer(db, id);
    if (before.status !== "draft" && before.status !== "sent") {
      throw new HttpError(409, "conflict", "Doar o ofertă ciornă sau trimisă poate fi acceptată");
    }
    if (contractedLines(before.data.lines).length === 0) {
      throw new HttpError(409, "conflict", "Oferta nu are nicio linie contractată (acceptată sau inclusă într-un pachet)");
    }
    const installments = before.data.installments;
    if (installments.length > 0) {
      const sum = installments.reduce((acc, i) => acc + i.percent, 0);
      if (Math.abs(sum - 100) > 0.001) {
        throw new HttpError(422, "validation_error", "Date invalide", { installments: "Suma procentelor tranșelor trebuie să fie 100" });
      }
    }

    if (before.kind === "amendment") {
      const inForce = before.contractId ? await currentInForce(db, before) : null;
      if (!inForce || before.parentOfferId !== inForce.id) {
        throw new HttpError(409, "conflict", "Actul adițional a fost creat pe o versiune care nu mai e în vigoare. Creează unul nou.");
      }
    }

    const acceptedAt = new Date();
    const snapshot = await buildSnapshot(db, before, acceptedAt);
    const accepted = await db
      .update(offers)
      .set({ status: "accepted", acceptedAt, acceptedSnapshot: snapshot, totals: snapshot.totals, netTotal: snapshot.totals.net, updatedAt: acceptedAt })
      .where(and(eq(offers.id, id), inArray(offers.status, ["draft", "sent"]), eq(offers.version, before.version)))
      .returning({ id: offers.id });
    if (accepted.length === 0) {
      throw new HttpError(409, "conflict", "Oferta a fost modificată sau acceptată între timp. Reîncarcă și încearcă din nou.");
    }
    await audit(req, "offer_accepted", "offer", id, { number: before.number, net: snapshot.totals.net });
    res.json({ item: await detail(db, await findOffer(db, id)) });
  });

  router.get("/offers/:id/current", requirePermission("documents.view"), async (req, res) => {
    const db = req.ctx.db;
    const { id } = parse(idSchema, req.params);
    const current = await currentInForce(db, await findOffer(db, id));
    res.json({ item: await detail(db, current) });
  });

  router.post("/offers/:id/amendments", requirePermission("documents.create"), async (req, res) => {
    const db = req.ctx.db;
    const { id } = parse(idSchema, req.params);
    const offer = await findOffer(db, id);
    if (offer.status !== "accepted" || !offer.contractId) {
      throw new HttpError(409, "conflict", "Actul adițional se creează doar pe o ofertă acceptată și legată de un contract");
    }
    const [open] = await db
      .select({ number: offers.number })
      .from(offers)
      .where(and(eq(offers.contractId, offer.contractId), eq(offers.kind, "amendment"), inArray(offers.status, ["draft", "sent"])))
      .limit(1);
    if (open) {
      throw new HttpError(
        409,
        "conflict",
        `Există deja un act adițional în lucru pentru acest contract (nr. ${open.number}). Finalizează-l sau marchează-l respins.`,
      );
    }
    const base = await currentInForce(db, offer);
    const snapshot = requireAcceptedSnapshot(base);
    const [contract] = await db.select({ number: contracts.number }).from(contracts).where(eq(contracts.id, offer.contractId)).limit(1);
    if (!contract) throw new HttpError(409, "conflict", "Contractul nu există");
    const contractNumber = contract.number ?? offer.number;

    const config = structuredClone(snapshot.config) as OfferConfig;
    const totals = computeTotals(config);
    const userId = req.auth?.user.id ?? null;

    let createdId = "";
    for (let attempt = 0; attempt < 3 && !createdId; attempt += 1) {
      try {
        createdId = await db.transaction(async (raw) => {
          const tx = raw as unknown as Db;
          const n = await nextAmendmentIndex(tx, offer.contractId!);
          const [row] = await tx
            .insert(offers)
            .values({
              number: `${contractNumber}-AA${n}`,
              kind: "amendment",
              parentOfferId: base.id,
              contractId: offer.contractId,
              clientId: offer.clientId,
              projectId: offer.projectId,
              status: "draft",
              date: todayIso(),
              title: `Act adițional nr. ${n}${offer.title ? ` – ${offer.title}` : ""}`,
              currency: config.currency,
              netTotal: totals.net,
              data: config,
              totals,
              version: 1,
            })
            .returning({ id: offers.id });
          await tx.insert(offerVersions).values({ offerId: row!.id, version: 1, status: "draft", data: config, totals, createdBy: userId });
          return row!.id;
        });
      } catch (error) {
        if (pgCode(error) === "23505") continue;
        throw error;
      }
    }
    if (!createdId) throw new HttpError(409, "conflict", "Numărul actului adițional nu a putut fi alocat");
    const created = await findOffer(db, createdId);
    await audit(req, "offer_amendment_created", "offer", createdId, { number: created.number, parent: base.number });
    res.status(201).json({ item: await detail(db, created) });
  });

  router.post("/offers/:id/contract", requirePermission("documents.create"), async (req, res) => {
    const db = req.ctx.db;
    const { id } = parse(idSchema, req.params);
    const offer = await findOffer(db, id);
    const snapshot = requireAcceptedSnapshot(offer);

    if (offer.contractId) {
      const [existing] = await db.select().from(contracts).where(eq(contracts.id, offer.contractId)).limit(1);
      if (existing) {
        res.json({ item: existing, created: false });
        return;
      }
    }

    let contractId = "";
    for (let attempt = 0; attempt < 3 && !contractId; attempt += 1) {
      try {
        contractId = await db.transaction(async (raw) => {
          const tx = raw as unknown as Db;
          const number = await nextContractNumber(tx);
          const [row] = await tx
            .insert(contracts)
            .values({
              clientId: offer.clientId,
              projectId: offer.projectId,
              offerId: offer.id,
              title: `Contract-cadru nr. ${number}`,
              number,
              kind: "generated",
              data: contractData(snapshot, number, offer.title),
              value: snapshot.totals.net,
              currency: snapshot.config.currency,
              status: "draft",
            })
            .returning({ id: contracts.id });
          await tx.update(offers).set({ contractId: row!.id, updatedAt: new Date() }).where(eq(offers.id, offer.id));
          return row!.id;
        });
      } catch (error) {
        if (pgCode(error) === "23505") continue;
        throw error;
      }
    }
    if (!contractId) throw new HttpError(409, "conflict", "Numărul contractului nu a putut fi alocat");
    const [item] = await db.select().from(contracts).where(eq(contracts.id, contractId)).limit(1);
    await audit(req, "contract_created", "contract", contractId, { number: item?.number, kind: "generated", offer: offer.number });
    res.status(201).json({ item, created: true });
  });

  router.delete("/offers/:id", requirePermission("documents.delete"), async (req, res) => {
    const db = req.ctx.db;
    const { id } = parse(idSchema, req.params);
    const before = await findOffer(db, id);
    if (before.status === "accepted") throw new HttpError(409, "conflict", "Oferta acceptată nu se șterge.");
    if (before.status !== "draft") throw new HttpError(409, "conflict", "Se șterg doar ofertele ciornă.");
    const [docs] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(dossierDocuments)
      .where(eq(dossierDocuments.offerId, id));
    if ((docs?.total ?? 0) > 0) {
      throw new HttpError(409, "conflict", "Oferta are documente generate în dosar. Șterge întâi documentele.");
    }
    await db.delete(offers).where(eq(offers.id, id));
    await audit(req, "offer_deleted", "offer", id, { number: before.number });
    res.status(204).end();
  });

  // --- Dosar ---
  router.get("/offers/:id/documents", requirePermission("documents.view"), async (req, res) => {
    const db = req.ctx.db;
    const { id } = parse(idSchema, req.params);
    await findOffer(db, id);
    const items = await db
      .select(dossierListFields)
      .from(dossierDocuments)
      .where(eq(dossierDocuments.offerId, id))
      .orderBy(desc(dossierDocuments.createdAt), desc(dossierDocuments.version));
    res.json({ items });
  });

  router.post("/offers/:id/documents", requirePermission("documents.create"), async (req, res) => {
    const db = req.ctx.db;
    const { id } = parse(idSchema, req.params);
    const input = parse(createDocumentSchema, req.body);
    if (input.type === "contract") {
      throw new HttpError(422, "validation_error", "Contractul se generează din «Generează contract».", {
        type: "Contractul se generează din «Generează contract».",
      });
    }
    const offer = await findOffer(db, id);

    let snapshot: DossierRow["snapshot"];
    let number: string | null;
    let contractNumber: string | null = null;
    if (offer.contractId) {
      const [c] = await db.select({ number: contracts.number }).from(contracts).where(eq(contracts.id, offer.contractId)).limit(1);
      contractNumber = c?.number ?? null;
    }

    if (input.type === "offer") {
      snapshot = offer.status === "accepted" && offer.acceptedSnapshot ? offer.acceptedSnapshot : await buildSnapshot(db, offer, null);
      number = offer.number;
    } else {
      const accepted = requireAcceptedSnapshot(offer);
      if (input.type === "amendment") {
        if (offer.kind !== "amendment") {
          throw new HttpError(409, "conflict", "Actul adițional se generează din oferta de tip act adițional");
        }
        const acceptedAt = offer.acceptedAt ?? new Date(accepted.acceptedAt ?? Date.now());
        let previous: OfferRow | undefined;
        if (offer.contractId) {
          const candidates = await db
            .select()
            .from(offers)
            .where(and(eq(offers.contractId, offer.contractId), eq(offers.status, "accepted")))
            .orderBy(desc(offers.acceptedAt), desc(offers.createdAt));
          previous = candidates.find((o) => o.id !== offer.id && o.acceptedAt && o.acceptedAt <= acceptedAt);
        }
        if (!previous && offer.parentOfferId) previous = await findOffer(db, offer.parentOfferId);
        if (!previous || !previous.acceptedSnapshot) {
          throw new HttpError(409, "conflict", "Nu există o configurație acceptată anterioară pentru comparație");
        }
        snapshot = { before: previous.acceptedSnapshot, after: accepted };
        number = AMENDMENT_SUFFIX.exec(offer.number)?.[1] ?? offer.number;
      } else {
        snapshot = accepted;
        number = input.type === "handover_pv" ? null : contractNumber;
        if (input.type === "maintenance_annex" && !contractedLines(accepted.config.lines).some((l) => l.billing !== "one_time")) {
          throw new HttpError(409, "conflict", "Oferta nu conține servicii recurente contractate (mentenanță, abonamente)");
        }
      }
    }

    const userDate = input.date ?? todayIso();
    let created: DossierRow | undefined;
    for (let attempt = 0; attempt < 3 && !created; attempt += 1) {
      try {
        created = await db.transaction(async (raw) => {
          const tx = raw as unknown as Db;
          const [last] = await tx
            .select({ version: dossierDocuments.version, number: dossierDocuments.number })
            .from(dossierDocuments)
            .where(and(eq(dossierDocuments.offerId, offer.id), eq(dossierDocuments.type, input.type)))
            .orderBy(desc(dossierDocuments.version))
            .limit(1);
          let docNumber = number;
          if (input.type === "handover_pv") docNumber = last?.number ?? (await nextPvNumber(tx));
          const [row] = await tx
            .insert(dossierDocuments)
            .values({
              type: input.type,
              number: docNumber,
              offerId: offer.id,
              contractId: offer.contractId,
              clientId: offer.clientId,
              date: userDate,
              data: input.data ?? {},
              snapshot,
              version: (last?.version ?? 0) + 1,
              status: "draft",
            })
            .returning();
          return row!;
        });
      } catch (error) {
        if (pgCode(error) === "23505") continue;
        throw error;
      }
    }
    if (!created) throw new HttpError(409, "conflict", "Documentul nu a putut fi creat, încearcă din nou");
    await audit(req, "dossier_document_created", "dossier_document", created.id, {
      type: created.type,
      number: created.number,
      version: created.version,
      offer: offer.number,
    });
    res.status(201).json({ item: created });
  });

  router.get("/documents/:id", requirePermission("documents.view"), async (req, res) => {
    const { id } = parse(idSchema, req.params);
    res.json({ item: await findDossierDoc(req.ctx.db, id) });
  });

  router.put("/documents/:id", requirePermission("documents.update"), async (req, res) => {
    const db = req.ctx.db;
    const { id } = parse(idSchema, req.params);
    const input = parse(updateDocumentSchema, req.body);
    const before = await findDossierDoc(db, id);
    if (before.status === "final") {
      if (input.data !== undefined || input.date !== undefined) {
        throw new HttpError(409, "conflict", "Document final – trece-l în ciornă ca să-l modifici.");
      }
      if (input.status === "draft" && before.documentId) {
        throw new HttpError(409, "conflict", "Documentul final este deja arhivat și nu mai poate reveni în ciornă.");
      }
    }
    await db
      .update(dossierDocuments)
      .set({
        data: input.data ?? before.data,
        date: input.date ?? before.date,
        status: input.status ?? before.status,
        updatedAt: new Date(),
      })
      .where(eq(dossierDocuments.id, id));
    await audit(req, "dossier_document_updated", "dossier_document", id, {
      type: before.type,
      number: before.number,
      status: input.status ?? before.status,
    });
    res.json({ item: await findDossierDoc(db, id) });
  });

  router.delete("/documents/:id", requirePermission("documents.delete"), async (req, res) => {
    const db = req.ctx.db;
    const { id } = parse(idSchema, req.params);
    const before = await findDossierDoc(db, id);
    if (before.status !== "draft") throw new HttpError(409, "conflict", "Se șterg doar documentele ciornă.");
    await db.delete(dossierDocuments).where(eq(dossierDocuments.id, id));
    await audit(req, "dossier_document_deleted", "dossier_document", id, { type: before.type, number: before.number });
    res.status(204).end();
  });

  // PDF-ul vine în base64, deci depășește limita globală de 1 MB (vezi `server/app.ts`).
  router.post(
    "/documents/:id/archive",
    requirePermission("documents.update"),
    express.json({ limit: "40mb" }),
    async (req, res) => {
      const db = req.ctx.db;
      const { id } = parse(idSchema, req.params);
      const input = parse(archiveSchema, req.body);
      const doc = await findDossierDoc(db, id);

      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(input.pdfBase64)) {
        throw new HttpError(422, "validation_error", "Date invalide", { pdfBase64: "PDF invalid (base64)" });
      }
      const data = Buffer.from(input.pdfBase64, "base64");
      if (data.length > MAX_PDF_BYTES) throw new HttpError(413, "too_large", "PDF-ul este prea mare");
      assertAllowedFile("application/pdf", data);

      const [offer] = await db.select({ projectId: offers.projectId, number: offers.number }).from(offers).where(eq(offers.id, doc.offerId)).limit(1);
      const name = input.filename.endsWith(".pdf") ? input.filename : `${input.filename}.pdf`;

      // Document existent (dacă a fost arhivat înainte și nu a fost șters) → versiune nouă; altfel document nou.
      let documentId: string | null = null;
      if (doc.documentId) {
        const [existing] = await db.select({ id: documents.id, deletedAt: documents.deletedAt }).from(documents).where(eq(documents.id, doc.documentId)).limit(1);
        if (existing && !existing.deletedAt) documentId = existing.id;
      }

      const storageKey = randomUUID();
      await putFile(req.ctx.env, storageKey, data);

      const result = await db.transaction(async (raw) => {
        const tx = raw as unknown as Db;
        let docId = documentId;
        if (!docId) {
          const [row] = await tx
            .insert(documents)
            .values({
              name,
              type: DOCUMENT_TYPE_OF[doc.type],
              clientId: doc.clientId,
              projectId: offer?.projectId ?? null,
              notes: `Generat din dosarul ofertei ${offer?.number ?? ""}: ${DOSSIER_DOC_LABELS[doc.type]}${doc.number ? ` (${doc.number})` : ""}`,
            })
            .returning({ id: documents.id });
          docId = row!.id;
        }
        const [last] = await tx
          .select({ version: documentVersions.version })
          .from(documentVersions)
          .where(eq(documentVersions.documentId, docId))
          .orderBy(desc(documentVersions.version))
          .limit(1);
        const [version] = await tx
          .insert(documentVersions)
          .values({
            documentId: docId,
            version: (last?.version ?? 0) + 1,
            storageKey,
            mime: "application/pdf",
            size: data.length,
            sha256: createHash("sha256").update(data).digest("hex"),
            uploadedById: req.auth?.user.id ?? null,
          })
          .returning({ id: documentVersions.id, version: documentVersions.version });
        await tx.update(documents).set({ currentVersionId: version!.id, updatedAt: new Date() }).where(eq(documents.id, docId));
        await tx.update(dossierDocuments).set({ documentId: docId, updatedAt: new Date() }).where(eq(dossierDocuments.id, doc.id));
        return { documentId: docId, version: version!.version };
      });

      await audit(req, "dossier_document_archived", "dossier_document", doc.id, {
        type: doc.type,
        number: doc.number,
        documentId: result.documentId,
        version: result.version,
        size: data.length,
      });
      res.status(201).json({ item: await findDossierDoc(db, doc.id), document: { id: result.documentId, name, version: result.version } });
    },
  );

  return router;
}

