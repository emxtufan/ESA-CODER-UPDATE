/** Tipuri de răspuns API, utilitare de bani și descărcări pentru ofertare și dosar. */
import type { Currency } from "@shared/enums";
import type {
  Billing,
  DossierDocType,
  OfferConfig,
  OfferKind,
  OfferSnapshot,
  OfferStatus,
  OfferTotals,
  ProviderValues,
} from "@shared/offers";
import type { BadgeTone } from "@/components/ui";

import type { CatalogService } from "../dossier/types";

export interface OfferRow {
  id: string;
  number: string;
  kind: OfferKind;
  status: OfferStatus;
  title: string;
  netTotal: number;
  currency: Currency;
  date: string;
  version: number;
  clientId: string;
  clientName: string;
  projectId: string | null;
  contractId: string | null;
  parentOfferId: string | null;
  sentAt: string | null;
  acceptedAt: string | null;
}

export interface OfferDetail extends OfferRow {
  data: OfferConfig;
  totals: OfferTotals;
  acceptedSnapshot: OfferSnapshot | null;
  client: { id: string; name: string } | null;
  parent: { id: string; number: string } | null;
  contract: { id: string; number: string | null } | null;
}

export interface DossierRow {
  id: string;
  type: DossierDocType;
  number: string | null;
  offerId: string;
  contractId: string | null;
  clientId: string;
  date: string;
  data: Record<string, unknown>;
  version: number;
  status: "draft" | "final";
  documentId: string | null;
  createdAt: string;
}

export interface DossierDetail extends DossierRow {
  snapshot: OfferSnapshot | { before: OfferSnapshot; after: OfferSnapshot };
}

export interface CatalogCategory {
  code: string;
  name: string;
  note: string;
  sort: number;
}

export interface CatalogServiceRow extends CatalogService {
  archivedAt: string | null;
  sort: number;
  currency: Currency;
}

export interface CatalogPackage {
  id: string;
  name: string;
  description: string;
  billing: Billing;
  recommendedPrice: number | null;
  currency: Currency | null;
  sort: number;
  archivedAt: string | null;
  serviceIds: string[];
  items: CatalogServiceRow[];
}

export const OFFER_STATUS_TONES: Record<OfferStatus, BadgeTone> = {
  draft: "neutral",
  sent: "warning",
  accepted: "success",
  rejected: "danger",
  expired: "danger",
};

export const KIND_LABELS: Record<OfferKind, string> = { offer: "Ofertă", amendment: "Act adițional" };

export const CURRENCY_OPTIONS = [
  { value: "RON", label: "RON (lei)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "USD", label: "USD" },
];

/* ------------------------------------------------------------------ bani și numere */

/** Text introdus de utilizator („400”, „49,90”, „1.234,56”) → unități majore, sau null dacă e invalid. */
export function parseNumber(text: string): number | null {
  let s = text.trim().replace(/\s/g, "");
  if (!s) return null;
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(",", ".");
  if (!/^-?\d*\.?\d+$|^-?\d+\.$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Unități minore → text pentru câmp („400”, „49,9”→„49,90”). */
export function minorToText(minor: number | null | undefined): string {
  if (minor === null || minor === undefined) return "";
  const v = minor / 100;
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(".", ",");
}

export function numberToText(n: number | null | undefined): string {
  if (n === null || n === undefined) return "";
  return String(n).replace(".", ",");
}

/* ------------------------------------------------------------------ fișiere */

export function downloadBlob(data: Blob | Uint8Array, name: string, mime: string): void {
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Serverul de PDF nu este disponibil (503): se trece pe print din browser. */
export class PdfUnavailableError extends Error {}

/** `POST /api/legal/pdf`. La 503 aruncă `PdfUnavailableError` cu mesajul serverului. */
export async function fetchServerPdf(html: string, filename: string): Promise<Blob> {
  const response = await fetch("/api/legal/pdf", {
    method: "POST",
    headers: { "x-requested-with": "esa", "content-type": "application/json", accept: "application/pdf" },
    credentials: "same-origin",
    body: JSON.stringify({ html, filename }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    const message = body?.error?.message ?? `Generarea PDF a eșuat (${response.status}).`;
    if (response.status === 503) throw new PdfUnavailableError(message);
    throw new Error(message);
  }
  return response.blob();
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Logo-ul ESA (PNG) ca bytes, pentru antetul documentelor Word. */
export async function loadLogoPng(): Promise<Uint8Array> {
  const { default: url } = await import("../assets/logo.png");
  return new Uint8Array(await (await fetch(url)).arrayBuffer());
}

export type { ProviderValues };

/** Text fara diacritice si litere mici, pentru cautare. */
export function norm(s: string): string {
  return s.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase();
}
