import type { HTMLAttributes } from "react";

import { Skeleton as ShadcnSkeleton } from "@/components/shadcn/skeleton";

export interface SkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  className?: string;
}

export function Skeleton(props: SkeletonProps) {
  return <ShadcnSkeleton {...props} />;
}
