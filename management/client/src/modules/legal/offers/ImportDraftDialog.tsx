/** Importul unei ciorne JSON (v2 sau v1 din generatorul vechi) ca ofertă nouă. */
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import { Button, Modal, Select, useToast } from "@/components/ui";
import { api } from "@/lib/api";

import { DRAFT_MAX_BYTES, importDraft, type ImportedDraft } from "../dossier/drafts";
import { useServices } from "./hooks";
import { LabeledField as Field } from "./Inputs";
import { todayIso } from "./editorModel";
import { norm } from "./lib";

type ClientOption = { id: string; companyName: string };

export function ImportDraftDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const servicesQuery = useServices("all");
  const clientsQuery = useQuery<{ items: ClientOption[] }>({
    queryKey: ["legal-clients"],
    queryFn: () => api<{ items: ClientOption[] }>("/clients", { query: { pageSize: 100, sort: "companyName" } }),
  });

  const [draft, setDraft] = useState<ImportedDraft | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [clientId, setClientId] = useState("");
  const [busy, setBusy] = useState(false);
  const clients = clientsQuery.data?.items ?? [];

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setDraft(null);
    setFileName(file.name);
    if (file.size > DRAFT_MAX_BYTES) return setError("Fișierul depășește 200 KB.");
    try {
      const imported = importDraft(await file.text(), servicesQuery.data?.items ?? []);
      setDraft(imported);
      // Clientul sugerat: v2 după id, v1 după nume.
      let match = imported.offer.clientId ? clients.find((c) => c.id === imported.offer.clientId) : undefined;
      if (!match && imported.legacy?.client) {
        const wanted = norm(imported.legacy.client.trim());
        match = clients.find((c) => norm(c.companyName) === wanted) ?? clients.find((c) => wanted && norm(c.companyName).includes(wanted));
      }
      setClientId(match?.id ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fișierul nu a putut fi importat.");
    }
  }

  async function create() {
    if (!draft || !clientId) return;
    setBusy(true);
    try {
      const { item } = await api<{ item: { id: string } }>("/legal/offers", {
        method: "POST",
        body: { clientId, title: draft.offer.title || undefined, date: draft.offer.date || todayIso(), data: draft.config },
      });
      toast.success("Am importat ciorna ca ofertă nouă.");
      navigate(`/legal/offers/${item.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Crearea ofertei a eșuat.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Importă ciornă"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Anulează
          </Button>
          <Button variant="primary" loading={busy} disabled={!draft || !clientId} onClick={() => void create()}>
            Creează oferta
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <input ref={fileRef} type="file" accept=".json,application/json" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            Alege fișier .json
          </Button>
          <span className="text-sm text-muted">{fileName || "Maximum 200 KB"}</span>
        </div>

        {error ? (
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        {draft ? (
          <>
            <p className="text-sm text-text">
              Ciornă format v{draft.version}: {draft.config.lines.length} linii
              {draft.offer.title ? `, „${draft.offer.title}”` : ""}.
            </p>
            {draft.warnings.length > 0 ? (
              <ul className="list-disc space-y-1 rounded-lg bg-warning-soft px-5 py-3 text-sm text-warning">
                {draft.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            ) : null}
            <Field
              label="Client"
              hint={draft.legacy?.client && !clientId ? `Clientul din ciornă („${draft.legacy.client}”) nu a fost găsit; alege-l din listă.` : undefined}
            >
              <Select
                value={clientId}
                options={[{ value: "", label: "— alege clientul —" }, ...clients.map((c) => ({ value: c.id, label: c.companyName }))]}
                onChange={(e) => setClientId(e.target.value)}
              />
            </Field>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
