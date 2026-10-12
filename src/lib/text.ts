// Every user-visible text lives in /source_data.json, grouped by scope:
// a route ("/contact", "/works/tubwell", "404") or a component path
// ("components/layout/Header"). Components read them with a scoped accessor:
//   const $t = text('components/layout/Header');  $t('lets-connect')
// In dev the JSON is imported (hot reload). In production the build leaves it out
// and the server provides the current file as window.__SOURCE_DATA__ (/content.js),
// so edits made in the admin show up without a rebuild.
import bundled from '../../source_data.json';

type Scope = Record<string, string | string[]>;

declare global {
  interface Window {
    __SOURCE_DATA__?: Record<string, any>;
  }
}

/** The whole source_data.json (texts by scope + `_collections`). */
export const sourceData: Record<string, any> =
  (typeof window !== 'undefined' && window.__SOURCE_DATA__) || (bundled as unknown as Record<string, any>) || {};
const scopes = sourceData as Record<string, Scope>;

function missing(scope: string, key: string) {
  if (import.meta.env.DEV) console.warn(`[source_data.json] missing text "${scope}" → "${key}"`);
  return key;
}

export function text(scope: string) {
  const entries = scopes[scope] ?? {};
  return (key: string): string => {
    const value = entries[key];
    return typeof value === 'string' ? value : missing(scope, key);
  };
}

export function textList(scope: string, key: string): string[] {
  const value = scopes[scope]?.[key];
  return Array.isArray(value) ? value : [];
}
