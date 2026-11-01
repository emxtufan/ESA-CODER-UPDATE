/**
 * Căutarea globală: interoghează entitățile principale cu `ilike` pe coloanele lor de
 * identificare, doar pentru grupurile pe care utilizatorul are voie să le vadă.
 *
 * Fiecare entitate căutabilă se descrie o singură dată în `GROUPS`: adăugarea unei
 * entități noi înseamnă doar o intrare nouă acolo.
 */
import { and, ilike, isNull, or } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { Router } from "express";
import { z } from "zod";

import type { Permission } from "../../../shared/permissions";
import { clients, projects, tasks } from "../../db/schema/core";
import { invoices } from "../../db/schema/finance";
import { contracts, documents } from "../../db/schema/ops";
import { commits, deployments, repositories } from "../../db/schema/github";
import { domains, servers } from "../../db/schema/infra";
import { parse } from "../../lib/http";
import { can, requireAuth } from "../../security/guards";

const querySchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, "Caută cel puțin 2 caractere")
    .max(100, "Maxim 100 de caractere"),
});

/** O entitate căutabilă: tabelul, coloanele `ilike` și felul cum se afișează un rând. */
interface SearchGroup {
  key: string;
  label: string;
  perm: Permission;
  table: PgTable;
  columns: PgColumn[];
  title: (row: any) => string;
  subtitle: (row: any) => string | null;
  link: (row: any) => string;
}

const GROUPS: SearchGroup[] = [
  {
    key: "clients",
    label: "Clienți",
    perm: "clients.view",
    table: clients,
    columns: [clients.companyName, clients.legalName, clients.cui, clients.primaryEmail],
    title: (row) => row.companyName,
    subtitle: (row) =>
      [row.legalName, row.cui, row.primaryEmail].filter(Boolean).join(" · ") || null,
    link: (row) => `/clients/${row.id}`,
  },
  {
    key: "projects",
    label: "Proiecte",
    perm: "projects.view",
    table: projects,
    columns: [projects.name, projects.slug, projects.websiteUrl],
    title: (row) => row.name,
    subtitle: (row) => row.websiteUrl ?? row.slug ?? null,
    link: (row) => `/projects/${row.id}`,
  },
  {
    key: "tasks",
    label: "Taskuri",
    perm: "tasks.view",
    table: tasks,
    columns: [tasks.title],
    title: (row) => row.title,
    subtitle: () => null,
    link: () => "/tasks",
  },
  {
    key: "servers",
    label: "Servere",
    perm: "infrastructure.view",
    table: servers,
    columns: [servers.name, servers.ip],
    title: (row) => row.name,
    subtitle: (row) => row.ip ?? null,
    link: () => "/infrastructure?tab=servers",
  },
  {
    key: "domains",
    label: "Domenii",
    perm: "infrastructure.view",
    table: domains,
    columns: [domains.domain],
    title: (row) => row.domain,
    subtitle: (row) => row.registrar ?? null,
    link: () => "/infrastructure?tab=domains",
  },
  {
    key: "repositories",
    label: "Repository-uri",
    perm: "github.view",
    table: repositories,
    columns: [repositories.name, repositories.owner],
    title: (row) => row.name,
    subtitle: (row) => row.owner ?? null,
    link: () => "/github",
  },
  {
    key: "commits",
    label: "Commit-uri",
    perm: "github.view",
    table: commits,
    columns: [commits.hash, commits.message],
    title: (row) => row.hash.slice(0, 7),
    subtitle: (row) => row.message ?? null,
    link: () => "/github?tab=commits",
  },
  {
    key: "deployments",
    label: "Deployments",
    perm: "deployments.view",
    table: deployments,
    columns: [deployments.commitHash, deployments.branch],
    title: (row) => `${row.environment ?? "—"} ${row.status}`,
    subtitle: (row) => row.branch ?? null,
    link: () => "/deployments",
  },
  {
    key: "invoices",
    label: "Facturi",
    perm: "finance.view",
    table: invoices,
    columns: [invoices.number, invoices.externalId],
    title: (row) => row.number,
    subtitle: (row) => row.status ?? null,
    link: () => "/finance",
  },
  {
    key: "documents",
    label: "Documente",
    perm: "documents.view",
    table: documents,
    columns: [documents.name, documents.notes],
    title: (row) => row.name,
    subtitle: (row) => row.type ?? null,
    link: () => "/documents",
  },
  {
    key: "contracts",
    label: "Contracte",
    perm: "documents.view",
    table: contracts,
    columns: [contracts.title],
    title: (row) => row.title,
    subtitle: (row) => row.status ?? null,
    link: () => "/documents?tab=contracts",
  },
];

/** `%text%` pentru `ilike`, cu metacaracterele utilizatorului escapate. */
function likePattern(value: string): string {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}

export function searchRouter(): Router {
  const router = Router();

  router.get("/", requireAuth, async (req, res) => {
    const { q } = parse(querySchema, req.query);
    const pattern = likePattern(q);
    const db = req.ctx.db as any;

    const groups = await Promise.all(
      GROUPS.filter((group) => can(req, group.perm)).map(async (group) => {
        const rows = await db
          .select()
          .from(group.table)
          .where(
            and(
              or(...group.columns.map((column) => ilike(column, pattern))),
              "deletedAt" in group.table ? isNull((group.table as any).deletedAt) : undefined,
            ),
          )
          .limit(5);

        return {
          key: group.key,
          label: group.label,
          items: rows.map((row: any) => ({
            id: row.id,
            title: group.title(row),
            subtitle: group.subtitle(row),
            link: group.link(row),
          })),
        };
      }),
    );

    res.json({ groups: groups.filter((group) => group.items.length > 0) });
  });

  return router;
}
