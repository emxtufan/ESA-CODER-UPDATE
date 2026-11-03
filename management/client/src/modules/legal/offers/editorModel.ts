/** Modelul editorului de ofertă: configurația implicită, grupare, adăugare din catalog și snapshot de previzualizare. */
import type { Currency } from "@shared/enums";
import {
  computeTotals,
  type ClientValues,
  type OfferConfig,
  type OfferKind,
  type OfferLine,
  type OfferSnapshot,
  type ProviderValues,
} from "@shared/offers";

import { lineFromService } from "../dossier/drafts";
import type { CatalogPackage } from "./lib";

export const uid = (): string => crypto.randomUUID();

export const todayIso = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export function emptyConfig(currency: Currency = "EUR"): OfferConfig {
  return {
    currency,
    vatRate: 0,
    lines: [],
    stages: [],
    installments: [
      { id: uid(), label: "Avans la semnare", percent: 50, due: "La semnare" },
      { id: uid(), label: "La predare", percent: 50, due: "La predarea livrabilelor" },
    ],
    intro: "",
    notes: "",
    validityDays: 30,
    timeline: "",
    paymentTerms: "",
    projectName: "",
    website: "",
  };
}

/** Serviciu personalizat: linie goală, acceptată, plată unică. */
export function blankLine(): OfferLine {
  return {
    id: uid(),
    serviceId: null,
    code: null,
    category: null,
    name: "",
    description: "",
    deliverables: "",
    acceptance: "",
    unit: "serviciu",
    quantity: 1,
    unitPrice: 0,
    discountType: "none",
    discountValue: 0,
    billing: "one_time",
    periods: 1,
    status: "accepted",
    isPackage: false,
    packageLineId: null,
    duration: "",
    conditions: "",
    advanced: false,
  };
}

/** Un pachet din catalog → linia de pachet (acceptată) și componentele `included`. */
export function linesFromPackage(pkg: CatalogPackage, currency: Currency): OfferLine[] {
  const head: OfferLine = {
    ...blankLine(),
    name: pkg.name,
    description: pkg.description,
    unit: "pachet",
    unitPrice: pkg.currency === currency && pkg.recommendedPrice != null ? pkg.recommendedPrice : 0,
    billing: pkg.billing,
    status: "accepted",
    isPackage: true,
  };
  const comps = pkg.items.map((service) => ({
    ...lineFromService(service, currency),
    status: "included" as const,
    packageLineId: head.id,
    unitPrice: 0,
    billing: pkg.billing,
    periods: 1,
  }));
  return [head, ...comps];
}

export type GroupKey = "pkg" | "one" | "rec" | "opt" | "dir";

/** Grupul în care apare o linie (componentele unui pachet existent apar sub pachet). */
export function groupOf(line: OfferLine, lines: OfferLine[]): GroupKey | `comp:${string}` {
  if (line.isPackage) return "pkg";
  if (line.packageLineId && lines.some((l) => l.id === line.packageLineId && l.isPackage)) return `comp:${line.packageLineId}`;
  if (line.status === "optional") return "opt";
  if (line.status === "client_direct") return "dir";
  return line.billing === "one_time" ? "one" : "rec";
}

export interface LineGroups {
  packages: { line: OfferLine; comps: OfferLine[] }[];
  one: OfferLine[];
  rec: OfferLine[];
  opt: OfferLine[];
  dir: OfferLine[];
}

export function groupLines(lines: OfferLine[]): LineGroups {
  const out: LineGroups = { packages: [], one: [], rec: [], opt: [], dir: [] };
  for (const line of lines.filter((l) => l.isPackage)) {
    out.packages.push({ line, comps: lines.filter((l) => l.packageLineId === line.id && !l.isPackage) });
  }
  for (const line of lines) {
    const g = groupOf(line, lines);
    if (g === "one" || g === "rec" || g === "opt" || g === "dir") out[g].push(line);
  }
  return out;
}

/** Mută o linie cu o poziție în cadrul grupului ei. */
export function moveLine(lines: OfferLine[], id: string, dir: -1 | 1): OfferLine[] {
  const line = lines.find((l) => l.id === id);
  if (!line) return lines;
  const key = groupOf(line, lines);
  const positions = lines.map((l, i) => (groupOf(l, lines) === key ? i : -1)).filter((i) => i >= 0);
  const at = positions.findIndex((i) => lines[i]!.id === id);
  const other = positions[at + dir];
  if (at < 0 || other === undefined) return lines;
  const next = [...lines];
  const mine = positions[at]!;
  [next[mine], next[other]] = [next[other]!, next[mine]!];
  return next;
}

/** Duplică o linie (pachetul, împreună cu componentele lui). */
export function duplicateLine(lines: OfferLine[], id: string): OfferLine[] {
  const line = lines.find((l) => l.id === id);
  if (!line) return lines;
  const copy = { ...line, id: uid(), name: line.name };
  if (!line.isPackage) {
    const next = [...lines];
    next.splice(lines.indexOf(line) + 1, 0, copy);
    return next;
  }
  const comps = lines.filter((l) => l.packageLineId === id).map((l) => ({ ...l, id: uid(), packageLineId: copy.id }));
  return [...lines, copy, ...comps];
}

export interface DraftMeta {
  id: string;
  number: string;
  date: string;
  version: number;
  kind: OfferKind;
  title: string;
}

/** Snapshot local, pentru previzualizarea unei ciorne (nu e acceptat). */
export function previewSnapshot(meta: DraftMeta, config: OfferConfig, client: ClientValues, provider: ProviderValues): OfferSnapshot {
  return { offer: meta, config, totals: computeTotals(config), client, provider, acceptedAt: null };
}

export const EMPTY_CLIENT: ClientValues = {
  clNume: "",
  clSediu: "",
  clRc: "",
  clCui: "",
  clIban: "",
  clBanca: "",
  clEmail: "",
  clTel: "",
  clRep: "",
  clFunctie: "",
};

export const EMPTY_PROVIDER: ProviderValues = {
  esaMarca: "",
  esaNume: "",
  esaCui: "",
  esaRc: "",
  esaAdresa: "",
  esaIban: "",
  esaBanca: "",
  esaEmail: "",
  esaTel: "",
  esaSite: "",
  esaRep: "",
  esaFunctie: "",
};
