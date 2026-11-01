import type { ReactNode } from "react";

import { Badge as ShadcnBadge } from "@/components/shadcn/badge";

import { cn } from "./cn";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

export interface BadgeProps {
  tone?: BadgeTone;
  children?: ReactNode;
  className?: string;
}

/** Verde, galben și roșu sunt rezervate stărilor; restul interfeței rămâne neutru. */
const TONES: Record<BadgeTone, string> = {
  neutral: "bg-black/5 text-muted",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-black/5 text-text",
};

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <ShadcnBadge variant="outline" className={cn("rounded-full border-transparent font-medium", TONES[tone], className)}>
      {children}
    </ShadcnBadge>
  );
}
