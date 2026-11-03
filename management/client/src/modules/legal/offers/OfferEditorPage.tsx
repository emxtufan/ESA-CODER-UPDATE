/**
 * Editorul de ofertă (`/legal/offers/new`, `/legal/offers/:id`): date în stânga, liniile și totalurile
 * în centru, previzualizarea documentului într-un iframe. Oferta acceptată e read-only.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useBlocker, useNavigate, useParams, useSearchParams } from "react-router";
import {
  OFFER_STATUS_LABELS,
  computeTotals,
  formatMoney,
  type ClientValues,
  type OfferConfig,
  type OfferLine,
  type OfferSnapshot,
} from "@shared/offers";

import { formatDate } from "@/components/resource/ResourcePage";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  Modal,
  PageHeader,
  Spinner,
  Tabs,
  cn,
  useToast,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useCan } from "@/lib/auth";

import { clientValues, type ClientRecord } from "../clientValues";
import { exportDraft, lineFromService } from "../dossier/drafts";
import { renderDossierDoc } from "../dossier/render";
import type { DossierInput } from "../dossier/types";
import { CatalogSheet } from "./CatalogSheet";
import { DocFrame } from "./DocFrame";
import { EMPTY_CLIENT, EMPTY_PROVIDER, blankLine, duplicateLine, emptyConfig, linesFromPackage, moveLine, previewSnapshot, todayIso } from "./editorModel";
import { useCategories, useProvider } from "./hooks";
import { LinesPanel } from "./LinesPanel";
import { OfferDataPanel, type OfferMeta } from "./OfferDataPanel";
import { OFFER_STATUS_TONES, downloadBlob, type CatalogPackage, type CatalogServiceRow, type OfferDetail } from "./lib";
import { TotalsPanel } from "./TotalsPanel";
import { VersionsDialog } from "./VersionsDialog";

interface Draft extends OfferMeta {
  config: OfferConfig;
}

type ProjectRecord = { id: string; name: string };

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const fields = error.fields ? Object.values(error.fields).join(" ") : "";
    return fields ? `${error.message}: ${fields}` : error.message;
  }
  return error instanceof Error ? error.message : fallback;
}

/* ------------------------------------------------------------------ încărcare */

export function OfferEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isNew = !id;

  const offerQuery = useQuery<{ item: OfferDetail }>({
    queryKey: ["legal-offer", id],
    queryFn: () => api<{ item: OfferDetail }>(`/legal/offers/${id}`),
    enabled: !isNew,
  });
  const numberQuery = useQuery<{ number: string }>({
    queryKey: ["legal-offer-next-number"],
    queryFn: () => api<{ number: string }>("/legal/offers/next-number"),
    enabled: isNew,
    staleTime: 0,
    gcTime: 0,
  });

  if (!isNew && offerQuery.isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }
  if (!isNew && (offerQuery.error || !offerQuery.data)) {
    return <ErrorState error={offerQuery.error} onRetry={() => void offerQuery.refetch()} />;
  }
  if (isNew && numberQuery.isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  const offer = offerQuery.data?.item ?? null;
  const initial: Draft = offer
    ? {
        clientId: offer.clientId,
        projectId: offer.projectId ?? "",
        number: offer.number,
        date: offer.date,
        title: offer.title,
        config: offer.data,
      }
    : {
        clientId: searchParams.get("clientId") ?? "",
        projectId: "",
        number: numberQuery.data?.number ?? "",
        date: todayIso(),
        title: "",
        config: emptyConfig(),
      };

  return <OfferEditor key={id ?? "new"} offer={offer} initial={initial} />;
}

/* ------------------------------------------------------------------ editor */

function OfferEditor({ offer, initial }: { offer: OfferDetail | null; initial: Draft }) {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const canCreate = useCan("documents.create");
  const canUpdate = useCan("documents.update");
  const canDelete = useCan("documents.delete");

  const isNew = !offer;
  const [draft, setDraft] = useState<Draft>(initial);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initial));
  const [view, setView] = useState<"date" | "lines" | "preview">("lines");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState("");
  const [confirm, setConfirm] = useState<null | "accept" | "delete">(null);
  const [deletePackage, setDeletePackage] = useState<OfferLine | null>(null);

  const readOnly = !!offer && offer.status !== "draft" && offer.status !== "sent";
  const canSave = isNew ? canCreate : canUpdate;
  const currentJson = JSON.stringify(draft);
  const dirty = !readOnly && currentJson !== savedJson;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  const { config } = draft;
  const totals = useMemo(() => computeTotals(config), [config]);

  const setConfig = (patch: Partial<OfferConfig>) => setDraft((d) => ({ ...d, config: { ...d.config, ...patch } }));
  const setLines = (fn: (lines: OfferLine[]) => OfferLine[]) => setDraft((d) => ({ ...d, config: { ...d.config, lines: fn(d.config.lines) } }));
  const setMeta = (patch: Partial<OfferMeta>) => setDraft((d) => ({ ...d, ...patch }));

  // --- protecție la părăsirea paginii cu modificări nesalvate ---
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirtyRef.current && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // --- date auxiliare ---
  const providerQuery = useProvider();
  const categories = useCategories().data?.items ?? [];
  const clientsQuery = useQuery<{ items: ClientRecord[] }>({
    queryKey: ["legal-clients"],
    queryFn: () => api<{ items: ClientRecord[] }>("/clients", { query: { pageSize: 100, sort: "companyName" } }),
    retry: false,
  });
  const clientQuery = useQuery<{ item: ClientRecord }>({
    queryKey: ["client", draft.clientId],
    queryFn: () => api<{ item: ClientRecord }>(`/clients/${draft.clientId}`),
    enabled: Boolean(draft.clientId),
  });
  // Ofertă nouă: moneda implicită e `preferredCurrency` din fișa clientului (dacă e setată), cât timp nu există linii.
  const preferredCurrency = clientQuery.data?.item.preferredCurrency;
  useEffect(() => {
    if (!isNew || (preferredCurrency !== "EUR" && preferredCurrency !== "RON" && preferredCurrency !== "USD")) return;
    setDraft((d) => (d.config.lines.length === 0 && d.config.currency !== preferredCurrency ? { ...d, config: { ...d.config, currency: preferredCurrency } } : d));
  }, [isNew, preferredCurrency, draft.clientId]);
  const projectsQuery = useQuery<{ items: ProjectRecord[] }>({
    queryKey: ["legal-projects", draft.clientId],
    queryFn: () => api<{ items: ProjectRecord[] }>("/projects", { query: { clientId: draft.clientId, pageSize: 100, sort: "name" } }),
    enabled: Boolean(draft.clientId),
    retry: false,
  });

  const clientOptions = useMemo(() => {
    const options = (clientsQuery.data?.items ?? []).map((c) => ({ value: c.id, label: c.companyName }));
    if (offer?.client && !options.some((o) => o.value === offer.client!.id)) options.unshift({ value: offer.client.id, label: offer.client.name });
    return options;
  }, [clientsQuery.data, offer]);
  const projectOptions = useMemo(() => (projectsQuery.data?.items ?? []).map((p) => ({ value: p.id, label: p.name })), [projectsQuery.data]);

  // --- snapshot pentru previzualizare ---
  const snapshot: OfferSnapshot = useMemo(() => {
    if (offer?.status === "accepted" && offer.acceptedSnapshot) return offer.acceptedSnapshot;
    const client: ClientValues = clientQuery.data ? (clientValues(clientQuery.data.item) as unknown as ClientValues) : EMPTY_CLIENT;
    return previewSnapshot(
      { id: offer?.id ?? "", number: draft.number, date: draft.date, version: offer?.version ?? 1, kind: offer?.kind ?? "offer", title: draft.title },
      draft.config,
      client,
      providerQuery.data?.item ?? EMPTY_PROVIDER,
    );
  }, [offer, draft, clientQuery.data, providerQuery.data]);

  const previewInput: DossierInput = useMemo(
    () => ({ snapshot, contract: null, doc: { number: snapshot.offer.number, date: snapshot.offer.date, data: {} } }),
    [snapshot],
  );

  // --- salvare ---
  function markSaved(json: string) {
    setSavedJson(json);
    dirtyRef.current = false;
  }

  async function refresh(item: OfferDetail) {
    queryClient.setQueryData(["legal-offer", item.id], { item });
    await queryClient.invalidateQueries({ queryKey: ["legal-offers"] });
  }

  function validate(): string | null {
    if (!draft.clientId) return "Alege clientul pentru a salva oferta.";
    if (config.lines.some((l) => !l.name.trim())) return "Completează denumirea tuturor serviciilor sau șterge liniile goale.";
    return null;
  }

  /** Salvează (POST/PUT). Întoarce id-ul ofertei sau `null` la eroare. */
  async function save(): Promise<string | null> {
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return null;
    }
    setSaving(true);
    const sent = JSON.stringify(draft);
    try {
      if (isNew) {
        const { item } = await api<{ item: OfferDetail }>("/legal/offers", {
          method: "POST",
          body: {
            clientId: draft.clientId,
            projectId: draft.projectId || undefined,
            title: draft.title,
            date: draft.date,
            number: draft.number.trim() || undefined,
            data: draft.config,
          },
        });
        markSaved(sent);
        await refresh(item);
        toast.success("Am creat oferta.");
        return item.id;
      }
      const { item } = await api<{ item: OfferDetail }>(`/legal/offers/${offer.id}`, {
        method: "PUT",
        body: { title: draft.title, date: draft.date, projectId: draft.projectId || null, data: draft.config },
      });
      markSaved(sent);
      await refresh(item);
      await queryClient.invalidateQueries({ queryKey: ["legal-offer-versions", offer.id] });
      toast.success(`Am salvat oferta (versiunea ${item.version}).`);
      return item.id;
    } catch (error) {
      toast.error(errorMessage(error, "Salvarea a eșuat."));
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    const savedId = await save();
    if (savedId && isNew) navigate(`/legal/offers/${savedId}`, { replace: true });
  }

  /** Acțiune pe server asupra ofertei salvate; salvează întâi modificările. */
  async function act(name: string, action: (id: string) => Promise<void>) {
    if (!offer) return;
    setBusy(name);
    try {
      if (dirty && !(await save())) return;
      await action(offer.id);
    } catch (error) {
      toast.error(errorMessage(error, "Operația a eșuat."));
    } finally {
      setBusy("");
    }
  }

  const changeStatus = (status: "sent" | "rejected" | "expired" | "draft", done: string) =>
    act(status, async (id) => {
      const { item } = await api<{ item: OfferDetail }>(`/legal/offers/${id}/status`, { method: "POST", body: { status } });
      await refresh(item);
      toast.success(done);
    });

  const accept = async () => {
    setConfirm(null);
    await act("accept", async (id) => {
      const { item } = await api<{ item: OfferDetail }>(`/legal/offers/${id}/accept`, { method: "POST" });
      await refresh(item);
      toast.success("Oferta a fost acceptată și blocată.");
    });
  };

  const generateContract = () =>
    act("contract", async (id) => {
      const result = await api<{ item: { id: string }; created: boolean }>(`/legal/offers/${id}/contract`, { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["legal-contracts"] });
      await queryClient.invalidateQueries({ queryKey: ["legal-offer", id] });
      toast.success(result.created ? "Am generat contractul." : "Oferta are deja un contract.");
      navigate(`/legal/contracts/${result.item.id}`);
    });

  const createAmendment = () =>
    act("amendment", async (id) => {
      const { item } = await api<{ item: OfferDetail }>(`/legal/offers/${id}/amendments`, { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["legal-offers"] });
      toast.success(`Am creat actul adițional ${item.number}.`);
      navigate(`/legal/offers/${item.id}`);
    });

  async function remove() {
    if (!offer) return;
    setBusy("delete");
    try {
      await api(`/legal/offers/${offer.id}`, { method: "DELETE" });
      dirtyRef.current = false;
      await queryClient.invalidateQueries({ queryKey: ["legal-offers"] });
      toast.success("Am șters oferta.");
      navigate("/legal/offers", { replace: true });
    } catch (error) {
      toast.error(errorMessage(error, "Ștergerea a eșuat."));
    } finally {
      setBusy("");
      setConfirm(null);
    }
  }

  function exportJson() {
    const json = exportDraft({
      number: draft.number,
      date: draft.date,
      title: draft.title,
      clientId: draft.clientId || null,
      projectId: draft.projectId || null,
      config: draft.config,
    });
    downloadBlob(new Blob([json], { type: "application/json" }), `${(draft.number || "oferta").replace(/[^\w.-]+/g, "_")}.json`, "application/json");
  }

  // --- linii ---
  function addFromCatalog(services: CatalogServiceRow[], packages: CatalogPackage[]) {
    const added = [...packages.flatMap((p) => linesFromPackage(p, config.currency)), ...services.map((s) => lineFromService(s, config.currency))];
    setLines((lines) => [...lines, ...added]);
    toast.success(added.length === 1 ? "Am adăugat o linie în ofertă." : `Am adăugat ${added.length} linii în ofertă.`);
  }

  const addCustom = () => setLines((lines) => [...lines, blankLine()]);

  function deleteLine(lineId: string) {
    const line = config.lines.find((l) => l.id === lineId);
    if (!line) return;
    if (line.isPackage && config.lines.some((l) => l.packageLineId === lineId)) setDeletePackage(line);
    else setLines((lines) => lines.filter((l) => l.id !== lineId));
  }

  function confirmDeletePackage(withComponents: boolean) {
    const pkg = deletePackage;
    if (!pkg) return;
    setLines((lines) =>
      lines
        .filter((l) => l.id !== pkg.id && !(withComponents && l.packageLineId === pkg.id))
        .map((l) => (l.packageLineId === pkg.id ? { ...l, packageLineId: null, status: "accepted" as const } : l)),
    );
    setDeletePackage(null);
  }

  async function saveToCatalog(lineId: string, categoryCode: string) {
    const line = config.lines.find((l) => l.id === lineId);
    if (!line) return;
    try {
      const { item } = await api<{ item: { id: string; code: string; categoryCode: string } }>("/catalog/services", {
        method: "POST",
        body: {
          categoryCode,
          name: line.name,
          description: line.description,
          deliverables: line.deliverables,
          acceptance: line.acceptance,
          unit: line.unit || "serviciu",
          defaultQuantity: line.quantity,
          recommendedPrice: line.unitPrice > 0 ? line.unitPrice : null,
          currency: line.unitPrice > 0 ? config.currency : null,
          billing: line.billing,
          defaultPeriods: line.periods,
          defaultStatus: line.status === "optional" || line.status === "client_direct" ? line.status : "accepted",
          advanced: line.advanced,
          duration: line.duration,
          conditions: line.conditions,
        },
      });
      setLines((lines) => lines.map((l) => (l.id === lineId ? { ...l, serviceId: item.id, code: item.code, category: item.categoryCode } : l)));
      await queryClient.invalidateQueries({ queryKey: ["catalog-services"] });
      toast.success(`Am salvat serviciul în catalog (${item.code}).`);
    } catch (error) {
      toast.error(errorMessage(error, "Salvarea în catalog a eșuat."));
    }
  }

  // --- afișare ---
  const isAmendment = offer?.kind === "amendment";
  const title = isNew ? "Ofertă nouă" : `${isAmendment ? "Act adițional" : "Ofertă"} ${offer.number}`;
  const tabsMobile = [
    { value: "date", label: "Date" },
    { value: "lines", label: "Servicii" },
    { value: "preview", label: "Previzualizare" },
  ];
  const tabsDesktop = [
    { value: "lines", label: "Editare" },
    { value: "preview", label: "Previzualizare" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={title}
        breadcrumbs={[{ label: "Legal", href: "/legal/offers" }, { label: "Oferte", href: "/legal/offers" }, { label: isNew ? "Ofertă nouă" : offer.number }]}
        actions={
          <>
            {offer ? <Badge tone={OFFER_STATUS_TONES[offer.status]}>{OFFER_STATUS_LABELS[offer.status]}</Badge> : <Badge>Neînregistrată</Badge>}
            {dirty ? <Badge tone="warning">Modificări nesalvate</Badge> : null}
            {!readOnly && canSave ? (
              <Button variant="primary" loading={saving} onClick={() => void handleSave()}>
                Salvează
              </Button>
            ) : null}
          </>
        }
      />

      {isAmendment ? (
        <p className="text-sm text-muted">
          Act adițional la Contractul nr. <b className="font-semibold text-text">{offer.contract?.number ?? "—"}</b>
          {offer.parent ? (
            <>
              {" "}
              · Oferta-părinte:{" "}
              <Link to={`/legal/offers/${offer.parent.id}`} className="font-medium text-primary hover:underline">
                {offer.parent.number}
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      {offer?.status === "accepted" ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-text">Oferta a fost acceptată{offer.acceptedAt ? ` la ${formatDate(offer.acceptedAt)}` : ""}.</p>
              <p className="text-xs text-muted">Oferta este blocată. Modificările se fac printr-un act adițional.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!isAmendment && canCreate ? (
                <Button variant="primary" loading={busy === "contract"} onClick={() => void generateContract()}>
                  {offer.contractId ? "Deschide contractul" : "Generează contract"}
                </Button>
              ) : null}
              {isAmendment && offer.contract ? (
                <Button variant="secondary" onClick={() => navigate(`/legal/contracts/${offer.contract!.id}`)}>
                  Contract
                </Button>
              ) : null}
              <Button variant="secondary" onClick={() => navigate(`/legal/offers/${offer.id}/dossier`)}>
                Dosar
              </Button>
              {offer.contractId && canCreate ? (
                <Button variant="secondary" loading={busy === "amendment"} onClick={() => void createAmendment()}>
                  Creează act adițional
                </Button>
              ) : null}
            </div>
          </div>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-card p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]">
        {offer && canUpdate && !readOnly ? (
          <>
            {offer.status === "draft" ? (
              <Button variant="secondary" size="sm" loading={busy === "sent"} onClick={() => void changeStatus("sent", "Oferta a fost marcată ca trimisă.")}>
                Marchează trimisă
              </Button>
            ) : null}
            <Button variant="secondary" size="sm" loading={busy === "rejected"} onClick={() => void changeStatus("rejected", "Oferta a fost marcată ca respinsă.")}>
              Respinsă
            </Button>
            <Button variant="secondary" size="sm" loading={busy === "expired"} onClick={() => void changeStatus("expired", "Oferta a fost marcată ca expirată.")}>
              Expirată
            </Button>
            {offer.status === "sent" ? (
              <Button variant="secondary" size="sm" loading={busy === "draft"} onClick={() => void changeStatus("draft", "Oferta a revenit la ciornă.")}>
                Înapoi la ciornă
              </Button>
            ) : null}
            <Button variant="primary" size="sm" loading={busy === "accept"} onClick={() => setConfirm("accept")}>
              Acceptă oferta
            </Button>
          </>
        ) : null}
        {offer && canUpdate && (offer.status === "rejected" || offer.status === "expired") ? (
          <Button variant="secondary" size="sm" loading={busy === "draft"} onClick={() => void changeStatus("draft", "Oferta a revenit la ciornă.")}>
            Înapoi la ciornă
          </Button>
        ) : null}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={exportJson}>
            Exportă ciornă (.json)
          </Button>
          {offer ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => setVersionsOpen(true)}>
                Istoric versiuni
              </Button>
              {offer.status !== "accepted" ? (
                <Button variant="secondary" size="sm" onClick={() => navigate(`/legal/offers/${offer.id}/dossier`)}>
                  Dosar
                </Button>
              ) : null}
            </>
          ) : null}
          {offer && offer.status === "draft" && canDelete ? (
            <Button variant="danger" size="sm" onClick={() => setConfirm("delete")}>
              Șterge
            </Button>
          ) : null}
        </div>
      </div>

      <div className="lg:hidden">
        <Tabs items={tabsMobile} value={view} onChange={(v) => setView(v as typeof view)} />
      </div>
      <div className="hidden lg:block">
        <Tabs items={tabsDesktop} value={view === "preview" ? "preview" : "lines"} onChange={(v) => setView(v as typeof view)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
        <aside
          className={cn(
            "overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto",
            view === "date" ? "block" : "hidden lg:block",
          )}
        >
          <OfferDataPanel
            meta={draft}
            config={config}
            readOnly={readOnly}
            numberLocked={!isNew}
            currencyLocked={isAmendment}
            clientOptions={clientOptions}
            projectOptions={projectOptions}
            onMeta={setMeta}
            onConfig={setConfig}
          />
        </aside>

        <div className={cn("min-w-0 space-y-4", view === "date" ? "hidden lg:block" : "block")}>
          {view === "preview" ? (
            <div className="h-[78vh] min-h-[420px]">
              <DocFrame
                title="Previzualizare ofertă"
                renderKey={previewInput}
                render={(doc, img) => renderDossierDoc("offer", previewInput, doc, img)}
              />
            </div>
          ) : (
            <>
              <LinesPanel
                lines={config.lines}
                currency={config.currency}
                readOnly={readOnly}
                categories={categories}
                onChange={(lineId, patch) => setLines((lines) => lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)))}
                onMove={(lineId, dir) => setLines((lines) => moveLine(lines, lineId, dir))}
                onDuplicate={(lineId) => setLines((lines) => duplicateLine(lines, lineId))}
                onDelete={deleteLine}
                onSaveToCatalog={saveToCatalog}
                onOpenCatalog={() => setCatalogOpen(true)}
                onAddCustom={addCustom}
              />
              <TotalsPanel totals={totals} currency={config.currency} vatRate={config.vatRate} className="lg:sticky lg:bottom-3 lg:z-20" />
              <div className="sticky bottom-2 z-20 flex items-baseline justify-between rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-lg lg:hidden" aria-hidden="true">
                <span className="text-sm">Total</span>
                <span className="text-base font-semibold tabular-nums">{formatMoney(totals.gross, config.currency)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <CatalogSheet
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        currency={config.currency}
        lines={config.lines}
        onAdd={addFromCatalog}
        onAddCustom={addCustom}
      />

      {offer && versionsOpen ? <VersionsDialog offer={offer} snapshot={snapshot} onClose={() => setVersionsOpen(false)} /> : null}

      <ConfirmDialog
        open={confirm === "accept"}
        title="Acceptă oferta"
        message="Oferta acceptată se blochează: nu mai poate fi editată, iar valorile ei devin baza contractului. Modificările ulterioare se fac doar printr-un act adițional. Continuăm?"
        confirmLabel="Acceptă oferta"
        loading={busy === "accept"}
        onConfirm={() => void accept()}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        title="Șterge oferta"
        message={`Sigur ștergi oferta ${offer?.number ?? ""}? Acțiunea nu poate fi anulată.`}
        confirmLabel="Șterge"
        danger
        loading={busy === "delete"}
        onConfirm={() => void remove()}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={blocker.state === "blocked"}
        title="Modificări nesalvate"
        message="Ai modificări nesalvate în ofertă. Dacă pleci acum, ele se pierd."
        confirmLabel="Pleacă fără salvare"
        danger
        onConfirm={() => blocker.state === "blocked" && blocker.proceed()}
        onCancel={() => blocker.state === "blocked" && blocker.reset()}
      />
      <Modal
        open={deletePackage !== null}
        onClose={() => setDeletePackage(null)}
        title="Șterge pachetul"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletePackage(null)}>
              Anulează
            </Button>
            <Button variant="secondary" onClick={() => confirmDeletePackage(false)}>
              Păstrează componentele
            </Button>
            <Button variant="danger" onClick={() => confirmDeletePackage(true)}>
              Șterge și componentele
            </Button>
          </>
        }
      >
        <p className="text-sm text-text">
          Pachetul „{deletePackage?.name}” are componente. Dacă le păstrezi, ele devin servicii acceptate, taxate separat (cu prețul lor).
        </p>
      </Modal>
    </div>
  );
}

export default OfferEditorPage;
