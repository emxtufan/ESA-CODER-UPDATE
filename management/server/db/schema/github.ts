import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

import type { DeploymentStatus } from "../../../shared/enums";

import { users } from "./auth";
import { projects } from "./core";
import { servers } from "./infra";

const primaryId = () => uuid("id").primaryKey().defaultRandom();

const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** §8 Repositories legate de proiecte. */
export const repositories = pgTable(
  "repositories",
  {
    id: primaryId(),
    name: text("name").notNull(),
    url: text("url"),
    owner: text("owner").notNull(),
    defaultBranch: text("default_branch"),
    devBranch: text("dev_branch"),
    prodBranch: text("prod_branch"),
    visibility: text("visibility"),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    status: text("status"),
    projectId: uuid("project_id").references((): AnyPgColumn => projects.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("repositories_owner_name_idx").on(t.owner, t.name),
    index("repositories_project_id_idx").on(t.projectId),
    index("repositories_name_idx").on(t.name),
  ],
);

/** Commituri sincronizate din GitHub. Commit ≠ deployed. */
export const commits = pgTable(
  "commits",
  {
    id: primaryId(),
    repositoryId: uuid("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    hash: text("hash").notNull(),
    message: text("message"),
    author: text("author"),
    authorEmail: text("author_email"),
    date: timestamp("date", { withTimezone: true }),
    branch: text("branch"),
    filesChanged: integer("files_changed"),
    additions: integer("additions"),
    deletions: integer("deletions"),
    url: text("url"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("commits_repository_id_hash_idx").on(t.repositoryId, t.hash),
    index("commits_hash_idx").on(t.hash),
    index("commits_date_idx").on(t.date),
    index("commits_branch_idx").on(t.branch),
  ],
);

/** §8 Pull requests. */
export const pullRequests = pgTable(
  "pull_requests",
  {
    id: primaryId(),
    repositoryId: uuid("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    title: text("title"),
    author: text("author"),
    status: text("status"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    mergedAt: timestamp("merged_at", { withTimezone: true }),
    headRef: text("head_ref"),
    baseRef: text("base_ref"),
    url: text("url"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("pull_requests_repository_id_number_idx").on(t.repositoryId, t.number),
    index("pull_requests_number_idx").on(t.number),
    index("pull_requests_status_idx").on(t.status),
  ],
);

/** §8 Releases. */
export const releases = pgTable(
  "releases",
  {
    id: primaryId(),
    repositoryId: uuid("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    version: text("version").notNull(),
    tag: text("tag").notNull(),
    notes: text("notes"),
    date: timestamp("date", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("releases_repository_id_tag_idx").on(t.repositoryId, t.tag),
    index("releases_date_idx").on(t.date),
  ],
);

/** Livrările de webhook GitHub, deduplicate pe X-GitHub-Delivery (append-only). */
export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: primaryId(),
    deliveryId: text("delivery_id").notNull().unique(),
    event: text("event").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("webhook_deliveries_event_idx").on(t.event),
    index("webhook_deliveries_received_at_idx").on(t.receivedAt),
  ],
);

/** §9 Deployments — înregistrate, fără execuție din browser. */
export const deployments = pgTable(
  "deployments",
  {
    id: primaryId(),
    projectId: uuid("project_id")
      .notNull()
      .references((): AnyPgColumn => projects.id, { onDelete: "cascade" }),
    repositoryId: uuid("repository_id").references((): AnyPgColumn => repositories.id, {
      onDelete: "set null",
    }),
    commitHash: text("commit_hash"),
    branch: text("branch"),
    environment: text("environment"),
    serverId: uuid("server_id").references((): AnyPgColumn => servers.id, {
      onDelete: "set null",
    }),
    deployedAt: timestamp("deployed_at", { withTimezone: true }).notNull().defaultNow(),
    triggeredById: uuid("triggered_by_id").references((): AnyPgColumn => users.id, {
      onDelete: "set null",
    }),
    status: text("status").$type<DeploymentStatus>().notNull(),
    logs: text("logs"),
    url: text("url"),
    ...timestamps(),
  },
  (t) => [
    index("deployments_project_id_idx").on(t.projectId),
    index("deployments_repository_id_idx").on(t.repositoryId),
    index("deployments_server_id_idx").on(t.serverId),
    index("deployments_commit_hash_idx").on(t.commitHash),
    index("deployments_status_idx").on(t.status),
    index("deployments_deployed_at_idx").on(t.deployedAt),
    index("deployments_triggered_by_id_idx").on(t.triggeredById),
  ],
);
