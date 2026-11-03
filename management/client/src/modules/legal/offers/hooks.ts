import { useQuery } from "@tanstack/react-query";
import type { ProviderValues } from "@shared/offers";

import { api } from "@/lib/api";

import type { CatalogCategory, CatalogPackage, CatalogServiceRow } from "./lib";

export function useCategories() {
  return useQuery<{ items: CatalogCategory[] }>({
    queryKey: ["catalog-categories"],
    queryFn: () => api<{ items: CatalogCategory[] }>("/catalog/categories"),
    staleTime: 60_000,
  });
}

export function useServices(archived: "true" | "false" | "all" = "false") {
  return useQuery<{ items: CatalogServiceRow[] }>({
    queryKey: ["catalog-services", archived],
    queryFn: () => api<{ items: CatalogServiceRow[] }>("/catalog/services", { query: { archived } }),
    staleTime: 30_000,
  });
}

export function usePackages(archived: "true" | "false" | "all" = "false") {
  return useQuery<{ items: CatalogPackage[] }>({
    queryKey: ["catalog-packages", archived],
    queryFn: () => api<{ items: CatalogPackage[] }>("/catalog/packages", { query: { archived } }),
    staleTime: 30_000,
  });
}

export function useProvider() {
  return useQuery<{ item: ProviderValues }>({
    queryKey: ["legal-provider"],
    queryFn: () => api<{ item: ProviderValues }>("/legal/provider"),
    staleTime: 60_000,
  });
}
