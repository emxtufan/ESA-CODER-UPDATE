import type { TextareaHTMLAttributes } from "react";

import { Textarea as ShadcnTextarea } from "@/components/shadcn/textarea";

import { cn } from "./cn";

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  invalid?: boolean;
  className?: string;
}

export function Textarea({ invalid = false, className, ...rest }: TextareaProps) {
  return <ShadcnTextarea aria-invalid={invalid || undefined} className={cn("min-h-20 resize-y rounded-lg bg-background shadow-none", className)} {...rest} />;
}
