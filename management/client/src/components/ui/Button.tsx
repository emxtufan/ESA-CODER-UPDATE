import type { ButtonHTMLAttributes } from "react";

import { Button as ShadcnButton } from "@/components/shadcn/button";

import { cn } from "./cn";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const VARIANTS = { primary: "default", secondary: "secondary", ghost: "ghost", danger: "destructive" } as const;

export function Button({ variant = "primary", size = "md", loading = false, disabled, className, children, type = "button", ...rest }: ButtonProps) {
  return (
    <ShadcnButton type={type} variant={VARIANTS[variant]} size={size === "sm" ? "sm" : "default"} disabled={disabled || loading} className={cn("rounded-full", className)} {...rest}>
      {loading ? <Spinner /> : null}
      {children}
    </ShadcnButton>
  );
}
