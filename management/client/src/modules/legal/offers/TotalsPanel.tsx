/** Panoul de totaluri al ofertei; toate valorile vin din `computeTotals`. */
import type { Currency } from "@shared/enums";
import { formatMoney, type OfferTotals } from "@shared/offers";

import { cn } from "@/components/ui";

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4", muted && "text-muted")}>
      <dt className={cn("text-sm", strong ? "font-semibold text-text" : muted ? "" : "text-muted")}>{label}</dt>
      <dd className={cn("text-sm tabular-nums", strong ? "text-base font-semibold text-text" : "")}>{value}</dd>
    </div>
  );
}

export function TotalsPanel({ totals, currency, vatRate, className }: { totals: OfferTotals; currency: Currency; vatRate: number; className?: string }) {
  const m = (n: number) => formatMoney(n, currency);
  return (
    <section
      aria-label="Totaluri ofertă"
      className={cn(
        "rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_30px_rgba(0,0,0,0.10)]",
        className,
      )}
    >
      <div className="grid gap-x-8 gap-y-3 md:grid-cols-2">
        <dl className="space-y-1.5">
          <Row label="Costuri unice" value={m(totals.oneTime)} />
          {totals.monthly > 0 ? <Row label="Lunar" value={`${m(totals.monthly)} /lună`} /> : null}
          {totals.yearly > 0 ? <Row label="Anual" value={`${m(totals.yearly)} /an`} /> : null}
          {totals.recurring > 0 ? <Row label="Recurent pe perioada contractată" value={m(totals.recurring)} /> : null}
          {totals.discount > 0 ? <Row label="Reduceri acordate" value={`-${m(totals.discount)}`} /> : null}
          {totals.optional > 0 ? <Row muted label="Opționale (neincluse)" value={m(totals.optional)} /> : null}
          {totals.clientDirect > 0 ? <Row muted label="Cost direct client (neinclus)" value={m(totals.clientDirect)} /> : null}
        </dl>
        <dl className="space-y-1.5 md:border-l md:border-line md:pl-8">
          <Row label="Valoare contractuală netă" value={m(totals.net)} strong />
          <Row label={vatRate > 0 ? `TVA (${vatRate.toLocaleString("ro-RO")}%)` : "TVA"} value={vatRate > 0 ? m(totals.vat) : "fără TVA"} />
          <Row label="Total" value={m(totals.gross)} strong />
        </dl>
      </div>
    </section>
  );
}
