// Serves the public pages: the React app rendered to HTML on the server (src/entry-server.tsx)
// plus that page's own <head> (server/seo.mjs). The browser then renders the app over it, so
// visitors see the same page, while crawlers, AI search bots and link previews get real content.
import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {headTags, pageMeta} from './seo.mjs';
import {itemScript} from './content.mjs';

export function createPages({root, isProd, vite, isKnown}) {
  const dist = path.join(root, 'dist');
  let template = null;
  // Some modules read their texts once, when loaded (e.g. the header's menu), so the server
  // bundle is loaded with the current texts in place and loaded again when they change.
  let renderModule = null;
  let moduleFor = null;
  let version = 0;
  // One render at a time: the renderer reads the URL and the texts from globals.
  let queue = Promise.resolve();
  // Rendered pages, valid while source_data.json is unchanged (the admin replaces the object).
  let cacheFor = null;
  const cache = new Map();

  async function load(url) {
    if (!isProd) {
      const html = await readFile(path.join(root, 'index.html'), 'utf8');
      return {html: await vite.transformIndexHtml(url, html), render: (await vite.ssrLoadModule('/src/entry-server.tsx')).render};
    }
    template ??= (await readFile(path.join(dist, 'index.html'), 'utf8')).replace(
      '<script type="module"',
      // texts first: classic `defer` scripts and module scripts run in document order
      '<script defer src="/content.js"></script>\n    <script type="module"',
    );
    return {html: template, render: renderProd};
  }

  async function renderProd(pathname, data) {
    if (moduleFor !== data) {
      globalThis.__SOURCE_DATA__ = data;
      renderModule = await import(`${pathToFileURL(path.join(dist, 'server', 'entry-server.js')).href}?v=${++version}`);
      moduleFor = data;
    }
    return renderModule.render(pathname, data);
  }

  async function body(pathname, data, render) {
    if (isProd && cacheFor === data && cache.has(pathname)) return cache.get(pathname);
    const run = queue.then(() => render(pathname, data));
    queue = run.catch(() => {});
    const html = await run;
    if (isProd) {
      if (cacheFor !== data) cache.clear(), (cacheFor = data);
      if (cache.size < 500) cache.set(pathname, html);
    }
    return html;
  }

  return async function page(req, res, next) {
    try {
      const pathname = req.path.length > 1 ? req.path.replace(/\/+$/, '') : req.path;
      const data = isKnown.data();
      const known = isKnown(pathname, data);
      const {html, render} = await load(req.originalUrl);
      let app = '';
      try {
        app = await body(pathname, data, render);
      } catch (err) {
        // never lose the page over a server-render problem: the browser still renders it
        console.error('[ssr]', pathname, err?.message);
      }
      // in dev the app imports the full source_data.json, so the inlined record is only needed in prod
      const head = headTags(pageMeta(pathname, data, app, known)) + (isProd ? itemScript(pathname, data) : '');
      const out = html.replace('<!--seo-head-->', head).replace('<div id="root"></div>', `<div id="root">${app}</div>`);
      res.status(known ? 200 : 404).type('html').set('Cache-Control', 'no-cache').send(out);
    } catch (err) {
      next(err);
    }
  };
}
