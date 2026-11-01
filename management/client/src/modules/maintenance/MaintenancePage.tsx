/** Mentenanță (§11): planuri pe proiect și jurnalul intervențiilor. */
import { useSearchParams } from "react-router";
import { ResourcePage } from "@/components/resource/ResourcePage";
import { formatDate, formatMoney, type FieldDef } from "@/components/resource/fields";
import { PageHeader, Tabs, type DataTableColumn } from "@/components/ui";
import { CURRENCIES, MAINTENANCE_ACTIVITIES, MAINTENANCE_PLANS } from "@shared/enums";

interface PlanRow {
  id: string;
  projectName: string | null;
  plan: string;
  monthlyPrice: number;
  currency: string;
  renewalDate: string | null;
  frequency: string | null;
  contractStatus: string | null;
}

interface LogRow {
  id: string;
  activity: string;
  performedAt: string;
  notes: string | null;
}

export const PLAN_COLUMNS: DataTableColumn<PlanRow>[] = [
  { key: "projectName", header: "Proiect" },
  { key: "plan", header: "Plan" },
  { key: "monthlyPrice", header: "Preț lunar", render: (r) => formatMoney(r.monthlyPrice, r.currency) },
  { key: "renewalDate", header: "Reînnoire", sortable: true, render: (r) => formatDate(r.renewalDate) },
  { key: "frequency", header: "Frecvență" },
  { key: "contractStatus", header: "Contract" },
];

export const PLAN_FIELDS: FieldDef[] = [
  { name: "projectId", label: "Proiect", type: "relation", endpoint: "/projects", required: true },
  { name: "plan", label: "Plan", type: "select", options: MAINTENANCE_PLANS, required: true },
  { name: "monthlyPrice", label: "Preț lunar", type: "money", required: true },
  { name: "currency", label: "Monedă", type: "select", options: CURRENCIES, required: true },
  { name: "startDate", label: "Început", type: "date" },
  { name: "renewalDate", label: "Reînnoire", type: "date" },
  { name: "frequency", label: "Frecvență", type: "select", options: ["Lunar", "Trimestrial", "Anual"], hint: "Creează automat câte un task pe perioadă." },
  { name: "contractStatus", label: "Status contract", type: "text" },
  { name: "includedServices", label: "Servicii incluse", type: "tags", span: 2 },
];

const LOG_COLUMNS: DataTableColumn<LogRow>[] = [
  { key: "activity", header: "Activitate" },
  { key: "performedAt", header: "Data", sortable: true, render: (r) => formatDate(r.performedAt) },
  { key: "notes", header: "Note" },
];

const LOG_FIELDS: FieldDef[] = [
  { name: "planId", label: "Plan", type: "relation", endpoint: "/maintenance/plans", labelKey: "projectName", required: true },
  { name: "activity", label: "Activitate", type: "select", options: MAINTENANCE_ACTIVITIES, required: true },
  { name: "performedAt", label: "Data", type: "date" },
  { name: "notes", label: "Note", type: "textarea", span: 2 },
];

const TABS = [
  { value: "plans", label: "Planuri" },
  { value: "logs", label: "Intervenții" },
];

export default function MaintenancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "logs" ? "logs" : "plans";
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Mentenanță" description="Planuri pe proiect și jurnalul intervențiilor." />
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
      {tab === "plans" ? (
        <ResourcePage<PlanRow> embedded title="Planuri" endpoint="/maintenance/plans" perm="maintenance" itemName="plan" columns={PLAN_COLUMNS} fields={PLAN_FIELDS} filters={[{ name: "plan", label: "Plan", options: MAINTENANCE_PLANS }]} />
      ) : (
        <ResourcePage<LogRow> embedded title="Intervenții" endpoint="/maintenance/logs" perm="maintenance" itemName="intervenție" columns={LOG_COLUMNS} fields={LOG_FIELDS} filters={[{ name: "activity", label: "Activitate", options: MAINTENANCE_ACTIVITIES }]} />
      )}
    </div>
  );
}
