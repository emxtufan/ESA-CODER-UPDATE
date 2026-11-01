/**
 * Starea unei liste în URL: paginare, căutare (cu debounce), sortare și filtre
 * arbitrare. Toate setările scriu în `searchParams`, deci lista e partajabilă.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

const DEFAULT_PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;
const RESERVED_KEYS = ["page", "pageSize", "q", "sort", "dir", "tab", "view"];

export type SortDir = "asc" | "desc";

export interface ListDefaults {
  pageSize?: number;
  sort?: string;
  dir?: SortDir;
}

export function useListParams(defaults: ListDefaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultPageSize = defaults.pageSize ?? DEFAULT_PAGE_SIZE;
  const defaultSort = defaults.sort ?? "";
  const defaultDir = defaults.dir ?? "asc";

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.max(1, Number(searchParams.get("pageSize")) || defaultPageSize);
  const q = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") || defaultSort;
  const dirParam = searchParams.get("dir");
  const dir: SortDir = dirParam === "asc" || dirParam === "desc" ? dirParam : defaultDir;

  const filters = useMemo(() => {
    const result: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (!RESERVED_KEYS.includes(key)) result[key] = value;
    });
    return result;
  }, [searchParams]);

  /** Scrie mai multe chei deodată; `resetPage` readuce lista la prima pagină. */
  const patch = useCallback(
    (updates: Record<string, string | number | null>, resetPage = false) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(updates)) {
            if (value === null || value === "") next.delete(key);
            else next.set(key, String(value));
          }
          if (resetPage) next.delete("page");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Căutarea se scrie în URL doar după 300ms de la ultima tastă.
  const [qInput, setQInput] = useState(q);

  useEffect(() => {
    setQInput(q);
  }, [q]);

  useEffect(() => {
    if (qInput === q) return;

    const timer = setTimeout(() => patch({ q: qInput }, true), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [qInput, q, patch]);

  const setPage = useCallback((next: number) => patch({ page: next }), [patch]);
  const setPageSize = useCallback((next: number) => patch({ pageSize: next }, true), [patch]);
  const setSort = useCallback((next: string, nextDir?: SortDir) => patch({ sort: next, dir: nextDir ?? dir }, true), [patch, dir]);
  const setDir = useCallback((next: SortDir) => patch({ dir: next }, true), [patch]);
  const setFilter = useCallback((key: string, value: string | null) => patch({ [key]: value }, true), [patch]);

  /** Obiectul de query trimis către `api(path, { query })`. */
  const query = useMemo(() => {
    const result: Record<string, string | number> = { page, pageSize, ...filters };
    if (q) result.q = q;
    if (sort) result.sort = sort;
    if (dir) result.dir = dir;
    return result;
  }, [page, pageSize, q, sort, dir, filters]);

  return {
    page,
    pageSize,
    q,
    qInput,
    setQ: setQInput,
    sort,
    dir,
    filters,
    setPage,
    setPageSize,
    setSort,
    setDir,
    setFilter,
    query,
  };
}
