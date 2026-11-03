/**
 * Ciorne de ofertă: export / import JSON (format nou v2 și compatibilitate cu generatorul
 * vechi de oferte, v1) și crearea unei linii de ofertă dintr-un serviciu din catalog.
 */
import { CURRENCIES, type Currency } from "@shared/enums";
import {
  BILLINGS,
  DISCOUNT_TYPES,
  LINE_STATUSES,
  type OfferConfig,
  type OfferLine,
  type PaymentInstallment,
  type ScheduleStage,
} from "@shared/offers";
import type { CatalogService } from "./types";

/** Mărimea maximă a unei ciorne importate. */
export const DRAFT_MAX_BYTES = 200 * 1024;
export const DRAFT_FORMAT = "esa-oferta";

/** Câmpurile ofertei care se păstrează în ciornă (fără stare, fără versiuni). */
export interface DraftOfferMeta {
  number: string;
  date: string;
  title: string;
  clientId: string | null;
  projectId: string | null;
}

export interface DraftSource extends DraftOfferMeta {
  config: OfferConfig;
}

export interface DraftV2 {
  format: typeof DRAFT_FORMAT;
  version: 2;
  offer: DraftOfferMeta;
  config: OfferConfig;
}

/** Datele din ciorna veche (v1) care nu au loc în ofertă: UI le poate folosi la alegerea clientului. */
export interface LegacyDraftInfo {
  client: string;
  provider: string;
  company: string;
  cui: string;
  reg: string;
  email: string;
  phone: string;
}

export interface ImportedDraft {
  version: 1 | 2;
  offer: DraftOfferMeta;
  config: OfferConfig;
  /** Observații la import (servicii negăsite în catalog etc.). */
  warnings: string[];
  legacy: LegacyDraftInfo | null;
}

/** Linie de ofertă dintr-un serviciu din catalog. Prețul se preia numai dacă moneda coincide. */
export function lineFromService(service: CatalogService, currency: Currency): OfferLine {
  const samePrice = service.currency === currency && service.recommendedPrice != null;
  return {
    id: crypto.randomUUID(),
    serviceId: service.id,
    code: service.code,
    category: service.categoryCode || null,
    name: service.name,
    description: service.description || service.shortDescription || "",
    deliverables: service.deliverables ?? "",
    acceptance: service.acceptance ?? "",
    unit: service.unit ?? "",
    quantity: service.defaultQuantity > 0 ? service.defaultQuantity : 1,
    unitPrice: samePrice ? (service.recommendedPrice as number) : 0,
    discountType: "none",
    discountValue: 0,
    billing: service.billing,
    periods: service.billing === "one_time" ? 1 : Math.max(1, Math.floor(service.defaultPeriods || 1)),
    // „included” fără pachet nu ar fi contractat niciodată; la adăugare simplă linia e acceptată.
    status: service.defaultStatus === "included" ? "accepted" : service.defaultStatus,
    isPackage: false,
    packageLineId: null,
    duration: service.duration ?? "",
    conditions: service.conditions ?? "",
    advanced: !!service.advanced,
  };
}

/** Exportă o ofertă ca ciornă JSON v2. */
export function exportDraft(offer: DraftSource): string {
  const draft: DraftV2 = {
    format: DRAFT_FORMAT,
    version: 2,
    offer: {
      number: offer.number,
      date: offer.date,
      title: offer.title,
      clientId: offer.clientId,
      projectId: offer.projectId,
    },
    config: offer.config,
  };
  return JSON.stringify(draft, null, 2);
}

/* ------------------------------------------------------------------ validare */

const fail = (msg: string): never => {
  throw new Error(msg);
};

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function text(o: Record<string, unknown>, k: string, where: string, max = 20000): string {
  const v = o[k];
  if (v === undefined || v === null) return "";
  if (typeof v !== "string") return fail(`${where}: câmpul „${k}” trebuie să fie text.`);
  if (v.length > max) return fail(`${where}: câmpul „${k}” este prea lung (maximum ${max} de caractere).`);
  return v;
}

function num(o: Record<string, unknown>, k: string, where: string, min: number, max: number, integer = false): number {
  const v = o[k];
  if (typeof v !== "number" || !Number.isFinite(v)) return fail(`${where}: câmpul „${k}” trebuie să fie un număr.`);
  if (v < min || v > max) return fail(`${where}: câmpul „${k}” trebuie să fie între ${min} și ${max}.`);
  if (integer && !Number.isInteger(v)) return fail(`${where}: câmpul „${k}” trebuie să fie un număr întreg.`);
  return v;
}

function oneOf<T extends string>(o: Record<string, unknown>, k: string, where: string, allowed: readonly T[]): T {
  const v = o[k];
  if (typeof v !== "string" || !(allowed as readonly string[]).includes(v)) {
    return fail(`${where}: câmpul „${k}” are o valoare nepermisă (${allowed.join(", ")}).`);
  }
  return v as T;
}

function bool(o: Record<string, unknown>, k: string, where: string): boolean {
  const v = o[k];
  if (v === undefined || v === null) return false;
  if (typeof v !== "boolean") return fail(`${where}: câmpul „${k}” trebuie să fie da/nu.`);
  return v;
}

function validateLine(raw: unknown, i: number): OfferLine {
  if (!isObj(raw)) return fail(`Linia ${i + 1} nu este un obiect.`);
  const where = `Linia ${i + 1}${typeof raw.name === "string" && raw.name ? ` („${raw.name.slice(0, 40)}”)` : ""}`;
  const id = typeof raw.id === "string" && raw.id ? raw.id : fail(`${where}: lipsește identificatorul („id”).`);
  const name = text(raw, "name", where, 300);
  if (!name.trim()) fail(`${where}: denumirea este obligatorie.`);
  const code = raw.code === null || raw.code === undefined ? null : text(raw, "code", where, 20) || null;
  const category = raw.category === null || raw.category === undefined ? null : text(raw, "category", where, 20) || null;
  const serviceId = raw.serviceId === null || raw.serviceId === undefined ? null : text(raw, "serviceId", where, 100) || null;
  const packageLineId = raw.packageLineId === null || raw.packageLineId === undefined ? null : text(raw, "packageLineId", where, 100) || null;
  return {
    id,
    serviceId,
    code,
    category,
    name,
    description: text(raw, "description", where),
    deliverables: text(raw, "deliverables", where),
    acceptance: text(raw, "acceptance", where),
    unit: text(raw, "unit", where, 60),
    quantity: num(raw, "quantity", where, 0, 1_000_000_000),
    unitPrice: num(raw, "unitPrice", where, 0, 1e13, true),
    discountType: oneOf(raw, "discountType", where, DISCOUNT_TYPES),
    discountValue: num(raw, "discountValue", where, 0, 1e13),
    billing: oneOf(raw, "billing", where, BILLINGS),
    periods: num(raw, "periods", where, 1, 1200, true),
    status: oneOf(raw, "status", where, LINE_STATUSES),
    isPackage: bool(raw, "isPackage", where),
    packageLineId,
    duration: text(raw, "duration", where, 300),
    conditions: text(raw, "conditions", where),
    advanced: bool(raw, "advanced", where),
  };
}

function validateConfig(raw: unknown): OfferConfig {
  if (!isObj(raw)) return fail("Ciorna nu conține configurația ofertei („config”).");
  const where = "Configurația ofertei";
  const currency = oneOf(raw, "currency", where, CURRENCIES);
  const vatRate = num(raw, "vatRate", where, 0, 100);

  if (!Array.isArray(raw.lines)) fail(`${where}: lista de servicii („lines”) lipsește.`);
  const rawLines = raw.lines as unknown[];
  if (rawLines.length > 500) fail(`${where}: prea multe servicii (maximum 500).`);
  const lines = rawLines.map(validateLine);
  const ids = new Set<string>();
  for (const l of lines) {
    if (ids.has(l.id)) fail(`Linia „${l.name}”: identificator duplicat.`);
    ids.add(l.id);
  }
  const pkgIds = new Set(lines.filter((l) => l.isPackage).map((l) => l.id));
  for (const l of lines) {
    if (l.packageLineId && !pkgIds.has(l.packageLineId)) {
      fail(`Linia „${l.name}” face parte dintr-un pachet inexistent în ciornă.`);
    }
    if (l.status === "included" && !l.packageLineId) {
      fail(`Linia „${l.name}” este „inclusă în pachet”, dar nu indică pachetul.`);
    }
  }

  const stagesRaw = raw.stages ?? [];
  if (!Array.isArray(stagesRaw) || stagesRaw.length > 100) fail(`${where}: etapele („stages”) trebuie să fie o listă de maximum 100.`);
  const stages: ScheduleStage[] = (stagesRaw as unknown[]).map((s, i) => {
    if (!isObj(s)) return fail(`Etapa ${i + 1} nu este un obiect.`);
    const w = `Etapa ${i + 1}`;
    return {
      id: typeof s.id === "string" && s.id ? s.id : crypto.randomUUID(),
      name: text(s, "name", w, 300),
      deliverables: text(s, "deliverables", w),
      term: text(s, "term", w, 300),
      firm: bool(s, "firm", w),
    };
  });

  const instRaw = raw.installments ?? [];
  if (!Array.isArray(instRaw) || instRaw.length > 100) fail(`${where}: tranșele („installments”) trebuie să fie o listă de maximum 100.`);
  const installments: PaymentInstallment[] = (instRaw as unknown[]).map((s, i) => {
    if (!isObj(s)) return fail(`Tranșa ${i + 1} nu este un obiect.`);
    const w = `Tranșa ${i + 1}`;
    return {
      id: typeof s.id === "string" && s.id ? s.id : crypto.randomUUID(),
      label: text(s, "label", w, 300),
      percent: num(s, "percent", w, 0, 100),
      due: text(s, "due", w, 300),
    };
  });

  let validityDays: number | null = null;
  if (raw.validityDays !== null && raw.validityDays !== undefined) validityDays = num(raw, "validityDays", where, 0, 3650, true);

  return {
    currency,
    vatRate,
    lines,
    stages,
    installments,
    intro: text(raw, "intro", where),
    notes: text(raw, "notes", where),
    validityDays,
    timeline: text(raw, "timeline", where, 1000),
    paymentTerms: text(raw, "paymentTerms", where, 2000),
    projectName: text(raw, "projectName", where, 300),
    website: text(raw, "website", where, 300),
  };
}

function validateMeta(raw: unknown): DraftOfferMeta {
  if (!isObj(raw)) return fail("Ciorna nu conține datele ofertei („offer”).");
  const w = "Datele ofertei";
  const nullable = (k: string): string | null => {
    const v = raw[k];
    if (v === null || v === undefined || v === "") return null;
    return typeof v === "string" ? v : fail(`${w}: câmpul „${k}” trebuie să fie text sau gol.`);
  };
  const date = text(raw, "date", w, 40);
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(`${w}: data trebuie să fie în formatul AAAA-LL-ZZ.`);
  return {
    number: text(raw, "number", w, 60),
    date,
    title: text(raw, "title", w, 300),
    clientId: nullable("clientId"),
    projectId: nullable("projectId"),
  };
}

/* ------------------------------------------------------------------ v1 (generatorul vechi) */

/** Serviciile bifabile ale generatorului vechi. */
const V1_KEYS = ["cms", "announcements", "prices", "contact", "facebook", "seo", "meta", "tiktok", "google", "video", "ads"] as const;

/** Codurile mereu incluse în „Redesign complet website”, în afara pachetului însuși (B01). */
const V1_ALWAYS = ["B06", "B07", "B08", "B09"];
/** Servicii bifate → componente incluse în pachet. */
const V1_INCLUDED: Record<string, string[]> = {
  cms: ["C01", "C03", "C04"],
  announcements: ["C07"],
  prices: ["C09"],
  contact: ["E01", "E04"],
  facebook: ["E06"],
  seo: ["F01", "F02", "F15"],
  meta: ["F09"],
  tiktok: ["F10"],
  google: ["F11"],
};

/** Preț în format liber („400”, „1.250,50”, „400 €”) → unități minore. */
function parsePriceMinor(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  let s = String(v).replace(/[^\d.,-]/g, "");
  if (!s || !/\d/.test(s)) return fail(`Prețul din ciorna veche („${String(v).slice(0, 30)}”) nu este valid.`);
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastDot >= 0 && lastComma >= 0) {
    const dec = Math.max(lastDot, lastComma);
    s = s.slice(0, dec).replace(/[.,]/g, "") + "." + s.slice(dec + 1);
  } else if (lastComma >= 0) {
    s = s.replace(",", ".");
  } else if (lastDot >= 0 && /^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return fail(`Prețul din ciorna veche („${String(v).slice(0, 30)}”) nu este valid.`);
  return Math.round(n * 100);
}

function parseCurrency(v: unknown): Currency {
  const s = String(v ?? "EUR").trim().toUpperCase();
  if (s === "EUR" || s === "€" || s === "EURO") return "EUR";
  if (s === "RON" || s === "LEI" || s === "LEU") return "RON";
  if (s === "USD" || s === "$") return "USD";
  return fail(`Moneda din ciorna veche („${String(v).slice(0, 20)}”) nu este recunoscută (EUR, RON sau USD).`);
}

function importV1(root: Record<string, unknown>, catalog: CatalogService[]): ImportedDraft {
  const st = root.state;
  if (!isObj(st)) return fail("Ciorna veche nu conține obiectul „state”.");
  const w = "Ciorna veche";
  const flags = isObj(st.services) ? st.services : fail(`${w}: lipsește obiectul „services”.`);
  for (const k of V1_KEYS) {
    if (flags[k] !== undefined && typeof flags[k] !== "boolean") fail(`${w}: serviciul „${k}” trebuie să fie bifat sau nebifat (da/nu).`);
  }
  const s = (k: string, max = 20000): string => text(st, k, w, max);
  const currency = parseCurrency(st.currency);
  const price = parsePriceMinor(st.price);
  const warnings: string[] = [];
  const byCode = new Map(catalog.map((c) => [c.code, c]));
  const find = (code: string): CatalogService | null => {
    const c = byCode.get(code);
    if (!c) warnings.push(`Serviciul ${code} nu există în catalog și a fost omis.`);
    return c ?? null;
  };

  const lines: OfferLine[] = [];
  const b01 = find("B01");
  const pkg: OfferLine = b01
    ? { ...lineFromService(b01, currency), isPackage: true, status: "accepted", unitPrice: price, quantity: 1, billing: "one_time", periods: 1 }
    : {
        id: crypto.randomUUID(),
        serviceId: null,
        code: null,
        category: "B",
        name: "Redesign complet website",
        description: "",
        deliverables: "",
        acceptance: "",
        unit: "proiect",
        quantity: 1,
        unitPrice: price,
        discountType: "none",
        discountValue: 0,
        billing: "one_time",
        periods: 1,
        status: "accepted",
        isPackage: true,
        packageLineId: null,
        duration: "",
        conditions: "",
        advanced: false,
      };
  lines.push(pkg);

  const component = (code: string): void => {
    const c = find(code);
    if (!c) return;
    lines.push({ ...lineFromService(c, currency), status: "included", packageLineId: pkg.id, unitPrice: 0, isPackage: false });
  };
  const standalone = (code: string, status: "optional" | "client_direct"): void => {
    const c = find(code);
    if (c) lines.push({ ...lineFromService(c, currency), status, packageLineId: null });
  };

  V1_ALWAYS.forEach(component);
  for (const [key, codes] of Object.entries(V1_INCLUDED)) {
    if (flags[key] === true) codes.forEach(component);
  }
  if (flags.video === true) standalone("H01", "optional");
  if (flags.ads === true) {
    standalone("G01", "optional");
    standalone("G04", "optional");
    standalone("G13", "client_direct");
  }

  const validity = /^\s*(\d{1,4})\b/.exec(s("validity", 200));
  const client = s("client", 300);
  const website = s("website", 300);
  const config: OfferConfig = {
    currency,
    vatRate: 0,
    lines,
    stages: [],
    installments: [],
    intro: s("intro"),
    notes: s("notes"),
    validityDays: validity ? Number(validity[1]) : null,
    timeline: s("timeline", 1000),
    paymentTerms: s("payment", 2000),
    projectName: "Redesign complet website",
    website,
  };
  const date = s("date", 40);
  return {
    version: 1,
    offer: {
      number: s("ref", 60),
      date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "",
      title: client ? `Ofertă redesign pentru ${client}` : "Ofertă redesign",
      clientId: null,
      projectId: null,
    },
    config,
    warnings,
    legacy: {
      client,
      provider: s("provider", 300),
      company: s("company", 300),
      cui: s("cui", 60),
      reg: s("reg", 60),
      email: s("email", 300),
      phone: s("phone", 60),
    },
  };
}

/**
 * Importă o ciornă (text JSON sau obiect deja parsat). Acceptă formatul nou (v2) și pe cel al
 * generatorului vechi (v1). Aruncă `Error` cu mesaj în română la orice abatere.
 */
export function importDraft(json: string | unknown, catalog: CatalogService[]): ImportedDraft {
  let root: unknown = json;
  if (typeof json === "string") {
    if (new TextEncoder().encode(json).length > DRAFT_MAX_BYTES) fail("Fișierul depășește 200 KB și nu poate fi importat.");
    try {
      root = JSON.parse(json);
    } catch {
      return fail("Fișierul nu este un JSON valid.");
    }
  } else if (JSON.stringify(json ?? null).length > DRAFT_MAX_BYTES) {
    fail("Ciorna depășește 200 KB și nu poate fi importată.");
  }
  if (!isObj(root)) return fail("Ciorna trebuie să fie un obiect JSON.");
  if (root.format !== DRAFT_FORMAT) fail(`Fișierul nu este o ciornă de ofertă ESA (câmpul „format” trebuie să fie „${DRAFT_FORMAT}”).`);
  if (root.version === 1) return importV1(root, catalog);
  if (root.version !== 2) fail(`Versiunea ciornei (${String(root.version)}) nu este acceptată; sunt acceptate 1 și 2.`);
  return { version: 2, offer: validateMeta(root.offer), config: validateConfig(root.config), warnings: [], legacy: null };
}
