import type { ReactNode } from "react";
import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge, Button, Card, EmptyState, Input, Skeleton, useToast } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { ResourcePage } from "@/components/resource/ResourcePage";
import type { FieldDef } from "@/components/resource/fields";
import { formatDate, statusTone } from "@/components/resource/fields";
import { api, ApiError } from "@/lib/api";
import {
  DOMAIN_COLUMNS,
  DOMAIN_FIELDS,
  HOSTING_COLUMNS,
  HOSTING_FIELDS,
  SERVER_COLUMNS,
  SERVER_FIELDS,
} from "@/modules/infra/InfrastructurePage";
import { COMMIT_COLUMNS, REPO_COLUMNS, REPO_FIELDS } from "@/modules/github/GithubPage";
import { DEPLOY_COLUMNS, DEPLOY_FIELDS } from "@/modules/deployments/DeploymentsPage";
import { EXPENSE_COLUMNS, EXPENSE_FIELDS } from "@/modules/finance/FinancePage";
import { InvoicesTab } from "@/modules/finance/InvoicesTab";
import { OBSERVATION_FIELDS, TASK_FIELDS } from "@/modules/tasks/fields";

export interface ProjectOverview {
  project: {
    id: string;
    name: string;
    status?: string | null;
    websiteUrl?: string | null;
    [key: string]: unknown;
  };
  client?: { id: string; companyName: string } | null;
  tasks: { total: number; open: number; completed: number };
  lastActivity?: {
    at?: string | null;
    description?: string | null;
    actorLabel?: string | null;
  } | null;
}

interface TimelineItem {
  id: string;
  at: string;
  actorName?: string | null;
  actorLabel?: string | null;
  type: string;
  description: string;
}

export interface ProjectTab {
  value: string;
  label: string;
  render: (projectId: string, overview: ProjectOverview | undefined) => ReactNode;
}

const TASK_COLUMNS: DataTableColumn<Record<string, unknown>>[] = [
  { key: "title", header: "Titlu" },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <Badge tone={statusTone(row.status as string)}>{String(row.status ?? "—")}</Badge>
    ),
  },
  { key: "priority", header: "Prioritate" },
  { key: "dueDate", header: "Scadență", render: (row) => formatDate(row.dueDate as string) },
];

const OBSERVATION_COLUMNS: DataTableColumn<Record<string, unknown>>[] = [
  { key: "content", header: "Observație" },
  { key: "createdAt", header: "Creat", render: (row) => formatDate(row.createdAt as string) },
];

const UPDATE_COLUMNS: DataTableColumn<Record<string, unknown>>[] = [
  { key: "text", header: "Update" },
  { key: "createdAt", header: "Creat", render: (row) => formatDate(row.createdAt as string) },
];

const UPDATE_FIELDS: FieldDef[] = [
  { name: "text", label: "Update", type: "textarea", required: true, span: 2 },
];

/** Credențialele din seif: în tabă apar doar metadatele, fără secret. */
const CREDENTIAL_COLUMNS: DataTableColumn<Record<string, unknown>>[] = [
  { key: "name", header: "Nume" },
  { key: "type", header: "Tip" },
  { key: "username", header: "Utilizator", render: (row) => String(row.username ?? "—") },
];

function OverviewTab({
  projectId,
  overview,
}: {
  projectId: string;
  overview: ProjectOverview | undefined;
}) {
  if (!overview) {
    return <Skeleton className="h-40 w-full" />;
  }

  const { project, client, tasks, lastActivity } = overview;
  const percent = tasks.total > 0 ? Math.round((tasks.completed / tasks.total) * 100) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Client">
        {client ? (
          <Link to={`/clients/${client.id}`} className="text-[--primary] hover:underline">
            {client.companyName}
          </Link>
        ) : (
          <span className="text-sm opacity-60">Fără client</span>
        )}
      </Card>

      <Card title="Website">
        {project.websiteUrl ? (
          <a
            href={project.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {project.websiteUrl}
          </a>
        ) : (
          <span className="text-sm opacity-60">—</span>
        )}
      </Card>

      <Card title="Status">
        <Badge tone={statusTone(project.status)}>{project.status ?? "—"}</Badge>
      </Card>

      <Card title="Progres taskuri">
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[--muted]">
            <div
              className="h-2 rounded-full bg-[--primary]"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-sm tabular-nums">
            {tasks.completed}/{tasks.total}
          </span>
        </div>
      </Card>

      <Card title="Ultima activitate" className="md:col-span-2">
        {lastActivity ? (
          <div className="flex flex-col gap-1">
            <span className="text-sm">{lastActivity.description ?? "—"}</span>
            <span className="text-xs opacity-60">{formatDate(lastActivity.at)}</span>
          </div>
        ) : (
          <span className="text-sm opacity-60">—</span>
        )}
      </Card>
    </div>
  );
}

function TimelineTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [description, setDescription] = useState("");

  const query = useQuery({
    queryKey: ["project-timeline", projectId],
    queryFn: () =>
      api<{ items: TimelineItem[] }>("/activities", {
        query: { projectId, pageSize: 100 },
      }),
  });

  const create = useMutation({
    mutationFn: () =>
      api("/activities", { method: "POST", body: { projectId, description } }),
    onSuccess: () => {
      setDescription("");
      qc.invalidateQueries({ queryKey: ["project-timeline", projectId] });
    },
    onError: (e) => {
      toast.error(e instanceof ApiError ? e.message : "Eroare la salvare");
    },
  });

  const items = [...(query.data?.items ?? [])].sort((a, b) =>
    a.at < b.at ? -1 : a.at > b.at ? 1 : 0,
  );

  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (description.trim()) create.mutate();
        }}
      >
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Adaugă o activitate…"
        />
        <Button type="submit" loading={create.isPending}>
          Adaugă
        </Button>
      </form>

      {query.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : items.length === 0 ? (
        <EmptyState title="Nicio activitate" />
      ) : (
        <ol className="flex flex-col gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-1 border-l-2 border-[--border] pl-3"
            >
              <span className="text-sm">{item.description}</span>
              <span className="text-xs opacity-60">
                {item.actorName || item.actorLabel || "—"} · {formatDate(item.at)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export const PROJECT_TABS: ProjectTab[] = [
  {
    value: "overview",
    label: "Prezentare",
    render: (projectId, overview) => (
      <OverviewTab projectId={projectId} overview={overview} />
    ),
  },
  {
    value: "tasks",
    label: "Taskuri",
    render: (projectId) => (
      <ResourcePage
        title="Taskuri"
        endpoint="/tasks"
        perm="tasks"
        itemName="task"
        columns={TASK_COLUMNS}
        fields={TASK_FIELDS}
        extraQuery={{ projectId }}
        defaults={{ projectId }}
        embedded
      />
    ),
  },
  {
    value: "observations",
    label: "Observații",
    render: (projectId) => (
      <ResourcePage
        title="Observații"
        endpoint="/observations"
        perm="observations"
        itemName="observație"
        columns={OBSERVATION_COLUMNS}
        fields={OBSERVATION_FIELDS}
        extraQuery={{ projectId }}
        defaults={{ projectId }}
        embedded
      />
    ),
  },
  {
    value: "updates",
    label: "Update-uri",
    render: (projectId) => (
      <ResourcePage
        title="Update-uri"
        endpoint="/updates"
        perm="projects"
        itemName="update"
        columns={UPDATE_COLUMNS}
        fields={UPDATE_FIELDS}
        extraQuery={{ projectId }}
        defaults={{ projectId }}
        embedded
      />
    ),
  },
  {
    value: "infrastructure",
    label: "Infrastructură",
    render: (projectId) => (
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          {/* Serverele se leagă de proiect prin `project_servers`; se creează din /infrastructure. */}
          <h3 className="text-sm font-semibold text-text">Servere</h3>
          <ResourcePage
            title="Servere"
            endpoint="/servers"
            perm="infrastructure"
            itemName="server"
            columns={SERVER_COLUMNS}
            fields={SERVER_FIELDS}
            extraQuery={{ projectId }}
            readOnly
            embedded
          />
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-text">Domenii</h3>
          <ResourcePage
            title="Domenii"
            endpoint="/domains"
            perm="infrastructure"
            itemName="domeniu"
            columns={DOMAIN_COLUMNS}
            fields={DOMAIN_FIELDS}
            extraQuery={{ projectId }}
            defaults={{ projectId }}
            embedded
          />
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-text">Hosting</h3>
          <ResourcePage
            title="Hosting"
            endpoint="/hosting"
            perm="infrastructure"
            itemName="serviciu de hosting"
            columns={HOSTING_COLUMNS}
            fields={HOSTING_FIELDS}
            extraQuery={{ projectId }}
            defaults={{ projectId }}
            embedded
          />
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-text">Credențiale</h3>
          <ResourcePage
            title="Credențiale"
            endpoint="/vault"
            perm="vault"
            itemName="credențială"
            columns={CREDENTIAL_COLUMNS}
            fields={[]}
            extraQuery={{ projectId }}
            readOnly
            embedded
          />
        </section>
      </div>
    ),
  },
  {
    value: "development",
    label: "Dezvoltare",
    render: (projectId) => (
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-text">Repository-uri</h3>
          <ResourcePage
            title="Repository-uri"
            endpoint="/github/repositories"
            perm="github"
            itemName="repository"
            columns={REPO_COLUMNS}
            fields={REPO_FIELDS}
            extraQuery={{ projectId }}
            defaults={{ projectId }}
            embedded
          />
        </section>

        <section className="flex flex-col gap-3">
          {/* Commit-urile vin din webhook, deci se pot doar citi. */}
          <h3 className="text-sm font-semibold text-text">Commit-uri</h3>
          <ResourcePage
            title="Commit-uri"
            endpoint="/github/commits"
            perm="github"
            itemName="commit"
            columns={COMMIT_COLUMNS}
            fields={[]}
            extraQuery={{ projectId }}
            readOnly
            embedded
          />
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-text">Deployments</h3>
          <ResourcePage
            title="Deployments"
            endpoint="/deployments"
            perm="deployments"
            itemName="deployment"
            columns={DEPLOY_COLUMNS}
            fields={DEPLOY_FIELDS}
            extraQuery={{ projectId }}
            defaults={{ projectId }}
            embedded
          />
        </section>
      </div>
    ),
  },
  {
    value: "finance",
    label: "Financiar",
    render: (projectId) => (
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-text">Facturi</h3>
          <InvoicesTab projectId={projectId} />
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-text">Cheltuieli</h3>
          <ResourcePage
            title="Cheltuieli"
            endpoint="/expenses"
            perm="finance"
            itemName="cheltuială"
            columns={EXPENSE_COLUMNS}
            fields={EXPENSE_FIELDS}
            extraQuery={{ projectId }}
            defaults={{ projectId }}
            embedded
          />
        </section>
      </div>
    ),
  },
  {
    value: "timeline",
    label: "Timeline",
    render: (projectId) => <TimelineTab projectId={projectId} />,
  },
];
