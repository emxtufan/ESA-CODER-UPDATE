/**
 * Deployments (§9): jurnalul lansărilor — commit, mediu, status și log-uri.
 *
 * Aplicația nu execută nimic pe servere: fiecare rând doar înregistrează o lansare.
 * `projectName` vine de la server la listare (`listTransform` din
 * `server/modules/deployments/routes.ts`), iar statusul din `DEPLOYMENT_STATUSES`.
 */
import { Badge } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { ResourcePage } from "@/components/resource/ResourcePage";
import { formatDate, statusTone, type FieldDef } from "@/components/resource/fields";
import { DEPLOYMENT_STATUSES } from "@shared/enums";

/** Un rând din listarea `GET /deployments` (`projectName` vine de la proiect). */
export type DeploymentRow = {
  id: string;
  projectId: string;
  projectName: string | null;
  repositoryId: string | null;
  serverId: string | null;
  environment: string | null;
  branch: string | null;
  commitHash: string | null;
  status: string;
  deployedAt: string | null;
  url: string | null;
  logs: string | null;
};

/** Primele 7 caractere ale unui hash, cât se vede în listă. */
function shortHash(hash: string | null): string {
  return hash ? hash.slice(0, 7) : "—";
}

/** Câmpurile lansării: exact cele din `deploymentSchema`. */
export const DEPLOY_FIELDS: FieldDef[] = [
  { name: "projectId", label: "Proiect", type: "relation", endpoint: "/projects", required: true },
  { name: "repositoryId", label: "Repository", type: "relation", endpoint: "/github/repositories" },
  { name: "environment", label: "Mediu", type: "text" },
  { name: "branch", label: "Branch", type: "text" },
  { name: "commitHash", label: "Commit", type: "text" },
  { name: "serverId", label: "Server", type: "relation", endpoint: "/servers" },
  { name: "status", label: "Status", type: "select", options: DEPLOYMENT_STATUSES, required: true },
  { name: "deployedAt", label: "Lansat la", type: "datetime" },
  { name: "url", label: "URL", type: "url" },
  { name: "logs", label: "Log-uri", type: "textarea", span: 2 },
];

/** Coloanele listării de lansări: hash-ul scurt și link-ul extern când există. */
export const DEPLOY_COLUMNS: DataTableColumn<DeploymentRow>[] = [
  { key: "projectName", header: "Proiect", render: (row) => row.projectName ?? "—" },
  { key: "environment", header: "Mediu", render: (row) => row.environment ?? "—" },
  { key: "branch", header: "Branch", render: (row) => row.branch ?? "—" },
  {
    key: "commitHash",
    header: "Commit",
    hideOnMobile: true,
    render: (row) => shortHash(row.commitHash),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
  },
  { key: "deployedAt", header: "Lansat la", sortable: true, render: (row) => formatDate(row.deployedAt) },
  {
    key: "url",
    header: "URL",
    hideOnMobile: true,
    render: (row) =>
      row.url ? (
        <a href={row.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
          {row.url}
        </a>
      ) : (
        "—"
      ),
  },
];

export function DeploymentsPage() {
  return (
    <ResourcePage<DeploymentRow>
      title="Deployments"
      description="Se înregistrează; aplicația nu execută nimic pe servere."
      endpoint="/deployments"
      perm="deployments"
      itemName="deployment"
      columns={DEPLOY_COLUMNS}
      fields={DEPLOY_FIELDS}
      filters={[
        { name: "status", label: "Status", options: DEPLOYMENT_STATUSES },
        { name: "projectId", label: "Proiect", endpoint: "/projects" },
      ]}
    />
  );
}

export default DeploymentsPage;
