import type { InputHTMLAttributes } from "react";

import { Input as ShadcnInput } from "@/components/shadcn/input";

import { cn } from "./cn";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  invalid?: boolean;
  className?: string;
}

export function Input({ invalid = false, className, ...rest }: InputProps) {
  return <ShadcnInput aria-invalid={invalid || undefined} className={cn("h-10 rounded-lg bg-background shadow-none", className)} {...rest} />;
}
