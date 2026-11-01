/**
 * Financiar (§12): facturi, cheltuieli, cursuri de schimb și profit.
 *
 * Sumele rămân separate pe monedă: sumarul afișează un card per monedă, iar
 * conversia se face doar cu cursurile datate din `/exchange-rates`. Tab-urile
 * stau în URL (`?tab=`), ca să poată fi legate din căutarea globală.
 */
import { useState } from "react";
import { useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";

import {
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  Field,
  Input,
  PageHeader,
  Select,
  Spinner,
  Tabs,
  type DataTableColumn,
  type SelectOption,
} from "@/components/ui";
import { ResourcePage, type FilterDef } from "@/components/resource/ResourcePage";
import { formatDate, formatMoney, type FieldDef } from "@/components/resource/fields";
import { api } from "@/lib/api";
import { InvoicesTab } from "@/modules/finance/InvoicesTab";
import { CURRENCIES, EXPENSE_CATEGORIES } from "@shared/enums";

/** Un rând din listarea `GET /expenses` (`projectName` vine de la proiect). */
export type ExpenseRow = {
  id: string;
  name: string;
  category: string | null;
  supplier: string | null;
  projectId: string | null;
  projectName: string | null;
  amount: number;
  currency: string;
  spentAt: string | null;
  recurring: boolean;
};

/** Un rând din listarea `GET /exchange-rates`. */
type ExchangeRateRow = {
  id: string;
  date: string | null;
  fromCurrency: string;
  toCurrency: string;
  rate: string | number;
  source: string | null;
};

/** Un rând din `GET /finance/summary` — sumele sunt în minor units. */
type SummaryRow = {
  currency: string;
  revenue: number;
  invoiced: number;
  collected: number;
  outstanding: number;
  expenses: number;
  profit: number;
  converted: { currency: string; profit: number; rate: number; rateDate: string } | null;
};

/** Un rând din `GET /finance/by-project` — profit pe proiect + monedă. */
type ProjectProfitRow = {
  projectId: string;
  projectName: string | null;
  currency: string;
  revenue: number;
  expenses: number;
  profit: number;
};

const CURRENCY_OPTIONS: SelectOption[] = CURRENCIES.map((currency) => ({
  value: currency,
  label: currency,
}));

export const EXPENSE_FILTERS: FilterDef[] = [
  { name: "category", label: "Categorie", options: EXPENSE_CATEGORIES },
  { name: "currency", label: "Valută", options: CURRENCIES },
];

/** Câmpurile cheltuielii: exact cele din schema serverului. */
export const EXPENSE_FIELDS: FieldDef[] = [
  { name: "name", label: "Nume", type: "text", required: true },
  { name: "category", label: "Categorie", type: "select", options: EXPENSE_CATEGORIES, required: true },
  { name: "supplier", label: "Furnizor", type: "text" },
  { name: "projectId", label: "Proiect", type: "relation", endpoint: "/projects" },
  { name: "amount", label: "Sumă", type: "money", required: true },
  { name: "currency", label: "Valută", type: "select", options: CURRENCIES, required: true },
  { name: "spentAt", label: "Cheltuit la", type: "date", required: true },
  { name: "recurring", label: "Recurentă", type: "checkbox" },
];

export const EXPENSE_COLUMNS: DataTableColumn<ExpenseRow>[] = [
  { key: "name", header: "Nume", sortable: true },
  { key: "category", header: "Categorie", render: (row) => row.category ?? "—" },
  { key: "supplier", header: "Furnizor", hideOnMobile: true, render: (row) => row.supplier ?? "—" },
  {
    key: "projectName",
    header: "Proiect",
    hideOnMobile: true,
    render: (row) => row.projectName ?? "—",
  },
  {
    key: "amount",
    header: "Sumă",
    align: "right",
    render: (row) => formatMoney(row.amount, row.currency),
  },
  {
    key: "spentAt",
    header: "Cheltuit la",
    sortable: true,
    render: (row) => formatDate(row.spentAt),
  },
  { key: "recurring", header: "Recurentă", render: (row) => (row.recurring ? "Da" : "—") },
];

const RATE_COLUMNS: DataTableColumn<ExchangeRateRow>[] = [
  { key: "date", header: "Data", sortable: true, render: (row) => formatDate(row.date) },
  { key: "fromCurrency", header: "Din", render: (row) => row.fromCurrency },
  { key: "toCurrency", header: "În", render: (row) => row.toCurrency },
  { key: "rate", header: "Curs", align: "right", render: (row) => String(row.rate ?? "—") },
  { key: "source", header: "Sursă", hideOnMobile: true, render: (row) => row.source ?? "—" },
];

const RATE_FIELDS: FieldDef[] = [
  { name: "date", label: "Data", type: "date", required: true },
  { name: "fromCurrency", label: "Din", type: "select", options: CURRENCIES, required: true },
  { name: "toCurrency", label: "În", type: "select", options: CURRENCIES, required: true },
  { name: "rate", label: "Curs", type: "number", required: true },
  { name: "source", label: "Sursă", type: "text" },
];

const PROFIT_COLUMNS: DataTableColumn<ProjectProfitRow>[] = [
  {
    key: "projectName",
    header: "Proiect",
    render: (row) => row.projectName ?? "—",
  },
  { key: "currency", header: "Monedă", render: (row) => row.currency },
  {
    key: "revenue",
    header: "Venit",
    align: "right",
    render: (row) => formatMoney(row.revenue, row.currency),
  },
  {
    key: "expenses",
    header: "Cheltuieli",
    align: "right",
    render: (row) => formatMoney(row.expenses, row.currency),
  },
  {
    key: "profit",
    header: "Profit",
    align: "right",
    render: (row) => formatMoney(row.profit, row.currency),
  },
];

/** Tab-ul de profit: sumar per monedă + profit pe proiect, în intervalul ales. */
function ProfitTab() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [convertTo, setConvertTo] = useState("");

  const summary = useQuery({
    queryKey: ["finance-summary", from, to, convertTo],
    queryFn: () =>
      api<{ items: SummaryRow[] }>("/finance/summary", {
        query: { from, to, convertTo },
      }),
  });

  const byProject = useQuery({
    queryKey: ["finance-by-project", from, to],
    queryFn: () =>
      api<{ items: ProjectProfitRow[] }>("/finance/by-project", { query: { from, to } }),
  });

  const rows = summary.data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="De la" htmlFor="profit-from">
          <Input
            id="profit-from"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </Field>
        <Field label="Până la" htmlFor="profit-to">
          <Input
            id="profit-to"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </Field>
        <Field label="Convertește în" htmlFor="profit-convert">
          <Select
            id="profit-convert"
            options={[{ value: "", label: "Fără conversie" }, ...CURRENCY_OPTIONS]}
            value={convertTo}
            onChange={(event) => setConvertTo(event.target.value)}
          />
        </Field>
      </div>

      {summary.isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : summary.error ? (
        <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Nicio sumă în interval"
          description="Nu există facturi sau cheltuieli în perioada aleasă."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((row) => (
            <Card key={row.currency} title={row.currency}>
              <dl className="grid gap-2">
                {[
                  { label: "Venit (fără TVA)", value: row.revenue },
                  { label: "Facturat", value: row.invoiced },
                  { label: "Încasat", value: row.collected },
                  { label: "De încasat", value: row.outstanding },
                  { label: "Cheltuieli", value: row.expenses },
                  { label: "Profit", value: row.profit },
                ].map((entry) => (
                  <div
                    key={entry.label}
                    className="flex flex-wrap items-baseline justify-between gap-2"
                  >
                    <dt className="text-sm text-muted">{entry.label}</dt>
                    <dd className="text-sm tabular-nums text-text">
                      {formatMoney(entry.value, row.currency)}
                    </dd>
                  </div>
                ))}
              </dl>

              {convertTo && convertTo !== row.currency ? (
                <p className="mt-3 text-xs text-muted">
                  {row.converted
                    ? `≈ ${formatMoney(row.converted.profit, row.converted.currency)} la cursul din ${row.converted.rateDate}`
                    : "Fără curs pentru această conversie"}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-text">Profit pe proiect</h3>
        <DataTable<ProjectProfitRow>
          columns={PROFIT_COLUMNS}
          rows={byProject.data?.items ?? []}
          rowKey="projectId"
          loading={byProject.isLoading}
          error={byProject.error}
          onRetry={() => void byProject.refetch()}
          empty={
            <EmptyState
              title="Fără date"
              description="Nu există profit înregistrat în perioada aleasă."
            />
          }
        />
      </section>
    </div>
  );
}

const TAB_ITEMS = [
  { value: "invoices", label: "Facturi" },
  { value: "expenses", label: "Cheltuieli" },
  { value: "rates", label: "Cursuri" },
  { value: "profit", label: "Profit" },
];

export function FinancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab");
  const tab: string = TAB_ITEMS.some((item) => item.value === requested)
    ? (requested as string)
    : "invoices";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Financiar"
        description="Evidență, nu contabilitate. Sumele rămân separate pe monedă."
      />

      <Tabs
        items={TAB_ITEMS}
        value={tab}
        onChange={(value) => {
          const next = new URLSearchParams(searchParams);
          next.set("tab", value);
          setSearchParams(next);
        }}
      />

      {tab === "invoices" ? <InvoicesTab /> : null}

      {tab === "expenses" ? (
        <ResourcePage<ExpenseRow>
          title="Cheltuieli"
          endpoint="/expenses"
          perm="finance"
          itemName="cheltuială"
          columns={EXPENSE_COLUMNS}
          fields={EXPENSE_FIELDS}
          filters={EXPENSE_FILTERS}
          embedded
        />
      ) : null}

      {tab === "rates" ? (
        <ResourcePage<ExchangeRateRow>
          title="Cursuri de schimb"
          description="Conversiile folosesc doar aceste cursuri."
          endpoint="/exchange-rates"
          perm="finance"
          itemName="curs"
          columns={RATE_COLUMNS}
          fields={RATE_FIELDS}
          embedded
        />
      ) : null}

      {tab === "profit" ? <ProfitTab /> : null}
    </div>
  );
}

export default FinancePage;
