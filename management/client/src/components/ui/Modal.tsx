import type { ReactNode } from "react";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/shadcn/dialog";

import { cn } from "./cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Lățimea cerută de apelant (`max-w-3xl`) trebuie să bată `sm:max-w-*` din shadcn. */
const widen = (className?: string) =>
  className?.split(" ").map((c) => (c.startsWith("max-w-") ? `sm:${c}` : c)).join(" ");

export function Modal({ open, onClose, title, footer, children, className }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent aria-describedby={undefined} className={cn("flex max-h-[90vh] flex-col gap-0 rounded-2xl p-0 sm:max-w-xl", widen(className))}>
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-base font-semibold tracking-tight">{title}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer ? <DialogFooter className="border-t px-6 py-4">{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}
