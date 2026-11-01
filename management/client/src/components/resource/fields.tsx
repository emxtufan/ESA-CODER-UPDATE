/**
 * Câmpurile declarative ale paginilor de resursă: tipuri, conversii între rândul
 * primit de la API și valorile din formular, controlul unui câmp și formatări de afișare.
 */
import { useId, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { FieldError, FieldValues, UseFormReturn } from "react-hook-form";

import {
  Checkbox,
  Field,
  Input,
  Select,
  Textarea,
  cn,
  type BadgeTone,
  type SelectOption,
} from "@/components/ui";
import { api } from "@/lib/api";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "money"
  | "date"
  | "datetime"
  | "select"
  | "checkbox"
  | "email"
  | "url"
  | "relation"
  | "tags"
  | "password";

/** O opțiune de `select`: fie textul (valoare = etichetă), fie perechea valoare/etichetă. */
export type FieldOption = string | { value: string; label: string };

/** Descrierea unui câmp de formular generat. */
export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  /** Opțiuni statice pentru `select` (la `relation` doar dacă nu există `endpoint`). */
  options?: readonly FieldOption[];
  /** Sursa opțiunilor pentru `relation`: listă paginată `{ items }`. */
  endpoint?: string;
  /** Proprietatea din rând folosită ca etichetă la `relation` (implicit `name`). */
  labelKey?: string;
  required?: boolean;
  hint?: string;
  span?: 1 | 2;
  showIf?: (values: Record<string, unknown>) => boolean;
  /** Câmpul apare doar la creare (ex. parola inițială). */
  omitOnEdit?: boolean;
}

/** Rândul brut dintr-o listă de relații (`GET endpoint?pageSize=100`). */
type RelationRow = Record<string, unknown>;

/** Normalizează opțiunile la forma cerută de `Select`. */
export function normalizeOptions(options?: readonly FieldOption[]): SelectOption[] {
  if (!options) return [];
  return options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : { value: option.value, label: option.label },
  );
}

/** Opțiunile unui câmp `relation`: primele 100 de rânduri de la `endpoint`. */
export function useRelationOptions(endpoint?: string, labelKey = "name") {
  const { data, isLoading } = useQuery<{ items: RelationRow[] }>({
    queryKey: ["relation", endpoint],
    queryFn: () => api<{ items: RelationRow[] }>(endpoint as string, { query: { pageSize: 100 } }),
    enabled: Boolean(endpoint),
  });

  const options = useMemo(
    () =>
      (data?.items ?? []).map((item) => ({
        value: String(item.id ?? ""),
        label: String(item[labelKey] ?? item.id ?? ""),
      })),
    [data, labelKey],
  );

  return { options, loading: isLoading };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** ISO → valoarea unui input `datetime-local` (ora locală a browserului). */
function toDateTimeLocal(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Valoarea din formular pentru un câmp, pornind de la rândul din API. */
function initialValue(field: FieldDef, source: Record<string, unknown> | null | undefined): unknown {
  const raw = source?.[field.name];

  switch (field.type) {
    case "money":
      return raw === null || raw === undefined || raw === "" ? "" : (Number(raw) / 100).toFixed(2);
    case "date":
      return raw ? String(raw).slice(0, 10) : "";
    case "datetime":
      return toDateTimeLocal(raw);
    case "tags":
      return Array.isArray(raw) ? raw.join(", ") : raw === null || raw === undefined ? "" : String(raw);
    case "checkbox":
      return Boolean(raw);
    case "number":
      return raw === null || raw === undefined ? "" : String(raw);
    default:
      return raw === null || raw === undefined ? "" : String(raw);
  }
}

/** `defaultValues` pentru formularul de resursă (creare: `defaults`, modificare: rândul). */
export function resourceDefaults(
  fields: FieldDef[],
  row: Record<string, unknown> | null,
  defaults?: Record<string, unknown>,
): Record<string, unknown> {
  const source = row ?? defaults ?? null;
  const values: Record<string, unknown> = {};
  for (const field of fields) values[field.name] = initialValue(field, source);
  return values;
}

/** Valoarea trimisă la API pentru un câmp (bani în unități minore, tag-uri ca listă). */
function bodyValue(field: FieldDef, raw: unknown): unknown {
  const empty = raw === null || raw === undefined || raw === "";

  switch (field.type) {
    case "checkbox":
      return Boolean(raw);
    case "money": {
      if (empty) return null;
      const amount = Number(typeof raw === "string" ? raw.replace(",", ".") : raw);
      return Number.isNaN(amount) ? null : Math.round(amount * 100);
    }
    case "number": {
      if (empty) return null;
      const amount = Number(raw);
      return Number.isNaN(amount) ? null : amount;
    }
    case "tags": {
      const list = Array.isArray(raw) ? raw.map(String) : String(raw).split(",");
      const tags = list.map((tag) => tag.trim()).filter(Boolean);
      return tags;
    }
    case "datetime": {
      if (empty) return null;
      const date = new Date(String(raw));
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }
    default: {
      if (empty) return field.required ? "" : null;
      return typeof raw === "string" ? raw.trim() : raw;
    }
  }
}

/** Corpul cererii de creare/modificare, construit din valorile formularului. */
export function formValuesToBody(
  fields: FieldDef[],
  values: Record<string, unknown>,
  editing: boolean,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const field of fields) {
    if (editing && field.omitOnEdit) continue;
    if (field.showIf && !field.showIf(values)) continue;
    body[field.name] = bodyValue(field, values[field.name]);
  }
  return body;
}

export interface ResourceFormFieldProps {
  field: FieldDef;
  form: UseFormReturn<FieldValues>;
}

/** Un câmp de formular generat din `FieldDef` (legat de formularul react-hook-form). */
export function ResourceFormField({ field, form }: ResourceFormFieldProps) {
  const id = useId();
  const relation = useRelationOptions(field.type === "relation" ? field.endpoint : undefined, field.labelKey);
  const options = useMemo(() => normalizeOptions(field.options), [field.options]);

  const error = form.formState.errors[field.name] as FieldError | undefined;
  const invalid = Boolean(error);
  const register = form.register(
    field.name,
    field.required ? { required: `${field.label} este obligatoriu.` } : undefined,
  );

  let control: ReactNode;

  switch (field.type) {
    case "textarea":
      control = <Textarea id={id} invalid={invalid} {...register} />;
      break;
    case "checkbox":
      control = <Checkbox id={id} {...register} />;
      break;
    case "select":
    case "relation": {
      const resolved = options.length > 0 ? options : relation.options;
      control = (
        <Select
          id={id}
          options={field.required ? resolved : [{ value: "", label: "—" }, ...resolved]}
          placeholder={relation.loading ? "Se încarcă…" : field.required ? "Alege…" : undefined}
          invalid={invalid}
          {...register}
        />
      );
      break;
    }
    case "money":
      control = (
        <Input
          id={id}
          type="number"
          step="0.01"
          inputMode="decimal"
          placeholder="0.00"
          invalid={invalid}
          {...register}
        />
      );
      break;
    case "number":
      control = <Input id={id} type="number" invalid={invalid} {...register} />;
      break;
    case "date":
      control = <Input id={id} type="date" invalid={invalid} {...register} />;
      break;
    case "datetime":
      control = <Input id={id} type="datetime-local" invalid={invalid} {...register} />;
      break;
    case "email":
      control = <Input id={id} type="email" invalid={invalid} {...register} />;
      break;
    case "url":
      control = <Input id={id} type="url" invalid={invalid} {...register} />;
      break;
    case "password":
      control = <Input id={id} type="password" autoComplete="new-password" invalid={invalid} {...register} />;
      break;
    case "tags":
      control = <Input id={id} placeholder="ex.: valoare1, valoare2" invalid={invalid} {...register} />;
      break;
    default:
      control = <Input id={id} invalid={invalid} {...register} />;
  }

  return (
    <Field
      label={field.label}
      htmlFor={id}
      required={field.required}
      hint={field.hint}
      error={error?.message}
      className={cn(field.span === 2 && "sm:col-span-2")}
    >
      {control}
    </Field>
  );
}

const MONEY_FORMATTERS = new Map<string, Intl.NumberFormat>();

function moneyFormatter(currency: string): Intl.NumberFormat {
  const cached = MONEY_FORMATTERS.get(currency);
  if (cached) return cached;

  const formatter = new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  MONEY_FORMATTERS.set(currency, formatter);
  return formatter;
}

/** Sumă din unități minore (bani) în text: `formatMoney(123450)` → „1.234,50 RON”. */
export function formatMoney(minor: number | null | undefined, currency = "RON"): string {
  if (minor === null || minor === undefined || !Number.isFinite(minor)) return "—";

  try {
    return moneyFormatter(currency).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency}`;
  }
}

/** Dată (ISO sau `Date`) în format românesc; „—” pentru valori lipsă sau invalide. */
export function formatDate(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("ro-RO");
}

const STATUS_SUCCESS = ["completed", "paid", "successful", "active", "resolved"];
const STATUS_DANGER = ["failed", "overdue", "suspended", "blocked"];
const STATUS_WARNING = ["pending", "review", "open", "partial", "rolled back", "on hold", "in review"];

/** Tonul de `Badge` pentru un status text („Active” → success, „Overdue” → danger…). */
export function statusTone(status: string | null | undefined): BadgeTone {
  if (!status) return "neutral";

  const key = status.trim().toLowerCase();
  if (STATUS_SUCCESS.includes(key)) return "success";
  if (STATUS_DANGER.includes(key)) return "danger";
  if (STATUS_WARNING.includes(key)) return "warning";
  if (key.startsWith("in")) return "info";
  return "neutral";
}
