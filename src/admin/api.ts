export type Value = string | string[];
export type Content = Record<string, Record<string, Value>>;

export type Field = {
  key: string;
  label?: string;
  type: 'text' | 'textarea' | 'html' | 'url' | 'slug' | 'number' | 'boolean' | 'image' | 'strings' | 'list' | 'select' | 'refs' | 'hidden';
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
export type Collections = Record<string, Item[]>;
export type FieldError = {index?: number; field: string; message: string};

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
  content: () => call<{data: Content; images: Record<string, string[]>; collections: Collections; schemas: Record<string, Schema>}>('/api/admin/content'),
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
};
