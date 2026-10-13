export type Value = string | string[];
export type Content = Record<string, Record<string, Value>>;

export type Field = {
  key: string;
  label?: string;
  type: 'text' | 'textarea' | 'html' | 'url' | 'slug' | 'number' | 'rank' | 'boolean' | 'image' | 'strings' | 'list' | 'select' | 'refs' | 'hidden';
  required?: boolean;
  unique?: boolean;
  advanced?: boolean;
  from?: string;
  options?: string[];
  collection?: string;
  fields?: Field[];
};
export type Schema = {
  label: string;
  itemLabel: string;
  itemImage?: string;
  route?: string;
  order?: number;
  fields: Field[];
  defaults?: Record<string, unknown>;
};
export type Item = Record<string, any>;

// --- visit analytics (server/analytics.mjs) ---------------------------------------------------
export type Visit = {
  sid: string; at: string; last: string; source: string; medium: string; campaign: string; content: string; term: string;
  referrer: string; landing: string; device: string; browser: string; os: string; country: string; tz: string;
  ip?: string; city?: string; screen?: string;
  views: {path: string; at: string}[];
};
type Top = {key: string; count: number}[];
export type AnalyticsSummary = {
  days: number;
  totals: {today: number; last7: number; range: number; views: number; allTime: number};
  daily: {date: string; visits: number; views: number}[];
  sources: Top; mediums: Top; campaigns: Top; contents: Top; terms: Top; referrers: Top; devices: Top;
  browsers: Top; os: Top; countries: Top; cities: Top; langs: Top; screens: Top; pages: Top; landings: Top; exits: Top;
  hours: number[];
  weekdays: number[];
  engagement: {sample: number; avgDuration: number; bounceRate: number; pagesPerVisit: number; returning: number};
  ips: {ip: string; visits: number; views: number; first: string; last: string; country: string; city: string; device: string; browser: string; os: string}[];
  campaignDetails: {key: string; visits: number; views: number}[];
  online: number;
  recent: Visit[];
};

// --- section-based admin (server/sections.json) ---------------------------------------------
export type TextField =
  | {type: 'text' | 'textarea' | 'link' | 'email' | 'phone' | 'code'; scope: string; key: string; label: string; hint?: string; placeholder?: string}
  | {type: 'pair'; scope: string; title: string; text: string; link: string}
  | {type: 'stat'; scope: string; title: string; value: string; suffix: string; label: string}
  | {type: 'rich'; scope: string; title: string; parts: {key: string; accent?: boolean; gapBefore?: string}[]};
export type Block = {
  title?: string;
  note?: string;
  fields?: TextField[] | (string | {key: string})[];
  images?: {scope?: string; prefix?: string; files?: string[]};
  files?: string[];
  collection?: string;
  mode?: 'list' | 'ranked';
  fixed?: boolean;
  position?: string;
  ranked?: string;
  itemName?: string;
  schema?: Schema;
  items?: Item[];
};
export type SectionView = {
  key: string;
  group: string;
  label: string;
  description?: string;
  footnote?: string;
  view?: string;
  blocks: Block[];
  texts: Record<string, string>;
  rev: string;
};
export type SectionError = {collection?: string; index?: number; field: string; message: string};
export type Collections = Record<string, Item[]>;
export type FieldError = {index?: number; field: string; message: string};
/** Page text scope → the components it is built from, in page order (server/admin.mjs buildPageIndex). */
export type PageIndex = Record<string, {collections: string[]; parts: {name: string; scopes: string[]; collections: string[]}[]}>;

async function call<T = {ok: boolean; error?: string}>(url: string, init: RequestInit = {}): Promise<T & {ok: boolean; error?: string; status: number}> {
  const res = await fetch(url, {
    credentials: 'same-origin',
    ...init,
    headers: {'x-admin': '1', ...(init.headers || {})},
  });
  const json = await res.json().catch(() => ({ok: false, error: 'Răspuns invalid de la server.'}));
  return {...json, status: res.status};
}

export const api = {
  session: () => call('/api/admin/session'),
  login: (password: string) =>
    call('/api/admin/login', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({password})}),
  logout: () => call('/api/admin/logout', {method: 'POST'}),
  sections: () => call<{groups: {key: string; label: string}[]; sections: SectionView[]}>('/api/admin/sections'),
  saveSection: (key: string, body: {rev: string; texts: Record<string, string>; collections: Record<string, Item[]>}) =>
    call<{section: SectionView; sections: SectionView[]; errors?: SectionError[]}>(`/api/admin/sections/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify(body),
    }),
  content: () =>
    call<{managed: string[]; data: Content; images: Record<string, string[]>; pages: PageIndex; collections: Collections; schemas: Record<string, Schema>}>('/api/admin/content'),
  saveCollection: (name: string, items: Item[]) =>
    call<{items: Item[]; errors?: FieldError[]}>(`/api/admin/collections/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({items}),
    }),
  upload: (file: File) =>
    call<{path: string}>('/api/admin/upload', {method: 'POST', headers: {'content-type': file.type}, body: file}),
  saveTexts: (scope: string, values: Record<string, Value>) =>
    call('/api/admin/texts', {method: 'PUT', headers: {'content-type': 'application/json'}, body: JSON.stringify({scope, values})}),
  replaceImage: (path: string, file: File) =>
    call<{version: number}>(`/api/admin/image?path=${encodeURIComponent(path)}`, {
      method: 'POST',
      headers: {'content-type': file.type},
      body: file,
    }),
  analytics: (days: number) => call<AnalyticsSummary>(`/api/admin/analytics?days=${days}`),
  hasOriginal: (path: string) => call<{exists: boolean}>(`/api/admin/image/original?path=${encodeURIComponent(path)}`),
  restoreImage: (path: string) =>
    call<{version: number}>(`/api/admin/image/restore?path=${encodeURIComponent(path)}`, {method: 'POST'}),
};
