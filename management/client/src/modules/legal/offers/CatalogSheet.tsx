/**
 * Panoul lateral „Catalog de servicii”: se deschide din dreapta (full-screen pe mobil), cu căutare
 * instantanee fără diacritice, filtre pe categorie și selectare multiplă de servicii și pachete.
 */
import { useDeferredValue, useMemo, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ChevronRight, X } from "lucide-react";
import type { Currency } from "@shared/enums";
import { BILLING_LABELS, formatMoney, type OfferLine } from "@shared/offers";

import { Badge, Button, Input, Spinner, Tabs, cn } from "@/components/ui";

import { useCategories, usePackages, useServices } from "./hooks";
import { norm, type CatalogPackage, type CatalogServiceRow } from "./lib";

export interface CatalogSheetProps {
  open: boolean;
  onClose: () => void;
  currency: Currency;
  lines: OfferLine[];
  onAdd: (services: CatalogServiceRow[], packages: CatalogPackage[]) => void;
  onAddCustom: () => void;
}

function Chip({ active, onClick, children, title }: { active: boolean; onClick: () => void; children: string; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-line bg-card text-muted hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

export function CatalogSheet({ open, onClose, currency, lines, onAdd, onAddCustom }: CatalogSheetProps) {
  const [tab, setTab] = useState("services");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [pickedServices, setPickedServices] = useState<Set<string>>(new Set());
  const [pickedPackages, setPickedPackages] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const deferred = useDeferredValue(q);

  // Catalogul se încarcă o singură dată (cache React Query); căutarea e locală.
  const categories = useCategories();
  const services = useServices("false");
  const packages = usePackages("false");

  const needle = norm(deferred.trim());
  const existingServiceIds = useMemo(() => new Set(lines.map((l) => l.serviceId).filter(Boolean) as string[]), [lines]);
  const existingPackages = useMemo(() => new Set(lines.filter((l) => l.isPackage).map((l) => l.name)), [lines]);

  const filteredServices = useMemo(
    () =>
      (services.data?.items ?? []).filter(
        (s) =>
          (!category || s.categoryCode === category) &&
          (!needle || norm(`${s.code} ${s.name} ${s.shortDescription} ${s.description}`).includes(needle)),
      ),
    [services.data, category, needle],
  );
  const filteredPackages = useMemo(
    () =>
      (packages.data?.items ?? []).filter(
        (p) =>
          (!category || p.items.some((s) => s.categoryCode === category)) &&
          (!needle || norm(`${p.name} ${p.description} ${p.items.map((s) => s.name).join(" ")}`).includes(needle)),
      ),
    [packages.data, category, needle],
  );

  const total = pickedServices.size + pickedPackages.size;
  const toggle = (set: Set<string>, id: string): Set<string> => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  function submit() {
    const chosenServices = (services.data?.items ?? []).filter((s) => pickedServices.has(s.id));
    const chosenPackages = (packages.data?.items ?? []).filter((p) => pickedPackages.has(p.id));
    onAdd(chosenServices, chosenPackages);
    setPickedServices(new Set());
    setPickedPackages(new Set());
    onClose();
  }

  const loading = services.isLoading || packages.isLoading;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm duration-300 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-background shadow-2xl outline-none duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right sm:w-[460px] sm:border-l sm:border-line"
        >
          <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <DialogPrimitive.Title className="text-base font-semibold tracking-tight text-text">Catalog de servicii</DialogPrimitive.Title>
            <DialogPrimitive.Close aria-label="Închide" className="rounded-full p-2 text-muted hover:bg-black/5 hover:text-text">
              <X className="size-4" />
            </DialogPrimitive.Close>
          </header>

          <div className="space-y-3 border-b border-line px-4 py-3">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Caută în denumire și descriere…" aria-label="Caută în catalog" />
            <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1" role="group" aria-label="Filtre categorie">
              <Chip active={category === ""} onClick={() => setCategory("")}>
                Toate
              </Chip>
              {(categories.data?.items ?? []).map((c) => (
                <Chip key={c.code} active={category === c.code} onClick={() => setCategory(category === c.code ? "" : c.code)} title={c.name}>
                  {`${c.code} · ${c.name}`}
                </Chip>
              ))}
            </div>
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { value: "services", label: `Servicii (${filteredServices.length})` },
                { value: "packages", label: `Pachete (${filteredPackages.length})` },
              ]}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {loading ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : tab === "services" ? (
              filteredServices.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted">Niciun serviciu găsit.</p>
              ) : (
                <ul className="space-y-1">
                  {filteredServices.map((s) => {
                    const added = existingServiceIds.has(s.id);
                    return (
                      <li key={s.id}>
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-sidebar">
                          <input
                            type="checkbox"
                            className="mt-1 size-4 shrink-0 accent-primary"
                            checked={pickedServices.has(s.id)}
                            onChange={() => setPickedServices((cur) => toggle(cur, s.id))}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-semibold text-muted">{s.code}</span>
                              <span className="text-sm font-medium text-text">{s.name}</span>
                              {s.advanced ? <Badge tone="warning">Avansat</Badge> : null}
                              {s.defaultStatus === "client_direct" ? <Badge>Cost direct client</Badge> : null}
                              {added ? <Badge tone="success">deja adăugat</Badge> : null}
                            </span>
                            {s.shortDescription ? <span className="mt-0.5 block text-xs text-muted">{s.shortDescription}</span> : null}
                            <span className="mt-0.5 block text-xs text-muted">
                              {BILLING_LABELS[s.billing]}
                              {s.recommendedPrice != null ? ` · ${formatMoney(s.recommendedPrice, s.currency ?? currency)}` : ""}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )
            ) : filteredPackages.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted">Niciun pachet găsit.</p>
            ) : (
              <ul className="space-y-1">
                {filteredPackages.map((p) => {
                  const isOpen = expanded.has(p.id);
                  return (
                    <li key={p.id} className="rounded-xl hover:bg-sidebar">
                      <div className="flex items-start gap-3 px-3 py-2.5">
                        <input
                          type="checkbox"
                          aria-label={`Alege pachetul ${p.name}`}
                          className="mt-1 size-4 shrink-0 accent-primary"
                          checked={pickedPackages.has(p.id)}
                          onChange={() => setPickedPackages((cur) => toggle(cur, p.id))}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-medium text-text">{p.name}</span>
                            {existingPackages.has(p.name) ? <Badge tone="success">deja adăugat</Badge> : null}
                          </div>
                          {p.description ? <p className="mt-0.5 text-xs text-muted">{p.description}</p> : null}
                          <p className="mt-0.5 text-xs text-muted">
                            {p.items.length} componente · {BILLING_LABELS[p.billing]}
                            {p.recommendedPrice != null ? ` · ${formatMoney(p.recommendedPrice, p.currency ?? currency)}` : ""}
                          </p>
                          {isOpen ? (
                            <ul className="mt-2 space-y-1 border-l border-line pl-3">
                              {p.items.map((s) => (
                                <li key={s.id} className="text-xs text-text">
                                  <span className="font-semibold text-muted">{s.code}</span> {s.name}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          aria-label={isOpen ? "Ascunde componentele" : "Arată componentele"}
                          aria-expanded={isOpen}
                          className="rounded-full p-1.5 text-muted hover:bg-black/5"
                          onClick={() => setExpanded((cur) => toggle(cur, p.id))}
                        >
                          <ChevronRight className={cn("size-4 transition-transform", isOpen && "rotate-90")} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-background px-4 py-3">
            <Button
              variant="secondary"
              onClick={() => {
                onAddCustom();
                onClose();
              }}
            >
              Serviciu personalizat
            </Button>
            <Button variant="primary" disabled={total === 0} onClick={submit}>
              Adaugă selectate ({total})
            </Button>
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
