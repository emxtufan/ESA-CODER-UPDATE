/**
 * Lista contractelor-cadru generate: căutare, paginare și acces rapid la generator.
 */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import { formatDate } from "@/components/resource/ResourcePage";
import { Badge, Button, DataTable, Input, PageHeader, Pagination, type DataTableColumn } from "@/components/ui";
import { api } from "@/lib/api";
import { useCan } from "@/lib/auth";
import { useListParams } from "@/lib/useListParams";

import { statusLabel, statusToneOf, type ContractRow } from "./constants";

const COLUMNS: DataTableColumn<ContractRow>[] = [
  { key: "number", header: "Număr", render: (row) => row.number ?? "—" },
  { key: "clientName", header: "Client" },
  { key: "projectName", header: "Proiect", hideOnMobile: true },
  { key: "date", header: "Data", hideOnMobile: true, render: (row) => formatDate(row.date) },
  {
    key: "status",
    header: "Status",
    render: (row) => <Badge tone={statusToneOf(row.status)}>{statusLabel(row.status)}</Badge>,
  },
  { key: "updatedAt", header: "Actualizat", hideOnMobile: true, render: (row) => formatDate(row.updatedAt) },
];

export function LegalPage() {
  const navigate = useNavigate();
  const canCreate = useCan("documents.create");
  const list = useListParams();

  const { data, isLoading, error, refetch } = useQuery<{ items: ContractRow[]; total: number }>({
    queryKey: ["legal-contracts", list.query],
    queryFn: () => api<{ items: ContractRow[]; total: number }>("/legal/contracts", { query: list.query }),
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Legal"
        description="Contractele-cadru generate pentru clienți."
        actions={
          canCreate ? (
            <Button variant="primary" onClick={() => navigate("/legal/contracts/new")}>
              Contract nou
            </Button>
          ) : undefined
        }
      />

      <div className="w-full sm:w-72">
        <Input
          value={list.qInput}
          onChange={(event) => list.setQ(event.target.value)}
          placeholder="Caută după număr, client sau proiect…"
          aria-label="Caută contracte"
        />
      </div>

      <DataTable
        columns={COLUMNS}
        rows={data?.items ?? []}
        rowKey="id"
        onRowClick={(row) => navigate(`/legal/contracts/${row.id}`)}
        loading={isLoading}
        error={error}
        onRetry={() => void refetch()}
      />

      <Pagination page={list.page} pageSize={list.pageSize} total={data?.total ?? 0} onPage={list.setPage} />
    </div>
  );
}

export default LegalPage;
