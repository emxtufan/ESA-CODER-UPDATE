/** Tab-ul „Oferte” din fișa clientului. */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import { Button, DataTable, type DataTableColumn } from "@/components/ui";
import { api } from "@/lib/api";
import { useCan } from "@/lib/auth";

import { type OfferRow } from "./lib";
import { OFFER_COLUMNS } from "./OffersPage";

const COLUMNS: DataTableColumn<OfferRow>[] = OFFER_COLUMNS.filter((c) => c.key !== "clientName");

export function ClientOffersTab({ clientId }: { clientId: string }) {
  const navigate = useNavigate();
  const canCreate = useCan("documents.create");

  const { data, isLoading, error, refetch } = useQuery<{ items: OfferRow[] }>({
    queryKey: ["legal-offers", { clientId }],
    queryFn: () => api<{ items: OfferRow[] }>("/legal/offers", { query: { clientId, pageSize: 100 } }),
  });

  return (
    <div className="space-y-4">
      {canCreate ? (
        <div className="flex justify-end">
          <Button variant="primary" onClick={() => navigate(`/legal/offers/new?clientId=${clientId}`)}>
            Ofertă nouă
          </Button>
        </div>
      ) : null}
      <DataTable
        columns={COLUMNS}
        rows={data?.items ?? []}
        rowKey="id"
        onRowClick={(row) => navigate(`/legal/offers/${row.id}`)}
        loading={isLoading}
        error={error}
        onRetry={() => void refetch()}
      />
    </div>
  );
}

export default ClientOffersTab;
