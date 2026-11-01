import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem as ShadcnItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/shadcn/breadcrumb";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/** Firimituri de navigare; ultimul element este pagina curentă. */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList className="text-xs">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <Fragment key={`${item.label}-${index}`}>
              <ShadcnItem>
                {item.href && !isLast ? <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink> : <BreadcrumbPage>{item.label}</BreadcrumbPage>}
              </ShadcnItem>
              {isLast ? null : <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
