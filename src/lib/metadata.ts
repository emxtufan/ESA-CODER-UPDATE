import {headTags, pageMeta} from '../../server/seo.mjs';
import {getSourceData} from './text';

// Use the server's metadata rules after SPA navigation, once the new page has rendered.
export function updateMetadata(pathname: string, known: boolean) {
  const source = getSourceData();
  const data = {...source, _collections: {...source._collections}};
  const match = pathname.match(/^\/(works|blog)\/([^/]+)$/);
  if (match) {
    const name = match[1] === 'works' ? 'projects' : 'posts';
    const full = window.__ITEMS__?.[`${name}/${decodeURIComponent(match[2])}`];
    if (full) data._collections[name] = data._collections[name].map(item => item.slug === full.slug ? full : item);
  }
  const meta = pageMeta(pathname, data, document.getElementById('root')?.innerHTML || '', known);
  const head = new DOMParser().parseFromString(headTags(meta), 'text/html').head;
  document.head.querySelectorAll('title, meta[name="description"], meta[name="robots"], link[rel="canonical"], meta[property^="og:"], meta[name^="twitter:"], meta[name="google-site-verification"], meta[name="msvalidate.01"], script[type="application/ld+json"]').forEach(node => node.remove());
  document.head.append(...Array.from(head.childNodes));
}
