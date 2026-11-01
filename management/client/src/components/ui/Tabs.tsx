import type { KeyboardEvent, ReactNode } from "react";
import { useRef } from "react";

import { cn } from "./cn";

export interface TabItem {
  value: string;
  label: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** Tab-uri accesibile: `role="tablist"`, selecție cu click și navigare cu săgeți/Home/End. */
export function Tabs({ items, value, onChange, className }: TabsProps) {
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = items.findIndex((item) => item.value === value);
    if (current < 0) return;

    let next: number;
    switch (event.key) {
      case "ArrowRight":
        next = (current + 1) % items.length;
        break;
      case "ArrowLeft":
        next = (current - 1 + items.length) % items.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = items.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const target = items[next];
    if (!target) return;
    onChange(target.value);
    buttons.current[target.value]?.focus();
  }

  return (
    <div
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn("flex items-center gap-1 overflow-x-auto border-b border-line", className)}
    >
      {items.map((item) => {
        const selected = item.value === value;

        return (
          <button
            key={item.value}
            ref={(node) => {
              buttons.current[item.value] = node;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors",
              selected ? "border-primary text-text" : "border-transparent text-muted hover:text-text",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
