/**
 * Catalogul de servicii (`/legal/catalog`): servicii, pachete și categorii.
 * Se editează în dialoguri; prețurile se introduc în unități majore și se salvează în minore.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import type { Currency } from "@shared/enums";
import { BILLINGS, BILLING_LABELS, formatMoney, type Billing } from "@shared/offers";

import {
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  Spinner,
  Tabs,
  Textarea,
  useToast,
  type DataTableColumn,
} from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useCan } from "@/lib/auth";

import { MoneyInput, NumInput, LabeledField as Field } from "../offers/Inputs";
import { PackagePrice } from "../offers/CatalogSheet";
import { useCategories, usePackages, useServices } from "../offers/hooks";
import { CURRENCY_OPTIONS, norm, type CatalogCategory, type CatalogPackage, type CatalogServiceRow } from "../offers/lib";

const BILLING_OPTIONS = BILLINGS.map((b) => ({ value: b, label: BILLING_LABELS[b] }));
const DEFAULT_STATUS_OPTIONS = [
  { value: "accepted", label: "Acceptat" },
  { value: "optional", label: "Opțional, neacceptat" },
  { value: "client_direct", label: "Cost suportat direct de client" },
];

const msg = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

/** Mesajul erorii, cu detaliile pe câmpuri (ex. lista codurilor necunoscute) când există. */
function detailedMsg(error: unknown, fallback: string): string {
  const base = msg(error, fallback);
  if (!(error instanceof ApiError) || !error.fields) return base;
  const details = Object.entries(error.fields)
    .filter(([, v]) => !base.includes(v))
    .map(([k, v]) => `${k}: ${v}`);
  return details.length ? [base, ...details.slice(0, 10)].join("\n") : base;
}

/* ------------------------------------------------------------------ servicii */

interface ServiceForm {
  code: string;
  categoryCode: string;
  name: string;
  shortDescription: string;
  description: string;
  deliverables: string;
  acceptance: string;
  unit: string;
  defaultQuantity: number;
  recommendedPrice: number | null;
  currency: Currency;
  billing: Billing;
  defaultPeriods: number;
  defaultStatus: "accepted" | "optional" | "client_direct";
  advanced: boolean;
  duration: string;
  conditions: string;
}

function serviceForm(service: CatalogServiceRow | null, category: string): ServiceForm {
  return {
    code: service?.code ?? "",
    categoryCode: service?.categoryCode ?? category,
    name: service?.name ?? "",
    shortDescription: service?.shortDescription ?? "",
    description: service?.description ?? "",
    deliverables: service?.deliverables ?? "",
    acceptance: service?.acceptance ?? "",
    unit: service?.unit ?? "serviciu",
    defaultQuantity: service?.defaultQuantity ?? 1,
    recommendedPrice: service?.recommendedPrice ?? null,
    currency: service?.currency ?? "RON",
    billing: service?.billing ?? "one_time",
    defaultPeriods: service?.defaultPeriods ?? 1,
    defaultStatus: (service?.defaultStatus === "included" ? "accepted" : service?.defaultStatus) ?? "accepted",
    advanced: service?.advanced ?? false,
    duration: service?.duration ?? "",
    conditions: service?.conditions ?? "",
  };
}

function ServiceDialog({
  service,
  categories,
  canWrite,
  canDelete,
  onClose,
}: {
  service: CatalogServiceRow | null;
  categories: CatalogCategory[];
  canWrite: boolean;
  canDelete: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ServiceForm>(() => serviceForm(service, categories[0]?.code ?? "A"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof ServiceForm>(key: K, value: ServiceForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function run(action: () => Promise<unknown>, done: string) {
    setBusy(true);
    setError("");
    try {
      await action();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["catalog-services"] }),
        queryClient.invalidateQueries({ queryKey: ["catalog-packages"] }),
      ]);
      toast.success(done);
      onClose();
    } catch (e) {
      setError(msg(e, "Operația a eșuat."));
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  function save() {
    if (!form.name.trim()) return setError("Denumirea este obligatorie.");
    const { code, ...rest } = form;
    const body = { ...rest, code: code.trim() || undefined, currency: form.recommendedPrice === null ? null : form.currency };
    void run(
      () => (service ? api(`/catalog/services/${service.id}`, { method: "PUT", body }) : api("/catalog/services", { method: "POST", body })),
      service ? "Am salvat serviciul." : "Am creat serviciul.",
    );
  }

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={service ? `Serviciu ${service.code}` : "Serviciu nou"}
        className="max-w-3xl"
        footer={
          <>
            {service && canWrite ? (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  void run(
                    () => api(`/catalog/services/${service.id}/${service.archivedAt ? "unarchive" : "archive"}`, { method: "POST" }),
                    service.archivedAt ? "Am dezarhivat serviciul." : "Am arhivat serviciul.",
                  )
                }
              >
                {service.archivedAt ? "Dezarhivează" : "Arhivează"}
              </Button>
            ) : null}
            {service && canDelete ? (
              <Button variant="danger" disabled={busy} onClick={() => setConfirmDelete(true)}>
                Șterge
              </Button>
            ) : null}
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Închide
            </Button>
            {canWrite ? (
              <Button variant="primary" loading={busy} onClick={save}>
                Salvează
              </Button>
            ) : null}
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {error ? (
            <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger sm:col-span-2">
              {error}
            </p>
          ) : null}
          <Field label="Cod" hint="Gol = se generează automat.">
            <Input value={form.code} onChange={(e) => set("code", e.target.value)} disabled={!canWrite} />
          </Field>
          <Field label="Categorie">
            <Select
              value={form.categoryCode}
              options={categories.map((c) => ({ value: c.code, label: `${c.code} · ${c.name}` }))}
              onChange={(e) => set("categoryCode", e.target.value)}
              disabled={!canWrite}
            />
          </Field>
          <Field label="Denumire" className="sm:col-span-2" required>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} disabled={!canWrite} />
          </Field>
          <Field label="Descriere scurtă" className="sm:col-span-2">
            <Input value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} disabled={!canWrite} />
          </Field>
          <Field label="Descriere detaliată" className="sm:col-span-2">
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} disabled={!canWrite} />
          </Field>
          <Field label="Livrabile">
            <Textarea value={form.deliverables} onChange={(e) => set("deliverables", e.target.value)} disabled={!canWrite} />
          </Field>
          <Field label="Criterii de acceptare">
            <Textarea value={form.acceptance} onChange={(e) => set("acceptance", e.target.value)} disabled={!canWrite} />
          </Field>
          <Field label="Unitate de măsură">
            <Input value={form.unit} onChange={(e) => set("unit", e.target.value)} disabled={!canWrite} />
          </Field>
          <Field label="Cantitate implicită">
            <NumInput value={form.defaultQuantity} min={0} onChange={(n) => set("defaultQuantity", n)} disabled={!canWrite} />
          </Field>
          <Field label="Preț recomandat" hint="În unități majore, ex. 400 sau 49,90. Gol = fără preț.">
            <MoneyInput nullable value={form.recommendedPrice} onChange={(m) => set("recommendedPrice", m)} disabled={!canWrite} />
          </Field>
          <Field label="Monedă">
            <Select value={form.currency} options={CURRENCY_OPTIONS} onChange={(e) => set("currency", e.target.value as Currency)} disabled={!canWrite} />
          </Field>
          <Field label="Frecvență">
            <Select value={form.billing} options={BILLING_OPTIONS} onChange={(e) => set("billing", e.target.value as Billing)} disabled={!canWrite} />
          </Field>
          <Field label="Perioade implicite">
            <NumInput integer min={1} value={form.defaultPeriods} onChange={(n) => set("defaultPeriods", n)} disabled={!canWrite} />
          </Field>
          <Field label="Stare implicită">
            <Select
              value={form.defaultStatus}
              options={DEFAULT_STATUS_OPTIONS}
              onChange={(e) => set("defaultStatus", e.target.value as ServiceForm["defaultStatus"])}
              disabled={!canWrite}
            />
          </Field>
          <Field label="Durată">
            <Input value={form.duration} onChange={(e) => set("duration", e.target.value)} disabled={!canWrite} />
          </Field>
          <Field label="Condiții" className="sm:col-span-2">
            <Textarea value={form.conditions} onChange={(e) => set("conditions", e.target.value)} disabled={!canWrite} />
          </Field>
          <div className="sm:col-span-2">
            <Checkbox
              checked={form.advanced}
              onChange={(e) => set("advanced", e.target.checked)}
              disabled={!canWrite}
              label="Dezvoltare avansată (ofertată separat)"
            />
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        title="Șterge serviciul"
        message={`Sigur ștergi serviciul ${service?.code ?? ""}? Dacă este într-un pachet, ștergerea nu e posibilă; arhivează-l în schimb.`}
        confirmLabel="Șterge"
        danger
        loading={busy}
        onConfirm={() => service && void run(() => api(`/catalog/services/${service.id}`, { method: "DELETE" }), "Am șters serviciul.")}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

function ServicesTab({ categories }: { categories: CatalogCategory[] }) {
  const canCreate = useCan("documents.create");
  const canUpdate = useCan("documents.update");
  const canDelete = useCan("documents.delete");
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [archived, setArchived] = useState(false);
  const [editing, setEditing] = useState<CatalogServiceRow | "new" | null>(null);
  const { data, isLoading, error, refetch } = useServices(archived ? "all" : "false");

  useEffect(() => {
    const timer = setTimeout(() => setQ(qInput), 150);
    return () => clearTimeout(timer);
  }, [qInput]);

  const rows = useMemo(() => {
    const needle = norm(q.trim());
    return (data?.items ?? []).filter(
      (s) =>
        (!category || s.categoryCode === category) &&
        (!needle || norm(`${s.code} ${s.name} ${s.shortDescription} ${s.description}`).includes(needle)),
    );
  }, [data, q, category]);

  const columns: DataTableColumn<CatalogServiceRow>[] = [
    { key: "code", header: "Cod", render: (r) => <span className="font-medium">{r.code}</span> },
    {
      key: "name",
      header: "Denumire",
      render: (r) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <span>{r.name}</span>
          {r.advanced ? <Badge tone="warning">Avansat</Badge> : null}
          {r.archivedAt ? <Badge>Arhivat</Badge> : null}
        </div>
      ),
    },
    { key: "categoryCode", header: "Categorie", hideOnMobile: true },
    { key: "billing", header: "Frecvență", hideOnMobile: true, render: (r) => BILLING_LABELS[r.billing] },
    {
      key: "recommendedPrice",
      header: "Preț recomandat",
      align: "right",
      render: (r) => (r.recommendedPrice != null ? formatMoney(r.recommendedPrice, r.currency ?? "RON") : "—"),
    },
    {
      key: "defaultStatus",
      header: "Stare implicită",
      hideOnMobile: true,
      render: (r) => DEFAULT_STATUS_OPTIONS.find((o) => o.value === r.defaultStatus)?.label ?? r.defaultStatus,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-72">
          <Input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Caută cod, denumire, descriere…" aria-label="Caută servicii" />
        </div>
        <div className="w-full sm:w-56">
          <Select
            aria-label="Categorie"
            value={category}
            options={[{ value: "", label: "Toate categoriile" }, ...categories.map((c) => ({ value: c.code, label: `${c.code} · ${c.name}` }))]}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <Checkbox checked={archived} onChange={(e) => setArchived(e.target.checked)} label="Arată arhivate" />
        {canCreate ? (
          <Button variant="primary" className="ml-auto" onClick={() => setEditing("new")}>
            Serviciu nou
          </Button>
        ) : null}
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey="id"
        onRowClick={(row) => setEditing(row)}
        loading={isLoading}
        error={error}
        onRetry={() => void refetch()}
      />
      {editing ? (
        <ServiceDialog
          key={editing === "new" ? "new" : editing.id}
          service={editing === "new" ? null : editing}
          categories={categories}
          canWrite={editing === "new" ? canCreate : canUpdate}
          canDelete={canDelete}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ pachete */

function PackageDialog({
  pkg,
  canWrite,
  canDelete,
  onClose,
}: {
  pkg: CatalogPackage | null;
  canWrite: boolean;
  canDelete: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: servicesData } = useServices("false");
  const services = useMemo(() => servicesData?.items ?? [], [servicesData]);
  const [name, setName] = useState(pkg?.name ?? "");
  const [description, setDescription] = useState(pkg?.description ?? "");
  const [billing, setBilling] = useState<Billing>(pkg?.billing ?? "one_time");
  const [price, setPrice] = useState<number | null>(pkg?.recommendedPrice ?? null);
  const [currency, setCurrency] = useState<Currency>(pkg?.currency ?? "RON");
  const [ids, setIds] = useState<string[]>(pkg?.serviceIds ?? []);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const byId = useMemo(() => new Map([...(pkg?.items ?? []), ...services].map((s) => [s.id, s])), [pkg, services]);
  const candidates = useMemo(() => {
    const needle = norm(q.trim());
    return services.filter((s) => !needle || norm(`${s.code} ${s.name}`).includes(needle));
  }, [services, q]);

  const toggle = (id: string) => setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const move = (index: number, dir: -1 | 1) =>
    setIds((cur) => {
      const next = [...cur];
      const j = index + dir;
      if (j < 0 || j >= next.length) return cur;
      [next[index], next[j]] = [next[j]!, next[index]!];
      return next;
    });

  async function run(action: () => Promise<unknown>, done: string) {
    setBusy(true);
    setError("");
    try {
      await action();
      await queryClient.invalidateQueries({ queryKey: ["catalog-packages"] });
      toast.success(done);
      onClose();
    } catch (e) {
      setError(msg(e, "Operația a eșuat."));
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  function save() {
    if (!name.trim()) return setError("Numele este obligatoriu.");
    const body = { name, description, billing, recommendedPrice: price, currency: price === null ? null : currency, serviceIds: ids };
    void run(
      () => (pkg ? api(`/catalog/packages/${pkg.id}`, { method: "PUT", body }) : api("/catalog/packages", { method: "POST", body })),
      pkg ? "Am salvat pachetul." : "Am creat pachetul.",
    );
  }

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={pkg ? `Pachet: ${pkg.name}` : "Pachet nou"}
        className="max-w-3xl"
        footer={
          <>
            {pkg && canWrite ? (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  void run(
                    () => api(`/catalog/packages/${pkg.id}/${pkg.archivedAt ? "unarchive" : "archive"}`, { method: "POST" }),
                    pkg.archivedAt ? "Am dezarhivat pachetul." : "Am arhivat pachetul.",
                  )
                }
              >
                {pkg.archivedAt ? "Dezarhivează" : "Arhivează"}
              </Button>
            ) : null}
            {pkg && canDelete ? (
              <Button variant="danger" disabled={busy} onClick={() => setConfirmDelete(true)}>
                Șterge
              </Button>
            ) : null}
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Închide
            </Button>
            {canWrite ? (
              <Button variant="primary" loading={busy} onClick={save}>
                Salvează
              </Button>
            ) : null}
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {error ? (
            <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger sm:col-span-2">
              {error}
            </p>
          ) : null}
          <Field label="Nume" className="sm:col-span-2" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canWrite} />
          </Field>
          <Field label="Descriere" className="sm:col-span-2">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={!canWrite} />
          </Field>
          <Field label="Frecvență">
            <Select value={billing} options={BILLING_OPTIONS} onChange={(e) => setBilling(e.target.value as Billing)} disabled={!canWrite} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Preț recomandat" hint="Opțional">
              <MoneyInput nullable value={price} onChange={setPrice} disabled={!canWrite} />
            </Field>
            <Field label="Monedă">
              <Select value={currency} options={CURRENCY_OPTIONS} onChange={(e) => setCurrency(e.target.value as Currency)} disabled={!canWrite} />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-medium text-text">Componente ({ids.length})</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-line">
                <div className="border-b border-line p-2">
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Caută servicii…" aria-label="Caută servicii pentru pachet" />
                </div>
                <ul className="max-h-64 overflow-y-auto p-1">
                  {candidates.map((s) => (
                    <li key={s.id}>
                      <label className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-sidebar">
                        <input
                          type="checkbox"
                          className="mt-0.5 size-4 accent-primary"
                          checked={ids.includes(s.id)}
                          disabled={!canWrite}
                          onChange={() => toggle(s.id)}
                        />
                        <span>
                          <span className="font-medium">{s.code}</span> {s.name}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
              <ol className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-line p-1">
                {ids.length === 0 ? <li className="p-3 text-xs text-muted">Nicio componentă aleasă.</li> : null}
                {ids.map((id, index) => {
                  const s = byId.get(id);
                  return (
                    <li key={id} className="flex items-center gap-1 rounded-lg bg-sidebar px-2 py-1 text-sm">
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-medium">{s?.code ?? "?"}</span> {s?.name ?? id}
                      </span>
                      {canWrite ? (
                        <>
                          <button type="button" aria-label="Mută sus" className="rounded p-1 hover:bg-black/5" onClick={() => move(index, -1)}>
                            <ArrowUp className="size-3.5" />
                          </button>
                          <button type="button" aria-label="Mută jos" className="rounded p-1 hover:bg-black/5" onClick={() => move(index, 1)}>
                            <ArrowDown className="size-3.5" />
                          </button>
                          <button type="button" aria-label="Elimină" className="rounded p-1 hover:bg-black/5" onClick={() => toggle(id)}>
                            <X className="size-3.5" />
                          </button>
                        </>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        title="Șterge pachetul"
        message={`Sigur ștergi pachetul „${pkg?.name ?? ""}”? Serviciile componente rămân în catalog.`}
        confirmLabel="Șterge"
        danger
        loading={busy}
        onConfirm={() => pkg && void run(() => api(`/catalog/packages/${pkg.id}`, { method: "DELETE" }), "Am șters pachetul.")}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

function PackagesTab() {
  const canCreate = useCan("documents.create");
  const canUpdate = useCan("documents.update");
  const canDelete = useCan("documents.delete");
  const [archived, setArchived] = useState(false);
  const [editing, setEditing] = useState<CatalogPackage | "new" | null>(null);
  const { data, isLoading, error, refetch } = usePackages(archived ? "all" : "false");

  const columns: DataTableColumn<CatalogPackage>[] = [
    {
      key: "name",
      header: "Pachet",
      render: (r) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium">{r.name}</span>
          {r.archivedAt ? <Badge>Arhivat</Badge> : null}
        </div>
      ),
    },
    { key: "items", header: "Componente", align: "right", render: (r) => r.items.length },
    { key: "billing", header: "Frecvență", hideOnMobile: true, render: (r) => BILLING_LABELS[r.billing] },
    {
      key: "recommendedPrice",
      header: "Preț recomandat",
      align: "right",
      render: (r) => <PackagePrice pkg={r} currency="RON" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Checkbox checked={archived} onChange={(e) => setArchived(e.target.checked)} label="Arată arhivate" />
        {canCreate ? (
          <Button variant="primary" className="ml-auto" onClick={() => setEditing("new")}>
            Pachet nou
          </Button>
        ) : null}
      </div>
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey="id"
        onRowClick={(row) => setEditing(row)}
        loading={isLoading}
        error={error}
        onRetry={() => void refetch()}
      />
      {editing ? (
        <PackageDialog
          key={editing === "new" ? "new" : editing.id}
          pkg={editing === "new" ? null : editing}
          canWrite={editing === "new" ? canCreate : canUpdate}
          canDelete={canDelete}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ categorii */

function CategoryRow({ category, canWrite }: { category: CatalogCategory; canWrite: boolean }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState(category.name);
  const [note, setNote] = useState(category.note);
  const [busy, setBusy] = useState(false);
  const dirty = name !== category.name || note !== category.note;

  async function save() {
    setBusy(true);
    try {
      await api(`/catalog/categories/${category.code}`, { method: "PUT", body: { name, note } });
      await queryClient.invalidateQueries({ queryKey: ["catalog-categories"] });
      toast.success(`Am salvat categoria ${category.code}.`);
    } catch (e) {
      toast.error(msg(e, "Salvarea a eșuat."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3 rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] md:grid-cols-[3rem_1fr_2fr_auto] md:items-start">
      <span className="text-lg font-semibold text-text">{category.code}</span>
      <Field label="Nume">
        <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canWrite} />
      </Field>
      <Field label="Notă">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} disabled={!canWrite} />
      </Field>
      {canWrite ? (
        <Button variant="primary" className="md:mt-6" disabled={!dirty || !name.trim()} loading={busy} onClick={() => void save()}>
          Salvează
        </Button>
      ) : null}
    </div>
  );
}

function CategoriesTab({ categories }: { categories: CatalogCategory[] }) {
  const canWrite = useCan("documents.update");
  if (categories.length === 0) return <EmptyState title="Nicio categorie" />;
  return (
    <div className="space-y-3">
      {categories.map((c) => (
        <CategoryRow key={c.code} category={c} canWrite={canWrite} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ export / import */

interface ImportCounts {
  created: number;
  updated: number;
  unchanged: number;
}

interface ImportSummary {
  dryRun: boolean;
  categories: ImportCounts;
  services: ImportCounts;
  packages: ImportCounts;
  warnings: string[];
}

const countsText = (c: ImportCounts) => `${c.created} noi, ${c.updated} actualizate, ${c.unchanged} neschimbate`;

function ImportExport() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const canExport = useCan("documents.view");
  const canCreate = useCan("documents.create");
  const canUpdate = useCan("documents.update");
  const canImport = canCreate && canUpdate;
  const fileInput = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<unknown>(null);
  const [fileName, setFileName] = useState("");
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  async function download() {
    setExporting(true);
    try {
      const response = await fetch("/api/catalog/export", { headers: { "x-requested-with": "esa" }, credentials: "same-origin" });
      if (!response.ok) throw new Error(`Exportul a eșuat (${response.status}).`);
      const blob = await response.blob();
      const name = /filename="([^"]+)"/.exec(response.headers.get("content-disposition") ?? "")?.[1] ?? "esa-catalog.json";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(msg(e, "Exportul a eșuat."));
    } finally {
      setExporting(false);
    }
  }

  async function chooseFile(file: File | undefined) {
    if (fileInput.current) fileInput.current.value = "";
    if (!file) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      toast.error("Fișierul nu este un JSON valid.");
      return;
    }
    setData(parsed);
    setFileName(file.name);
    setSummary(null);
    setError("");
    setOpen(true);
    setBusy(true);
    try {
      setSummary(await api<ImportSummary>("/catalog/import", { method: "POST", body: { data: parsed, dryRun: true } }));
    } catch (e) {
      setError(detailedMsg(e, "Fișierul nu a putut fi verificat."));
    } finally {
      setBusy(false);
    }
  }

  async function apply() {
    setBusy(true);
    setError("");
    try {
      await api("/catalog/import", { method: "POST", body: { data, dryRun: false } });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["catalog-categories"] }),
        queryClient.invalidateQueries({ queryKey: ["catalog-services"] }),
        queryClient.invalidateQueries({ queryKey: ["catalog-packages"] }),
      ]);
      toast.success("Am importat catalogul.");
      close();
    } catch (e) {
      setError(detailedMsg(e, "Importul a eșuat."));
    } finally {
      setBusy(false);
    }
  }

  function close() {
    setOpen(false);
    setData(null);
    setSummary(null);
    setError("");
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <div className="flex flex-wrap items-center gap-2">
          {canExport ? (
            <Button variant="secondary" loading={exporting} onClick={() => void download()}>
              Exportă catalogul
            </Button>
          ) : null}
          {canImport ? (
            <Button variant="secondary" disabled={busy} onClick={() => fileInput.current?.click()}>
              Importă catalogul
            </Button>
          ) : null}
          <input ref={fileInput} type="file" accept=".json,application/json" className="hidden" onChange={(e) => void chooseFile(e.target.files?.[0])} />
        </div>
        <p className="max-w-md text-right text-xs text-muted">
          Exportă catalogul după ce setezi prețurile și păstrează fișierul. Pe altă instalare îl imporți cu un click.
        </p>
      </div>
      <Modal
        open={open}
        onClose={() => (busy ? undefined : close())}
        title="Importă catalogul"
        footer={
          <>
            <Button variant="secondary" disabled={busy} onClick={close}>
              Renunță
            </Button>
            <Button loading={busy} disabled={!summary} onClick={() => void apply()}>
              Aplică importul
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-muted">Fișier: {fileName}</p>
          {busy && !summary ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : null}
          {summary ? (
            <ul className="space-y-1">
              <li>Servicii: {countsText(summary.services)}</li>
              <li>Pachete: {countsText(summary.packages)}</li>
              <li>Categorii: {countsText(summary.categories)}</li>
            </ul>
          ) : null}
          {summary?.warnings.length ? (
            <ul className="list-disc space-y-1 pl-5 text-amber-600">
              {summary.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}
          {summary ? <p className="text-xs text-muted">Nu se șterge nimic din catalogul curent. Ofertele existente nu sunt afectate.</p> : null}
          {error ? <p className="whitespace-pre-wrap text-danger">{error}</p> : null}
        </div>
      </Modal>
    </>
  );
}

/* ------------------------------------------------------------------ pagina */

export function CatalogPage() {
  const [tab, setTab] = useState("services");
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data?.items ?? [];

  return (
    <div className="space-y-4">
      <PageHeader title="Catalog servicii" description="Serviciile, pachetele și categoriile din care se construiesc ofertele." actions={<ImportExport />} />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "services", label: "Servicii" },
          { value: "packages", label: "Pachete" },
          { value: "categories", label: "Categorii" },
        ]}
      />
      {categoriesQuery.isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : tab === "services" ? (
        <ServicesTab categories={categories} />
      ) : tab === "packages" ? (
        <PackagesTab />
      ) : (
        <CategoriesTab categories={categories} />
      )}
    </div>
  );
}

export default CatalogPage;
