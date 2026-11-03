import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import type {
  Currency,
  Priority,
  ProjectStatus,
  ProjectType,
  TaskStatus,
} from "../../../shared/enums";

import { users } from "./auth";
import { commits, deployments } from "./github";
import { documents } from "./ops";

const primaryId = () => uuid("id").primaryKey().defaultRandom();

const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

const softDelete = () => timestamp("deleted_at", { withTimezone: true });

/** §6 Clients. */
export const clients = pgTable(
  "clients",
  {
    id: primaryId(),
    companyName: text("company_name").notNull(),
    legalName: text("legal_name"),
    cui: text("cui"),
    regCom: text("reg_com"),
    iban: text("iban"),
    bank: text("bank"),
    vatStatus: text("vat_status"),
    country: text("country"),
    city: text("city"),
    address: text("address"),
    postalCode: text("postal_code"),
    website: text("website"),
    industry: text("industry"),
    contactPerson: text("contact_person"),
    position: text("position"),
    phone: text("phone"),
    primaryEmail: text("primary_email"),
    billingEmail: text("billing_email"),
    paymentTerms: text("payment_terms"),
    preferredCurrency: text("preferred_currency").$type<Currency>(),
    paymentMethod: text("payment_method"),
    status: text("status"),
    internalNotes: text("internal_notes"),
    isDemo: boolean("is_demo").notNull().default(false),
    deletedAt: softDelete(),
    ...timestamps(),
  },
  (t) => [
    index("clients_company_name_idx").on(t.companyName),
    index("clients_cui_idx").on(t.cui),
    index("clients_primary_email_idx").on(t.primaryEmail),
    index("clients_status_idx").on(t.status),
  ],
);

/** Contacte suplimentare pentru un client. */
export const contacts = pgTable(
  "contacts",
  {
    id: primaryId(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: text("position"),
    email: text("email"),
    phone: text("phone"),
    notes: text("notes"),
    ...timestamps(),
  },
  (t) => [
    index("contacts_client_id_idx").on(t.clientId),
    index("contacts_email_idx").on(t.email),
  ],
);

/** §5 Projects — entitatea centrală. */
export const projects = pgTable(
  "projects",
  {
    id: primaryId(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    description: text("description"),
    type: text("type").$type<ProjectType>().notNull(),
    websiteUrl: text("website_url"),
    adminUrl: text("admin_url"),
    status: text("status").$type<ProjectStatus>().notNull(),
    priority: text("priority").$type<Priority>().notNull(),
    startDate: date("start_date"),
    deadline: date("deadline"),
    deliveryDate: date("delivery_date"),
    /** Valoare contract în minor units + moneda ei. */
    contractValue: integer("contract_value"),
    currency: text("currency").$type<Currency>(),
    maintenanceStatus: text("maintenance_status"),
    internalNotes: text("internal_notes"),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    isDemo: boolean("is_demo").notNull().default(false),
    deletedAt: softDelete(),
    ...timestamps(),
  },
  (t) => [
    index("projects_client_id_idx").on(t.clientId),
    index("projects_name_idx").on(t.name),
    index("projects_status_idx").on(t.status),
    index("projects_type_idx").on(t.type),
    index("projects_priority_idx").on(t.priority),
    index("projects_deadline_idx").on(t.deadline),
  ],
);

/** Proiecte favorite per utilizator. */
export const projectFavorites = pgTable(
  "project_favorites",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references((): AnyPgColumn => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.projectId, t.userId] }),
    index("project_favorites_user_id_idx").on(t.userId),
  ],
);

/** §10 Tasks (kanban/listă/calendar). */
export const tasks = pgTable(
  "tasks",
  {
    id: primaryId(),
    title: text("title").notNull(),
    description: text("description"),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    priority: text("priority").$type<Priority>().notNull(),
    status: text("status").$type<TaskStatus>().notNull(),
    due: timestamp("due", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    estimatedHours: numeric("estimated_hours", { precision: 6, scale: 2 }),
    actualHours: numeric("actual_hours", { precision: 6, scale: 2 }),
    isDemo: boolean("is_demo").notNull().default(false),
    deletedAt: softDelete(),
    ...timestamps(),
  },
  (t) => [
    index("tasks_project_id_idx").on(t.projectId),
    index("tasks_client_id_idx").on(t.clientId),
    index("tasks_status_idx").on(t.status),
    index("tasks_priority_idx").on(t.priority),
    index("tasks_due_idx").on(t.due),
    index("tasks_title_idx").on(t.title),
  ],
);

/** Dependențe între taskuri (task → task de care depinde). */
export const taskDependencies = pgTable(
  "task_dependencies",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    dependsOnTaskId: uuid("depends_on_task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.taskId, t.dependsOnTaskId] }),
    index("task_dependencies_depends_on_task_id_idx").on(t.dependsOnTaskId),
  ],
);

/** Comentarii polimorfe (entity_type/entity_id). */
export const comments = pgTable(
  "comments",
  {
    id: primaryId(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    authorId: uuid("author_id").references((): AnyPgColumn => users.id, {
      onDelete: "set null",
    }),
    body: text("body").notNull(),
    ...timestamps(),
  },
  (t) => [
    index("comments_entity_idx").on(t.entityType, t.entityId),
    index("comments_author_id_idx").on(t.authorId),
  ],
);

/** Atașamente polimorfe: leagă o entitate de o versiune de document din storage. */
export const attachments = pgTable(
  "attachments",
  {
    id: primaryId(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    documentId: uuid("document_id")
      .notNull()
      .references((): AnyPgColumn => documents.id, { onDelete: "cascade" }),
    ...timestamps(),
  },
  (t) => [
    index("attachments_entity_idx").on(t.entityType, t.entityId),
    index("attachments_document_id_idx").on(t.documentId),
  ],
);

/** §10 Observations — conversie posibilă în task. */
export const observations = pgTable(
  "observations",
  {
    id: primaryId(),
    title: text("title").notNull(),
    description: text("description"),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references((): AnyPgColumn => users.id, {
      onDelete: "set null",
    }),
    date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
    priority: text("priority").$type<Priority>().notNull(),
    status: text("status"),
    convertedTaskId: uuid("converted_task_id").references((): AnyPgColumn => tasks.id, {
      onDelete: "set null",
    }),
    deletedAt: softDelete(),
    ...timestamps(),
  },
  (t) => [
    index("observations_project_id_idx").on(t.projectId),
    index("observations_author_id_idx").on(t.authorId),
    index("observations_status_idx").on(t.status),
    index("observations_converted_task_id_idx").on(t.convertedTaskId),
  ],
);

/** Manual Update Log (§10) — text legat de commit/deployment/task. */
export const projectUpdates = pgTable(
  "project_updates",
  {
    id: primaryId(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    commitId: uuid("commit_id").references((): AnyPgColumn => commits.id, {
      onDelete: "set null",
    }),
    deploymentId: uuid("deployment_id").references((): AnyPgColumn => deployments.id, {
      onDelete: "set null",
    }),
    taskId: uuid("task_id").references((): AnyPgColumn => tasks.id, { onDelete: "set null" }),
    ...timestamps(),
  },
  (t) => [
    index("project_updates_project_id_idx").on(t.projectId),
    index("project_updates_commit_id_idx").on(t.commitId),
    index("project_updates_deployment_id_idx").on(t.deploymentId),
    index("project_updates_task_id_idx").on(t.taskId),
  ],
);

/** Timeline (§5) — append-only. */
export const activities = pgTable(
  "activities",
  {
    id: primaryId(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    actorId: uuid("actor_id").references((): AnyPgColumn => users.id, { onDelete: "set null" }),
    /** Pentru acțiuni venite din integrări (ex: "GitHub", "Sistem"). */
    actorLabel: text("actor_label"),
    type: text("type").notNull(),
    description: text("description").notNull(),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("activities_project_id_idx").on(t.projectId),
    index("activities_client_id_idx").on(t.clientId),
    index("activities_actor_id_idx").on(t.actorId),
    index("activities_entity_idx").on(t.entityType, t.entityId),
    index("activities_at_idx").on(t.at),
  ],
);
