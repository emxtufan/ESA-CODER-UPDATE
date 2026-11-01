/**
 * Documente (§13): lista documentelor (cu versiuni, link temporar de descărcare) și
 * contractele care leagă clienții/proiectele de documente.
 *
 * Fișierul unei versiuni se urcă direct cu `fetch` (body brut `octet-stream`), nu prin
 * `api`, ca să nu treacă prin serializarea JSON; restul acțiunilor folosesc `api`.
 */
import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router";

import { Badge, Button, ErrorState, Modal, PageHeader, Spinner, Tabs, useToast } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { ResourcePage, type FilterDef } from "@/components/resource/ResourcePage";
import { formatDate, formatMoney, statusTone, type FieldDef } from "@/components/resource/fields";
import { api, ApiError } from "@/lib/api";
import { useCan } from "@/lib/auth";
import { CURRENCIES, DOCUMENT_TYPES } from "@shared/enums";

/** Un rând din listarea `GET /documents` (`versionCount` vine de la server). */
export type DocumentRow = {
  id: string;
  name: string;
  type: string | null;
  clientName: string | null;
  projectName: string | null;
  versionCount: number;
  uploadDate: string | null;
  expirationDate: string | null;
};

/** O versiune a unui document (`GET /documents/:id/versions`). */
export type DocumentVersion = {
  id: string;
  version: number;
  mime: string | null;
  size: number;
  createdAt: string;
  preview: boolean;
};

/** Link de descărcare temporar (`POST /documents/:id/link`). */
type TemporaryLink = { url: string; expiresAt: string };

/** Limita de încărcare: fișierele mai mari sunt refuzate din UI. */
const MAX_FILE_BYTES = 25 * 1024 * 1024;

/** Tipurile de fișiere acceptate la încărcarea unei versiuni. */
const UPLOAD_ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.zip,.docx,.xlsx";

/** Mesajul unei erori de API (serverul îl trimite deja în română). */
function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.message) return error.message;
  return error instanceof Error && error.message ? error.message : fallback;
}

/** Mărime lizibilă pentru listarea versiunilor („340 KB”, „1,2 MB”). */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb).toLocaleString("ro-RO")} KB`;
  return `${(kb / 1024).toLocaleString("ro-RO", { maximumFractionDigits: 1 })} MB`;
}

/** Un termen e expirat doar dacă data lui validă e strict în trecut. */
function isExpired(value: string | null): boolean {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

/** Coloanele listării: versiunile și expirarea sunt informațiile de risc. */
export const DOCUMENT_COLUMNS: DataTableColumn<DocumentRow>[] = [
  { key: "name", header: "Nume", sortable: true },
  { key: "type", header: "Tip" },
  { key: "clientName", header: "Client", hideOnMobile: true, render: (row) => row.clientName ?? "—" },
  { key: "projectName", header: "Proiect", hideOnMobile: true, render: (row) => row.projectName ?? "—" },
  {
    key: "versionCount",
    header: "Versiuni",
    render: (row) => (row.versionCount > 0 ? `v${row.versionCount}` : "Fără fișier"),
  },
  { key: "uploadDate", header: "Încărcat", sortable: true, render: (row) => formatDate(row.uploadDate) },
  {
    key: "expirationDate",
    header: "Expiră",
    sortable: true,
    render: (row) => (
      <span className="flex items-center gap-2">
        {formatDate(row.expirationDate)}
        {isExpired(row.expirationDate) ? <Badge tone="danger">Expirat</Badge> : null}
      </span>
    ),
  },
];

/** Câmpurile documentului: metadate plus legăturile cu clientul și proiectul. */
export const DOCUMENT_FIELDS: FieldDef[] = [
  { name: "name", label: "Nume", type: "text", required: true },
  { name: "type", label: "Tip", type: "select", options: DOCUMENT_TYPES, required: true },
  { name: "clientId", label: "Client", type: "relation", endpoint: "/clients", labelKey: "companyName" },
  { name: "projectId", label: "Proiect", type: "relation", endpoint: "/projects" },
  { name: "expirationDate", label: "Expiră la", type: "date" },
  { name: "notes", label: "Note", type: "textarea", span: 2 },
];

export const DOCUMENT_FILTERS: FilterDef[] = [
  { name: "type", label: "Tip", options: DOCUMENT_TYPES },
];

/** Încărcarea unei versiuni noi: `POST /documents/:id/versions` cu fișierul brut. */
function UploadAction({ document }: { document: DocumentRow }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    if (file.size > MAX_FILE_BYTES) {
      toast.error("Fișierul depășește limita de 25 MB.");
      return;
    }

    setUploading(true);
    try {
      const response = await fetch(`/api/documents/${document.id}/versions`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/octet-stream",
          "x-file-mime": file.type,
          "x-requested-with": "esa",
        },
        body: file,
      });

      const data = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;

      if (!response.ok) {
        throw new ApiError(
          response.status,
          "upload_failed",
          data?.error?.message ?? `Încărcarea a eșuat (${response.status})`,
        );
      }

      toast.success(`Am încărcat o versiune nouă pentru „${document.name}”.`);
      await queryClient.invalidateQueries({ queryKey: ["resource", "/documents"] });
    } catch (err) {
      toast.error(errorMessage(err, "Încărcarea a eșuat."));
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={UPLOAD_ACCEPT}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void upload(file);
        }}
      />
      <Button variant="ghost" size="sm" loading={uploading} onClick={() => inputRef.current?.click()}>
        Încarcă
      </Button>
    </>
  );
}

/** Modalul cu versiunile unui document: descărcare și, când există, previzualizare. */
function VersionsModal({
  document,
  onClose,
}: {
  document: DocumentRow | null;
  onClose: () => void;
}) {
  const documentId = document?.id ?? "";

  const versionsQuery = useQuery({
    queryKey: ["document-versions", documentId],
    queryFn: () => api<{ items: DocumentVersion[] }>(`/documents/${documentId}/versions`),
    enabled: documentId !== "",
  });

  const versions = versionsQuery.data?.items ?? [];

  return (
    <Modal
      open={document !== null}
      onClose={onClose}
      title={document ? `Versiuni — ${document.name}` : "Versiuni"}
      className="max-w-3xl"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Închide
        </Button>
      }
    >
      {versionsQuery.isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : versionsQuery.error ? (
        <ErrorState
          error={versionsQuery.error}
          onRetry={() => void versionsQuery.refetch()}
        />
      ) : versions.length === 0 ? (
        <p className="text-sm text-muted">Nicio versiune încărcată.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="pb-2 font-medium">Versiune</th>
                <th className="pb-2 font-medium">Încărcată</th>
                <th className="pb-2 text-right font-medium">Mărime</th>
                <th className="pb-2 text-right font-medium">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((version) => (
                <tr key={version.id} className="border-t border-line">
                  <td className="py-2 pr-3 text-text">{`v${version.version}`}</td>
                  <td className="py-2 pr-3 text-text">{formatDate(version.createdAt)}</td>
                  <td className="py-2 pr-3 text-right text-text">{formatSize(version.size)}</td>
                  <td className="py-2 text-right text-text">
                    <div className="flex items-center justify-end gap-3">
                      <a
                        href={`/api/documents/${documentId}/download?version=${version.id}`}
                        download
                        className="text-primary hover:underline"
                      >
                        Descarcă
                      </a>
                      {version.preview ? (
                        <a
                          href={`/api/documents/${documentId}/download?version=${version.id}&inline=1`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          Previzualizează
                        </a>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}

/** Lista documentelor; filtrele fixe vin din props (proiect sau client). */
export function DocumentsList({ projectId, clientId }: { projectId?: string; clientId?: string }) {
  const toast = useToast();
  const canUpload = useCan("documents.update");
  const canDownload = useCan("documents.download");

  const [versionsDoc, setVersionsDoc] = useState<DocumentRow | null>(null);
  const [link, setLink] = useState<TemporaryLink | null>(null);
  const [linkPendingId, setLinkPendingId] = useState<string | null>(null);

  const scope = useMemo(() => {
    const query: Record<string, string> = {};
    if (projectId) query.projectId = projectId;
    if (clientId) query.clientId = clientId;
    return query;
  }, [projectId, clientId]);

  async function createLink(document: DocumentRow) {
    setLinkPendingId(document.id);
    try {
      const data = await api<TemporaryLink>(`/documents/${document.id}/link`, {
        method: "POST",
        body: { minutes: 15 },
      });
      setLink(data);
    } catch (err) {
      toast.error(errorMessage(err, "Generarea linkului a eșuat."));
    } finally {
      setLinkPendingId(null);
    }
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiat în clipboard.");
    } catch {
      toast.error("Copierea a eșuat.");
    }
  }

  const fullLinkUrl = link ? `${window.location.origin}${link.url}` : "";

  return (
    <>
      <ResourcePage<DocumentRow>
        title="Documente"
        endpoint="/documents"
        perm="documents"
        itemName="document"
        columns={DOCUMENT_COLUMNS}
        fields={DOCUMENT_FIELDS}
        filters={DOCUMENT_FILTERS}
        extraQuery={scope}
        defaults={scope}
        embedded
        rowActions={(row) =>
          canUpload || canDownload ? (
            <div
              className="flex items-center gap-1"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {canUpload ? <UploadAction document={row} /> : null}
              {canDownload && row.versionCount > 0 ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setVersionsDoc(row)}>
                    Versiuni
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={linkPendingId === row.id}
                    onClick={() => void createLink(row)}
                  >
                    Link temporar
                  </Button>
                </>
              ) : null}
            </div>
          ) : null
        }
      />

      <VersionsModal document={versionsDoc} onClose={() => setVersionsDoc(null)} />

      <Modal
        open={link !== null}
        onClose={() => setLink(null)}
        title="Link temporar"
        footer={
          <Button variant="ghost" onClick={() => setLink(null)}>
            Închide
          </Button>
        }
      >
        {link ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Linkul expiră la {new Date(link.expiresAt).toLocaleString("ro-RO")}.
            </p>
            <code className="block overflow-x-auto rounded-md border border-line bg-bg px-3 py-2 text-xs break-all text-text">
              {fullLinkUrl}
            </code>
            <Button variant="secondary" size="sm" onClick={() => void copyLink(fullLinkUrl)}>
              Copiază
            </Button>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

/** Un rând din listarea `GET /contracts`. */
export type ContractRow = {
  id: string;
  title: string;
  clientName: string | null;
  projectName: string | null;
  value: number | null;
  currency: string | null;
  signedAt: string | null;
  expiresAt: string | null;
  status: string | null;
};

export const CONTRACT_COLUMNS: DataTableColumn<ContractRow>[] = [
  { key: "title", header: "Titlu", sortable: true },
  { key: "clientName", header: "Client", hideOnMobile: true, render: (row) => row.clientName ?? "—" },
  { key: "projectName", header: "Proiect", hideOnMobile: true, render: (row) => row.projectName ?? "—" },
  {
    key: "value",
    header: "Valoare",
    align: "right",
    render: (row) => formatMoney(row.value, row.currency ?? "RON"),
  },
  { key: "signedAt", header: "Semnat", sortable: true, render: (row) => formatDate(row.signedAt) },
  { key: "expiresAt", header: "Expiră", sortable: true, render: (row) => formatDate(row.expiresAt) },
  {
    key: "status",
    header: "Status",
    render: (row) =>
      row.status ? <Badge tone={statusTone(row.status)}>{row.status}</Badge> : "—",
  },
];

export const CONTRACT_FIELDS: FieldDef[] = [
  { name: "title", label: "Titlu", type: "text", required: true },
  {
    name: "clientId",
    label: "Client",
    type: "relation",
    endpoint: "/clients",
    labelKey: "companyName",
    required: true,
  },
  { name: "projectId", label: "Proiect", type: "relation", endpoint: "/projects" },
  { name: "documentId", label: "Document", type: "relation", endpoint: "/documents" },
  { name: "value", label: "Valoare", type: "money" },
  { name: "currency", label: "Monedă", type: "select", options: CURRENCIES },
  { name: "signedAt", label: "Semnat la", type: "date" },
  { name: "expiresAt", label: "Expiră la", type: "date" },
  { name: "status", label: "Status", type: "text" },
];

/** Lista contractelor; filtrele fixe vin din props (client sau proiect). */
export function ContractsList({ clientId, projectId }: { clientId?: string; projectId?: string }) {
  const scope = useMemo(() => {
    const query: Record<string, string> = {};
    if (projectId) query.projectId = projectId;
    if (clientId) query.clientId = clientId;
    return query;
  }, [clientId, projectId]);

  return (
    <ResourcePage<ContractRow>
      title="Contracte"
      endpoint="/contracts"
      perm="documents"
      itemName="contract"
      columns={CONTRACT_COLUMNS}
      fields={CONTRACT_FIELDS}
      extraQuery={scope}
      defaults={scope}
      embedded
    />
  );
}

/** Taburile paginii, în ordinea din specificație. */
const TAB_ITEMS = [
  { value: "documents", label: "Documente" },
  { value: "contracts", label: "Contracte" },
];

export default function DocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab");
  const activeTab: string =
    TAB_ITEMS.some((tab) => tab.value === requested) ? (requested as string) : "documents";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Documente" breadcrumbs={[{ label: "Documente" }]} />

      <Tabs
        items={TAB_ITEMS}
        value={activeTab}
        onChange={(value) => {
          const next = new URLSearchParams(searchParams);
          next.set("tab", value);
          setSearchParams(next);
        }}
      />

      {activeTab === "documents" ? <DocumentsList /> : null}

      {activeTab === "contracts" ? <ContractsList /> : null}
    </div>
  );
}
