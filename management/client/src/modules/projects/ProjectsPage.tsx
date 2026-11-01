/**
 * Lista proiectelor: tabel cu numele proiectului și clientul dedesubt, filtrabil pe
 * status/tip/prioritate, plus formularul generat din `PROJECT_FIELDS`.
 */
import type { FieldDef } from "@/components/resource/fields";
import { ResourcePage, formatDate, statusTone } from "@/components/resource/ResourcePage";
import { Badge, type DataTableColumn } from "@/components/ui";
import { CURRENCIES, PRIORITIES, PROJECT_STATUSES, PROJECT_TYPES } from "@shared/enums";

/** Un rând din listarea `GET /projects`. */
type ProjectRow = {
  id: string;
  name: string;
  clientName: string | null;
  type: string;
  status: string;
  deadline: string | null;
  priority: string;
};

/** Câmpurile proiectului (§5): exact cele din schema zod a serverului. */
export const PROJECT_FIELDS: FieldDef[] = [
  { name: "name", label: "Nume", type: "text", required: true },
  {
    name: "clientId",
    label: "Client",
    type: "relation",
    endpoint: "/clients",
    labelKey: "companyName",
    required: true,
  },
  { name: "description", label: "Descriere", type: "textarea", span: 2 },
  { name: "type", label: "Tip", type: "select", options: PROJECT_TYPES, required: true },
  { name: "status", label: "Status", type: "select", options: PROJECT_STATUSES, required: true },
  { name: "priority", label: "Prioritate", type: "select", options: PRIORITIES, required: true },
  { name: "websiteUrl", label: "Website", type: "url" },
  { name: "adminUrl", label: "Admin URL", type: "url" },
  { name: "startDate", label: "Data început", type: "date" },
  { name: "deadline", label: "Termen", type: "date" },
  { name: "deliveryDate", label: "Data livrare", type: "date" },
  { name: "contractValue", label: "Valoare contract", type: "money" },
  { name: "currency", label: "Valută", type: "select", options: CURRENCIES },
  { name: "maintenanceStatus", label: "Status mentenanță", type: "text" },
  { name: "internalNotes", label: "Note interne", type: "textarea", span: 2 },
  { name: "tags", label: "Etichete", type: "tags" },
];

/** Coloanele listării: proiect (cu clientul dedesubt), tip, status, termen și prioritate. */
const PROJECT_COLUMNS: DataTableColumn<ProjectRow>[] = [
  {
    key: "name",
    header: "Proiect",
    sortable: true,
    render: (row) => (
      <div className="min-w-0">
        <span className="block truncate font-medium">{row.name}</span>
        {row.clientName ? (
          <span className="block truncate text-xs text-muted">{row.clientName}</span>
        ) : null}
      </div>
    ),
  },
  { key: "type", header: "Tip", hideOnMobile: true },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
  },
  { key: "deadline", header: "Termen", sortable: true, render: (row) => formatDate(row.deadline) },
  { key: "priority", header: "Prioritate", sortable: true },
];

export function ProjectsPage() {
  return (
    <ResourcePage<ProjectRow>
      title="Proiecte"
      description="Portofoliul de proiecte, cu statusul, termenele și prioritatea lor."
      endpoint="/projects"
      perm="projects"
      itemName="proiect"
      searchPlaceholder="Caută după nume, slug sau URL…"
      columns={PROJECT_COLUMNS}
      fields={PROJECT_FIELDS}
      filters={[
        { name: "status", label: "Status", options: PROJECT_STATUSES },
        { name: "type", label: "Tip", options: PROJECT_TYPES },
        { name: "priority", label: "Prioritate", options: PRIORITIES },
      ]}
      detailPath={(row) => `/projects/${row.id}`}
      defaults={{
        status: "Planned",
        priority: "Medium",
        currency: "RON",
        type: "Custom Website",
      }}
    />
  );
}

export default ProjectsPage;
