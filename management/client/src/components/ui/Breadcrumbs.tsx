import { ChevronRight } from "lucide-react";
import { Fragment } from "react";

import { cn } from "./cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/** Firimituri de navigare; ultimul element este pagina curentă. */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumbs" className={cn("text-xs text-muted", className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <Fragment key={`${item.label}-${index}`}>
              <li>
                {item.href && !isLast ? (
                  <a href={item.href} className="hover:text-text">
                    {item.label}
                  </a>
                ) : (
                  <span aria-current={isLast ? "page" : undefined} className={isLast ? "text-text" : undefined}>
                    {item.label}
                  </span>
                )}
              </li>
              {isLast ? null : <ChevronRight aria-hidden="true" className="size-3 shrink-0 text-muted" />}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
