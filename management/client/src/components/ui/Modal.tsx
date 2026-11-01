import { X } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { useEffect, useId, useRef } from "react";

import { cn } from "./cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * Fereastră modală peste `<dialog>` nativ: `showModal()` aduce singur focus trap,
 * închidere cu Esc și stratul `::backdrop`; `aria-modal` e setat explicit.
 */
export function Modal({ open, onClose, title, footer, children, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    // Click pe fundal are ca țintă chiar elementul <dialog>.
    if (event.target === dialogRef.current) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={handleClick}
      className={cn(
        "m-auto flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg flex-col overflow-hidden rounded-lg border border-line bg-card p-0 text-text backdrop:bg-bg/70",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
        <h2 id={titleId} className="text-sm font-semibold text-text">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Închide"
          className="shrink-0 text-muted hover:text-text"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-sm">{children}</div>
      {footer ? (
        <div className="flex shrink-0 justify-end gap-2 border-t border-line px-4 py-3">{footer}</div>
      ) : null}
    </dialog>
  );
}
