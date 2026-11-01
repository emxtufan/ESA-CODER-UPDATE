import type { ReactNode } from "react";

import { cn } from "./cn";

export interface CardProps {
  title?: ReactNode;
  description?: ReactNode;
  /** Acțiuni aliniate în dreapta titlului (ex: buton „Adaugă”). */
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** Container de conținut, fără gradient și fără efecte decorative. */
export function Card({ title, description, actions, children, className, bodyClassName }: CardProps) {
  const hasHeader = title !== undefined || description !== undefined || actions !== undefined;

  return (
    <div className={cn("rounded-lg border border-line bg-card", className)}>
      {hasHeader ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            {title !== undefined ? <h2 className="text-sm font-semibold text-text">{title}</h2> : null}
            {description !== undefined ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children !== undefined ? <div className={cn("p-4", bodyClassName)}>{children}</div> : null}
    </div>
  );
}
