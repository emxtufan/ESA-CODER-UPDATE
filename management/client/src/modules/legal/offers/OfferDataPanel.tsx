/** Coloana stângă a editorului: datele ofertei, etape și tranșe de plată. */
import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { Currency } from "@shared/enums";
import type { OfferConfig, PaymentInstallment, ScheduleStage } from "@shared/offers";

import { Button, Checkbox, Input, Select, Textarea } from "@/components/ui";

import { uid } from "./editorModel";
import { NumInput, LabeledField as Field } from "./Inputs";
import { CURRENCY_OPTIONS } from "./lib";

export interface OfferMeta {
  clientId: string;
  projectId: string;
  number: string;
  date: string;
  title: string;
}

const VAT_PRESETS = [0, 21, 19];

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="space-y-3 border-b border-line px-4 py-4 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight text-text">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export interface OfferDataPanelProps {
  meta: OfferMeta;
  config: OfferConfig;
  readOnly: boolean;
  /** Oferta există: clientul și numărul nu se mai schimbă. */
  numberLocked: boolean;
  /** Actul adițional păstrează moneda ofertei-părinte. */
  currencyLocked: boolean;
  clientOptions: { value: string; label: string }[];
  projectOptions: { value: string; label: string }[];
  onMeta: (patch: Partial<OfferMeta>) => void;
  onConfig: (patch: Partial<OfferConfig>) => void;
}

export function OfferDataPanel({ meta, config, readOnly, numberLocked, currencyLocked, clientOptions, projectOptions, onMeta, onConfig }: OfferDataPanelProps) {
  const [vatCustom, setVatCustom] = useState(!VAT_PRESETS.includes(config.vatRate));
  const sum = config.installments.reduce((acc, i) => acc + (i.percent || 0), 0);
  const sumOk = Math.abs(sum - 100) < 0.001;

  const setStage = (id: string, patch: Partial<ScheduleStage>) =>
    onConfig({ stages: config.stages.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const setInstallment = (id: string, patch: Partial<PaymentInstallment>) =>
    onConfig({ installments: config.installments.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  const moveStage = (index: number, dir: -1 | 1) => {
    const next = [...config.stages];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j]!, next[index]!];
    onConfig({ stages: next });
  };

  return (
    <div>
      <Section title="Date ofertă">
        <Field label="Client" required>
          <Select
            value={meta.clientId}
            options={[{ value: "", label: "— alege clientul —" }, ...clientOptions]}
            onChange={(e) => onMeta({ clientId: e.target.value, projectId: "" })}
            disabled={readOnly || numberLocked}
          />
        </Field>
        {meta.clientId ? (
          <Field label="Proiect (opțional)">
            <Select
              value={meta.projectId}
              options={[{ value: "", label: "— fără proiect —" }, ...projectOptions]}
              onChange={(e) => onMeta({ projectId: e.target.value })}
              disabled={readOnly}
            />
          </Field>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Număr" hint={numberLocked ? undefined : "Gol = alocat automat."}>
            <Input value={meta.number} onChange={(e) => onMeta({ number: e.target.value })} disabled={readOnly || numberLocked} />
          </Field>
          <Field label="Data">
            <Input type="date" value={meta.date} onChange={(e) => onMeta({ date: e.target.value })} disabled={readOnly} />
          </Field>
        </div>
        <Field label="Titlu">
          <Input value={meta.title} onChange={(e) => onMeta({ title: e.target.value })} disabled={readOnly} />
        </Field>
        <Field label="Denumirea proiectului" hint="Apare în ofertă și în Comandă.">
          <Input value={config.projectName} onChange={(e) => onConfig({ projectName: e.target.value })} disabled={readOnly} />
        </Field>
        <Field label="Website">
          <Input value={config.website} onChange={(e) => onConfig({ website: e.target.value })} disabled={readOnly} />
        </Field>
      </Section>

      <Section title="Monedă și TVA">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Monedă">
            <Select
              value={config.currency}
              options={CURRENCY_OPTIONS}
              onChange={(e) => onConfig({ currency: e.target.value as Currency })}
              disabled={readOnly || currencyLocked}
            />
          </Field>
          <Field label="Cota TVA">
            <Select
              value={vatCustom ? "custom" : String(config.vatRate)}
              options={[
                { value: "0", label: "0% (fără TVA)" },
                { value: "21", label: "21%" },
                { value: "19", label: "19%" },
                { value: "custom", label: "Altă valoare" },
              ]}
              onChange={(e) => {
                if (e.target.value === "custom") setVatCustom(true);
                else {
                  setVatCustom(false);
                  onConfig({ vatRate: Number(e.target.value) });
                }
              }}
              disabled={readOnly}
            />
          </Field>
        </div>
        {vatCustom ? (
          <Field label="Cota TVA (%)">
            <NumInput min={0} max={100} value={config.vatRate} onChange={(n) => onConfig({ vatRate: n })} disabled={readOnly} />
          </Field>
        ) : null}
      </Section>

      <Section title="Condiții">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valabilitate (zile)">
            <NumInput
              integer
              min={0}
              value={config.validityDays ?? 0}
              onChange={(n) => onConfig({ validityDays: n > 0 ? n : null })}
              disabled={readOnly}
            />
          </Field>
          <Field label="Termen de realizare">
            <Input value={config.timeline} onChange={(e) => onConfig({ timeline: e.target.value })} disabled={readOnly} />
          </Field>
        </div>
        <Field label="Condiții de plată">
          <Textarea value={config.paymentTerms} onChange={(e) => onConfig({ paymentTerms: e.target.value })} disabled={readOnly} />
        </Field>
        <Field label="Introducere">
          <Textarea value={config.intro} onChange={(e) => onConfig({ intro: e.target.value })} disabled={readOnly} />
        </Field>
        <Field label="Observații">
          <Textarea value={config.notes} onChange={(e) => onConfig({ notes: e.target.value })} disabled={readOnly} />
        </Field>
      </Section>

      <Section
        title="Etape"
        action={
          !readOnly ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onConfig({ stages: [...config.stages, { id: uid(), name: "", deliverables: "", term: "", firm: false }] })}
            >
              <Plus className="size-3.5" />
              Etapă
            </Button>
          ) : undefined
        }
      >
        {config.stages.length === 0 ? <p className="text-xs text-muted">Nicio etapă definită.</p> : null}
        {config.stages.map((stage, index) => (
          <div key={stage.id} className="space-y-2 rounded-xl border border-line p-3">
            <div className="flex items-center gap-1">
              <Input
                aria-label={`Denumire etapă ${index + 1}`}
                placeholder={`Etapa ${index + 1}`}
                value={stage.name}
                onChange={(e) => setStage(stage.id, { name: e.target.value })}
                disabled={readOnly}
              />
              {!readOnly ? (
                <>
                  <button type="button" aria-label="Mută sus" className="rounded p-1.5 hover:bg-black/5" onClick={() => moveStage(index, -1)}>
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button type="button" aria-label="Mută jos" className="rounded p-1.5 hover:bg-black/5" onClick={() => moveStage(index, 1)}>
                    <ArrowDown className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Șterge etapa"
                    className="rounded p-1.5 hover:bg-black/5"
                    onClick={() => onConfig({ stages: config.stages.filter((s) => s.id !== stage.id) })}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </>
              ) : null}
            </div>
            <Textarea
              aria-label="Livrabile"
              placeholder="Livrabile"
              className="min-h-14"
              value={stage.deliverables}
              onChange={(e) => setStage(stage.id, { deliverables: e.target.value })}
              disabled={readOnly}
            />
            <Input
              aria-label="Termen"
              placeholder="Termen (dată sau text)"
              value={stage.term}
              onChange={(e) => setStage(stage.id, { term: e.target.value })}
              disabled={readOnly}
            />
            <Checkbox
              checked={stage.firm}
              onChange={(e) => setStage(stage.id, { firm: e.target.checked })}
              disabled={readOnly}
              label="Termen ferm (altfel estimativ)"
            />
          </div>
        ))}
      </Section>

      <Section
        title="Tranșe de plată"
        action={
          !readOnly ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onConfig({ installments: [...config.installments, { id: uid(), label: "", percent: 0, due: "" }] })}
            >
              <Plus className="size-3.5" />
              Tranșă
            </Button>
          ) : undefined
        }
      >
        {config.installments.map((inst) => (
          <div key={inst.id} className="grid grid-cols-[1fr_5rem_auto] items-center gap-2">
            <Input
              aria-label="Etichetă tranșă"
              placeholder="Etichetă"
              value={inst.label}
              onChange={(e) => setInstallment(inst.id, { label: e.target.value })}
              disabled={readOnly}
            />
            <NumInput aria-label="Procent" min={0} max={100} value={inst.percent} onChange={(n) => setInstallment(inst.id, { percent: n })} disabled={readOnly} />
            {!readOnly ? (
              <button
                type="button"
                aria-label="Șterge tranșa"
                className="rounded p-1.5 hover:bg-black/5"
                onClick={() => onConfig({ installments: config.installments.filter((i) => i.id !== inst.id) })}
              >
                <Trash2 className="size-3.5" />
              </button>
            ) : (
              <span />
            )}
            <Input
              className="col-span-3"
              aria-label="Scadență"
              placeholder="Scadență (dată sau text)"
              value={inst.due}
              onChange={(e) => setInstallment(inst.id, { due: e.target.value })}
              disabled={readOnly}
            />
          </div>
        ))}
        {config.installments.length > 0 ? (
          <p className={sumOk ? "text-xs text-muted" : "rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning"} role={sumOk ? undefined : "alert"}>
            Suma procentelor: {sum.toLocaleString("ro-RO", { maximumFractionDigits: 2 })}%
            {sumOk ? "" : " – trebuie să fie 100% pentru a putea accepta oferta."}
          </p>
        ) : null}
      </Section>
    </div>
  );
}
