import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "./cn";

/** Indicator de încărcare; preia culoarea textului din context. */
export function Spinner({ className, ...rest }: ComponentProps<typeof LoaderCircle>) {
  return (
    <LoaderCircle
      aria-hidden="true"
      className={cn("size-4 shrink-0 animate-spin", className)}
      {...rest}
    />
  );
}
