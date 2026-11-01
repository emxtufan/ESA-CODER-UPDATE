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
        className="size-4 shrink-0 cursor-pointer rounded border-line bg-bg accent-primary disabled:cursor-not-allowed disabled:opacity-50"
        {...rest}
      />
      {label ? <span>{label}</span> : null}
    </label>
  );
}
