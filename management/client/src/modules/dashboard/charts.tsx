/**
 * Graficele dashboard-ului. Culorile au trecut validatorul de paletă pe suprafața cardului
 * (#1c241e): albastru și portocaliu, cu separare suficientă și pentru daltonism.
 */
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SERIES_1 = "#3987e5";
const SERIES_2 = "#d95926";
const GRID = "rgba(242, 245, 242, 0.08)";
const AXIS = "#9aa59b";

const monthFormat = new Intl.DateTimeFormat("ro-RO", { month: "short", timeZone: "UTC" });
export const monthLabel = (month: string) => monthFormat.format(new Date(`${month}-01T00:00:00Z`)).replace(".", "");
const compact = new Intl.NumberFormat("ro-RO", { notation: "compact", maximumFractionDigits: 1 });

const tick = { fill: AXIS, fontSize: 12 };

interface TipRow {
  name?: string | number;
  value?: number | string;
  color?: string;
}

function ChartTooltip({
  active,
  label,
  payload,
  format,
}: {
  active?: boolean;
  label?: string | number;
  payload?: TipRow[];
  format: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-sidebar px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-text">{label}</p>
      {payload.map((row) => (
        <p key={String(row.name)} className="flex items-center gap-2 text-muted">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ background: row.color }} aria-hidden />
          {row.name}: <span className="font-medium text-text">{format(Number(row.value))}</span>
        </p>
      ))}
    </div>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="mb-2 flex flex-wrap gap-4 text-xs text-muted">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} aria-hidden />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/** Aceleași date, ca tabel: pentru cititoare de ecran și pentru valori exacte. */
function DataDetails({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <details className="mt-2 text-xs text-muted">
      <summary className="cursor-pointer">Vezi tabelul</summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              {head.map((h) => (
                <th key={h} className="py-1 pr-4 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-line">
                {row.map((cell, j) => (
                  <td key={j} className="py-1 pr-4 text-text">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export interface MoneyPoint {
  month: string;
  revenue: number;
  expenses: number;
}

/** Venituri și cheltuieli, aceeași monedă, deci aceeași axă. */
export function MoneyChart({ data, format }: { data: MoneyPoint[]; format: (minor: number) => string }) {
  const points = data.map((d) => ({ ...d, label: monthLabel(d.month) }));
  return (
    <div>
      <Legend
        items={[
          { label: "Venituri fără TVA", color: SERIES_1 },
          { label: "Cheltuieli", color: SERIES_2 },
        ]}
      />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} barGap={2} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} />
            <YAxis tick={tick} tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => compact.format(v / 100)} />
            <Tooltip cursor={{ fill: GRID }} content={<ChartTooltip format={format} />} />
            <Bar dataKey="revenue" name="Venituri" fill={SERIES_1} radius={[4, 4, 0, 0]} maxBarSize={14} />
            <Bar dataKey="expenses" name="Cheltuieli" fill={SERIES_2} radius={[4, 4, 0, 0]} maxBarSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataDetails
        head={["Lună", "Venituri", "Cheltuieli"]}
        rows={points.map((p) => [p.label, format(p.revenue), format(p.expenses)])}
      />
    </div>
  );
}

export function GrowthChart({ data }: { data: { month: string; count: number }[] }) {
  const points = data.map((d) => ({ ...d, label: monthLabel(d.month) }));
  return (
    <div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} />
            <YAxis tick={tick} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
            <Tooltip content={<ChartTooltip format={String} />} />
            <Line dataKey="count" name="Proiecte noi" stroke={SERIES_1} strokeWidth={2} dot={{ r: 4, fill: SERIES_1, strokeWidth: 0 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <DataDetails head={["Lună", "Proiecte noi"]} rows={points.map((p) => [p.label, p.count])} />
    </div>
  );
}

export function StatusChart({ data }: { data: { status: string; count: number }[] }) {
  const points = [...data].sort((a, b) => b.count - a.count);
  return (
    <div style={{ height: Math.max(120, points.length * 34) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 0 }}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis type="category" dataKey="status" tick={tick} tickLine={false} axisLine={false} width={124} />
          <Tooltip cursor={{ fill: GRID }} content={<ChartTooltip format={String} />} />
          <Bar dataKey="count" name="Proiecte" fill={SERIES_1} radius={[0, 4, 4, 0]} maxBarSize={16} isAnimationActive={false}>
            <LabelList dataKey="count" position="right" fill="#f2f5f2" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** O singură bară segmentată: identitatea e în legendă și numere, nu doar în culoare. */
export function InvoiceBar({ paid, unpaid, overdue }: { paid: number; unpaid: number; overdue: number }) {
  const open = unpaid + overdue;
  const total = paid + open;
  return (
    <div>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded" role="img" aria-label={`${paid} plătite, ${open} neachitate`}>
        {paid > 0 ? <div style={{ width: `${(paid / total) * 100}%`, background: SERIES_1 }} title={`Plătite: ${paid}`} /> : null}
        {open > 0 ? <div style={{ width: `${(open / total) * 100}%`, background: SERIES_2 }} title={`Neachitate: ${open}`} /> : null}
      </div>
      <ul className="mt-3 space-y-1 text-sm text-muted">
        <li className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: SERIES_1 }} aria-hidden />
          Plătite: <span className="font-medium text-text">{paid}</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: SERIES_2 }} aria-hidden />
          Neachitate: <span className="font-medium text-text">{open}</span>
          {overdue > 0 ? <span>(din care {overdue} restante)</span> : null}
        </li>
      </ul>
    </div>
  );
}
