/**
 * Generatorul de contracte-cadru: formular pe stânga, previzualizare pagină cu pagină
 * pe dreapta. Contractul se salvează în `contracts` (cu numărul alocat de server);
 * „Descarcă PDF” salvează și apoi printează iframe-ul de previzualizare.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";

import { ConfirmDialog, Button, ErrorState, Field, Input, PageHeader, Select, Spinner, useToast } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useCan } from "@/lib/auth";

import { ContractForm } from "./ContractForm";
import { ContractPreview, type ContractPreviewHandle } from "./ContractPreview";
import { CONTRACT_STATUSES, type ContractDetail } from "./constants";
import { clientValues, type ClientRecord } from "./clientValues";
import type { Values } from "./contract/engine";
import { PROVIDER_KEYS, defaultValues } from "./contract/fields";
import template from "./contract/template.html?raw";
import { CONTRACT_HEADER_TITLE } from "./contract/engine";
import { DOCX_MIME, contractBodyHtml, htmlToDocx } from "./dossier/docx";
import { exportHtml } from "./dossier/render";
import { PdfUnavailableError, downloadBlob, fetchServerPdf, loadLogoPng, type OfferDetail } from "./offers/lib";
import type { ProviderValues } from "@shared/offers";

type ProjectRecord = { id: string; name: string };

export function ContractGeneratorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const canCreate = useCan("documents.create");
  const canUpdate = useCan("documents.update");
  const canDelete = useCan("documents.delete");

  const previewRef = useRef<ContractPreviewHandle>(null);

  const [values, setValues] = useState<Values>(() => defaultValues());
  const [status, setStatus] = useState<string>("draft");
  const [clientId, setClientId] = useState(searchParams.get("clientId") ?? "");
  const [projectId, setProjectId] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);
  const [esaMarca, setEsaMarca] = useState("");
  const [exporting, setExporting] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Inițializările automate se fac o singură dată pe contract.
  const initialized = useRef({ contract: false, provider: false, number: false, client: false });

  const patch = (changes: Values) => setValues((prev) => ({ ...prev, ...changes }));
  const setValue = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));

  // --- Date de la server ---
  const contractQuery = useQuery<{ item: ContractDetail }>({
    queryKey: ["legal-contract", id],
    queryFn: () => api<{ item: ContractDetail }>(`/legal/contracts/${id}`),
    enabled: !isNew,
  });

  const offerId = contractQuery.data?.item.offerId ?? null;
  const linkedOfferQuery = useQuery<{ item: OfferDetail }>({
    queryKey: ["legal-offer", offerId],
    queryFn: () => api<{ item: OfferDetail }>(`/legal/offers/${offerId}`),
    enabled: Boolean(offerId),
    retry: false,
  });

  const providerQuery = useQuery<{ item: Values }>({
    queryKey: ["legal-provider"],
    queryFn: () => api<{ item: Values }>("/legal/provider"),
  });

  const numberQuery = useQuery<{ number: string }>({
    queryKey: ["legal-next-number"],
    queryFn: () => api<{ number: string }>("/legal/contracts/next-number"),
    enabled: isNew,
    staleTime: 0,
    gcTime: 0,
  });

  const clientsQuery = useQuery<{ items: ClientRecord[] }>({
    queryKey: ["legal-clients"],
    queryFn: () => api<{ items: ClientRecord[] }>("/clients", { query: { pageSize: 100, sort: "companyName" } }),
    retry: false,
  });

  const projectsQuery = useQuery<{ items: ProjectRecord[] }>({
    queryKey: ["legal-projects", clientId],
    queryFn: () => api<{ items: ProjectRecord[] }>("/projects", { query: { clientId, pageSize: 100, sort: "name" } }),
    enabled: Boolean(clientId),
    retry: false,
  });

  // Contract existent: valorile salvate peste cele implicite.
  useEffect(() => {
    const item = contractQuery.data?.item;
    if (!item || initialized.current.contract) return;
    initialized.current.contract = true;
    setValues({ ...defaultValues(), ...(item.data ?? {}) });
    setStatus(item.status ?? "draft");
    setClientId(item.clientId);
    setProjectId(item.projectId ?? "");
    // Datele deja salvate în contract nu se mai suprascriu cu cele noi.
    initialized.current.provider = true;
    initialized.current.number = true;
    initialized.current.client = true;
  }, [contractQuery.data]);

  // Contract nou: datele ESA salvate ca implicite.
  useEffect(() => {
    const provider = providerQuery.data?.item;
    if (!isNew || !provider || initialized.current.provider) return;
    initialized.current.provider = true;
    patch(Object.fromEntries(PROVIDER_KEYS.map((key) => [key, provider[key] ?? ""])));
  }, [isNew, providerQuery.data]);

  // Marca comercială nu face parte din șablon: se ține separat, doar în formular.
  useEffect(() => {
    setEsaMarca(providerQuery.data?.item.esaMarca ?? "");
  }, [providerQuery.data]);

  // Contract nou: numărul următor.
  useEffect(() => {
    const next = numberQuery.data?.number;
    if (!isNew || !next || initialized.current.number) return;
    initialized.current.number = true;
    setValues((prev) => (prev.nr ? prev : { ...prev, nr: next }));
  }, [isNew, numberQuery.data]);

  // Contract nou cu `?clientId=`: precompletare automată.
  useEffect(() => {
    const items = clientsQuery.data?.items;
    const requested = searchParams.get("clientId");
    if (!isNew || !requested || !items || initialized.current.client) return;
    initialized.current.client = true;
    void pickClient(requested);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, clientsQuery.data]);

  const clientOptions = useMemo(() => {
    const options = (clientsQuery.data?.items ?? []).map((client) => ({ value: client.id, label: client.companyName }));
    const current = contractQuery.data?.item;
    if (current && !options.some((option) => option.value === current.clientId)) {
      options.unshift({ value: current.clientId, label: current.clientName });
    }
    return [{ value: "", label: "— alege clientul —" }, ...options];
  }, [clientsQuery.data, contractQuery.data]);

  const projectOptions = useMemo(() => {
    const options = (projectsQuery.data?.items ?? []).map((project) => ({ value: project.id, label: project.name }));
    const current = contractQuery.data?.item;
    if (current?.projectId && !options.some((option) => option.value === current.projectId)) {
      options.unshift({ value: current.projectId, label: current.projectName ?? current.projectId });
    }
    return [{ value: "", label: "— fără proiect —" }, ...options];
  }, [projectsQuery.data, contractQuery.data]);

  /** Alegerea clientului precompletează câmpurile `cl*` (rămân editabile). */
  async function pickClient(nextId: string) {
    setClientId(nextId);
    setProjectId("");
    if (!nextId) return;

    let client = clientsQuery.data?.items.find((item) => item.id === nextId);
    if (!client) {
      try {
        client = (await api<{ item: ClientRecord }>(`/clients/${nextId}`)).item;
      } catch {
        return;
      }
    }
    patch(clientValues(client));
  }

  function pickProject(nextId: string) {
    setProjectId(nextId);
    const project = projectsQuery.data?.items.find((item) => item.id === nextId);
    if (project) setValues((prev) => (prev.proiect ? prev : { ...prev, proiect: project.name }));
  }

  async function saveProviderDefaults() {
    setSavingProvider(true);
    try {
      await api("/legal/provider", {
        method: "PUT",
        body: { ...Object.fromEntries(PROVIDER_KEYS.map((key) => [key, values[key] ?? ""])), esaMarca },
      });
      await queryClient.invalidateQueries({ queryKey: ["legal-provider"] });
      toast.success("Am salvat datele prestatorului ca implicite.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Salvarea a eșuat.");
    } finally {
      setSavingProvider(false);
    }
  }

  /** Salvează (POST/PUT). Întoarce id-ul contractului sau `null` la eroare. */
  async function save(): Promise<string | null> {
    if (!clientId) {
      toast.error("Alege clientul pentru a salva contractul.");
      return null;
    }
    setSaving(true);
    try {
      const body = { clientId, projectId: projectId || null, number: values.nr?.trim() || undefined, status, data: values };
      const result = isNew
        ? await api<{ item: ContractDetail }>("/legal/contracts", { method: "POST", body })
        : await api<{ item: ContractDetail }>(`/legal/contracts/${id}`, { method: "PUT", body });
      toast.success(isNew ? "Am creat contractul." : "Am salvat contractul.");
      if (!values.nr?.trim() && result.item.number) setValue("nr", result.item.number);
      await queryClient.invalidateQueries({ queryKey: ["legal-contracts"] });
      await queryClient.invalidateQueries({ queryKey: ["legal-contract", result.item.id] });
      return result.item.id;
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) toast.error(error.message);
      else toast.error(error instanceof Error ? error.message : "Salvarea a eșuat.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    const savedId = await save();
    if (savedId && isNew) navigate(`/legal/contracts/${savedId}`, { replace: true });
  }

  async function handlePdf() {
    const savedId = await save();
    if (!savedId) return;
    setExporting("pdf");
    try {
      const doc = await previewRef.current?.prepare();
      if (!doc) return;
      try {
        const name = `Contract_${(values.nr || "").replace(/[^\w-]+/g, "-")}_${(values.clNume || "client").normalize("NFD").replace(/\p{M}+/gu, "").replace(/[^A-Za-z0-9]+/g, "_")}`;
        const blob = await fetchServerPdf(await exportHtml(doc), name);
        downloadBlob(blob, `${name}.pdf`, "application/pdf");
      } catch (error) {
        if (error instanceof PdfUnavailableError) {
          toast.error(error.message);
          await previewRef.current?.print();
        } else toast.error(error instanceof Error ? error.message : "Generarea PDF a eșuat.");
      }
    } finally {
      setExporting("");
    }
    if (isNew) navigate(`/legal/contracts/${savedId}`, { replace: true });
  }

  async function handleWord() {
    setExporting("word");
    try {
      const provider = {
        esaMarca: esaMarca || providerQuery.data?.item.esaMarca || "",
        ...Object.fromEntries(
          ["esaNume", "esaCui", "esaRc", "esaAdresa", "esaIban", "esaBanca", "esaEmail", "esaTel", "esaSite", "esaRep", "esaFunctie"].map((key) => [key, values[key] ?? ""]),
        ),
      } as unknown as ProviderValues;
      const bytes = htmlToDocx(contractBodyHtml(values, template), { title: CONTRACT_HEADER_TITLE, provider, logoPng: await loadLogoPng() });
      const name = `Contract_${(values.nr || "").replace(/[^\w-]+/g, "-")}_${(values.clNume || "client").normalize("NFD").replace(/\p{M}+/gu, "").replace(/[^A-Za-z0-9]+/g, "_")}`;
      downloadBlob(bytes, `${name}.docx`, DOCX_MIME);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generarea documentului Word a eșuat.");
    } finally {
      setExporting("");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api(`/legal/contracts/${id}`, { method: "DELETE" });
      toast.success("Am șters contractul.");
      await queryClient.invalidateQueries({ queryKey: ["legal-contracts"] });
      navigate("/legal", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ștergerea a eșuat.");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (!isNew && contractQuery.isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }
  if (!isNew && (contractQuery.error || !contractQuery.data)) {
    return <ErrorState error={contractQuery.error} onRetry={() => void contractQuery.refetch()} />;
  }

  const canSave = isNew ? canCreate : canUpdate;

  const before = {
    cl: (
      <div className="grid gap-3">
        <Field label="Client din aplicație" hint="Alegerea precompletează câmpurile de mai jos; le poți modifica.">
          <Select value={clientId} options={clientOptions} onChange={(event) => void pickClient(event.target.value)} />
        </Field>
        {clientId ? (
          <Field label="Proiect (opțional)">
            <Select value={projectId} options={projectOptions} onChange={(event) => pickProject(event.target.value)} />
          </Field>
        ) : null}
      </div>
    ),
  };

  const beforeProvider = {
    e: (
      <Field label="Marcă comercială" hint="Apare în documentele din dosar; nu face parte din șablonul contractului.">
        <Input value={esaMarca} onChange={(event) => setEsaMarca(event.target.value)} />
      </Field>
    ),
  };

  const after = {
    c: (
      <Field label="Status">
        <Select
          value={status}
          options={CONTRACT_STATUSES.map((item) => ({ value: item.value, label: item.label }))}
          onChange={(event) => setStatus(event.target.value)}
        />
      </Field>
    ),
    e: (
      <div>
        <Button variant="secondary" size="sm" loading={savingProvider} disabled={!canUpdate} onClick={() => void saveProviderDefaults()}>
          Salvează ca implicite
        </Button>
      </div>
    ),
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={isNew ? "Contract nou" : `Contract ${values.nr || ""}`.trim()}
        breadcrumbs={[{ label: "Legal", href: "/legal" }, { label: isNew ? "Contract nou" : values.nr || "Contract" }]}
      />

      {offerId ? (
        <p className="rounded-xl bg-sidebar px-4 py-2.5 text-sm text-muted">
          Generat din oferta nr.{" "}
          <Link to={`/legal/offers/${offerId}`} className="font-medium text-primary hover:underline">
            {linkedOfferQuery.data?.item.number ?? "…"}
          </Link>
          .
        </p>
      ) : null}

      <div className="grid gap-4 lg:h-[calc(100vh-15rem)] lg:min-h-[520px] lg:grid-cols-[minmax(340px,430px)_1fr]">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-card">
          <div className="min-h-0 flex-1 overflow-y-auto max-lg:max-h-[70vh]">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-base font-semibold text-text">Generator contract</h2>
              <p className="text-xs text-muted">
                Completează câmpurile, vezi contractul în dreapta, apoi apasă „Descarcă PDF”. Câmpurile goale rămân puncte pentru completat de mână.
              </p>
            </div>
            <ContractForm values={values} onChange={setValue} before={{ ...before, ...beforeProvider }} after={after} />
          </div>
          <div className="flex gap-2 border-t border-line bg-card px-4 py-3">
            <Button variant="secondary" loading={saving} disabled={!canSave} onClick={() => void handleSave()}>
              Salvează
            </Button>
            <Button variant="primary" className="flex-1" loading={saving || exporting === "pdf"} disabled={!canSave} onClick={() => void handlePdf()}>
              Descarcă PDF
            </Button>
            <Button variant="secondary" loading={exporting === "word"} onClick={() => void handleWord()}>
              Word
            </Button>
            {!isNew && canDelete ? (
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                Șterge
              </Button>
            ) : null}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col gap-2">
          <p className="text-xs text-muted">
            <b className="font-semibold text-text">Previzualizare pagină cu pagină</b>, exact cum va ieși PDF-ul. Valorile completate de tine sunt evidențiate cu galben doar aici, nu și în PDF.
          </p>
          <div className="h-[75vh] min-h-0 lg:h-auto lg:flex-1">
            <ContractPreview ref={previewRef} values={values} />
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Șterge contractul"
        message={`Sigur ștergi contractul ${values.nr || ""}? Acțiunea nu poate fi anulată.`}
        confirmLabel="Șterge"
        danger
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

export default ContractGeneratorPage;
