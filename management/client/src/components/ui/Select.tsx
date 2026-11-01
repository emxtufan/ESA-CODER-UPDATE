import type { SelectHTMLAttributes } from "react";

import { NativeSelect, NativeSelectOption } from "@/components/shadcn/native-select";

import { cn } from "./cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "children" | "size"> {
  options: SelectOption[];
  placeholder?: string;
  invalid?: boolean;
  className?: string;
}

/** Select nativ: funcționează direct cu `register` din react-hook-form. */
export function Select({ options, placeholder, invalid = false, className, ...rest }: SelectProps) {
  return (
    <NativeSelect aria-invalid={invalid || undefined} className={cn("h-10 cursor-pointer rounded-lg bg-background shadow-none", className)} {...rest}>
      {placeholder ? (
        <NativeSelectOption value="" disabled>
          {placeholder}
        </NativeSelectOption>
      ) : null}
      {options.map((option) => (
        <NativeSelectOption key={option.value} value={option.value}>
          {option.label}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
