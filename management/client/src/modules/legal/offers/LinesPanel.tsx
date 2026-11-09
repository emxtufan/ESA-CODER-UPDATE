/** Zona centrală a editorului: liniile ofertei grupate, rând compact + editor extins per linie. */
import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronRight, Copy, Trash2 } from "lucide-react";
import type { Currency } from "@shared/enums";
import {
  BILLINGS,
  BILLING_LABELS,
  LINE_STATUS_LABELS,
  formatMoney,
  lineAmounts,
  type Billing,
  type DiscountType,
  type LineStatus,
  type OfferLine,
} from "@shared/offers";

import { Badge, Button, EmptyState, Input, Select, Textarea, cn } from "@/components/ui";

import { groupLines, type LineGroups } from "./editorModel";
import { MoneyInput, NumInput, LabeledField as Field } from "./Inputs";
import type { CatalogCategory } from "./lib";

export interface LinesPanelProps {
  lines: OfferLine[];
  currency: Currency;
  readOnly: boolean;
  categories: CatalogCategory[];
  onChange: (id: string, patch: Partial<OfferLine>) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onSaveToCatalog: (id: string, categoryCode: string) => Promise<void>;
  onOpenCatalog: () => void;
  onAddCustom: () => void;
}

function statusOptions(line: OfferLine): { value: string; label: string }[] {
  const allowed: LineStatus[] = line.isPackage
    ? ["accepted", "optional"]
    : line.packageLineId
      ? ["included", "accepted", "optional", "client_direct"]
      : ["accepted", "optional", "client_direct"];
  return allowed.map((s) => ({ value: s, label: LINE_STATUS_LABELS[s] }));
}

const PERIOD_UNIT: Record<Billing, string> = { one_time: "", monthly: "luni", yearly: "ani" };
const SUFFIX: Record<Billing, string> = { one_time: "", monthly: "/lună", yearly: "/an" };

interface RowProps {
  line: OfferLine;
  lines: OfferLine[];
  currency: Currency;
  readOnly: boolean;
  indent?: boolean;
  categories: CatalogCategory[];
  open: boolean;
  onToggle: () => void;
  onChange: LinesPanelProps["onChange"];
  onMove: LinesPanelProps["onMove"];
  onDuplicate: LinesPanelProps["onDuplicate"];
  onDelete: LinesPanelProps["onDelete"];
  onSaveToCatalog: LinesPanelProps["onSaveToCatalog"];
}

function LineEditor({ line, readOnly, categories, onChange, onMove, onDuplicate, onDelete, onSaveToCatalog, currency }: RowProps) {
  const [category, setCategory] = useState(line.category ?? categories[0]?.code ?? "A");
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<OfferLine>) => onChange(line.id, patch);

  return (
    <div className="space-y-3 border-t border-line px-3 py-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Denumire" className="md:col-span-2" required>
          <Input value={line.name} onChange={(e) => set({ name: e.target.value })} disabled={readOnly} />
        </Field>
        <Field label="Descriere detaliată" className="md:col-span-2">
          <Textarea value={line.description} onChange={(e) => set({ description: e.target.value })} disabled={readOnly} />
        </Field>
        <Field label="Livrabile">
          <Textarea value={line.deliverables} onChange={(e) => set({ deliverables: e.target.value })} disabled={readOnly} />
        </Field>
        <Field label="Criterii de acceptare">
          <Textarea value={line.acceptance} onChange={(e) => set({ acceptance: e.target.value })} disabled={readOnly} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Field label="Unitate">
          <Input value={line.unit} onChange={(e) => set({ unit: e.target.value })} disabled={readOnly} />
        </Field>
        <Field label="Cantitate">
          <NumInput min={0} value={line.quantity} onChange={(n) => set({ quantity: n })} disabled={readOnly} />
        </Field>
        <Field label={`Preț unitar (${currency})`}>
          <MoneyInput value={line.unitPrice} onChange={(m) => set({ unitPrice: m ?? 0 })} disabled={readOnly} />
        </Field>
        <Field label="Stare">
          <Select
            value={line.status}
            options={statusOptions(line)}
            onChange={(e) => set({ status: e.target.value as LineStatus })}
            disabled={readOnly}
          />
        </Field>
        <Field label="Reducere">
          <Select
            value={line.discountType}
            options={[
              { value: "none", label: "Fără reducere" },
              { value: "percent", label: "Procent (%)" },
              { value: "fixed", label: "Sumă fixă" },
            ]}
            onChange={(e) => set({ discountType: e.target.value as DiscountType, discountValue: 0 })}
            disabled={readOnly}
          />
        </Field>
        {line.discountType === "percent" ? (
          <Field label="Valoare reducere (%)">
            <NumInput min={0} max={100} value={line.discountValue} onChange={(n) => set({ discountValue: n })} disabled={readOnly} />
          </Field>
        ) : line.discountType === "fixed" ? (
          <Field label={`Valoare reducere (${currency})`}>
            <MoneyInput value={line.discountValue} onChange={(m) => set({ discountValue: m ?? 0 })} disabled={readOnly} />
          </Field>
        ) : (
          <div />
        )}
        <Field label="Frecvență">
          <Select
            value={line.billing}
            options={BILLINGS.map((b) => ({ value: b, label: BILLING_LABELS[b] }))}
            onChange={(e) => set({ billing: e.target.value as Billing })}
            disabled={readOnly}
          />
        </Field>
        {line.billing !== "one_time" ? (
          <Field label={`Perioade (${PERIOD_UNIT[line.billing]})`}>
            <NumInput integer min={1} value={line.periods} onChange={(n) => set({ periods: Math.max(1, n) })} disabled={readOnly} />
          </Field>
        ) : (
          <div />
        )}
        <Field label="Durată" className="md:col-span-2">
          <Input value={line.duration} onChange={(e) => set({ duration: e.target.value })} disabled={readOnly} />
        </Field>
        <Field label="Condiții" className="md:col-span-2">
          <Input value={line.conditions} onChange={(e) => set({ conditions: e.target.value })} disabled={readOnly} />
        </Field>
      </div>

      {!readOnly ? (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button size="sm" variant="secondary" onClick={() => onMove(line.id, -1)} aria-label="Mută sus">
            <ArrowUp className="size-3.5" />
            Sus
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onMove(line.id, 1)} aria-label="Mută jos">
            <ArrowDown className="size-3.5" />
            Jos
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onDuplicate(line.id)}>
            <Copy className="size-3.5" />
            Duplică
          </Button>
          <Button size="sm" variant="danger" onClick={() => onDelete(line.id)}>
            <Trash2 className="size-3.5" />
            Șterge
          </Button>
          {line.serviceId === null && !line.isPackage ? (
            <div className="ml-auto flex items-center gap-2">
              <Select
                aria-label="Categorie în catalog"
                className="h-8 w-44"
                value={category}
                options={categories.map((c) => ({ value: c.code, label: `${c.code} · ${c.name}` }))}
                onChange={(e) => setCategory(e.target.value)}
              />
              <Button
                size="sm"
                variant="secondary"
                loading={saving}
                disabled={!line.name.trim()}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await onSaveToCatalog(line.id, category);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Salvează în catalog
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function LineRow(props: RowProps) {
  const { line, lines, currency, readOnly, indent, open, onToggle, onChange } = props;
  const amounts = lineAmounts(line, lines);
  const included = line.status === "included";

  return (
    <div className={cn("rounded-xl border border-line", indent ? "ml-4 bg-sidebar sm:ml-8" : "bg-card")} data-line-id={line.id}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 basis-48 items-center gap-2 text-left"
        >
          <ChevronRight aria-hidden="true" className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-90")} />
          {line.code ? <span className="shrink-0 text-xs font-semibold text-muted">{line.code}</span> : null}
          <span className="min-w-0 truncate text-sm font-medium text-text">{line.name || "Serviciu fără denumire"}</span>
        </button>
        <div className="flex flex-wrap items-center gap-1.5">
          {line.isPackage ? <Badge>Pachet</Badge> : null}
          {included ? <Badge>inclus în pachet</Badge> : null}
          {line.advanced ? <Badge tone="warning">Dezvoltare avansată – ofertată separat</Badge> : null}
        </div>
        {!included ? (
          <div className="text-sm text-muted tabular-nums">
            {line.quantity.toLocaleString("ro-RO")} × {formatMoney(line.unitPrice, currency)}
            {SUFFIX[line.billing]}
            {line.billing !== "one_time" && line.periods > 1 ? ` × ${line.periods} ${PERIOD_UNIT[line.billing]}` : ""}
            {amounts.discount > 0 ? (
              <Badge tone="danger" className="ml-2">−{Math.round((amounts.discount / amounts.gross) * 100)}%</Badge>
            ) : null}
          </div>
        ) : null}
        <div className="min-w-20 text-right text-sm font-semibold text-text tabular-nums">
          {!included && amounts.discount > 0 ? (
            <s className="block text-xs font-normal text-danger">{formatMoney(amounts.gross * amounts.periods, currency)}</s>
          ) : null}
          {included ? "—" : formatMoney(amounts.total, currency)}
        </div>
        <Select
          aria-label={`Stare ${line.name}`}
          className="h-8 w-full text-xs sm:w-52"
          value={line.status}
          options={statusOptions(line)}
          onChange={(e) => onChange(line.id, { status: e.target.value as LineStatus })}
          disabled={readOnly}
        />
      </div>
      {open ? <LineEditor {...props} /> : null}
    </div>
  );
}

function GroupBlock({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  if (count === 0) return null;
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-text">
        {title}
        <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium text-muted">{count}</span>
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export function LinesPanel(props: LinesPanelProps) {
  const { lines, readOnly, onOpenCatalog, onAddCustom } = props;
  const [openId, setOpenId] = useState<string | null>(null);
  const groups: LineGroups = groupLines(lines);

  const row = (line: OfferLine, indent = false) => (
    <LineRow
      key={line.id}
      line={line}
      lines={lines}
      currency={props.currency}
      readOnly={readOnly}
      indent={indent}
      categories={props.categories}
      open={openId === line.id}
      onToggle={() => setOpenId((cur) => (cur === line.id ? null : line.id))}
      onChange={props.onChange}
      onMove={props.onMove}
      onDuplicate={props.onDuplicate}
      onDelete={props.onDelete}
      onSaveToCatalog={props.onSaveToCatalog}
    />
  );

  return (
    <div className="space-y-5">
      {!readOnly ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={onOpenCatalog}>
            Adaugă din catalog
          </Button>
          <Button variant="secondary" onClick={onAddCustom}>
            Serviciu personalizat
          </Button>
        </div>
      ) : null}

      {lines.length === 0 ? (
        <div className="rounded-2xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]">
          <EmptyState title="Oferta nu are încă servicii" description="Adaugă servicii sau pachete din catalog, ori un serviciu personalizat." />
        </div>
      ) : null}

      <GroupBlock title="Pachete" count={groups.packages.length}>
        {groups.packages.map(({ line, comps }) => (
          <div key={line.id} className="space-y-2">
            {row(line)}
            {comps.map((c) => row(c, true))}
          </div>
        ))}
      </GroupBlock>
      <GroupBlock title="Servicii cu plată unică" count={groups.one.length}>
        {groups.one.map((l) => row(l))}
      </GroupBlock>
      <GroupBlock title="Servicii recurente" count={groups.rec.length}>
        {groups.rec.map((l) => row(l))}
      </GroupBlock>
      <GroupBlock title="Opționale neacceptate" count={groups.opt.length}>
        {groups.opt.map((l) => row(l))}
      </GroupBlock>
      <GroupBlock title="Costuri suportate direct de client" count={groups.dir.length}>
        {groups.dir.map((l) => row(l))}
      </GroupBlock>
    </div>
  );
}
