import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "./cn";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { Skeleton } from "./Skeleton";

export type DataTableAlign = "left" | "center" | "right";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  align?: DataTableAlign;
  /** Coloană ascunsă pe ecrane mici (rămâne vizibilă de la `sm` în sus). */
  hideOnMobile?: boolean;
}

export interface DataTableSort {
  key: string;
  dir: "asc" | "desc";
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: keyof T | ((row: T) => string | number);
  sort?: DataTableSort;
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** Conținut pentru starea fără date; implicit un `EmptyState` generic. */
  empty?: ReactNode;
  className?: string;
}

const ALIGN: Record<DataTableAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const SKELETON_ROWS = 5;

function resolveRowKey<T>(row: T, rowKey: DataTableProps<T>["rowKey"]): string | number {
  if (typeof rowKey === "function") return rowKey(row);
  const value: unknown = row[rowKey];
  return typeof value === "string" || typeof value === "number" ? value : String(value);
}

/** Valoarea afișată implicit, când coloana nu are `render`. */
function defaultCell(row: unknown, key: string): ReactNode {
  if (typeof row !== "object" || row === null) return "—";
  const value = (row as Record<string, unknown>)[key];
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" || typeof value === "number") return value;
  return String(value);
}

/** Tabel de date: sortare, stări loading/error/empty, rânduri focusabile, scroll pe mobil. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  sort,
  onSort,
  onRowClick,
  loading = false,
  error,
  onRetry,
  empty,
  className,
}: DataTableProps<T>) {
  if (error) {
    return (
      <div className={cn("rounded-lg border border-line bg-card", className)}>
        <ErrorState error={error} onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto rounded-lg border border-line bg-card", className)}>
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            {columns.map((column) => {
              const active = sort?.key === column.key;
              const canSort = Boolean(column.sortable && onSort);

              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={active ? (sort?.dir === "asc" ? "ascending" : "descending") : undefined}
                  className={cn(
                    "px-3 py-2 text-xs font-medium whitespace-nowrap text-muted",
                    ALIGN[column.align ?? "left"],
                    column.hideOnMobile && "hidden sm:table-cell",
                  )}
                >
                  {canSort ? (
                    <button
                      type="button"
                      onClick={() => onSort?.(column.key)}
                      className="inline-flex items-center gap-1 hover:text-text"
                    >
                      {column.header}
                      {active ? (
                        sort?.dir === "asc" ? (
                          <ArrowUp aria-hidden="true" className="size-3" />
                        ) : (
                          <ArrowDown aria-hidden="true" className="size-3" />
                        )
                      ) : (
                        <ChevronsUpDown aria-hidden="true" className="size-3" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <tr key={`skeleton-${index}`} className="border-b border-line last:border-0">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn("px-3 py-2", column.hideOnMobile && "hidden sm:table-cell")}
                    >
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.length === 0
              ? (
                <tr>
                  <td colSpan={columns.length}>
                    {empty ?? (
                      <EmptyState
                        title="Niciun rezultat"
                        description="Nu există date de afișat pentru filtrele curente."
                      />
                    )}
                  </td>
                </tr>
              )
              : rows.map((row) => (
                <tr
                  key={resolveRowKey(row, rowKey)}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key !== "Enter") return;
                          event.preventDefault();
                          onRowClick(row);
                        }
                      : undefined
                  }
                  className={cn(
                    "border-b border-line last:border-0",
                    onRowClick && "cursor-pointer hover:bg-sidebar",
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-3 py-2 text-text",
                        ALIGN[column.align ?? "left"],
                        column.hideOnMobile && "hidden sm:table-cell",
                      )}
                    >
                      {column.render ? column.render(row) : defaultCell(row, column.key)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
