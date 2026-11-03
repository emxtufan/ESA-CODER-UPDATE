/** Istoricul versiunilor unei oferte: listă și vizualizare read-only a unei versiuni. */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { computeTotals, formatMoney, type OfferConfig, type OfferSnapshot, type OfferStatus, type OfferTotals } from "@shared/offers";

import { Modal, Button, Spinner, cn } from "@/components/ui";
import { OFFER_STATUS_LABELS } from "@shared/offers";
import { api } from "@/lib/api";

import { renderDossierDoc } from "../dossier/render";
import type { DossierInput } from "../dossier/types";
import { DocFrame } from "./DocFrame";
import type { OfferDetail } from "./lib";

interface VersionRow {
  id: string;
  version: number;
  status: OfferStatus;
  totals: OfferTotals;
  createdAt: string;
}

export function VersionsDialog({ offer, snapshot, onClose }: { offer: OfferDetail; snapshot: OfferSnapshot; onClose: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);

  const list = useQuery<{ items: VersionRow[] }>({
    queryKey: ["legal-offer-versions", offer.id],
    queryFn: () => api<{ items: VersionRow[] }>(`/legal/offers/${offer.id}/versions`),
  });
  const detail = useQuery<{ item: { version: number; data: OfferConfig } }>({
    queryKey: ["legal-offer-version", offer.id, selected],
    queryFn: () => api<{ item: { version: number; data: OfferConfig } }>(`/legal/offers/${offer.id}/versions/${selected}`),
    enabled: selected !== null,
  });

  const input: DossierInput | null = detail.data
    ? {
        snapshot: {
          ...snapshot,
          offer: { ...snapshot.offer, version: detail.data.item.version },
          config: detail.data.item.data,
          totals: computeTotals(detail.data.item.data),
          acceptedAt: null,
        },
        contract: null,
        doc: { number: snapshot.offer.number, date: snapshot.offer.date, data: {} },
      }
    : null;

  return (
    <Modal open onClose={onClose} title={`Istoric versiuni – ${offer.number}`} className="max-w-5xl" footer={<Button variant="ghost" onClick={onClose}>Închide</Button>}>
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <ul className="max-h-[60vh] space-y-1 overflow-y-auto">
          {list.isLoading ? <Spinner /> : null}
          {(list.data?.items ?? []).map((v) => (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => setSelected(v.version)}
                className={cn(
                  "w-full rounded-xl border border-line px-3 py-2 text-left text-sm hover:bg-sidebar",
                  selected === v.version && "bg-sidebar ring-1 ring-primary",
                )}
              >
                <span className="font-medium">Versiunea {v.version}</span>
                <span className="block text-xs text-muted">
                  {new Date(v.createdAt).toLocaleString("ro-RO")} · {OFFER_STATUS_LABELS[v.status]}
                </span>
                <span className="block text-xs text-muted">Net: {formatMoney(v.totals.net, offer.currency)}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="h-[60vh] min-h-[320px]">
          {selected === null ? (
            <p className="p-6 text-sm text-muted">Alege o versiune pentru a o vedea (doar citire).</p>
          ) : input ? (
            <DocFrame title={`Versiunea ${selected}`} renderKey={input} render={(doc, img) => renderDossierDoc("offer", input, doc, img)} />
          ) : (
            <Spinner />
          )}
        </div>
      </div>
    </Modal>
  );
}
