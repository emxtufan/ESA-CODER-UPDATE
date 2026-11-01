import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { DataTable, Input, Modal, PageHeader, Pagination } from "@/components/ui";
import { api } from "@/lib/api";
import { useListParams } from "@/lib/useListParams";

type AuditRow = {
  id: string;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string;
  meta: unknown;
  ip: string | null;
  at: string;
};

type AuditResponse = {
  items: AuditRow[];
  total: number;
};

export function AuditPage() {
  const { page, pageSize, qInput, setQ, filters, setFilter, setPage, query } =
    useListParams();
  const [selected, setSelected] = useState<AuditRow | null>(null);

  const { data, isLoading, error, refetch } = useQuery<AuditResponse>({
    queryKey: ["audit", query],
    queryFn: () => api<AuditResponse>("/audit", { query }),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Audit"
        description="Jurnalul acțiunilor din sistem"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={qInput}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Caută..."
        />
        <Input
          value={filters.action ?? ""}
          onChange={(e) => setFilter("action", e.target.value)}
          placeholder="Filtru acțiune"
        />
      </div>

      <DataTable
        columns={[
          {
            key: "at",
            header: "Data",
            render: (row: AuditRow) =>
              new Date(row.at).toLocaleString("ro-RO"),
          },
          {
            key: "actorName",
            header: "Actor",
            render: (row: AuditRow) => row.actorName ?? row.actorEmail ?? "—",
          },
          {
            key: "action",
            header: "Acțiune",
            hideOnMobile: true,
          },
          {
            key: "entityType",
            header: "Entitate",
            render: (row: AuditRow) => `${row.entityType} #${row.entityId}`,
          },
          {
            key: "ip",
            header: "IP",
            hideOnMobile: true,
            render: (row: AuditRow) => row.ip ?? "—",
          },
        ]}
        rows={items}
        rowKey={(row: AuditRow) => row.id}
        onRowClick={(row: AuditRow) => setSelected(row)}
        loading={isLoading}
        error={error}
        onRetry={() => refetch()}
        empty="Nicio înregistrare"
      />

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPage={setPage}
      />

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Detalii înregistrare"
      >
        <pre className="text-xs whitespace-pre-wrap break-words">
          {JSON.stringify(selected?.meta ?? null, null, 2)}
        </pre>
      </Modal>
    </div>
  );
}

export default AuditPage;
