/**
 * Detaliul unui client: date generale, proiecte, contacte și timeline-ul de
 * activitate, plus editarea în modal peste câmpurile partajate `CLIENT_FIELDS`.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, type FieldValues } from "react-hook-form";
import { Link, useParams, useSearchParams } from "react-router";

import type { FieldDef } from "@/components/resource/fields";
import {
  ResourceFormField,
  formValuesToBody,
  resourceDefaults,
} from "@/components/resource/fields";
import { ResourcePage, formatDate, statusTone } from "@/components/resource/ResourcePage";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Modal,
  PageHeader,
  Skeleton,
  Spinner,
  Tabs,
  cn,
  useToast,
  type DataTableColumn,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useCan } from "@/lib/auth";
import { pushRecent } from "@/lib/recent";
import { InvoicesTab } from "@/modules/finance/InvoicesTab";

import { CLIENT_FIELDS } from "./ClientsPage";

/** Rândul complet al clientului (`GET /clients/:id` → `{ item }`). */
type ClientDetail = Record<string, unknown> & {
  id: string;
  companyName: string;
};

type ClientProject = {
  id: string;
  name: string;
  status: string | null;
  websiteUrl: string | null;
};

type ClientActivity = {
  id: string;
  at: string;
  actorId: string | null;
  actorLabel: string | null;
  type: string;
  description: string;
  entityType: string | null;
  entityId: string | null;
};

/** `GET /clients/:id/summary` → proiectele clientului + ultimele 20 de activități. */
type ClientSummary = {
  projects: ClientProject[];
  recentActivity: ClientActivity[];
};

type ContactRow = {
  id: string;
  name: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

const TABS = [
  { value: "date", label: "Date" },
  { value: "projects", label: "Proiecte" },
  { value: "contacts", label: "Contacte" },
  { value: "activity", label: "Activitate" },
];

/** Tab-ul de facturi apare doar pentru cine are `finance.view`. */
const INVOICES_TAB = { value: "invoices", label: "Facturi" };

/** Contactele suplimentare ale clientului (tabela `contacts`, filtrată pe `clientId`). */
const CONTACT_FIELDS: FieldDef[] = [
  { name: "name", label: "Nume", type: "text", required: true },
  { name: "position", label: "Funcție", type: "text" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Telefon", type: "text" },
  { name: "notes", label: "Note", type: "textarea", span: 2 },
];

const CONTACT_COLUMNS: DataTableColumn<ContactRow>[] = [
  { key: "name", header: "Nume", sortable: true },
  { key: "position", header: "Funcție", render: (row) => row.position ?? "—" },
  { key: "email", header: "Email", hideOnMobile: true, render: (row) => row.email ?? "—" },
  { key: "phone", header: "Telefon", hideOnMobile: true, render: (row) => row.phone ?? "—" },
];

/** Valoarea unui câmp, gata de afișat în panoul read-only. */
function displayValue(field: FieldDef, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";

  switch (field.type) {
    case "checkbox":
      return value ? "Da" : "Nu";
    case "date":
    case "datetime":
      return formatDate(String(value));
    default:
      return String(value);
  }
}

/** Modalul de editare: aceleași câmpuri ca la creare, trimise prin `PATCH`. */
function EditClientModal({ client, onClose }: { client: ClientDetail; onClose: () => void }) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FieldValues>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.reset(resourceDefaults(CLIENT_FIELDS, client));
  }, [client, form]);

  const submit = form.handleSubmit(async (values) => {
    setSaving(true);
    try {
      await api(`/clients/${client.id}`, {
        method: "PATCH",
        body: formValuesToBody(CLIENT_FIELDS, values, true),
      });

      toast.success("Am salvat modificările pentru client.");
      await queryClient.invalidateQueries({ queryKey: ["client", client.id] });
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        for (const [name, message] of Object.entries(error.fields)) {
          form.setError(name, { message });
        }
      }
      toast.error(error instanceof Error ? error.message : "Salvarea a eșuat.");
    } finally {
      setSaving(false);
    }
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="Editează client"
      className="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Anulează
          </Button>
          <Button variant="primary" loading={saving} onClick={() => void submit()}>
            Salvează
          </Button>
        </>
      }
    >
      <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={submit}>
        {CLIENT_FIELDS.map((field) => (
          <ResourceFormField key={field.name} field={field} form={form} />
        ))}
      </form>
    </Modal>
  );
}

/** Tab-ul „Proiecte”: link către detaliul proiectului și statusul lui. */
function ProjectsTab({ projects }: { projects: ClientProject[] }) {
  if (projects.length === 0) {
    return <EmptyState title="Niciun proiect" description="Clientul nu are încă proiecte." />;
  }

  return (
    <ul className="grid gap-2">
      {projects.map((project) => (
        <li
          key={project.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-3 py-2"
        >
          <Link to={`/projects/${project.id}`} className="text-sm font-medium text-primary hover:underline">
            {project.name}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {project.websiteUrl ? (
              <a
                href={project.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted hover:text-text"
              >
                {project.websiteUrl}
              </a>
            ) : null}
            <Badge tone={statusTone(project.status)}>{project.status ?? "—"}</Badge>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Tab-ul „Activitate”: timeline-ul clientului, cele mai recente intrări primele. */
function ActivityTab({ activity }: { activity: ClientActivity[] }) {
  if (activity.length === 0) {
    return <EmptyState title="Nicio activitate" description="Nu există intrări în timeline." />;
  }

  return (
    <ul className="grid gap-2">
      {activity.map((entry) => (
        <li key={entry.id} className="rounded-md border border-line px-3 py-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm text-text">{entry.description}</span>
            <span className="text-xs text-muted">{formatDate(entry.at)}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
            <Badge>{entry.type}</Badge>
            <span>{entry.actorLabel ?? "Sistem"}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Câmpurile read-only ale clientului: `CLIENT_FIELDS` cu valorile formatate. */
function ClientFieldsPanel({ client }: { client: ClientDetail }) {
  return (
    <Card title="Date client">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CLIENT_FIELDS.map((field) => (
          <div key={field.name} className={cn(field.span === 2 && "sm:col-span-2")}>
            <dt className="text-xs text-muted">{field.label}</dt>
            <dd className="mt-0.5 text-sm break-words text-text">
              {displayValue(field, client[field.name])}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

/** Contactele clientului, filtrate pe `clientId` în tabela `contacts`. */
function ClientContactsTab({ clientId, clientName }: { clientId: string; clientName: string }) {
  const clientFilter = useMemo(() => ({ clientId }), [clientId]);

  return (
    <ResourcePage<ContactRow>
      title="Contacte"
      description={`Contactele clientului ${clientName}`}
      endpoint="/contacts"
      perm="clients"
      itemName="contact"
      columns={CONTACT_COLUMNS}
      fields={CONTACT_FIELDS}
      extraQuery={clientFilter}
      defaults={clientFilter}
      embedded
    />
  );
}

/**
 * Fișa clientului refolosibilă în alte ecrane (ex. panouri laterale): datele din
 * tabul „Date”, contactele și acțiunile rapide de editare / deschidere fișă.
 */
export function ClientInfo({ clientId }: { clientId: string }) {
  const [editing, setEditing] = useState(false);

  const clientQuery = useQuery<{ item: ClientDetail }>({
    queryKey: ["client", clientId],
    queryFn: () => api<{ item: ClientDetail }>(`/clients/${clientId}`),
    enabled: Boolean(clientId),
  });

  const canUpdate = useCan("clients.update");

  if (clientQuery.isLoading) {
    return (
      <div className="grid gap-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (clientQuery.error || !clientQuery.data) {
    return <ErrorState error={clientQuery.error} onRetry={() => void clientQuery.refetch()} />;
  }

  const client = clientQuery.data.item;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-text">{client.companyName}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {canUpdate ? (
            <Button variant="primary" onClick={() => setEditing(true)}>
              Editează
            </Button>
          ) : null}
          <Link to={`/clients/${clientId}`} className="text-sm font-medium text-primary hover:underline">
            Deschide fișa clientului
          </Link>
        </div>
      </div>

      <ClientFieldsPanel client={client} />

      <ClientContactsTab clientId={clientId} clientName={client.companyName} />

      {editing ? <EditClientModal client={client} onClose={() => setEditing(false)} /> : null}
    </div>
  );
}

export function ClientDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editing, setEditing] = useState(false);

  const clientQuery = useQuery<{ item: ClientDetail }>({
    queryKey: ["client", id],
    queryFn: () => api<{ item: ClientDetail }>(`/clients/${id}`),
    enabled: Boolean(id),
  });

  const clientName = clientQuery.data?.item.companyName;

  useEffect(() => {
    if (!clientName) return;
    pushRecent({ label: clientName, to: `/clients/${id}` });
  }, [clientName, id]);

  const summaryQuery = useQuery<ClientSummary>({
    queryKey: ["client", id, "summary"],
    queryFn: () => api<ClientSummary>(`/clients/${id}/summary`),
    enabled: Boolean(id),
  });

  const canViewFinance = useCan("finance.view");
  const tabs = canViewFinance ? [...TABS, INVOICES_TAB] : TABS;

  const requestedTab = searchParams.get("tab") ?? "";
  const tab = tabs.some((item) => item.value === requestedTab) ? requestedTab : "date";

  function changeTab(value: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", value);
        return next;
      },
      { replace: true },
    );
  }

  if (clientQuery.isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (clientQuery.error || !clientQuery.data) {
    return <ErrorState error={clientQuery.error} onRetry={() => void clientQuery.refetch()} />;
  }

  const client = clientQuery.data.item;

  /** Conținutul tab-urilor care depind de sumar, cu stările de încărcare și eroare. */
  function summaryContent(render: (summary: ClientSummary) => ReactNode) {
    if (summaryQuery.isLoading) {
      return (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      );
    }
    if (summaryQuery.error || !summaryQuery.data) {
      return <ErrorState error={summaryQuery.error} onRetry={() => void summaryQuery.refetch()} />;
    }
    return render(summaryQuery.data);
  }

  return (
    <div className="grid gap-4">
      <PageHeader
        title={client.companyName}
        breadcrumbs={[{ label: "Clienți", href: "/clients" }, { label: client.companyName }]}
        actions={
          <Button variant="primary" onClick={() => setEditing(true)}>
            Editează
          </Button>
        }
      />

      <Tabs items={tabs} value={tab} onChange={changeTab} />

      {tab === "date" ? <ClientFieldsPanel client={client} /> : null}

      {tab === "projects"
        ? summaryContent((summary) => <ProjectsTab projects={summary.projects} />)
        : null}

      {tab === "contacts" ? (
        <ClientContactsTab clientId={id} clientName={client.companyName} />
      ) : null}

      {tab === "activity"
        ? summaryContent((summary) => <ActivityTab activity={summary.recentActivity} />)
        : null}

      {tab === "invoices" && canViewFinance ? <InvoicesTab clientId={id} /> : null}

      {editing ? <EditClientModal client={client} onClose={() => setEditing(false)} /> : null}
    </div>
  );
}

export default ClientDetailPage;
