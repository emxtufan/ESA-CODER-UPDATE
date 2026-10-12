// Site server: serves every route of the React app, receives the contact form
// and hosts the admin (/admin) for editing texts and images.
//   npm run dev    -> Vite in middleware mode (HMR), same API
//   npm start      -> production build from dist/
import express from 'express';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createAdmin} from './admin.mjs';
import {isKnownPath} from './routes.mjs';
import {createContactStore, createRateLimiter, parseSubmission} from './contacts.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isProd = process.env.NODE_ENV === 'production' || process.argv.includes('--prod');
const port = Number(process.env.PORT) || 5000;
const host = process.env.HOST || '0.0.0.0';
const dataFile = path.resolve(root, process.env.CONTACTS_FILE || 'data/contacts.json');

const app = express();
const server = http.createServer(app);
app.disable('x-powered-by');
app.set('trust proxy', 'loopback');

// --- Contact API --------------------------------------------------------------
const store = createContactStore(dataFile);
const allow = createRateLimiter({limit: 5, windowMs: 10 * 60 * 1000});

app.post(
  '/api/contact',
  express.raw({type: ['multipart/form-data', 'application/x-www-form-urlencoded'], limit: '256kb'}),
  async (req, res) => {
    if (!allow(req.ip)) {
      return res.status(429).json({ok: false, error: 'Too many messages — please try again in a few minutes.'});
    }
    let formData;
    try {
      // Let the platform's multipart parser do the work (same as the browser's FormData).
      formData = await new Request('http://local/', {
        method: 'POST',
        headers: {'content-type': req.get('content-type') || ''},
        body: req.body,
      }).formData();
    } catch {
      return res.status(400).json({ok: false, error: 'Your message did not send. Please try again.'});
    }

    const result = parseSubmission(formData);
    if (result.error) return res.status(422).json({ok: false, error: result.error});
    // Honeypot filled: pretend success, store nothing.
    if (result.spam) return res.json({ok: true});

    try {
      const entry = await store.append(result.fields, {
        ip: req.ip,
        userAgent: req.get('user-agent') || '',
        referer: req.get('referer') || '',
      });
      console.log(`[contact] ${entry.createdAt} ${entry.name} <${entry.email}>`);
      res.json({ok: true});
    } catch (err) {
      console.error('[contact] could not save submission', err);
      res.status(500).json({ok: false, error: 'Your message did not send. Please try again.'});
    }
  },
);

// --- Admin ----------------------------------------------------------------------
const admin = await createAdmin({root, isProd});
app.use('/api/admin', admin.router);
app.get('/content.js', admin.contentScript);

app.all('/api/{*rest}', (_req, res) => res.status(404).json({ok: false, error: 'Not found'}));

// --- Pages --------------------------------------------------------------------
if (isProd) {
  const dist = path.join(root, 'dist');
  const routes = new Set(JSON.parse(await readFile(path.join(dist, 'routes.json'), 'utf8')));
  // Texts are not bundled in production: /content.js (always current) loads them first.
  const indexHtml = (await readFile(path.join(dist, 'index.html'), 'utf8')).replace(
    '<script type="module"',
    '<script src="/content.js"></script>\n    <script type="module"',
  );
  const adminHtml = await readFile(path.join(dist, 'admin.html'), 'utf8');

  app.use('/assets', express.static(path.join(dist, 'assets'), {immutable: true, maxAge: '1y', index: false, redirect: false}));
  // Images can be replaced from the admin, so they are revalidated (ETag) instead of cached blindly.
  app.use(express.static(dist, {index: false, redirect: false, maxAge: 0}));

  app.get(['/admin', '/admin/{*rest}'], (_req, res) => res.type('html').set('Cache-Control', 'no-cache').send(adminHtml));

  // Every page is rendered client-side from index.html; unknown URLs get a real
  // 404 status and the app shows its not-found page.
  app.get('{*path}', (req, res) => {
    const pathname = req.path.length > 1 ? req.path.replace(/\/+$/, '') : req.path;
    res.status(isKnownPath(pathname, routes, admin.current()) ? 200 : 404).type('html').set('Cache-Control', 'no-cache').send(indexHtml);
  });
} else {
  const {createServer} = await import('vite');
  // HMR shares this HTTP server, so no extra port is needed.
  const vite = await createServer({root, server: {middlewareMode: true, hmr: {server}}, appType: 'spa'});
  app.get(['/admin', '/admin/{*rest}'], async (req, res, next) => {
    try {
      const html = await readFile(path.join(root, 'admin.html'), 'utf8');
      res.type('html').send(await vite.transformIndexHtml(req.originalUrl, html));
    } catch (err) {
      next(err);
    }
  });
  app.use(vite.middlewares);
}

server.listen(port, host, () => {
  console.log(`Server ${isProd ? '(production)' : '(dev)'} on http://localhost:${port}`);
  console.log(`Contact submissions -> ${path.relative(root, dataFile)}`);
  console.log(`Admin: http://localhost:${port}/admin` + (admin.generated ? ` — password: ${admin.password} (saved in data/admin-password.txt)` : ''));
});
