/**
 * Tipuri comune pentru randarea dosarului contractual (builder-e, randare, DOCX, ciorne).
 */
import type { Billing, DossierDocType, LineStatus, OfferSnapshot } from "@shared/offers";
import type { Currency } from "@shared/enums";

/** Documentele din dosar care se randează cu builder-ele din `builders.ts` (contractul are propriul motor). */
export type DossierRenderType = Exclude<DossierDocType, "contract">;

/** Intrarea comună a tuturor builder-elor. */
export interface DossierInput {
  /** Configurația acceptată (sau ciorna), din care se randează documentul. */
  snapshot: OfferSnapshot;
  /** Contractul-cadru la care se raportează documentul; null dacă nu există încă. */
  contract: { number: string; date: string; cmdNr: string } | null;
  doc: {
    /** Numărul documentului (PV, act adițional, anexe); null = necompletat. */
    number: string | null;
    /** Data documentului, ISO `YYYY-MM-DD`. */
    date: string;
    /**
     * Date specifice tipului de document:
     * - PV: `results[lineId]` (`accepted | accepted_minor | rejected | not_delivered`),
     *   `delivery[lineId]` (text), `minorDefects`, `blockingDefects` (text);
     * - anexe: `annexNo` (suprascrie numărul implicit al anexei, ex. „1.1”).
     */
    data: Record<string, unknown>;
  };
}

/** Actul adițional primește în plus configurația anterioară (snapshot-ul inițial). */
export interface AmendmentInput extends DossierInput {
  before: OfferSnapshot;
}

/** Un rând din `/api/catalog/services`. Sumele sunt în unități minore. */
export interface CatalogService {
  id: string;
  /** Codul din catalog, ex. „B01”. */
  code: string;
  /** Codul categoriei, ex. „B”. */
  categoryCode: string;
  name: string;
  shortDescription: string;
  description: string;
  deliverables: string;
  acceptance: string;
  unit: string;
  defaultQuantity: number;
  /** Prețul recomandat, configurat de administrator; null = fără preț. */
  recommendedPrice: number | null;
  currency: Currency;
  billing: Billing;
  defaultPeriods: number;
  defaultStatus: LineStatus;
  /** Dezvoltare avansată, ofertată separat (D08–D12). */
  advanced: boolean;
  duration: string;
  conditions: string;
}
