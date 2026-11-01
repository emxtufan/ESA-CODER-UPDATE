import type { ReactNode } from "react";

import { Tabs as ShadcnTabs, TabsList, TabsTrigger } from "@/components/shadcn/tabs";

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

/** Control segmentat; conținutul activ îl randează părintele. */
export function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <ShadcnTabs value={value} onValueChange={onChange} className={className}>
      <div className="max-w-full overflow-x-auto">
        <TabsList className="h-10 rounded-full">
          {items.map((item) => (
            <TabsTrigger key={item.value} value={item.value} className="rounded-full px-3.5">
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </ShadcnTabs>
  );
}
