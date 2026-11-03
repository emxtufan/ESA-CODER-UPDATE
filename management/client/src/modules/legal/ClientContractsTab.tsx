/** Tab-ul „Contracte” din fișa clientului: contractele generate + butonul de generare. */
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";

import { formatDate } from "@/components/resource/ResourcePage";
import { Badge, Button, DataTable, type DataTableColumn } from "@/components/ui";
import { api } from "@/lib/api";
import { useCan } from "@/lib/auth";

import { statusLabel, statusToneOf, type ContractRow } from "./constants";

const COLUMNS: DataTableColumn<ContractRow>[] = [
  {
    key: "number",
    header: "Număr",
    render: (row) => (
      <Link to={`/legal/contracts/${row.id}`} className="font-medium text-primary hover:underline" onClick={(event) => event.stopPropagation()}>
        {row.number ?? "—"}
      </Link>
    ),
  },
  { key: "date", header: "Data", render: (row) => formatDate(row.date) },
  {
    key: "status",
    header: "Status",
    render: (row) => <Badge tone={statusToneOf(row.status)}>{statusLabel(row.status)}</Badge>,
  },
  { key: "projectName", header: "Proiect", hideOnMobile: true },
];

export function ClientContractsTab({ clientId }: { clientId: string }) {
  const navigate = useNavigate();
  const canCreate = useCan("documents.create");

  const { data, isLoading, error, refetch } = useQuery<{ items: ContractRow[] }>({
    queryKey: ["legal-contracts", { clientId }],
    queryFn: () => api<{ items: ContractRow[] }>("/legal/contracts", { query: { clientId, pageSize: 100 } }),
  });

  return (
    <div className="space-y-4">
      {canCreate ? (
        <div className="flex justify-end">
          <Button variant="primary" onClick={() => navigate(`/legal/contracts/new?clientId=${clientId}`)}>
            Generează contract
          </Button>
        </div>
      ) : null}

      <DataTable
        columns={COLUMNS}
        rows={data?.items ?? []}
        rowKey="id"
        onRowClick={(row) => navigate(`/legal/contracts/${row.id}`)}
        loading={isLoading}
        error={error}
        onRetry={() => void refetch()}
      />
    </div>
  );
}

export default ClientContractsTab;
