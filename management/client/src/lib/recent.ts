/** Elemente deschise recent; rămân în browser, nu ajung pe server. */
const KEY = "esa-recent";
const MAX = 6;

export interface RecentItem {
  label: string;
  to: string;
}

export function readRecent(): RecentItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as RecentItem[]) : [];
  } catch {
    return [];
  }
}

export function pushRecent(item: RecentItem): void {
  const next = [item, ...readRecent().filter((r) => r.to !== item.to)].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
}
