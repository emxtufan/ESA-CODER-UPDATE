// Which URLs are real pages (200) — static routes from the build plus the
// collection-backed ones. Keep in sync with src/lib/dynamicRoutes.ts.
const DYNAMIC = [
  [/^\/works\/([^/]+)$/, 'projects', 'slug'],
  [/^\/blog\/category\/([^/]+)$/, 'postCategories', 'key'],
  [/^\/blog\/([^/]+)$/, 'posts', 'slug'],
  [/^\/([^/]+)$/, 'pages', 'slug'],
];

export function isKnownPath(pathname, staticRoutes, data) {
  if (staticRoutes.has(pathname)) return true;
  const collections = data?._collections ?? {};
  for (const [pattern, name, field] of DYNAMIC) {
    const match = pathname.match(pattern);
    if (!match) continue;
    let param;
    try {
      param = decodeURIComponent(match[1]);
    } catch {
      return false;
    }
    if ((collections[name] ?? []).some((item) => item?.[field] === param)) return true;
  }
  return false;
}
