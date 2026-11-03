/** Constante și tipuri comune pentru modulul Legal. */
import type { BadgeTone } from "@/components/ui";

export const CONTRACT_STATUSES = [
  { value: "draft", label: "Ciornă", tone: "neutral" },
  { value: "trimis", label: "Trimis", tone: "warning" },
  { value: "semnat", label: "Semnat", tone: "success" },
] as const satisfies readonly { value: string; label: string; tone: BadgeTone }[];

export function statusLabel(status: string | null | undefined): string {
  return CONTRACT_STATUSES.find((item) => item.value === status)?.label ?? status ?? "—";
}

export function statusToneOf(status: string | null | undefined): BadgeTone {
  return CONTRACT_STATUSES.find((item) => item.value === status)?.tone ?? "neutral";
}

/** Un rând din `GET /legal/contracts`. */
export interface ContractRow {
  id: string;
  number: string | null;
  title: string;
  status: string | null;
  clientId: string;
  clientName: string;
  projectId: string | null;
  projectName: string | null;
  date: string | null;
  updatedAt: string;
}

/** Contractul complet (`GET /legal/contracts/:id`). */
export interface ContractDetail extends ContractRow {
  data: Record<string, string> | null;
  /** Oferta din care a fost generat contractul (dacă există). */
  offerId?: string | null;
}
