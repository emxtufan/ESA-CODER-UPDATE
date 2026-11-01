import type { InputHTMLAttributes } from "react";

import { cn } from "./cn";
import { FIELD_BASE, FIELD_INVALID } from "./field-styles";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  invalid?: boolean;
  className?: string;
}

export function Input({ invalid = false, className, ...rest }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(FIELD_BASE, "h-9", invalid && FIELD_INVALID, className)}
      {...rest}
    />
  );
}
