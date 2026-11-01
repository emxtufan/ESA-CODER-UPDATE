import type { ReactNode } from "react";
import { toast } from "sonner";

import { Toaster } from "@/components/shadcn/sonner";

export type ToastTone = "success" | "error";

export interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

const API: ToastApi = {
  success: (message) => void toast.success(message),
  error: (message) => void toast.error(message),
};

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors position="bottom-right" duration={5000} />
    </>
  );
}

export function useToast(): ToastApi {
  return API;
}
