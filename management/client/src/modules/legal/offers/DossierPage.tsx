/**
 * Dosarul unei oferte (`/legal/offers/:id/dossier`): documentele din dosarul contractual,
 * versiunile lor, previzualizare, PDF (server), Word, arhivare în Documente și ZIP.
 */
import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router";
import {
  DOSSIER_DOC_LABELS,
  DOSSIER_DOC_TYPES,
  OFFER_STATUS_LABELS,
  contractedLines,
  formatMoney,
  type DossierDocType,
  type OfferSnapshot,
} from "@shared/offers";

import { formatDate } from "@/components/resource/ResourcePage";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Select,
  Spinner,
  Textarea,
  cn,
  useToast,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useCan } from "@/lib/auth";

import { CONTRACT_SKELETON } from "../ContractPreview";
import type { ContractDetail } from "../constants";
import { CONTRACT_HEADER_TITLE, render as renderContract } from "../contract/engine";
import { defaultValues } from "../contract/fields";
import template from "../contract/template.html?raw";
import { PV_RESULTS, buildDossierBody } from "../dossier/builders";
import { DOCX_MIME, contractBodyHtml, htmlToDocx } from "../dossier/docx";
import { DOSSIER_SKELETON, HEADER_TITLES, exportHtml, fileName, renderDossierDoc } from "../dossier/render";
import type { AmendmentInput, DossierInput, DossierRenderType } from "../dossier/types";
import { buildDossierZip, ZIP_MIME } from "../dossier/zip";
import { LabeledField as Field } from "./Inputs";
import { DocFrame, renderHidden, type DocFrameHandle } from "./DocFrame";
import {
  OFFER_STATUS_TONES,
  PdfUnavailableError,
  blobToBase64,
  downloadBlob,
  fetchServerPdf,
  loadLogoPng,
  type DossierDetail,
  type DossierRow,
  type OfferDetail,
  type OfferRow,
} from "./lib";

const msg = (error: unknown, fallback: string): string => (error instanceof ApiError || error instanceof Error ? error.message : fallback);

function contractInfoOf(contract: ContractDetail | undefined) {
  if (!contract) return null;
  return {
    number: contract.number ?? "",
    date: String(contract.data?.data ?? ""),
    cmdNr: String(contract.data?.cmdNr ?? ""),
  };
}

function inputOf(doc: DossierDetail, contract: ContractDetail | undefined): DossierInput | AmendmentInput {
  const base = { contract: contractInfoOf(contract), doc: { number: doc.number, date: doc.date, data: doc.data } };
  if (doc.type === "amendment") {
    const s = doc.snapshot as { before: OfferSnapshot; after: OfferSnapshot };
    return { ...base, snapshot: s.after, before: s.before };
  }
  return { ...base, snapshot: doc.snapshot as OfferSnapshot };
}

/* ------------------------------------------------------------------ formular PV */

function PvForm({ doc, snapshot, canWrite: canWriteRole, onSaved }: { doc: DossierDetail; snapshot: OfferSnapshot; canWrite: boolean; onSaved: (doc: DossierDetail) => void }) {
  const isFinal = doc.status === "final";
  const canWrite = canWriteRole && !isFinal;
  const toast = useToast();
  const data = doc.data;
  const obj = (k: string) => (data[k] && typeof data[k] === "object" ? (data[k] as Record<string, string>) : {});
  const [results, setResults] = useState<Record<string, string>>(obj("results"));
  const [delivery, setDelivery] = useState<Record<string, string>>(obj("delivery"));
  const [minor, setMinor] = useState(typeof data.minorDefects === "string" ? data.minorDefects : "");
  const [blocking, setBlocking] = useState(typeof data.blockingDefects === "string" ? data.blockingDefects : "");
  const [saving, setSaving] = useState(false);
  const lines = contractedLines(snapshot.config.lines);

  async function save() {
    setSaving(true);
    try {
      const clean = (rec: Record<string, string>) => Object.fromEntries(Object.entries(rec).filter(([, v]) => v.trim() !== ""));
      const { item } = await api<{ item: DossierDetail }>(`/legal/documents/${doc.id}`, {
        method: "PUT",
        body: { data: { ...data, results: clean(results), delivery: clean(delivery), minorDefects: minor, blockingDefects: blocking } },
      });
      onSaved(item);
      toast.success("Am salvat datele procesului-verbal.");
    } catch (error) {
      toast.error(msg(error, "Salvarea a eșuat."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Date proces-verbal" description="Rezultatul fiecărui livrabil se completează la predare; nimic nu e precompletat ca „acceptat”.">
      <div className="space-y-3">
        {isFinal ? <p className="text-sm text-muted">Document final – trece-l în ciornă ca să-l modifici</p> : null}
        {lines.map((l) => (
          <div key={l.id} className={cn("grid gap-2 sm:grid-cols-[1fr_14rem_1fr] sm:items-center", l.status === "included" && "pl-4")}>
            <span className="text-sm text-text">{l.name}</span>
            <Select
              aria-label={`Rezultat ${l.name}`}
              value={results[l.id] ?? ""}
              options={[{ value: "", label: "— necompletat —" }, ...Object.entries(PV_RESULTS).map(([value, label]) => ({ value, label }))]}
              onChange={(e) => setResults((r) => ({ ...r, [l.id]: e.target.value }))}
              disabled={!canWrite}
            />
            <Input
              aria-label={`Mod de predare ${l.name}`}
              placeholder="Mod de predare"
              value={delivery[l.id] ?? ""}
              onChange={(e) => setDelivery((r) => ({ ...r, [l.id]: e.target.value }))}
              disabled={!canWrite}
            />
          </div>
        ))}
        <Field label="Defecte minore (de remediat în garanție)">
          <Textarea value={minor} onChange={(e) => setMinor(e.target.value)} disabled={!canWrite} />
        </Field>
        <Field label="Defecte care împiedică recepția">
          <Textarea value={blocking} onChange={(e) => setBlocking(e.target.value)} disabled={!canWrite} />
        </Field>
        {canWrite ? (
          <Button variant="primary" loading={saving} onClick={() => void save()}>
            Salvează procesul-verbal
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ pagina */

export function DossierPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const canCreate = useCan("documents.create");
  const canUpdate = useCan("documents.update");
  const canDelete = useCan("documents.delete");
  const frameRef = useRef<DocFrameHandle>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const offerQuery = useQuery<{ item: OfferDetail }>({
    queryKey: ["legal-offer", id],
    queryFn: () => api<{ item: OfferDetail }>(`/legal/offers/${id}`),
  });
  const docsQuery = useQuery<{ items: DossierRow[] }>({
    queryKey: ["legal-offer-docs", id],
    queryFn: () => api<{ items: DossierRow[] }>(`/legal/offers/${id}/documents`),
  });
  const offer = offerQuery.data?.item;
  const contractQuery = useQuery<{ item: ContractDetail }>({
    queryKey: ["legal-contract", offer?.contractId],
    queryFn: () => api<{ item: ContractDetail }>(`/legal/contracts/${offer!.contractId}`),
    enabled: Boolean(offer?.contractId),
  });
  const amendmentsQuery = useQuery<{ items: OfferRow[] }>({
    queryKey: ["legal-offers", { amendmentsOf: offer?.contractId }],
    queryFn: () => api<{ items: OfferRow[] }>("/legal/offers", { query: { kind: "amendment", clientId: offer!.clientId, pageSize: 100 } }),
    enabled: Boolean(offer?.contractId) && offer?.kind === "offer",
  });
  const detailQuery = useQuery<{ item: DossierDetail }>({
    queryKey: ["legal-dossier-doc", selectedId],
    queryFn: () => api<{ item: DossierDetail }>(`/legal/documents/${selectedId}`),
    enabled: Boolean(selectedId),
  });

  const docs = useMemo(() => docsQuery.data?.items ?? [], [docsQuery.data]);
  const contract = contractQuery.data?.item;
  const detail = detailQuery.data?.item;
  const detailInput = useMemo(() => (detail ? inputOf(detail, contract) : null), [detail, contract]);
  const amendments = (amendmentsQuery.data?.items ?? []).filter((a) => a.contractId === offer?.contractId);

  if (offerQuery.isLoading || docsQuery.isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }
  if (offerQuery.error || !offer) return <ErrorState error={offerQuery.error} onRetry={() => void offerQuery.refetch()} />;

  const accepted = offer.status === "accepted";
  const hasRecurring = !!offer.acceptedSnapshot && contractedLines(offer.acceptedSnapshot.config.lines).some((l) => l.billing !== "one_time");

  const refreshDocs = () => queryClient.invalidateQueries({ queryKey: ["legal-offer-docs", id] });

  async function generate(type: DossierDocType) {
    setBusy(`gen:${type}`);
    try {
      const { item } = await api<{ item: DossierRow }>(`/legal/offers/${id}/documents`, { method: "POST", body: { type } });
      await refreshDocs();
      setSelectedId(item.id);
      toast.success(`Am generat: ${DOSSIER_DOC_LABELS[type]} (v${item.version}).`);
    } catch (error) {
      toast.error(msg(error, "Generarea a eșuat."));
    } finally {
      setBusy("");
    }
  }

  async function generateContract() {
    setBusy("gen:contract");
    try {
      const result = await api<{ item: { id: string } }>(`/legal/offers/${id}/contract`, { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["legal-offer", id] });
      await queryClient.invalidateQueries({ queryKey: ["legal-contracts"] });
      toast.success("Am generat contractul.");
      navigate(`/legal/contracts/${result.item.id}`);
    } catch (error) {
      toast.error(msg(error, "Generarea contractului a eșuat."));
    } finally {
      setBusy("");
    }
  }

  /** Cheia de nume și cele două exporturi pentru documentul deschis. */
  async function currentPdf(): Promise<{ blob: Blob; name: string }> {
    if (!detail || !detailInput) throw new Error("Alege un document.");
    const doc = await frameRef.current?.prepare();
    if (!doc) throw new Error("Previzualizarea nu e gata.");
    const name = fileName(detail.type, detailInput);
    return { blob: await fetchServerPdf(await exportHtml(doc), name), name };
  }

  async function downloadPdf() {
    if (!detail || !detailInput) return;
    setBusy("pdf");
    try {
      const { blob, name } = await currentPdf();
      downloadBlob(blob, `${name}.pdf`, "application/pdf");
    } catch (error) {
      if (error instanceof PdfUnavailableError) {
        toast.error(error.message);
        await frameRef.current?.print(fileName(detail.type, detailInput));
      } else toast.error(msg(error, "Generarea PDF a eșuat."));
    } finally {
      setBusy("");
    }
  }

  async function downloadWord() {
    if (!detail || !detailInput) return;
    setBusy("word");
    try {
      const type = detail.type as DossierRenderType;
      const bytes = htmlToDocx(buildDossierBody(type, detailInput), {
        title: HEADER_TITLES[type],
        provider: detailInput.snapshot.provider,
        logoPng: await loadLogoPng(),
      });
      downloadBlob(bytes, `${fileName(type, detailInput)}.docx`, DOCX_MIME);
    } catch (error) {
      toast.error(msg(error, "Generarea documentului Word a eșuat."));
    } finally {
      setBusy("");
    }
  }

  async function archive() {
    if (!detail) return;
    setBusy("archive");
    try {
      const { blob, name } = await currentPdf();
      await api(`/legal/documents/${detail.id}/archive`, { method: "POST", body: { pdfBase64: await blobToBase64(blob), filename: `${name}.pdf` } });
      await refreshDocs();
      await queryClient.invalidateQueries({ queryKey: ["legal-dossier-doc", detail.id] });
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Am arhivat PDF-ul în Documente.");
    } catch (error) {
      toast.error(error instanceof PdfUnavailableError ? `Arhivarea are nevoie de PDF generat pe server. ${error.message}` : msg(error, "Arhivarea a eșuat."));
    } finally {
      setBusy("");
    }
  }

  async function markFinal(status: "final" | "draft" = "final") {
    if (!detail) return;
    setBusy("final");
    try {
      const { item } = await api<{ item: DossierDetail }>(`/legal/documents/${detail.id}`, { method: "PUT", body: { status } });
      queryClient.setQueryData(["legal-dossier-doc", detail.id], { item });
      await refreshDocs();
      toast.success(status === "final" ? "Documentul a fost marcat final." : "Documentul a revenit în ciornă.");
    } catch (error) {
      toast.error(msg(error, "Operația a eșuat."));
    } finally {
      setBusy("");
    }
  }

  async function removeDoc() {
    if (!detail) return;
    setBusy("delete");
    try {
      await api(`/legal/documents/${detail.id}`, { method: "DELETE" });
      setSelectedId(null);
      await refreshDocs();
      toast.success("Am șters documentul.");
    } catch (error) {
      toast.error(msg(error, "Ștergerea a eșuat."));
    } finally {
      setBusy("");
      setConfirmDelete(false);
    }
  }

  /** ZIP: ultima versiune a fiecărui document generat + contractul, PDF (server) și Word + configurația. */
  async function downloadZip() {
    if (!offer) return;
    setBusy("zip");
    try {
      const latest = new Map<DossierDocType, DossierRow>();
      for (const d of docs) if (d.type !== "contract" && (latest.get(d.type)?.version ?? 0) < d.version) latest.set(d.type, d);
      const queue = DOSSIER_DOC_TYPES.filter((t) => latest.has(t));
      const total = queue.length + (contract ? 1 : 0);
      if (total === 0) {
        toast.error("Nu există documente generate în dosar.");
        return;
      }
      setProgress({ done: 0, total });
      const logo = await loadLogoPng();
      const files: { name: string; data: Uint8Array }[] = [];
      const manifest: object[] = [];
      let pdfOk = true;
      let done = 0;

      const addPdf = async (doc: Document, name: string) => {
        if (!pdfOk) return;
        try {
          const blob = await fetchServerPdf(await exportHtml(doc), name);
          files.push({ name: `PDF/${name}.pdf`, data: new Uint8Array(await blob.arrayBuffer()) });
        } catch (error) {
          if (error instanceof PdfUnavailableError) {
            pdfOk = false;
            toast.error(`${error.message} ZIP-ul va conține doar Word și configurația.`);
          } else throw error;
        }
      };

      for (const type of queue) {
        const row = latest.get(type)!;
        const { item } = await queryClient.fetchQuery({
          queryKey: ["legal-dossier-doc", row.id],
          queryFn: () => api<{ item: DossierDetail }>(`/legal/documents/${row.id}`),
        });
        const input = inputOf(item, contract);
        const name = fileName(type, input);
        const t = type as DossierRenderType;
        const { doc, dispose } = await renderHidden(DOSSIER_SKELETON, (d, img) => renderDossierDoc(t, input, d, img));
        try {
          await addPdf(doc, name);
        } finally {
          dispose();
        }
        files.push({ name: `Word/${name}.docx`, data: htmlToDocx(buildDossierBody(t, input), { title: HEADER_TITLES[t], provider: input.snapshot.provider, logoPng: logo }) });
        manifest.push({ type, number: item.number, version: item.version, status: item.status, date: item.date });
        setProgress({ done: ++done, total });
      }

      if (contract && offer.acceptedSnapshot) {
        const values = { ...defaultValues(), ...(contract.data ?? {}) };
        const base: DossierInput = { snapshot: offer.acceptedSnapshot, contract: null, doc: { number: contract.number, date: "", data: {} } };
        const name = fileName("contract", base);
        const { doc, dispose } = await renderHidden(CONTRACT_SKELETON, (d, img) => renderContract(values, d, template, img));
        try {
          await addPdf(doc, name);
        } finally {
          dispose();
        }
        files.push({
          name: `Word/${name}.docx`,
          data: htmlToDocx(contractBodyHtml(values, template), { title: CONTRACT_HEADER_TITLE, provider: offer.acceptedSnapshot.provider, logoPng: logo }),
        });
        manifest.push({ type: "contract", number: contract.number, status: contract.status });
        setProgress({ done: ++done, total });
      }

      const zip = buildDossierZip(files, {
        offer: { number: offer.number, title: offer.title, kind: offer.kind, status: offer.status, date: offer.date, version: offer.version },
        client: offer.client,
        contract: contract ? { number: contract.number, status: contract.status } : null,
        totals: offer.acceptedSnapshot?.totals ?? offer.totals,
        config: offer.acceptedSnapshot?.config ?? offer.data,
        documents: manifest,
        generatedAt: new Date().toISOString(),
        pdfIncluded: pdfOk,
      });
      downloadBlob(zip, `Dosar_${offer.number.replace(/[^\w-]+/g, "_")}.zip`, ZIP_MIME);
      toast.success(pdfOk ? "Am generat arhiva dosarului." : "Am generat arhiva dosarului, fără PDF.");
    } catch (error) {
      toast.error(msg(error, "Generarea arhivei a eșuat."));
    } finally {
      setBusy("");
      setProgress(null);
    }
  }

  /* ---- carduri ---- */
  const docCard = (type: DossierDocType) => {
    const label = DOSSIER_DOC_LABELS[type];
    const versions = docs.filter((d) => d.type === type).sort((a, b) => b.version - a.version);
    let reason = "";
    if (type !== "offer" && !accepted) reason = "Disponibil după acceptarea ofertei.";
    else if (type === "maintenance_annex" && !hasRecurring) reason = "Oferta nu conține servicii recurente contractate (mentenanță, abonamente).";
    else if (type === "amendment" && offer.kind !== "amendment") reason = "Se generează din oferta de tip act adițional, după acceptarea ei.";

    if (type === "contract") {
      return (
        <Card key={type} title={label}>
          {offer.contractId ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted">Contract nr. {contract?.number ?? offer.contract?.number ?? "—"}</p>
              <Button variant="secondary" onClick={() => navigate(`/legal/contracts/${offer.contractId}`)}>
                Deschide generatorul de contracte
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted">{accepted ? "Contractul nu a fost generat încă." : "Disponibil după acceptarea ofertei."}</p>
              {canCreate ? (
                <Button variant="primary" disabled={!accepted} loading={busy === "gen:contract"} onClick={() => void generateContract()}>
                  Generează contract
                </Button>
              ) : null}
            </div>
          )}
        </Card>
      );
    }

    return (
      <Card key={type} title={label}>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">{reason || (versions.length ? `${versions.length} ${versions.length === 1 ? "versiune" : "versiuni"}` : "Negenerat încă.")}</p>
            {type === "amendment" && offer.kind !== "amendment" ? null : canCreate ? (
              <Button variant="primary" disabled={!!reason} loading={busy === `gen:${type}`} onClick={() => void generate(type)}>
                Generează
              </Button>
            ) : null}
          </div>
          {type === "amendment" && offer.kind === "offer" && offer.contractId ? (
            amendments.length > 0 ? (
              <ul className="space-y-1">
                {amendments.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2 text-sm">
                    <span>
                      <b className="font-medium">{a.number}</b> <span className="text-muted">· {formatMoney(a.netTotal, a.currency)}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge tone={OFFER_STATUS_TONES[a.status]}>{OFFER_STATUS_LABELS[a.status]}</Badge>
                      <Link to={`/legal/offers/${a.id}/dossier`} className="font-medium text-primary hover:underline">
                        Dosar
                      </Link>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted">Contractul nu are acte adiționale.</p>
            )
          ) : null}
          {versions.length > 0 ? (
            <ul className="space-y-1">
              {versions.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(d.id)}
                    className={cn(
                      "flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-line px-3 py-2 text-left text-sm hover:bg-sidebar",
                      selectedId === d.id && "bg-sidebar ring-1 ring-primary",
                    )}
                  >
                    <span className="font-medium">v{d.version}</span>
                    <span className="text-muted">{formatDate(d.date)}</span>
                    {d.number ? <span className="text-muted">nr. {d.number}</span> : null}
                    <Badge tone={d.status === "final" ? "success" : "neutral"}>{d.status === "final" ? "Final" : "Ciornă"}</Badge>
                    {d.documentId ? <Badge tone="success">arhivat în Documente</Badge> : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Dosar ${offer.number}`}
        breadcrumbs={[{ label: "Legal", href: "/legal/offers" }, { label: "Oferte", href: "/legal/offers" }, { label: offer.number, href: `/legal/offers/${offer.id}` }, { label: "Dosar" }]}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate(`/legal/offers/${offer.id}`)}>
              Deschide oferta
            </Button>
            <Button variant="primary" loading={busy === "zip"} disabled={!!busy && busy !== "zip"} onClick={() => void downloadZip()}>
              {progress ? `Se generează ${progress.done} / ${progress.total}` : "Descarcă dosarul (ZIP)"}
            </Button>
          </>
        }
      />

      <Card>
        <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-muted">Ofertă</dt>
            <dd className="mt-0.5 flex items-center gap-2 font-medium text-text">
              {offer.number}
              <Badge tone={OFFER_STATUS_TONES[offer.status]}>{OFFER_STATUS_LABELS[offer.status]}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Client</dt>
            <dd className="mt-0.5 font-medium text-text">
              <Link to={`/clients/${offer.clientId}`} className="hover:underline">
                {offer.client?.name ?? offer.clientName}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Contract</dt>
            <dd className="mt-0.5 font-medium text-text">
              {offer.contractId ? (
                <Link to={`/legal/contracts/${offer.contractId}`} className="text-primary hover:underline">
                  {offer.contract?.number ?? "Deschide"}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Valoare netă</dt>
            <dd className="mt-0.5 font-medium text-text">{formatMoney(offer.netTotal, offer.currency)}</dd>
          </div>
        </dl>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] xl:items-start">
        <div className="space-y-3">{DOSSIER_DOC_TYPES.map((t) => docCard(t))}</div>

        <div className="space-y-4 xl:sticky xl:top-20">
          {!selectedId ? (
            <Card>
              <EmptyState title="Alege un document" description="Selectează o versiune din listă pentru a o previzualiza, a o descărca sau a o arhiva." />
            </Card>
          ) : detailQuery.isLoading || !detail || !detailInput ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <>
              <Card
                title={`${DOSSIER_DOC_LABELS[detail.type]} · v${detail.version}`}
                actions={<Badge tone={detail.status === "final" ? "success" : "neutral"}>{detail.status === "final" ? "Final" : "Ciornă"}</Badge>}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" size="sm" loading={busy === "pdf"} disabled={!!busy && busy !== "pdf"} onClick={() => void downloadPdf()}>
                      PDF
                    </Button>
                    <Button variant="secondary" size="sm" loading={busy === "word"} disabled={!!busy && busy !== "word"} onClick={() => void downloadWord()}>
                      Word
                    </Button>
                    {canUpdate ? (
                      <Button variant="secondary" size="sm" loading={busy === "archive"} disabled={!!busy && busy !== "archive"} onClick={() => void archive()}>
                        Arhivează în Documente
                      </Button>
                    ) : null}
                    {canUpdate && detail.status === "draft" ? (
                      <Button variant="secondary" size="sm" loading={busy === "final"} onClick={() => void markFinal("final")}>
                        Marchează final
                      </Button>
                    ) : null}
                    {canUpdate && detail.status === "final" && !detail.documentId ? (
                      <Button variant="secondary" size="sm" loading={busy === "final"} onClick={() => void markFinal("draft")}>
                        Trece în ciornă
                      </Button>
                    ) : null}
                    {canDelete && detail.status === "draft" ? (
                      <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                        Șterge
                      </Button>
                    ) : null}
                  </div>
                  <div className="h-[70vh] min-h-[420px]">
                    <DocFrame
                      ref={frameRef}
                      title="Previzualizare document din dosar"
                      renderKey={detailInput}
                      render={(doc, img) => renderDossierDoc(detail.type as DossierRenderType, detailInput, doc, img)}
                    />
                  </div>
                </div>
              </Card>
              {detail.type === "handover_pv" ? (
                <PvForm
                  key={detail.id}
                  doc={detail}
                  snapshot={detailInput.snapshot}
                  canWrite={canUpdate}
                  onSaved={(item) => {
                    queryClient.setQueryData(["legal-dossier-doc", item.id], { item });
                    void refreshDocs();
                  }}
                />
              ) : null}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Șterge documentul"
        message="Sigur ștergi această versiune a documentului? Acțiunea nu poate fi anulată."
        confirmLabel="Șterge"
        danger
        loading={busy === "delete"}
        onConfirm={() => void removeDoc()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

export default DossierPage;
