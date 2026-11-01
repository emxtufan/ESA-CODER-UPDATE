import type { HTMLAttributes } from "react";

import { cn } from "./cn";

export interface SkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  className?: string;
}

/** Bloc de încărcare (fără conținut, doar formă). */
export function Skeleton({ className, ...rest }: SkeletonProps) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded bg-line", className)} {...rest} />;
}
