import { TriangleAlert } from "lucide-react";

import { ApiError } from "@/lib/api";

import { Button } from "./Button";
import { cn } from "./cn";

export interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  className?: string;
}

/** Mesajul de eroare afișabil utilizatorului. */
function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "A apărut o eroare neașteptată.";
}

/** Stare de eroare, cu buton de reîncercare opțional. */
export function ErrorState({ error, onRetry, title = "Nu am putut încărca datele", className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center justify-center gap-2 px-6 py-10 text-center", className)}
    >
      <TriangleAlert aria-hidden="true" className="size-6 text-danger" />
      <p className="text-sm font-medium text-text">{title}</p>
      <p className="max-w-md text-xs text-muted">{errorMessage(error)}</p>
      {onRetry ? (
        <Button variant="ghost" size="sm" className="mt-2" onClick={onRetry}>
          Reîncearcă
        </Button>
      ) : null}
    </div>
  );
}
