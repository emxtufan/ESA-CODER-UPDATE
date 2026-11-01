/** Monitorizare (§15): verificări pe site-uri, incidente și starea agentului de server. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { ResourcePage } from "@/components/resource/ResourcePage";
import { formatDate, statusTone, type FieldDef } from "@/components/resource/fields";
import { Badge, Button, DataTable, EmptyState, ErrorState, Modal, PageHeader, Tabs, useToast, type BadgeTone, type DataTableColumn } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useCan } from "@/lib/auth";
import { INCIDENT_SEVERITIES, INCIDENT_STATUSES } from "@shared/enums";

interface CheckRow {
  id: string;
  url: string;
  projectName: string | null;
  lastStatus: string | null;
  intervalSeconds: number;
  lastCheckedAt: string | null;
  enabled: boolean;
}

interface ResultRow {
  id: string;
  at: string;
  ok: boolean;
  httpStatus: number | null;
  responseMs: number | null;
  sslExpiresAt: string | null;
  error: string | null;
}

interface IncidentRow {
  id: string;
  name: string;
  projectName: string | null;
  severity: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
}

interface ServerRow {
  id: string;
  name: string;
  ip: string | null;
}

function CheckStatus({ status }: { status: string | null }) {
  if (status === "up") return <Badge tone="success">Funcționează</Badge>;
  if (status === "down") return <Badge tone="danger">Căzut</Badge>;
  return <Badge tone="neutral">Neverificat</Badge>;
}

export const CHECK_COLUMNS: DataTableColumn<CheckRow>[] = [
  { key: "url", header: "Adresă", sortable: true },
  { key: "projectName", header: "Proiect" },
  { key: "lastStatus", header: "Stare", render: (r) => <CheckStatus status={r.lastStatus} /> },
  { key: "intervalSeconds", header: "Interval", render: (r) => `${Math.round(r.intervalSeconds / 60)} min` },
  { key: "lastCheckedAt", header: "Ultima verificare", sortable: true, render: (r) => formatDate(r.lastCheckedAt) },
  { key: "enabled", header: "Activă", render: (r) => (r.enabled ? "Da" : "Nu") },
];

export const CHECK_FIELDS: FieldDef[] = [
  { name: "projectId", label: "Proiect", type: "relation", endpoint: "/projects", required: true },
  { name: "url", label: "Adresă", type: "url", required: true, hint: "Doar adrese publice http sau https." },
  { name: "intervalSeconds", label: "Interval (secunde)", type: "number", hint: "Minimum 60. Implicit 300." },
  { name: "enabled", label: "Activă", type: "checkbox" },
];

const RESULT_COLUMNS: DataTableColumn<ResultRow>[] = [
  { key: "at", header: "Data", render: (r) => new Date(r.at).toLocaleString("ro-RO") },
  { key: "ok", header: "Rezultat", render: (r) => <Badge tone={r.ok ? "success" : "danger"}>{r.ok ? "OK" : "Eșec"}</Badge> },
  { key: "httpStatus", header: "HTTP", render: (r) => r.httpStatus ?? "—" },
  { key: "responseMs", header: "Timp", render: (r) => (r.responseMs === null ? "—" : `${r.responseMs} ms`) },
  { key: "sslExpiresAt", header: "SSL expiră", render: (r) => formatDate(r.sslExpiresAt) },
  { key: "error", header: "Eroare", render: (r) => r.error ?? "—" },
];

function HistoryModal({ check, onClose }: { check: CheckRow; onClose: () => void }) {
  const query = useQuery({
    queryKey: ["monitoring-results", check.id],
    queryFn: () => api<{ items: ResultRow[] }>("/monitoring/results", { query: { checkId: check.id, pageSize: 50 } }),
  });
  return (
    <Modal open onClose={onClose} title={`Istoric: ${check.url}`} className="max-w-3xl">
      <DataTable columns={RESULT_COLUMNS} rows={query.data?.items ?? []} rowKey="id" loading={query.isLoading} error={query.error} onRetry={() => void query.refetch()} empty={<EmptyState title="Nicio verificare încă" />} />
    </Modal>
  );
}

function ChecksTab() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const canRun = useCan("monitoring.update");
  const [history, setHistory] = useState<CheckRow | null>(null);
  const run = useMutation({
    mutationFn: (id: string) => api<{ result: ResultRow }>(`/monitoring/checks/${id}/run`, { method: "POST" }),
    onSuccess: ({ result }) => {
      if (result.ok) toast.success(`Funcționează: HTTP ${result.httpStatus}, ${result.responseMs} ms.`);
      else toast.error(`Eșec: ${result.error ?? "fără răspuns"}.`);
      void queryClient.invalidateQueries({ queryKey: ["resource", "/monitoring/checks"] });
      void queryClient.invalidateQueries({ queryKey: ["monitoring-results"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Verificarea a eșuat."),
  });
  return (
    <>
      <ResourcePage<CheckRow>
        embedded
        title="Verificări"
        description="Se verifică doar adrese publice: status, timp de răspuns, SSL și DNS."
        endpoint="/monitoring/checks"
        perm="monitoring"
        itemName="verificare"
        columns={CHECK_COLUMNS}
        fields={CHECK_FIELDS}
        rowActions={(row) => (
          <>
            {canRun ? (
              <Button variant="ghost" size="sm" loading={run.isPending && run.variables === row.id} onClick={() => run.mutate(row.id)}>
                Verifică acum
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onClick={() => setHistory(row)}>
              Istoric
            </Button>
          </>
        )}
      />
      {history ? <HistoryModal check={history} onClose={() => setHistory(null)} /> : null}
    </>
  );
}

const severityTone = (severity: string): BadgeTone => {
  if (severity === "Critical" || severity === "High") return "danger";
  return severity === "Medium" ? "warning" : "neutral";
};

const INCIDENT_COLUMNS: DataTableColumn<IncidentRow>[] = [
  { key: "name", header: "Incident", sortable: true },
  { key: "projectName", header: "Proiect" },
  { key: "severity", header: "Severitate", render: (r) => <Badge tone={severityTone(r.severity)}>{r.severity}</Badge> },
  { key: "status", header: "Status", render: (r) => <Badge tone={r.status === "Resolved" ? "success" : statusTone(r.status)}>{r.status}</Badge> },
  { key: "startedAt", header: "Început", sortable: true, render: (r) => formatDate(r.startedAt) },
  { key: "endedAt", header: "Sfârșit", render: (r) => formatDate(r.endedAt) },
];

const INCIDENT_FIELDS: FieldDef[] = [
  { name: "name", label: "Nume", type: "text", required: true, span: 2 },
  { name: "projectId", label: "Proiect", type: "relation", endpoint: "/projects" },
  { name: "serverId", label: "Server", type: "relation", endpoint: "/servers" },
  { name: "severity", label: "Severitate", type: "select", options: INCIDENT_SEVERITIES, required: true },
  { name: "status", label: "Status", type: "select", options: INCIDENT_STATUSES, required: true },
  { name: "startedAt", label: "Început", type: "datetime" },
  { name: "endedAt", label: "Sfârșit", type: "datetime" },
  { name: "description", label: "Descriere", type: "textarea", span: 2 },
  { name: "resolution", label: "Rezolvare", type: "textarea", span: 2 },
];

const SERVER_COLUMNS: DataTableColumn<ServerRow>[] = [
  { key: "name", header: "Server" },
  { key: "ip", header: "IP", render: (r) => r.ip ?? "—" },
  { key: "agent", header: "Agent", render: () => <Badge tone="neutral">Neconectat</Badge> },
];

function ServersTab() {
  const query = useQuery({ queryKey: ["monitoring-servers"], queryFn: () => api<{ items: ServerRow[] }>("/monitoring/servers") });
  if (query.error) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">CPU, RAM, disc și servicii cer un agent securizat pe server. Niciun agent nu e instalat, deci metricile nu se afișează.</p>
      <DataTable columns={SERVER_COLUMNS} rows={query.data?.items ?? []} rowKey="id" loading={query.isLoading} empty={<EmptyState title="Niciun server adăugat" />} />
    </div>
  );
}

const TABS = [
  { value: "checks", label: "Verificări" },
  { value: "incidents", label: "Incidente" },
  { value: "servers", label: "Servere" },
];

export default function MonitoringPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab");
  const tab = TABS.some((t) => t.value === requested) ? (requested as string) : "checks";
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Monitorizare" description="Disponibilitatea site-urilor și incidentele." />
      <Tabs
        items={TABS}
        value={tab}
        onChange={(value) =>
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set("tab", value);
            return next;
          })
        }
      />
      {tab === "checks" ? <ChecksTab /> : null}
      {tab === "incidents" ? (
        <ResourcePage<IncidentRow>
          embedded
          title="Incidente"
          endpoint="/monitoring/incidents"
          perm="monitoring"
          itemName="incident"
          columns={INCIDENT_COLUMNS}
          fields={INCIDENT_FIELDS}
          filters={[
            { name: "status", label: "Status", options: INCIDENT_STATUSES },
            { name: "severity", label: "Severitate", options: INCIDENT_SEVERITIES },
          ]}
        />
      ) : null}
      {tab === "servers" ? <ServersTab /> : null}
    </div>
  );
}
