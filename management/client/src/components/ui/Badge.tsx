import type { ReactNode } from "react";

import { cn } from "./cn";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

const TONES: Record<BadgeTone, string> = {
  neutral: "border-line bg-line text-muted",
  success: "border-text/50 bg-transparent text-text",
  warning: "border-dashed border-text/70 bg-transparent text-text",
  danger: "border-text bg-text text-bg",
  info: "border-line bg-transparent text-muted",
};

/** Etichetă compactă de stare. */
export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
