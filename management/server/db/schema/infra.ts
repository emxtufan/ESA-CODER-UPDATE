import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import type {
  CredentialType,
  Currency,
  ServerProvider,
  ServerType,
  ServiceName,
} from "../../../shared/enums";

import { projects } from "./core";

const primaryId = () => uuid("id").primaryKey().defaultRandom();

const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

const softDelete = () => timestamp("deleted_at", { withTimezone: true });

/** §7 Servers. */
export const servers = pgTable(
  "servers",
  {
    id: primaryId(),
    name: text("name").notNull(),
    provider: text("provider").$type<ServerProvider>().notNull(),
    ip: text("ip"),
    os: text("os"),
    type: text("type").$type<ServerType>().notNull(),
    sshPort: integer("ssh_port"),
    sshUsername: text("ssh_username"),
    /** Referință la cheia SSH (nu conține niciodată cheia sau parola). */
    sshKeyRef: text("ssh_key_ref"),
    location: text("location"),
    cpu: text("cpu"),
    ram: text("ram"),
    disk: text("disk"),
    status: text("status"),
    purchaseDate: date("purchase_date"),
    renewalDate: date("renewal_date"),
    /** Cost lunar în minor units + moneda. */
    monthlyCost: integer("monthly_cost"),
    currency: text("currency").$type<Currency>(),
    notes: text("notes"),
    deletedAt: softDelete(),
    ...timestamps(),
  },
  (t) => [
    index("servers_name_idx").on(t.name),
    index("servers_ip_idx").on(t.ip),
    index("servers_provider_idx").on(t.provider),
    index("servers_type_idx").on(t.type),
    index("servers_status_idx").on(t.status),
    index("servers_renewal_date_idx").on(t.renewalDate),
  ],
);

/** M:N server ↔ proiect. */
export const projectServers = pgTable(
  "project_servers",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    serverId: uuid("server_id")
      .notNull()
      .references(() => servers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.projectId, t.serverId] }),
    index("project_servers_server_id_idx").on(t.serverId),
  ],
);

/** §7 Services instalate pe un server. */
export const serverServices = pgTable(
  "server_services",
  {
    id: primaryId(),
    serverId: uuid("server_id")
      .notNull()
      .references(() => servers.id, { onDelete: "cascade" }),
    name: text("name").$type<ServiceName>().notNull(),
    version: text("version"),
    port: integer("port"),
    status: text("status"),
    configPath: text("config_path"),
    projectId: uuid("project_id").references((): AnyPgColumn => projects.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    ...timestamps(),
  },
  (t) => [
    index("server_services_server_id_idx").on(t.serverId),
    index("server_services_project_id_idx").on(t.projectId),
    index("server_services_name_idx").on(t.name),
  ],
);

/** §7 Domains. */
export const domains = pgTable(
  "domains",
  {
    id: primaryId(),
    domain: text("domain").notNull().unique(),
    registrar: text("registrar"),
    registrationDate: date("registration_date"),
    expirationDate: date("expiration_date"),
    autoRenewal: boolean("auto_renewal").notNull().default(false),
    dnsProvider: text("dns_provider"),
    nameservers: text("nameservers").array().notNull().default(sql`'{}'::text[]`),
    projectId: uuid("project_id").references((): AnyPgColumn => projects.id, {
      onDelete: "set null",
    }),
    /** Cost de reînnoire în minor units + moneda. */
    renewalCost: integer("renewal_cost"),
    currency: text("currency").$type<Currency>(),
    status: text("status"),
    deletedAt: softDelete(),
    ...timestamps(),
  },
  (t) => [
    index("domains_project_id_idx").on(t.projectId),
    index("domains_expiration_date_idx").on(t.expirationDate),
    index("domains_status_idx").on(t.status),
    index("domains_registrar_idx").on(t.registrar),
  ],
);

/** Înregistrări DNS pentru un domeniu. */
export const dnsRecords = pgTable(
  "dns_records",
  {
    id: primaryId(),
    domainId: uuid("domain_id")
      .notNull()
      .references(() => domains.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    name: text("name").notNull(),
    value: text("value").notNull(),
    ttl: integer("ttl"),
    ...timestamps(),
  },
  (t) => [
    index("dns_records_domain_id_idx").on(t.domainId),
    index("dns_records_type_idx").on(t.type),
    index("dns_records_name_idx").on(t.name),
  ],
);

/** §7 SSL certificates. */
export const sslCertificates = pgTable(
  "ssl_certificates",
  {
    id: primaryId(),
    domainId: uuid("domain_id")
      .notNull()
      .references(() => domains.id, { onDelete: "cascade" }),
    issuer: text("issuer"),
    issueDate: date("issue_date"),
    expirationDate: date("expiration_date"),
    autoRenewal: boolean("auto_renewal").notNull().default(false),
    status: text("status"),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index("ssl_certificates_domain_id_idx").on(t.domainId),
    index("ssl_certificates_expiration_date_idx").on(t.expirationDate),
    index("ssl_certificates_status_idx").on(t.status),
  ],
);

/** §7 Hosting services. */
export const hostingServices = pgTable(
  "hosting_services",
  {
    id: primaryId(),
    provider: text("provider").notNull(),
    plan: text("plan"),
    /** Cost în minor units + moneda. */
    monthlyCost: integer("monthly_cost"),
    currency: text("currency").$type<Currency>(),
    billingCycle: text("billing_cycle"),
    nextPaymentDate: date("next_payment_date"),
    projectId: uuid("project_id").references((): AnyPgColumn => projects.id, {
      onDelete: "set null",
    }),
    paymentStatus: text("payment_status"),
    ...timestamps(),
  },
  (t) => [
    index("hosting_services_project_id_idx").on(t.projectId),
    index("hosting_services_provider_idx").on(t.provider),
    index("hosting_services_next_payment_date_idx").on(t.nextPaymentDate),
  ],
);

/**
 * §7 Vault: doar secretul criptat AES-256-GCM în `secret_enc`, niciodată plaintext.
 * `secret_enc` nu se expune în API-urile obișnuite; reveal = endpoint separat, cu audit.
 */
export const credentials = pgTable(
  "credentials",
  {
    id: primaryId(),
    name: text("name").notNull(),
    type: text("type").$type<CredentialType>().notNull(),
    projectId: uuid("project_id").references((): AnyPgColumn => projects.id, {
      onDelete: "set null",
    }),
    serverId: uuid("server_id").references((): AnyPgColumn => servers.id, {
      onDelete: "set null",
    }),
    username: text("username"),
    secretEnc: text("secret_enc").notNull(),
    url: text("url"),
    notes: text("notes"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    rotatedAt: timestamp("rotated_at", { withTimezone: true }),
    deletedAt: softDelete(),
    ...timestamps(),
  },
  (t) => [
    index("credentials_name_idx").on(t.name),
    index("credentials_type_idx").on(t.type),
    index("credentials_project_id_idx").on(t.projectId),
    index("credentials_server_id_idx").on(t.serverId),
    index("credentials_revoked_at_idx").on(t.revokedAt),
  ],
);
