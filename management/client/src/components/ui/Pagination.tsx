import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "./Button";
import { cn } from "./cn";

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  className?: string;
}

/** Navigare între pagini, cu intervalul curent și totalul. */
export function Pagination({ page, pageSize, total, onPage, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-2 text-xs text-muted", className)}>
      <span>{total === 0 ? "Niciun rezultat" : `${from}–${to} din ${total}`}</span>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          aria-label="Pagina anterioară"
          disabled={current <= 1}
          onClick={() => onPage(current - 1)}
        >
          <ChevronLeft aria-hidden="true" className="size-3.5" />
          Anterior
        </Button>
        <span className="whitespace-nowrap">
          Pagina {current} din {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Pagina următoare"
          disabled={current >= totalPages}
          onClick={() => onPage(current + 1)}
        >
          Următor
          <ChevronRight aria-hidden="true" className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
