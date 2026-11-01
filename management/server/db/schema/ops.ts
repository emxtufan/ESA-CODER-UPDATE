import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type {
  Currency,
  DocumentType,
  MaintenanceActivity,
  MaintenancePlan,
  NotificationEvent,
} from "../../../shared/enums";

import { users } from "./auth";
import { clients, projects } from "./core";
import { servers } from "./infra";

const primaryId = () => uuid("id").primaryKey().defaultRandom();

const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

const softDelete = () => timestamp("deleted_at", { withTimezone: true });

/** §11 Maintenance plan pe proiect. */
export const maintenancePlans = pgTable(
  "maintenance_plans",
  {
    id: primaryId(),
    projectId: uuid("project_id")
      .notNull()
      .references((): AnyPgColumn => projects.id, { onDelete: "cascade" }),
    plan: text("plan").$type<MaintenancePlan>().notNull(),
    /** Preț lunar în minor units + moneda. */
    monthlyPrice: integer("monthly_price").notNull(),
    currency: text("currency").$type<Currency>().notNull(),
    startDate: date("start_date"),
    renewalDate: date("renewal_date"),
    includedServices: text("included_services").array().notNull().default(sql`'{}'::text[]`),
    frequency: text("frequency"),
    contractStatus: text("contract_status"),
    ...timestamps(),
  },
  (t) => [
    index("maintenance_plans_project_id_idx").on(t.projectId),
    index("maintenance_plans_plan_idx").on(t.plan),
    index("maintenance_plans_renewal_date_idx").on(t.renewalDate),
    index("maintenance_plans_contract_status_idx").on(t.contractStatus),
  ],
);

/** §11 Log intervenții de mentenanță. */
export const maintenanceLogs = pgTable(
  "maintenance_logs",
  {
    id: primaryId(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => maintenancePlans.id, { onDelete: "cascade" }),
    activity: text("activity").$type<MaintenanceActivity>().notNull(),
    performedAt: timestamp("performed_at", { withTimezone: true }).notNull().defaultNow(),
    performedById: uuid("performed_by_id").references((): AnyPgColumn => users.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    ...timestamps(),
  },
  (t) => [
    index("maintenance_logs_plan_id_idx").on(t.planId),
    index("maintenance_logs_activity_idx").on(t.activity),
    index("maintenance_logs_performed_at_idx").on(t.performedAt),
    index("maintenance_logs_performed_by_id_idx").on(t.performedById),
  ],
);

/** Contracte cu clienții (documentul semnat stă în documents). */
export const contracts = pgTable(
  "contracts",
  {
    id: primaryId(),
    clientId: uuid("client_id")
      .notNull()
      .references((): AnyPgColumn => clients.id, { onDelete: "restrict" }),
    projectId: uuid("project_id").references((): AnyPgColumn => projects.id, {
      onDelete: "set null",
    }),
    documentId: uuid("document_id").references((): AnyPgColumn => documents.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    /** Valoare în minor units + moneda. */
    value: integer("value"),
    currency: text("currency").$type<Currency>(),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    status: text("status"),
    ...timestamps(),
  },
  (t) => [
    index("contracts_client_id_idx").on(t.clientId),
    index("contracts_project_id_idx").on(t.projectId),
    index("contracts_document_id_idx").on(t.documentId),
    index("contracts_status_idx").on(t.status),
    index("contracts_expires_at_idx").on(t.expiresAt),
  ],
);

/** §13 Documents — versiunea curentă e în document_versions (referință circulară). */
export const documents = pgTable(
  "documents",
  {
    id: primaryId(),
    name: text("name").notNull(),
    type: text("type").$type<DocumentType>().notNull(),
    clientId: uuid("client_id").references((): AnyPgColumn => clients.id, {
      onDelete: "set null",
    }),
    projectId: uuid("project_id").references((): AnyPgColumn => projects.id, {
      onDelete: "set null",
    }),
    uploadDate: date("upload_date").notNull().default(sql`CURRENT_DATE`),
    expirationDate: date("expiration_date"),
    notes: text("notes"),
    currentVersionId: uuid("current_version_id").references(
      (): AnyPgColumn => documentVersions.id,
      { onDelete: "set null" },
    ),
    deletedAt: softDelete(),
    ...timestamps(),
  },
  (t) => [
    index("documents_client_id_idx").on(t.clientId),
    index("documents_project_id_idx").on(t.projectId),
    index("documents_type_idx").on(t.type),
    index("documents_name_idx").on(t.name),
    index("documents_current_version_id_idx").on(t.currentVersionId),
    index("documents_expiration_date_idx").on(t.expirationDate),
  ],
);

/** Versiunile unui document: fișierul fizic e în storage, aici doar metadatele. */
export const documentVersions = pgTable(
  "document_versions",
  {
    id: primaryId(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    storageKey: text("storage_key").notNull(),
    mime: text("mime"),
    size: integer("size"),
    sha256: text("sha256"),
    uploadedById: uuid("uploaded_by_id").references((): AnyPgColumn => users.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("document_versions_document_id_version_idx").on(t.documentId, t.version),
    index("document_versions_uploaded_by_id_idx").on(t.uploadedById),
    index("document_versions_sha256_idx").on(t.sha256),
  ],
);

/** §14 Template-uri de email, unul per eveniment. */
export const emailTemplates = pgTable("email_templates", {
  id: primaryId(),
  event: text("event").$type<NotificationEvent>().notNull().unique(),
  subject: text("subject").notNull(),
  html: text("html").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  ...timestamps(),
});

/** §14 Reguli de notificare: destinatari, frecvență, retry. */
export const notificationRules = pgTable(
  "notification_rules",
  {
    id: primaryId(),
    event: text("event").$type<NotificationEvent>().notNull(),
    recipients: jsonb("recipients").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    enabled: boolean("enabled").notNull().default(true),
    frequencyMinutes: integer("frequency_minutes"),
    maxRetries: integer("max_retries"),
    ...timestamps(),
  },
  (t) => [
    index("notification_rules_event_idx").on(t.event),
    index("notification_rules_enabled_idx").on(t.enabled),
  ],
);

/** §14 Log livrare (deduplicare pe dedupe_key + recipient). */
export const notificationLogs = pgTable(
  "notification_logs",
  {
    id: primaryId(),
    event: text("event").$type<NotificationEvent>().notNull(),
    dedupeKey: text("dedupe_key").notNull(),
    recipient: text("recipient").notNull(),
    status: text("status").notNull(),
    attempts: integer("attempts").notNull().default(0),
    error: text("error"),
    payload: jsonb("payload").$type<Record<string, string>>(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("notification_logs_dedupe_key_recipient_idx").on(t.dedupeKey, t.recipient),
    index("notification_logs_event_idx").on(t.event),
    index("notification_logs_status_idx").on(t.status),
    index("notification_logs_sent_at_idx").on(t.sentAt),
  ],
);

/** Notification Center din aplicație. */
export const notifications = pgTable(
  "notifications",
  {
    id: primaryId(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body"),
    link: text("link"),
    readAt: timestamp("read_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index("notifications_user_id_idx").on(t.userId),
    index("notifications_read_at_idx").on(t.readAt),
  ],
);

/** §15 Monitoring website (fără agenți: doar HTTP/SSL/DNS). */
export const monitoringChecks = pgTable(
  "monitoring_checks",
  {
    id: primaryId(),
    projectId: uuid("project_id")
      .notNull()
      .references((): AnyPgColumn => projects.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    type: text("type").notNull(),
    intervalSeconds: integer("interval_seconds").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    lastStatus: text("last_status"),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index("monitoring_checks_project_id_idx").on(t.projectId),
    index("monitoring_checks_enabled_idx").on(t.enabled),
    index("monitoring_checks_url_idx").on(t.url),
  ],
);

/** Rezultatele verificărilor (append-only). */
export const monitoringResults = pgTable(
  "monitoring_results",
  {
    id: primaryId(),
    checkId: uuid("check_id")
      .notNull()
      .references(() => monitoringChecks.id, { onDelete: "cascade" }),
    ok: boolean("ok").notNull(),
    httpStatus: integer("http_status"),
    responseMs: integer("response_ms"),
    sslExpiresAt: timestamp("ssl_expires_at", { withTimezone: true }),
    dnsOk: boolean("dns_ok"),
    error: text("error"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("monitoring_results_check_id_idx").on(t.checkId),
    index("monitoring_results_at_idx").on(t.at),
    index("monitoring_results_ok_idx").on(t.ok),
  ],
);

/** §15 Incidents. */
export const incidents = pgTable(
  "incidents",
  {
    id: primaryId(),
    name: text("name").notNull(),
    projectId: uuid("project_id").references((): AnyPgColumn => projects.id, {
      onDelete: "set null",
    }),
    serverId: uuid("server_id").references((): AnyPgColumn => servers.id, {
      onDelete: "set null",
    }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    severity: text("severity").notNull(),
    status: text("status").notNull(),
    description: text("description"),
    resolution: text("resolution"),
    ...timestamps(),
  },
  (t) => [
    index("incidents_project_id_idx").on(t.projectId),
    index("incidents_server_id_idx").on(t.serverId),
    index("incidents_status_idx").on(t.status),
    index("incidents_severity_idx").on(t.severity),
    index("incidents_started_at_idx").on(t.startedAt),
  ],
);
