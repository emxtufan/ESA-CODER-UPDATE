/**
 * Catalog de servicii și pachete, oferte (cu versiuni) și documentele din dosarul
 * contractual. Tipurile comune client/server sunt în `shared/offers.ts`.
 */
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { Currency } from "../../../shared/enums";
import type {
  Billing,
  DossierDocType,
  LineStatus,
  OfferConfig,
  OfferKind,
  OfferSnapshot,
  OfferStatus,
  OfferTotals,
} from "../../../shared/offers";

import { users } from "./auth";
import { clients, projects } from "./core";
import { contracts, documents } from "./ops";

const primaryId = () => uuid("id").primaryKey().defaultRandom();

const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Categoriile catalogului (A–L). */
export const catalogCategories = pgTable("catalog_categories", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  /** Nota de categorie (ex. avertismente SEO, GDPR). */
  note: text("note").notNull().default(""),
  sort: integer("sort").notNull().default(0),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
});

/** Serviciile din catalog (șabloane pentru liniile de ofertă). */
export const catalogServices = pgTable(
  "catalog_services",
  {
    id: primaryId(),
    code: text("code").notNull().unique(),
    categoryCode: text("category_code")
      .notNull()
      .references(() => catalogCategories.code, { onDelete: "restrict" }),
    name: text("name").notNull(),
    shortDescription: text("short_description").notNull().default(""),
    description: text("description").notNull().default(""),
    deliverables: text("deliverables").notNull().default(""),
    acceptance: text("acceptance").notNull().default(""),
    unit: text("unit").notNull().default("serviciu"),
    defaultQuantity: numeric("default_quantity", { precision: 12, scale: 3, mode: "number" }).notNull().default(1),
    /** Preț recomandat în unități minore; null = nesetat (configurat de administrator). */
    recommendedPrice: integer("recommended_price"),
    currency: text("currency").$type<Currency>(),
    billing: text("billing").$type<Billing>().notNull().default("one_time"),
    defaultPeriods: integer("default_periods").notNull().default(1),
    defaultStatus: text("default_status")
      .$type<Extract<LineStatus, "accepted" | "optional" | "client_direct">>()
      .notNull()
      .default("accepted"),
    advanced: boolean("advanced").notNull().default(false),
    duration: text("duration").notNull().default(""),
    conditions: text("conditions").notNull().default(""),
    sort: integer("sort").notNull().default(0),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [index("catalog_services_category_idx").on(t.categoryCode), index("catalog_services_name_idx").on(t.name)],
);

/** Pachetele reutilizabile (șabloane, fără prețuri presupuse). */
export const catalogPackages = pgTable("catalog_packages", {
  id: primaryId(),
  name: text("name").notNull().unique(),
  description: text("description").notNull().default(""),
  billing: text("billing").$type<Billing>().notNull().default("one_time"),
  recommendedPrice: integer("recommended_price"),
  currency: text("currency").$type<Currency>(),
  sort: integer("sort").notNull().default(0),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps(),
});

export const catalogPackageItems = pgTable(
  "catalog_package_items",
  {
    packageId: uuid("package_id")
      .notNull()
      .references(() => catalogPackages.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => catalogServices.id, { onDelete: "restrict" }),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.packageId, t.serviceId] }), index("catalog_package_items_service_idx").on(t.serviceId)],
);

/** Oferte comerciale și amendamentele lor. */
export const offers = pgTable(
  "offers",
  {
    id: primaryId(),
    number: text("number").notNull().unique(),
    kind: text("kind").$type<OfferKind>().notNull().default("offer"),
    parentOfferId: uuid("parent_offer_id").references((): AnyPgColumn => offers.id, { onDelete: "set null" }),
    contractId: uuid("contract_id").references((): AnyPgColumn => contracts.id, { onDelete: "set null" }),
    clientId: uuid("client_id")
      .notNull()
      .references((): AnyPgColumn => clients.id, { onDelete: "restrict" }),
    projectId: uuid("project_id").references((): AnyPgColumn => projects.id, { onDelete: "set null" }),
    status: text("status").$type<OfferStatus>().notNull().default("draft"),
    date: date("date").notNull(),
    title: text("title").notNull().default(""),
    currency: text("currency").$type<Currency>().notNull(),
    /** Valoarea contractuală netă, în unități minore (copie a `totals.net`, pentru listări). */
    netTotal: integer("net_total").notNull().default(0),
    data: jsonb("data").$type<OfferConfig>().notNull(),
    totals: jsonb("totals").$type<OfferTotals>().notNull(),
    version: integer("version").notNull().default(1),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    acceptedSnapshot: jsonb("accepted_snapshot").$type<OfferSnapshot>(),
    ...timestamps(),
  },
  (t) => [
    index("offers_client_id_idx").on(t.clientId),
    index("offers_contract_id_idx").on(t.contractId),
    index("offers_parent_idx").on(t.parentOfferId),
    index("offers_status_idx").on(t.status),
  ],
);

/** Istoricul salvărilor unei oferte. */
export const offerVersions = pgTable(
  "offer_versions",
  {
    id: primaryId(),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    status: text("status").$type<OfferStatus>().notNull(),
    data: jsonb("data").$type<OfferConfig>().notNull(),
    totals: jsonb("totals").$type<OfferTotals>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid("created_by").references((): AnyPgColumn => users.id, { onDelete: "set null" }),
  },
  (t) => [uniqueIndex("offer_versions_offer_version_uq").on(t.offerId, t.version)],
);

/** Documentele generate în dosar; fiecare își păstrează snapshot-ul. */
export const dossierDocuments = pgTable(
  "dossier_documents",
  {
    id: primaryId(),
    type: text("type").$type<DossierDocType>().notNull(),
    number: text("number"),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "restrict" }),
    contractId: uuid("contract_id").references((): AnyPgColumn => contracts.id, { onDelete: "set null" }),
    clientId: uuid("client_id")
      .notNull()
      .references((): AnyPgColumn => clients.id, { onDelete: "restrict" }),
    date: date("date").notNull(),
    /** Inputuri specifice documentului (ex. rezultatele din PV). */
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    /** `OfferSnapshot`; pentru actul adițional `{ before, after }`. */
    snapshot: jsonb("snapshot").$type<OfferSnapshot | { before: OfferSnapshot; after: OfferSnapshot }>().notNull(),
    version: integer("version").notNull().default(1),
    status: text("status").$type<"draft" | "final">().notNull().default("draft"),
    documentId: uuid("document_id").references((): AnyPgColumn => documents.id, { onDelete: "set null" }),
    ...timestamps(),
  },
  (t) => [
    index("dossier_documents_offer_idx").on(t.offerId),
    index("dossier_documents_client_idx").on(t.clientId),
    index("dossier_documents_type_number_idx").on(t.type, t.number),
    // Un document nou al aceluiași tip pe aceeași ofertă primește o versiune nouă.
    uniqueIndex("dossier_documents_offer_type_version_uq").on(t.offerId, t.type, t.version),
  ],
);

/** Un document din pachetul trimis spre semnare (originalul + versiunea semnată). */
export type SignatureDoc = {
  title: string;
  htmlKey: string;
  pdfKey: string;
  sha256: string;
  signedPdfKey?: string;
  signedSha256?: string;
};

/** Cererile de semnătură electronică (link public cu token + OTP). */
export const signatureRequests = pgTable(
  "signature_requests",
  {
    id: primaryId(),
    offerId: uuid("offer_id").references((): AnyPgColumn => offers.id, { onDelete: "set null" }),
    contractId: uuid("contract_id").references((): AnyPgColumn => contracts.id, { onDelete: "set null" }),
    signerEmail: text("signer_email").notNull(),
    signerName: text("signer_name"),
    /** Hash-ul tokenului din link; tokenul în clar nu se stochează. */
    tokenHash: text("token_hash").notNull().unique(),
    status: text("status").$type<"sent" | "viewed" | "signed" | "cancelled">().notNull().default("sent"),
    /** Documentele trimise spre semnare, cu hash-urile lor. */
    docs: jsonb("docs").$type<SignatureDoc[]>().notNull(),
    otpHash: text("otp_hash"),
    otpExpiresAt: timestamp("otp_expires_at", { withTimezone: true }),
    otpAttempts: integer("otp_attempts").notNull().default(0),
    otpSentAt: timestamp("otp_sent_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    viewedAt: timestamp("viewed_at", { withTimezone: true }),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    signedName: text("signed_name"),
    signedRole: text("signed_role"),
    signedIp: text("signed_ip"),
    signedUa: text("signed_ua"),
    /** Semnătura desenată (PNG, data URL). */
    signaturePng: text("signature_png"),
    createdBy: uuid("created_by").references((): AnyPgColumn => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("signature_requests_offer_id_idx").on(t.offerId)
  ],
);
