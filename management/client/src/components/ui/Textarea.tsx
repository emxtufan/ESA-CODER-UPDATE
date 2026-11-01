import type { TextareaHTMLAttributes } from "react";

import { cn } from "./cn";
import { FIELD_BASE, FIELD_INVALID } from "./field-styles";

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  invalid?: boolean;
  className?: string;
}

export function Textarea({ invalid = false, rows = 3, className, ...rest }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(FIELD_BASE, "min-h-20 resize-y py-2", invalid && FIELD_INVALID, className)}
      {...rest}
    />
  );
}
