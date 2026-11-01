import type { ReactNode } from "react";

import { Card as ShadcnCard, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card";

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

export function Card({ title, description, actions, children, className, bodyClassName }: CardProps) {
  const hasHeader = title !== undefined || description !== undefined || actions !== undefined;

  return (
    <ShadcnCard className={cn("gap-0 rounded-2xl border-0 py-0 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]", className)}>
      {hasHeader ? (
        <CardHeader className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-0">
          <div className="min-w-0">
            {title !== undefined ? (
              <CardTitle>
                <h2 className="text-sm font-semibold tracking-tight text-text">{title}</h2>
              </CardTitle>
            ) : null}
            {description !== undefined ? <CardDescription className="mt-0.5 text-xs">{description}</CardDescription> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </CardHeader>
      ) : null}
      {children !== undefined ? <CardContent className={cn("p-5", bodyClassName)}>{children}</CardContent> : null}
    </ShadcnCard>
  );
}
