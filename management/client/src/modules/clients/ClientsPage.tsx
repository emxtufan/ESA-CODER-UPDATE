/**
 * Lista clienților: tabel cu căutare și filtru de status, formular generat din
 * `CLIENT_FIELDS`. Câmpurile sunt partajate cu pagina de detaliu a clientului.
 */
import type { FieldDef } from "@/components/resource/fields";
import { ResourcePage, statusTone } from "@/components/resource/ResourcePage";
import { Badge, type DataTableColumn } from "@/components/ui";
import { CLIENT_STATUSES, CURRENCIES } from "@shared/enums";

/** Un rând din listarea `GET /clients`. */
type ClientRow = {
  id: string;
  companyName: string;
  city: string | null;
  primaryEmail: string | null;
  status: string | null;
};

/** Câmpurile clientului (§6): exact cele din schema zod a serverului. */
export const CLIENT_FIELDS: FieldDef[] = [
  { name: "companyName", label: "Companie", type: "text", required: true },
  { name: "legalName", label: "Denumire legală", type: "text" },
  { name: "cui", label: "CUI", type: "text" },
  { name: "regCom", label: "Reg. Com.", type: "text" },
  {
    name: "iban",
    label: "IBAN",
    type: "text",
    pattern: { value: /^RO\d{2}[A-Z]{4}[A-Z0-9]{16}$/i, message: "IBAN românesc invalid (ex. RO49AAAA1B31007593840000)." },
  },
  { name: "bank", label: "Banca", type: "text" },
  { name: "vatStatus", label: "Status TVA", type: "text" },
  { name: "country", label: "Țară", type: "text" },
  { name: "city", label: "Oraș", type: "text" },
  { name: "address", label: "Adresă", type: "textarea", span: 2 },
  { name: "postalCode", label: "Cod poștal", type: "text" },
  { name: "website", label: "Website", type: "url" },
  { name: "industry", label: "Industrie", type: "text" },
  { name: "contactPerson", label: "Persoană de contact", type: "text" },
  { name: "position", label: "Funcție", type: "text" },
  { name: "phone", label: "Telefon", type: "text" },
  { name: "primaryEmail", label: "Email principal", type: "email" },
  { name: "billingEmail", label: "Email facturare", type: "email" },
  { name: "paymentTerms", label: "Termen de plată", type: "text" },
  { name: "preferredCurrency", label: "Valută preferată", type: "select", options: CURRENCIES },
  { name: "paymentMethod", label: "Metodă de plată", type: "text" },
  { name: "status", label: "Status", type: "select", options: CLIENT_STATUSES },
  { name: "internalNotes", label: "Note interne", type: "textarea", span: 2 },
  { name: "isDemo", label: "Date DEMO", type: "checkbox" },
];

/** Coloanele listării: companie, oraș, email principal și status. */
const CLIENT_COLUMNS: DataTableColumn<ClientRow>[] = [
  { key: "companyName", header: "Companie", sortable: true },
  { key: "city", header: "Oraș", hideOnMobile: true, render: (row) => row.city ?? "—" },
  { key: "primaryEmail", header: "Email", hideOnMobile: true, render: (row) => row.primaryEmail ?? "—" },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) =>
      row.status ? <Badge tone={statusTone(row.status)}>{row.status}</Badge> : "—",
  },
];

export function ClientsPage() {
  return (
    <ResourcePage<ClientRow>
      title="Clienți"
      description="Portofoliul de clienți, cu proiectele și contactele lor."
      endpoint="/clients"
      perm="clients"
      itemName="client"
      searchPlaceholder="Caută după companie, CUI sau email…"
      columns={CLIENT_COLUMNS}
      fields={CLIENT_FIELDS}
      filters={[{ name: "status", label: "Status", options: CLIENT_STATUSES }]}
      detailPath={(row) => `/clients/${row.id}`}
    />
  );
}

export default ClientsPage;
