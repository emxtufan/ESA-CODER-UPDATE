// Server-renders URLs through the real router (App → SiteLayout → RouteView, lazy pages
// resolved) and writes one HTML file per URL. Used to prove refactors keep output identical.
// usage: node scripts/ssr-check.mjs <outDir> [/path ...]      (no paths = every URL in source_data + sitemap)
//        node scripts/ssr-check.mjs --compare <dirA> <dirB>
import {mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync} from 'node:fs';
import path from 'node:path';
import {Writable} from 'node:stream';
import {createServer} from 'vite';
import React from 'react';
import {renderToPipeableStream} from 'react-dom/server';

const root = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);

if (args[0] === '--compare') {
  const [a, b] = args.slice(1);
  let same = 0, diff = 0, missing = 0;
  for (const f of readdirSync(a)) {
    if (!existsSync(path.join(b, f))) { missing++; console.log('MISSING', f); continue; }
    if (readFileSync(path.join(a, f), 'utf8') === readFileSync(path.join(b, f), 'utf8')) same++;
    else { diff++; console.log('DIFF', f); }
  }
  console.log(`identical=${same} different=${diff} missing=${missing}`);
  process.exit(diff || missing ? 1 : 0);
}

const outDir = path.resolve(args[0]);
mkdirSync(outDir, {recursive: true});
let paths = args.slice(1);
if (!paths.length) {
  const routesSrc = readFileSync(path.join(root, 'src/routes.ts'), 'utf8');
  const fromRoutes = [...routesSrc.matchAll(/^\s*["'](\/[^"']*)["']\s*:/gm)].map((m) => m[1]);
  const data = JSON.parse(readFileSync(path.join(root, 'source_data.json'), 'utf8'));
  const c = data._collections ?? {};
  const dynamic = [
    ...(c.projects ?? []).map((p) => `/works/${p.slug}`),
    ...(c.postCategories ?? []).map((p) => `/blog/category/${p.key}`),
    ...(c.posts ?? []).map((p) => `/blog/${p.slug}`),
    ...(c.pages ?? []).map((p) => `/${p.slug}`),
  ];
  // the original sitemap, so pages turned into templates are still checked
  const sitemap = existsSync(path.join(import.meta.dirname, 'sitemap-paths.json'))
    ? JSON.parse(readFileSync(path.join(import.meta.dirname, 'sitemap-paths.json'), 'utf8'))
    : [];
  paths = [...new Set([...fromRoutes, ...dynamic, ...sitemap, '/this-page-does-not-exist'])];
}

const vite = await createServer({root, server: {middlewareMode: true, hmr: false}, appType: 'custom', logLevel: 'error'});
const {default: App} = await vite.ssrLoadModule('/src/App.tsx');

function render(url) {
  globalThis.__SSR_PATH__ = url;
  return new Promise((resolve, reject) => {
    let html = '';
    const sink = new Writable({
      write(chunk, _enc, cb) { html += chunk.toString(); cb(); },
      final(cb) { resolve(html); cb(); },
    });
    const stream = renderToPipeableStream(React.createElement(App), {
      onAllReady() { stream.pipe(sink); },
      onShellError: reject,
      onError(err) { reject(err); },
    });
  });
}

let failed = 0;
for (const url of paths) {
  try {
    const html = await render(url);
    const name = (url === '/' ? 'index' : url.slice(1).replace(/\//g, '__')) + '.html';
    writeFileSync(path.join(outDir, name), html);
  } catch (err) {
    failed++;
    console.error('FAIL', url, err?.message);
  }
}
await vite.close();
console.log(`rendered ${paths.length - failed}/${paths.length} → ${path.relative(root, outDir)}`);
process.exit(failed ? 1 : 0);
