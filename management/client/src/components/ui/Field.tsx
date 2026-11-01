import type { ReactNode } from "react";

import { Label } from "@/components/shadcn/label";

import { cn } from "./cn";

export interface FieldProps {
  label: string;
  /** `id`-ul câmpului controlat, ca să legăm `<label>` de el. */
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/** Înveliș de câmp: etichetă, conținut, hint și mesaj de eroare. */
export function Field({ label, htmlFor, error, hint, required = false, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium text-text">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            {" *"}
          </span>
        ) : null}
      </Label>
      {children}
      {hint && !error ? <p className="text-xs text-muted">{hint}</p> : null}
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
