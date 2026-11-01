/**
 * GitHub (§8): repository-urile legate de proiecte, sincronizarea lor manuală și listele de
 * commits, pull requests și releases aduse de webhook.
 *
 * Commits, PR-urile și release-urile sunt strict citire (`readOnly`), la fel ca pe server.
 * Starea integrării vine din `GET /github/status` și spune doar dacă token-ul și secretul de
 * webhook există; fără token, sincronizarea manuală nu are cu ce lucra, deci butonul dispare.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router";

import { api } from "@/lib/api";
import { Badge, Button, PageHeader, Tabs, useToast } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { ResourcePage } from "@/components/resource/ResourcePage";
import { formatDate, statusTone, type FieldDef } from "@/components/resource/fields";

/** Un rând din listarea `GET /github/repositories` (`projectName` vine de la proiect). */
export type RepositoryRow = {
  id: string;
  name: string;
  owner: string;
  url: string | null;
  defaultBranch: string | null;
  devBranch: string | null;
  prodBranch: string | null;
  projectId: string | null;
  projectName: string | null;
  status: string | null;
  lastSyncAt: string | null;
};

/** Un rând din listarea `GET /github/commits` (`repositoryName` vine de la repository). */
export type CommitRow = {
  id: string;
  hash: string;
  message: string | null;
  author: string | null;
  branch: string | null;
  repositoryName: string | null;
  date: string | null;
  url: string | null;
};

/** Un rând din listarea `GET /github/pull-requests`. */
export type PullRequestRow = {
  id: string;
  number: number;
  title: string | null;
  author: string | null;
  status: string | null;
  headRef: string | null;
  baseRef: string | null;
  repositoryName: string | null;
  createdAt: string;
};

/** Un rând din listarea `GET /github/releases`. */
export type ReleaseRow = {
  id: string;
  tag: string;
  version: string;
  repositoryName: string | null;
  date: string | null;
};

/** Starea integrării: doar existența token-ului și a secretului, niciodată valorile. */
type GithubStatus = { token: boolean; webhook: boolean };

/** Rezultatul sincronizării manuale (`POST /github/repositories/:id/sync`). */
type SyncResult = { commits: number; pulls: number; releases: number };

/** Primele 7 caractere ale unui hash, cât se vede în listă. */
function shortHash(hash: string | null): string {
  return hash ? hash.slice(0, 7) : "—";
}

/** Câmpurile repository-ului: exact cele din `repositorySchema`. */
export const REPO_FIELDS: FieldDef[] = [
  { name: "name", label: "Nume", type: "text", required: true },
  { name: "owner", label: "Proprietar", type: "text", required: true },
  { name: "url", label: "URL", type: "url" },
  { name: "defaultBranch", label: "Branch implicit", type: "text" },
  { name: "devBranch", label: "Branch dev", type: "text" },
  { name: "prodBranch", label: "Branch prod", type: "text" },
  { name: "projectId", label: "Proiect", type: "relation", endpoint: "/projects" },
];

/** Coloanele listării de repository-uri. */
export const REPO_COLUMNS: DataTableColumn<RepositoryRow>[] = [
  { key: "name", header: "Nume", sortable: true },
  { key: "owner", header: "Proprietar" },
  { key: "projectName", header: "Proiect", hideOnMobile: true, render: (row) => row.projectName ?? "—" },
  {
    key: "status",
    header: "Status",
    render: (row) =>
      row.status ? <Badge tone={statusTone(row.status)}>{row.status}</Badge> : "—",
  },
  { key: "lastSyncAt", header: "Ultima sincronizare", render: (row) => formatDate(row.lastSyncAt) },
];

/** Coloanele listării de commits: hash-ul duce la commit-ul din GitHub, când există URL. */
export const COMMIT_COLUMNS: DataTableColumn<CommitRow>[] = [
  {
    key: "hash",
    header: "Hash",
    sortable: true,
    render: (row) =>
      row.url ? (
        <a href={row.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
          {shortHash(row.hash)}
        </a>
      ) : (
        shortHash(row.hash)
      ),
  },
  { key: "message", header: "Mesaj", render: (row) => row.message ?? "—" },
  { key: "author", header: "Autor", render: (row) => row.author ?? "—" },
  { key: "branch", header: "Branch", hideOnMobile: true, render: (row) => row.branch ?? "—" },
  {
    key: "repositoryName",
    header: "Repository",
    hideOnMobile: true,
    render: (row) => row.repositoryName ?? "—",
  },
  { key: "date", header: "Data", sortable: true, render: (row) => formatDate(row.date) },
];

/** Coloanele listării de pull request-uri. */
const PR_COLUMNS: DataTableColumn<PullRequestRow>[] = [
  { key: "number", header: "Număr", sortable: true, render: (row) => `#${row.number}` },
  { key: "title", header: "Titlu", render: (row) => row.title ?? "—" },
  { key: "author", header: "Autor", hideOnMobile: true, render: (row) => row.author ?? "—" },
  {
    key: "status",
    header: "Status",
    render: (row) =>
      row.status ? <Badge tone={statusTone(row.status)}>{row.status}</Badge> : "—",
  },
  { key: "refs", header: "Branch", render: (row) => `${row.headRef ?? "—"} → ${row.baseRef ?? "—"}` },
  {
    key: "repositoryName",
    header: "Repository",
    hideOnMobile: true,
    render: (row) => row.repositoryName ?? "—",
  },
  { key: "createdAt", header: "Creat la", sortable: true, render: (row) => formatDate(row.createdAt) },
];

/** Coloanele listării de releases. */
const RELEASE_COLUMNS: DataTableColumn<ReleaseRow>[] = [
  { key: "tag", header: "Tag", sortable: true },
  { key: "version", header: "Versiune" },
  {
    key: "repositoryName",
    header: "Repository",
    hideOnMobile: true,
    render: (row) => row.repositoryName ?? "—",
  },
  { key: "date", header: "Data", sortable: true, render: (row) => formatDate(row.date) },
];

/** Taburile paginii, în ordinea din specificație. */
const TAB_ITEMS = [
  { value: "repositories", label: "Repository-uri" },
  { value: "commits", label: "Commits" },
  { value: "prs", label: "Pull requests" },
  { value: "releases", label: "Releases" },
];

/** Repository-urile, cu sincronizarea manuală pe rând (doar când token-ul e configurat). */
function RepositoriesTab({ canSync }: { canSync: boolean }) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const syncMutation = useMutation({
    mutationFn: (id: string) =>
      api<{ result: SyncResult }>(`/github/repositories/${id}/sync`, { method: "POST" }),
    onSuccess: ({ result }) => {
      toast.success(
        `Sincronizat: ${result.commits} commit-uri, ${result.pulls} pull request-uri, ${result.releases} release-uri.`,
      );
      queryClient.invalidateQueries({ queryKey: ["resource", "/github/repositories"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error && err.message ? err.message : "Sincronizarea a eșuat."),
  });

  return (
    <ResourcePage<RepositoryRow>
      title="Repository-uri"
      endpoint="/github/repositories"
      perm="github"
      itemName="repository"
      columns={REPO_COLUMNS}
      fields={REPO_FIELDS}
      rowActions={
        canSync
          ? (row) => (
              <Button
                variant="secondary"
                size="sm"
                loading={syncMutation.isPending && syncMutation.variables === row.id}
                onClick={(event) => {
                  event.stopPropagation();
                  syncMutation.mutate(row.id);
                }}
              >
                Sincronizează
              </Button>
            )
          : undefined
      }
      embedded
    />
  );
}

export default function GithubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab");
  const activeTab: string = TAB_ITEMS.some((tab) => tab.value === requested)
    ? (requested as string)
    : "repositories";

  const statusQuery = useQuery({
    queryKey: ["github-status"],
    queryFn: () => api<GithubStatus>("/github/status"),
  });
  const token = statusQuery.data?.token ?? false;
  const webhook = statusQuery.data?.webhook ?? false;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="GitHub"
        breadcrumbs={[{ label: "GitHub" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={token ? "success" : "neutral"}>
              {token ? "Token conectat" : "Neconectat: setează GITHUB_TOKEN"}
            </Badge>
            <Badge tone={webhook ? "success" : "neutral"}>
              {webhook ? "Webhook activ" : "Webhook neconfigurat: setează GITHUB_WEBHOOK_SECRET"}
            </Badge>
          </div>
        }
      />

      <Tabs
        items={TAB_ITEMS}
        value={activeTab}
        onChange={(value) => {
          const next = new URLSearchParams(searchParams);
          next.set("tab", value);
          setSearchParams(next);
        }}
      />

      {activeTab === "repositories" ? <RepositoriesTab canSync={token} /> : null}

      {activeTab === "commits" ? (
        <ResourcePage<CommitRow>
          title="Commits"
          endpoint="/github/commits"
          perm="github"
          itemName="commit"
          columns={COMMIT_COLUMNS}
          fields={[]}
          readOnly
          embedded
        />
      ) : null}

      {activeTab === "prs" ? (
        <ResourcePage<PullRequestRow>
          title="Pull requests"
          endpoint="/github/pull-requests"
          perm="github"
          itemName="pull request"
          columns={PR_COLUMNS}
          fields={[]}
          readOnly
          embedded
        />
      ) : null}

      {activeTab === "releases" ? (
        <ResourcePage<ReleaseRow>
          title="Releases"
          endpoint="/github/releases"
          perm="github"
          itemName="release"
          columns={RELEASE_COLUMNS}
          fields={[]}
          readOnly
          embedded
        />
      ) : null}
    </div>
  );
}
