/**
 * Formularul generatorului: secțiuni pliabile generate din `SECTIONS` (etichete, texte
 * de ajutor, tipuri și validări identice cu originalul). Câmpurile aplicației (status,
 * client, proiect, „Salvează ca implicite”) intră prin `before` / `after`.
 */
import { useId, type ReactNode } from "react";

import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui";

import type { Values } from "./contract/engine";
import { CHECKS, SECTIONS, type FieldSpec } from "./contract/fields";

export interface ContractFormProps {
  values: Values;
  onChange: (key: string, value: string) => void;
  /** Conținut adăugat la începutul secțiunii (după introducere), după id-ul secțiunii. */
  before?: Record<string, ReactNode>;
  /** Conținut adăugat la finalul secțiunii, după id-ul secțiunii. */
  after?: Record<string, ReactNode>;
}

function FieldControl({ spec, values, onChange }: { spec: FieldSpec; values: Values; onChange: ContractFormProps["onChange"] }) {
  const id = useId();
  const value = values[spec.key] ?? "";

  if (spec.type === "check") {
    return (
      <div className="mb-2">
        <Checkbox
          checked={Boolean(value)}
          onChange={(event) => onChange(spec.key, event.target.checked ? "1" : "")}
          label={spec.label}
        />
      </div>
    );
  }

  const warning = spec.check ? CHECKS[spec.check](value) : "";
  let control: ReactNode;

  if (spec.type === "textarea") {
    control = <Textarea id={id} value={value} invalid={Boolean(warning)} onChange={(event) => onChange(spec.key, event.target.value)} />;
  } else if (spec.type === "select") {
    control = (
      <Select
        id={id}
        value={value}
        options={(spec.opts ?? []).map((option) => ({ value: option, label: option || "— alege —" }))}
        onChange={(event) => onChange(spec.key, event.target.value)}
      />
    );
  } else {
    control = (
      <Input
        id={id}
        type={spec.type}
        value={value}
        min={spec.min}
        max={spec.max}
        inputMode={spec.type === "number" ? "decimal" : undefined}
        step={spec.type === "number" ? "any" : undefined}
        autoComplete="off"
        invalid={Boolean(warning)}
        onChange={(event) => onChange(spec.key, event.target.value)}
      />
    );
  }

  return (
    <Field label={spec.label} htmlFor={id} error={warning || undefined}>
      {control}
      {spec.help ? <p className="text-xs leading-snug text-muted [&_b]:font-semibold [&_b]:text-text" dangerouslySetInnerHTML={{ __html: spec.help }} /> : null}
    </Field>
  );
}

export function ContractForm({ values, onChange, before, after }: ContractFormProps) {
  return (
    <div className="divide-y divide-line">
      {SECTIONS.map((section) => (
        <details key={section.id} open={section.open || undefined} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-bold text-text [&::-webkit-details-marker]:hidden">
            <span>
              {section.title}
              {section.sub ? <small className="ml-2 text-xs font-normal text-muted">{section.sub}</small> : null}
            </span>
            <span aria-hidden="true" className="text-lg font-normal text-muted group-open:hidden">+</span>
            <span aria-hidden="true" className="hidden text-lg font-normal text-muted group-open:inline">–</span>
          </summary>
          <div className="grid gap-3 px-4 pb-4">
            {section.intro ? (
              <p
                className="border-l-[3px] border-text bg-secondary px-3 py-2 text-xs text-muted [&_b]:font-semibold [&_i]:italic"
                dangerouslySetInnerHTML={{ __html: section.intro }}
              />
            ) : null}
            {before?.[section.id]}
            {section.fields.map((spec) => (
              <FieldControl key={spec.key} spec={spec} values={values} onChange={onChange} />
            ))}
            {after?.[section.id]}
          </div>
        </details>
      ))}
    </div>
  );
}
