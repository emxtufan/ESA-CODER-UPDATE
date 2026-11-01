import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "./cn";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> {
  label?: ReactNode;
  className?: string;
}

export function Checkbox({ label, className, ...rest }: CheckboxProps) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2 text-sm text-text", className)}>
      <input
        type="checkbox"
        className="size-4 cursor-pointer rounded accent-primary"
        {...rest}
      />
      {label ? <span>{label}</span> : null}
    </label>
  );
}
