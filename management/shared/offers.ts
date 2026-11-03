/**
 * Oferte, catalog și dosar contractual: tipurile comune client/server și calculul valorilor.
 * Sursa unică pentru totaluri: `computeTotals`. Orice document (ofertă, contract, deviz,
 * grafic, PV, act adițional, mentenanță, centralizator) folosește aceste funcții.
 *
 * Sumele sunt în unități minore (bani / cenți), întregi, în moneda ofertei.
 * Nu se adună niciodată sume în monede diferite: o ofertă are o singură monedă.
 */
import type { Currency } from "./enums";

/** Frecvența de facturare a unei linii. */
export const BILLINGS = ["one_time", "monthly", "yearly"] as const;
export type Billing = (typeof BILLINGS)[number];
export const BILLING_LABELS: Record<Billing, string> = {
  one_time: "Plată unică",
  monthly: "Lunar",
  yearly: "Anual",
};

/**
 * Starea unei linii în ofertă:
 * - `accepted`: contractat și taxat separat (sau pachet acceptat);
 * - `included`: inclus într-un pachet (`packageLineId`), afișat detaliat, fără cost separat;
 * - `optional`: propus, încă neacceptat; nu intră în contract și nici în total;
 * - `client_direct`: cost achitat direct de beneficiar către terți (bugete reclame,
 *   abonamente); informativ, nu intră în valoarea contractului.
 */
export const LINE_STATUSES = ["accepted", "included", "optional", "client_direct"] as const;
export type LineStatus = (typeof LINE_STATUSES)[number];
export const LINE_STATUS_LABELS: Record<LineStatus, string> = {
  accepted: "Acceptat",
  included: "Inclus în pachet",
  optional: "Opțional, neacceptat",
  client_direct: "Cost suportat direct de client",
};

export const DISCOUNT_TYPES = ["none", "percent", "fixed"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const OFFER_STATUSES = ["draft", "sent", "accepted", "rejected", "expired"] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];
export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  draft: "Ciornă",
  sent: "Trimisă",
  accepted: "Acceptată",
  rejected: "Respinsă",
  expired: "Expirată",
};

/** `offer` = ofertă inițială; `amendment` = modificare ulterioară (stă la baza unui act adițional). */
export const OFFER_KINDS = ["offer", "amendment"] as const;
export type OfferKind = (typeof OFFER_KINDS)[number];

/** Tipurile de documente din dosarul contractual. */
export const DOSSIER_DOC_TYPES = [
  "offer",
  "contract",
  "services_annex",
  "schedule_annex",
  "handover_pv",
  "amendment",
  "maintenance_annex",
  "summary",
] as const;
export type DossierDocType = (typeof DOSSIER_DOC_TYPES)[number];
export const DOSSIER_DOC_LABELS: Record<DossierDocType, string> = {
  offer: "Ofertă comercială",
  contract: "Contract de prestări servicii",
  services_annex: "Anexa de servicii și deviz",
  schedule_annex: "Anexa cu graficul de implementare și plată",
  handover_pv: "Proces-verbal de predare-primire și recepție",
  amendment: "Act adițional",
  maintenance_annex: "Anexa de mentenanță și servicii recurente",
  summary: "Centralizator de servicii și costuri",
};

/** O linie din ofertă. Copie editabilă a unui serviciu din catalog (sau serviciu personalizat). */
export interface OfferLine {
  /** Identificator local, stabil între versiuni (uuid generat în client). */
  id: string;
  /** Serviciul din catalog de la care a pornit linia; null = serviciu personalizat. */
  serviceId: string | null;
  /** Codul din catalog (ex. „B01”); null pentru serviciile personalizate. */
  code: string | null;
  /** Codul categoriei (ex. „B”); null dacă nu are. */
  category: string | null;
  name: string;
  /** Descrierea detaliată, editabilă pentru client. */
  description: string;
  deliverables: string;
  /** Criteriile de acceptare / recepție. */
  acceptance: string;
  /** Unitatea de măsură (ex. „proiect”, „pagină”, „oră”, „lună”). */
  unit: string;
  /** Cantitatea, poate fi zecimală (max. 3 zecimale). */
  quantity: number;
  /** Prețul unitar, în unități minore, în moneda ofertei, fără TVA. */
  unitPrice: number;
  discountType: DiscountType;
  /** `percent`: 0–100 (zecimale permise); `fixed`: unități minore, scăzute din valoarea pe perioadă a liniei. */
  discountValue: number;
  billing: Billing;
  /**
   * Pentru `monthly` / `yearly`: numărul de perioade contractate (ex. 3 luni).
   * Ignorat pentru `one_time`. Minimum 1.
   */
  periods: number;
  status: LineStatus;
  /** Linie de pachet: prețul ei este prețul pachetului; componentele au `packageLineId` = acest `id`. */
  isPackage: boolean;
  /** Pentru `included`: id-ul liniei de pachet din care face parte. */
  packageLineId: string | null;
  /** Durata / termenul specific (text liber). */
  duration: string;
  /** Condiții specifice (text liber). */
  conditions: string;
  /** Dezvoltare avansată, ofertată separat (ex. D08–D12): necesită analiză suplimentară. */
  advanced: boolean;
}

/** O etapă de implementare. */
export interface ScheduleStage {
  id: string;
  name: string;
  /** Ce se livrează în etapă (text liber). */
  deliverables: string;
  /** Termenul (dată ISO `YYYY-MM-DD` sau text, ex. „15 zile lucrătoare de la avans”). */
  term: string;
  /** Termen ferm (art. 6.1 din contract) sau estimativ. */
  firm: boolean;
}

/** O tranșă de plată pentru costurile unice. Suma procentelor trebuie să fie 100. */
export interface PaymentInstallment {
  id: string;
  label: string;
  /** Procent din valoarea unică netă (0–100, zecimale permise). */
  percent: number;
  /** Scadența (dată ISO sau text, ex. „la semnare”). */
  due: string;
}

/** Configurația comercială completă a unei oferte (stocată în `offers.data`). */
export interface OfferConfig {
  currency: Currency;
  /** Cota TVA în procente (0 = neplătitor / fără TVA). */
  vatRate: number;
  lines: OfferLine[];
  stages: ScheduleStage[];
  installments: PaymentInstallment[];
  /** Texte libere ale ofertei. */
  intro: string;
  notes: string;
  /** Valabilitatea ofertei, în zile; null = nespecificată. */
  validityDays: number | null;
  /** Termenul de realizare (text). */
  timeline: string;
  /** Condiții de plată (text). */
  paymentTerms: string;
  /** Denumirea proiectului (apare în ofertă și în Comandă). */
  projectName: string;
  website: string;
}

/**
 * Datele prestatorului, cu aceleași chei ca generatorul de contracte (`esa*`),
 * plus marca comercială. Stocate în `app_settings` (`legal.provider`).
 */
export interface ProviderValues {
  esaMarca: string;
  esaNume: string;
  esaCui: string;
  esaRc: string;
  esaAdresa: string;
  esaIban: string;
  esaBanca: string;
  esaEmail: string;
  esaTel: string;
  esaSite: string;
  esaRep: string;
  esaFunctie: string;
}

/** Datele beneficiarului, cu aceleași chei ca generatorul de contracte (`cl*`). */
export interface ClientValues {
  clNume: string;
  clSediu: string;
  clRc: string;
  clCui: string;
  clIban: string;
  clBanca: string;
  clEmail: string;
  clTel: string;
  clRep: string;
  clFunctie: string;
}

/**
 * Copia nemodificabilă a unei oferte, salvată la acceptare (`offers.accepted_snapshot`)
 * și la fiecare document generat (`dossier_documents.snapshot`). Documentele se randează
 * numai din snapshot, deci schimbările ulterioare din catalog sau din fișa clientului
 * nu modifică documentele deja emise.
 */
export interface OfferSnapshot {
  offer: { id: string; number: string; date: string; version: number; kind: OfferKind; title: string };
  config: OfferConfig;
  totals: OfferTotals;
  client: ClientValues;
  provider: ProviderValues;
  /** ISO timestamp; null dacă snapshot-ul e al unei ciorne (previzualizare). */
  acceptedAt: string | null;
}

export interface LineAmounts {
  /** Valoarea pe o perioadă, înainte de reducere: round(quantity × unitPrice). */
  gross: number;
  /** Reducerea pe o perioadă (≥ 0, nu depășește `gross`). */
  discount: number;
  /** Valoarea netă pe o perioadă: gross − discount. */
  net: number;
  /** Numărul de perioade luate în calcul (1 pentru plată unică). */
  periods: number;
  /** Valoarea netă pe toată durata: net × periods. */
  total: number;
  /** Linia intră în valoarea contractului. */
  contracted: boolean;
}

export interface OfferTotals {
  /** Costuri unice contractate, net. */
  oneTime: number;
  /** Suma lunară a serviciilor lunare contractate (pe o lună). */
  monthly: number;
  /** Suma anuală a serviciilor anuale contractate (pe un an). */
  yearly: number;
  /** Total recurent pe perioada contractată. */
  recurring: number;
  /** Reduceri acordate pe liniile contractate (pe toată durata). */
  discount: number;
  /** Valoarea contractuală netă: oneTime + recurring. */
  net: number;
  vat: number;
  /** net + vat. */
  gross: number;
  /** Servicii opționale, neacceptate (pe toată durata), net. Nu intră în total. */
  optional: number;
  /** Costuri achitate direct de client (pe toată durata). Nu intră în total. */
  clientDirect: number;
}

/** Rotunjire „jumătate în sus” (în valoare absolută), tolerantă la erorile binare (1,005 → 1,01). */
const round = (n: number): number => Math.sign(n) * Math.floor(Math.abs(n) + 0.5 + 1e-9);

/** Liniile de pachet acceptate, după id. */
function acceptedPackages(lines: OfferLine[]): Set<string> {
  return new Set(lines.filter((l) => l.isPackage && l.status === "accepted").map((l) => l.id));
}

/**
 * O linie intră în contract dacă e acceptată sau dacă e inclusă într-un pachet acceptat.
 * Liniile incluse nu se taxează separat (valoarea lor e 0 în totaluri).
 */
export function isContracted(line: OfferLine, lines: OfferLine[]): boolean {
  if (line.status === "accepted") return true;
  if (line.status === "included") return !!line.packageLineId && acceptedPackages(lines).has(line.packageLineId);
  return false;
}

/** Valorile unei linii. Liniile `included` au valoare 0 (costul e în pachet). */
export function lineAmounts(line: OfferLine, lines: OfferLine[]): LineAmounts {
  const periods = line.billing === "one_time" ? 1 : Math.max(1, Math.floor(line.periods || 1));
  const contracted = isContracted(line, lines);
  if (line.status === "included") return { gross: 0, discount: 0, net: 0, periods, total: 0, contracted };
  // Cantitatea are max. 3 zecimale: înmulțirea se face pe întregi (×1000), ca 1,005 × 100 să dea exact 100,5.
  const gross = round((Math.round((line.quantity || 0) * 1000) * (line.unitPrice || 0)) / 1000);
  let discount = 0;
  if (line.discountType === "percent") discount = round((gross * Math.min(100, Math.max(0, line.discountValue || 0))) / 100);
  else if (line.discountType === "fixed") discount = Math.max(0, round(line.discountValue || 0));
  discount = Math.min(discount, Math.max(0, gross));
  const net = gross - discount;
  return { gross, discount, net, periods, total: net * periods, contracted };
}

/** Totalurile ofertei. Valoarea contractului = costuri unice + recurente pe perioada contractată. */
export function computeTotals(config: Pick<OfferConfig, "lines" | "vatRate">): OfferTotals {
  const t: OfferTotals = {
    oneTime: 0,
    monthly: 0,
    yearly: 0,
    recurring: 0,
    discount: 0,
    net: 0,
    vat: 0,
    gross: 0,
    optional: 0,
    clientDirect: 0,
  };
  for (const line of config.lines) {
    const a = lineAmounts(line, config.lines);
    if (line.status === "optional") {
      t.optional += a.total;
      continue;
    }
    if (line.status === "client_direct") {
      t.clientDirect += a.total;
      continue;
    }
    if (!a.contracted || line.status === "included") continue;
    t.discount += a.discount * a.periods;
    if (line.billing === "one_time") t.oneTime += a.total;
    else {
      if (line.billing === "monthly") t.monthly += a.net;
      else t.yearly += a.net;
      t.recurring += a.total;
    }
  }
  t.net = t.oneTime + t.recurring;
  t.vat = round((t.net * Math.max(0, config.vatRate || 0)) / 100);
  t.gross = t.net + t.vat;
  return t;
}

/** Liniile care intră în contract și în anexele de execuție (acceptate + incluse în pachete acceptate). */
export function contractedLines(lines: OfferLine[]): OfferLine[] {
  return lines.filter((l) => isContracted(l, lines));
}

/** Formatare sumă din unități minore, ex. 55000 EUR → „550 €”, 123456 RON → „1.234,56 lei”. */
export function formatMoney(minor: number, currency: Currency): string {
  const v = minor / 100;
  const s = new Intl.NumberFormat("ro-RO", {
    minimumFractionDigits: Number.isInteger(v) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(v);
  return currency === "EUR" ? `${s} €` : currency === "RON" ? `${s} lei` : `${s} USD`;
}

/** Diferența dintre configurația acceptată anterior și o modificare (pentru actul adițional). */
export interface LineChange {
  kind: "added" | "removed" | "changed";
  before: OfferLine | null;
  after: OfferLine | null;
  /** Câmpurile schimbate (doar pentru `changed`). */
  fields: (keyof OfferLine)[];
}

const DIFF_FIELDS: (keyof OfferLine)[] = [
  "name",
  "description",
  "deliverables",
  "acceptance",
  "unit",
  "quantity",
  "unitPrice",
  "discountType",
  "discountValue",
  "billing",
  "periods",
  "status",
  "isPackage",
  "packageLineId",
  "duration",
  "conditions",
];

/** Compară liniile după `id`. Doar liniile contractate contează pentru actul adițional. */
export function diffLines(before: OfferLine[], after: OfferLine[]): LineChange[] {
  const b = new Map(contractedLines(before).map((l) => [l.id, l]));
  const a = new Map(contractedLines(after).map((l) => [l.id, l]));
  const out: LineChange[] = [];
  for (const [id, old] of b) {
    const neu = a.get(id);
    if (!neu) out.push({ kind: "removed", before: old, after: null, fields: [] });
    else {
      const fields = DIFF_FIELDS.filter((f) => JSON.stringify(old[f]) !== JSON.stringify(neu[f]));
      if (fields.length) out.push({ kind: "changed", before: old, after: neu, fields });
    }
  }
  for (const [id, neu] of a) if (!b.has(id)) out.push({ kind: "added", before: null, after: neu, fields: [] });
  return out;
}
