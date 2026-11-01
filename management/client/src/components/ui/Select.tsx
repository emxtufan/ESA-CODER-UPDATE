import type { SelectHTMLAttributes } from "react";

import { cn } from "./cn";
import { FIELD_BASE, FIELD_INVALID } from "./field-styles";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "children"> {
  options: SelectOption[];
  placeholder?: string;
  invalid?: boolean;
  className?: string;
}

export function Select({ options, placeholder, invalid = false, className, ...rest }: SelectProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(FIELD_BASE, "h-9 cursor-pointer", invalid && FIELD_INVALID, className)}
      {...rest}
    >
      {placeholder ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
