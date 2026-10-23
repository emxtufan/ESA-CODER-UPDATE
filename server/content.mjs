// /content.js carries every text of the site to every page. The long fields of projects and posts
// are only read on their own page, so they are left out (the record gets `_lite: true`): that page
// gets its full record inlined by the server render (window.__ITEMS__) or from /api/item/:collection/:slug.
// Keep in sync with src/lib/dynamicRoutes.ts.
export const DETAIL = {
  projects: ['about', 'shots', 'pagesList', 'featuresList', 'overview', 'approach', 'brief', 'outcome'],
  posts: ['html'],
};

export function liteData(data) {
  const collections = Object.fromEntries(Object.entries(data._collections ?? {})
    .map(([name, items]) => [name, Array.isArray(items) ? items.filter(item => item?.published !== false) : items]));
  for (const [name, fields] of Object.entries(DETAIL)) {
    if (!Array.isArray(collections[name])) continue;
    collections[name] = collections[name].map((item) => {
      const lite = {...item, _lite: true};
      for (const f of fields) delete lite[f];
      return lite;
    });
  }
  return {...data, _collections: collections};
}

/** The published record of a detail collection, or undefined. */
export function fullItem(data, collection, slug) {
  if (!DETAIL[collection]) return undefined;
  const list = data._collections?.[collection];
  return Array.isArray(list) ? list.find((item) => item?.slug === slug && item.published !== false) : undefined;
}

/** `<script>` with the full record for a /works/:slug or /blog/:slug page, else ''. */
export function itemScript(pathname, data) {
  const m = pathname.match(/^\/(works|blog)\/([^/]+)$/);
  const collection = m && (m[1] === 'works' ? 'projects' : 'posts');
  const item = collection && fullItem(data, collection, decodeURIComponent(m[2]));
  if (!item) return '';
  return `<script>window.__ITEMS__=${JSON.stringify({[`${collection}/${item.slug}`]: item}).replace(/</g, '\\u003c')};</script>`;
}
