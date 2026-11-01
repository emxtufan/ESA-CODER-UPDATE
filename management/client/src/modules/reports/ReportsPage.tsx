/** Rapoarte (§17): aceleași date pe ecran și la export; moneda rămâne pe fiecare rând. */
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useRelationOptions } from "@/components/resource/fields";
import { DataTable, EmptyState, Field, Input, PageHeader, Select } from "@/components/ui";
import { api, qs } from "@/lib/api";
import { useCan } from "@/lib/auth";
import { CURRENCIES } from "@shared/enums";

type Cell = string | number | null;

interface ReportData {
  columns: { key: string; label: string }[];
  rows: Record<string, Cell>[];
  limited: boolean;
}

const LINK = "inline-flex items-center rounded-lg border border-line px-3 py-2 text-sm text-text transition-colors hover:border-primary hover:text-primary";

export default function ReportsPage() {
  const finance = useCan("finance.view");
  const profitability = useCan("finance.profitability");
  const infrastructure = useCan("infrastructure.view");
  const reports = [
    { value: "projects", label: "Proiecte" },
    { value: "clients", label: "Clienți" },
    ...(finance ? [{ value: "revenue", label: "Venituri" }, { value: "expenses", label: "Cheltuieli" }] : []),
    ...(profitability ? [{ value: "profitability", label: "Profitabilitate" }] : []),
    { value: "maintenance", label: "Mentenanță" },
    { value: "tasks", label: "Taskuri" },
    ...(infrastructure ? [{ value: "server-costs", label: "Costuri servere" }, { value: "domain-renewals", label: "Reînnoiri domenii" }] : []),
  ];

  const [type, setType] = useState("projects");
  const [filters, setFilters] = useState({ from: "", to: "", clientId: "", projectId: "", currency: "", status: "" });
  const clients = useRelationOptions("/clients", "companyName");
  const projects = useRelationOptions("/projects");
  const set = (key: keyof typeof filters) => (event: { target: { value: string } }) =>
    setFilters((prev) => ({ ...prev, [key]: event.target.value }));

  const query = useQuery({
    queryKey: ["report", type, filters],
    queryFn: () => api<ReportData>(`/reports/${type}`, { query: filters }),
  });
  const columns = (query.data?.columns ?? []).map((c) => ({
    key: c.key,
    header: c.label,
    render: (row: Record<string, Cell> & { __i: number }) => row[c.key] ?? "—",
  }));
  const rows = (query.data?.rows ?? []).map((row, i) => ({ ...row, __i: i }));

  const search = qs(filters).replace(/^\?/, "");
  const exportUrl = (format: string) => `/api/reports/${type}?${search ? `${search}&` : ""}format=${format}`;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Rapoarte"
        description="Sumele sunt în unități întregi, cu moneda pe rând."
        actions={
          <div className="flex gap-2">
            <a className={LINK} href={exportUrl("csv")} download>
              CSV
            </a>
            <a className={LINK} href={exportUrl("xlsx")} download>
              Excel
            </a>
          </div>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Raport" htmlFor="report-type">
          <Select id="report-type" value={type} options={reports} onChange={(event) => setType(event.target.value)} />
        </Field>
        <Field label="De la" htmlFor="report-from">
          <Input id="report-from" type="date" value={filters.from} onChange={set("from")} />
        </Field>
        <Field label="Până la" htmlFor="report-to">
          <Input id="report-to" type="date" value={filters.to} onChange={set("to")} />
        </Field>
        <Field label="Client" htmlFor="report-client">
          <Select id="report-client" value={filters.clientId} options={[{ value: "", label: "Toți" }, ...clients.options]} onChange={set("clientId")} />
        </Field>
        <Field label="Proiect" htmlFor="report-project">
          <Select id="report-project" value={filters.projectId} options={[{ value: "", label: "Toate" }, ...projects.options]} onChange={set("projectId")} />
        </Field>
        <Field label="Monedă" htmlFor="report-currency">
          <Select id="report-currency" value={filters.currency} options={[{ value: "", label: "Toate" }, ...CURRENCIES.map((c) => ({ value: c, label: c }))]} onChange={set("currency")} />
        </Field>
        <Field label="Status" htmlFor="report-status">
          <Input id="report-status" value={filters.status} onChange={set("status")} />
        </Field>
      </div>
      {query.data ? (
        <p className="text-sm text-muted">
          {query.data.rows.length} rânduri{query.data.limited ? ". Raport limitat la 10.000 de rânduri." : ""}
        </p>
      ) : null}
      <DataTable
        columns={columns}
        rows={rows}
        rowKey="__i"
        loading={query.isLoading}
        error={query.error}
        onRetry={() => void query.refetch()}
        empty={<EmptyState title="Niciun rând" description="Schimbă filtrele sau adaugă date." />}
      />
    </div>
  );
}
