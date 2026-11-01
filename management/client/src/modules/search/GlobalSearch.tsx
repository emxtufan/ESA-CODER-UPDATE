/**
 * Căutarea globală din header: un input cu lupă, rezultatele grupate într-un
 * dropdown și navigare completă de la tastatură (Ctrl+K, săgeți, Enter, Escape).
 */
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { Input, Spinner, cn } from "@/components/ui";
import { api } from "@/lib/api";

interface SearchItem {
  id: string;
  title: string;
  subtitle: string | null;
  link: string;
}

interface SearchGroup {
  key: string;
  label: string;
  items: SearchItem[];
}

interface SearchResponse {
  groups: SearchGroup[];
}

/** Cât așteptăm după ultima tastă înainte de cerere. */
const DEBOUNCE_MS = 250;
/** Serverul cere minimum 2 caractere pentru `q`. */
const MIN_QUERY_LENGTH = 2;

export function GlobalSearch() {
  const navigate = useNavigate();
  const baseId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const listboxId = `${baseId}-listbox`;
  const inputId = `${baseId}-input`;

  const { data, isFetching } = useQuery({
    queryKey: ["search", debounced],
    queryFn: ({ signal }) => api<SearchResponse>("/search", { query: { q: debounced }, signal }),
    enabled: debounced.length >= MIN_QUERY_LENGTH,
    staleTime: 30_000,
  });

  const groups = useMemo(() => data?.groups ?? [], [data]);
  const items = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  /** Indexul din lista aplatizată unde începe fiecare grup (pentru navigarea cu săgeți). */
  const groupOffsets = useMemo(() => {
    let offset = 0;
    return groups.map((group) => {
      const start = offset;
      offset += group.items.length;
      return start;
    });
  }, [groups]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [debounced]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const input = containerRef.current?.querySelector<HTMLInputElement>("input");
        input?.focus();
        input?.select();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (activeIndex < 0) return;
    document.getElementById(`${baseId}-option-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, baseId]);

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const goTo = (item: SearchItem) => {
    setQuery("");
    setDebounced("");
    close();
    navigate(item.link);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (items.length === 0 ? -1 : Math.min(index + 1, items.length - 1)));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, -1));
      return;
    }

    if (event.key === "Enter") {
      const target = items[activeIndex] ?? (items.length === 1 ? items[0] : undefined);
      if (!target) return;

      event.preventDefault();
      goTo(target);
    }
  };

  const trimmed = query.trim();
  const showDropdown = open && trimmed.length > 0;
  const loading = trimmed.length >= MIN_QUERY_LENGTH && isFetching && items.length === 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted"
        />
        <Input
          id={inputId}
          type="search"
          role="combobox"
          aria-label="Caută în aplicație"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${baseId}-option-${activeIndex}` : undefined
          }
          autoComplete="off"
          placeholder="Caută…"
          value={query}
          className="pl-8 pr-14"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onInputKeyDown}
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-line px-1 text-[10px] leading-4 text-muted">
          Ctrl K
        </kbd>
      </div>

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-md border border-line bg-card">
          {loading ? (
            <p className="flex items-center gap-2 px-3 py-2 text-sm text-muted">
              <Spinner />
              Se caută…
            </p>
          ) : items.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted">
              {trimmed.length < MIN_QUERY_LENGTH
                ? `Scrie cel puțin ${MIN_QUERY_LENGTH} caractere.`
                : `Niciun rezultat pentru „${trimmed}”.`}
            </p>
          ) : (
            <ul role="listbox" id={listboxId} aria-label="Rezultatele căutării" className="py-1">
              {groups.map((group, groupIndex) => (
                <li key={group.key} role="group" aria-labelledby={`${baseId}-${group.key}`}>
                  <p
                    id={`${baseId}-${group.key}`}
                    className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-muted"
                  >
                    {group.label}
                  </p>
                  <ul role="none">
                    {group.items.map((item, itemIndex) => {
                      const index = groupOffsets[groupIndex] + itemIndex;
                      const active = index === activeIndex;

                      return (
                        <li
                          key={`${group.key}-${item.id}`}
                          id={`${baseId}-option-${index}`}
                          role="option"
                          aria-selected={active}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => goTo(item)}
                          className={cn(
                            "cursor-pointer px-3 py-2 text-sm",
                            active ? "bg-brand text-text" : "text-text hover:bg-sidebar",
                          )}
                        >
                          <span className="block truncate">{item.title}</span>
                          {item.subtitle ? (
                            <span className="block truncate text-xs text-muted">{item.subtitle}</span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default GlobalSearch;
