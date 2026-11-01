import { CircleCheck, CircleX, X } from "lucide-react";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "./cn";

export type ToastTone = "success" | "error";

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

export interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Durata de afișare a unei notificări (5s). */
const TOAST_DURATION = 5000;

/** Furnizor de notificări: `ToastProvider` în rădăcină + `useToast()` în componente. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef<number[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (tone: ToastTone, message: string) => {
      nextId.current += 1;
      const id = nextId.current;
      setToasts((current) => [...current, { id, tone, message }]);

      const timer = window.setTimeout(() => dismiss(id), TOAST_DURATION);
      timers.current.push(timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) window.clearTimeout(timer);
    };
  }, []);

  const value = useMemo<ToastApi>(
    () => ({
      success: (message: string) => push("success", message),
      error: (message: string) => push("error", message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-md border bg-card px-3 py-2 text-sm text-text",
              toast.tone === "success" ? "border-primary/40" : "border-danger/40",
            )}
          >
            {toast.tone === "success" ? (
              <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
            ) : (
              <CircleX aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger" />
            )}
            <p className="min-w-0 flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Închide notificarea"
              className="shrink-0 text-muted hover:text-text"
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Acces la notificări: `const toast = useToast(); toast.success("Salvat");` */
export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast trebuie folosit în interiorul ToastProvider");
  return context;
}
