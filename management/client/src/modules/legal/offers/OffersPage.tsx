/** Lista ofertelor (`/legal/offers`): căutare, filtre după status și tip, import de ciorne. */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { OFFER_KINDS, OFFER_STATUSES, OFFER_STATUS_LABELS, formatMoney } from "@shared/offers";

import { formatDate } from "@/components/resource/ResourcePage";
import { Badge, Button, DataTable, Input, PageHeader, Pagination, Select, type DataTableColumn } from "@/components/ui";
import { api } from "@/lib/api";
import { useCan } from "@/lib/auth";
import { useListParams } from "@/lib/useListParams";

import { ImportDraftDialog } from "./ImportDraftDialog";
import { KIND_LABELS, OFFER_STATUS_TONES, type OfferRow } from "./lib";

export const OFFER_COLUMNS: DataTableColumn<OfferRow>[] = [
  { key: "number", header: "Număr", render: (row) => <span className="font-medium">{row.number}</span> },
  {
    key: "clientName",
    header: "Client",
    render: (row) => (
      <Link to={`/clients/${row.clientId}`} className="hover:underline" onClick={(event) => event.stopPropagation()}>
        {row.clientName}
      </Link>
    ),
  },
  { key: "title", header: "Titlu", hideOnMobile: true, render: (row) => row.title || "—" },
  { key: "kind", header: "Tip", hideOnMobile: true, render: (row) => KIND_LABELS[row.kind] },
  {
    key: "status",
    header: "Status",
    render: (row) => <Badge tone={OFFER_STATUS_TONES[row.status]}>{OFFER_STATUS_LABELS[row.status]}</Badge>,
  },
  { key: "netTotal", header: "Valoare netă", align: "right", render: (row) => formatMoney(row.netTotal, row.currency) },
  { key: "date", header: "Data", hideOnMobile: true, render: (row) => formatDate(row.date) },
  { key: "version", header: "Versiune", hideOnMobile: true, align: "right", render: (row) => `v${row.version}` },
];

export function OffersPage() {
  const navigate = useNavigate();
  const canCreate = useCan("documents.create");
  const list = useListParams();
  const [importing, setImporting] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<{ items: OfferRow[]; total: number }>({
    queryKey: ["legal-offers", list.query],
    queryFn: () => api<{ items: OfferRow[]; total: number }>("/legal/offers", { query: list.query }),
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Oferte"
        description="Ofertele comerciale și actele adiționale, de la ciornă la dosarul contractual."
        actions={
          canCreate ? (
            <>
              <Button variant="secondary" onClick={() => setImporting(true)}>
                Importă ciornă
              </Button>
              <Button variant="primary" onClick={() => navigate("/legal/offers/new")}>
                Ofertă nouă
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-72">
          <Input
            value={list.qInput}
            onChange={(event) => list.setQ(event.target.value)}
            placeholder="Caută după număr, client sau titlu…"
            aria-label="Caută oferte"
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            aria-label="Status"
            value={list.filters.status ?? ""}
            options={[{ value: "", label: "Toate statusurile" }, ...OFFER_STATUSES.map((s) => ({ value: s, label: OFFER_STATUS_LABELS[s] }))]}
            onChange={(event) => list.setFilter("status", event.target.value || null)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            aria-label="Tip"
            value={list.filters.kind ?? ""}
            options={[{ value: "", label: "Toate tipurile" }, ...OFFER_KINDS.map((k) => ({ value: k, label: KIND_LABELS[k] }))]}
            onChange={(event) => list.setFilter("kind", event.target.value || null)}
          />
        </div>
      </div>

      <DataTable
        columns={OFFER_COLUMNS}
        rows={data?.items ?? []}
        rowKey="id"
        onRowClick={(row) => navigate(`/legal/offers/${row.id}`)}
        loading={isLoading}
        error={error}
        onRetry={() => void refetch()}
      />

      <Pagination page={list.page} pageSize={list.pageSize} total={data?.total ?? 0} onPage={list.setPage} />

      {importing ? <ImportDraftDialog onClose={() => setImporting(false)} /> : null}
    </div>
  );
}

export default OffersPage;
