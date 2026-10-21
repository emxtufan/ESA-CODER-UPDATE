// Site server: serves every route of the React app, receives the contact form
// and hosts the admin (/admin) for editing texts and images.
//   npm run dev    -> Vite in middleware mode (HMR), same API
//   npm start      -> production build from dist/
import express from 'express';
import compression from 'compression';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createAdmin} from './admin.mjs';
import {createAi} from './ai/routes.mjs';
import {createAnalytics} from './analytics.mjs';
import {imageOptimizer} from './images.mjs';
import {isKnownPath} from './routes.mjs';
import {createContactStore, createRateLimiter, parseSubmission} from './contacts.mjs';
import {createMailer} from './mail.mjs';
import {createRecaptcha} from './recaptcha.mjs';
import {robotsTxt, sitemapUrls, sitemapXml} from './seo.mjs';
import {createPages} from './ssr.mjs';
import {fullItem} from './content.mjs';
import {createGdpr} from './gdpr.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isProd = process.env.NODE_ENV === 'production' || process.argv.includes('--prod');
const port = Number(process.env.PORT) || 5000;
const host = process.env.HOST || '0.0.0.0';
const dataFile = path.resolve(root, process.env.CONTACTS_FILE || 'data/contacts.json');

const app = express();
const server = http.createServer(app);
app.disable('x-powered-by');
app.set('trust proxy', 'loopback');
app.use(compression());
app.get('/privacy-policy', (_req, res) => res.redirect(301, '/politica-de-confidentialitate'));
app.use((req, res, next) => {
  res.set({'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'SAMEORIGIN'});
  // HSTS only over https; no includeSubDomains, so other subdomains (e.g. mail) are not forced
  if (req.secure) res.set('Strict-Transport-Security', 'max-age=31536000');
  next();
});

// --- Contact API --------------------------------------------------------------
const store = createContactStore(dataFile);
const allow = createRateLimiter({limit: 5, windowMs: 10 * 60 * 1000});
const mailer = createMailer(path.resolve(root, process.env.SMTP_FILE || 'data/smtp.json'));
const recaptcha = createRecaptcha(path.resolve(root, process.env.RECAPTCHA_FILE || 'data/recaptcha.json'));

// Public: the reCAPTCHA site key the contact form needs ('' = check is off).
app.get('/api/recaptcha', async (_req, res) => res.set('Cache-Control', 'no-store').json({ok: true, siteKey: await recaptcha.siteKey()}));

app.post(
  '/api/contact',
  express.raw({type: ['multipart/form-data', 'application/x-www-form-urlencoded'], limit: '256kb'}),
  async (req, res) => {
    if (!allow(req.ip)) {
      return res.status(429).json({ok: false, error: 'Prea multe mesaje — încearcă din nou peste câteva minute.'});
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
      return res.status(400).json({ok: false, error: 'Mesajul nu a fost trimis. Încearcă din nou.'});
    }

    const result = parseSubmission(formData);
    if (result.error) return res.status(422).json({ok: false, error: result.error});
    // Honeypot filled: pretend success, store nothing.
    if (result.spam) return res.json({ok: true});
    if (!(await recaptcha.verify(String(formData.get('recaptcha_token') ?? ''), req.ip))) {
      return res.status(403).json({ok: false, error: 'Nu am putut verifica că ești om. Reîncarcă pagina și încearcă din nou.'});
    }

    try {
      const entry = await store.append(result.fields, {
        ip: req.ip,
        userAgent: req.get('user-agent') || '',
        referer: req.get('referer') || '',
      });
      console.log(`[contact] ${entry.createdAt} request=${entry.id}`);
      res.json({ok: true});
      mailer.notify(entry);
    } catch (err) {
      console.error('[contact] could not save submission', err);
      res.status(500).json({ok: false, error: 'Mesajul nu a fost trimis. Încearcă din nou.'});
    }
  },
);

// --- Visit analytics (cookieless, see server/analytics.mjs) ---------------------
const analytics = createAnalytics(path.resolve(root, process.env.ANALYTICS_FILE || 'data/analytics.json'));
const allowVisit = createRateLimiter({limit: 120, windowMs: 10 * 60 * 1000});
app.post('/api/visits', express.text({type: ['text/plain', 'application/json'], limit: '4kb'}), async (req, res) => {
  // always 204: analytics must never surface errors to visitors
  res.status(204).end();
  if (!allowVisit(req.ip)) return;
  try {
    if (!(await gdpr.consentAllowsStatistics(req))) return;
    analytics.record(JSON.parse(String(req.body || '{}')), {headers: req.headers, ip: req.ip});
  } catch {}
});

// --- Admin ----------------------------------------------------------------------
// `ai` is created after the admin but the admin already needs its change hook, so the
// variable is hoisted and the hook no-ops until the assistant is ready.
let ai = null;
const admin = await createAdmin({root, isProd, onChange: () => ai?.onContentChange()});
ai = await createAi({dir: path.resolve(root, process.env.AI_DIR || 'data/ai'), admin, getContent: admin.current});
// Mounted before /api/admin: the AI panel has its own router (same CMS session check).
app.use('/api/admin/ai', ai.adminRouter);
const gdpr = await createGdpr({dir: path.resolve(root, process.env.GDPR_DIR || 'data/gdpr'), contacts: store, analytics, content: admin.current, mailer, recaptcha, isProd, adminAccess: admin.hasSession});
app.use('/api/consent', gdpr.consentRouter);
app.use('/api/ai', ai.publicRouter);
// Named auditors can enter GDPR directly without receiving the CMS administrator password.
app.use('/api/admin/gdpr', gdpr.router);
const retentionTimer = setInterval(() => gdpr.runJob().catch(() => console.error('[gdpr] retention unavailable; inspect private register')), 15 * 60 * 1000);
retentionTimer.unref();
// behind the admin session check of admin.router
admin.router.get('/analytics', gdpr.auth.guard(true), (req, res) => res.set('Cache-Control', 'no-store').json({ok: true, ...analytics.summary(req.query.days)}));
admin.router.delete('/analytics/visits/:sid', gdpr.auth.guard(true), async (req, res) => {
  const {sid} = req.params;
  if (!sid || sid.length > 40 || /[\u0000-\u001f]/.test(sid)) return res.status(400).json({ok: false, error: 'Identificator de vizită invalid.'});
  try {
    (await gdpr.manualDelete(req.gdprActor.id, 'visits', [sid])) ? res.json({ok: true}) : res.status(404).json({ok: false, error: 'Vizita nu mai există.'});
  } catch (err) {
    console.error('[analytics] could not delete visit', err);
    res.status(err.status || 500).json({ok: false, error: err.status ? err.message : 'Nu am putut salva ștergerea vizitei. Încearcă din nou.'});
  }
});
admin.router.delete('/analytics', gdpr.auth.guard(true), async (_req, res) => {
  res.status(409).json({ok: false, error: 'Pentru ștergere în masă folosește GDPR & Compliance → Politici de retenție → Simulare. Blocările și dovezile trebuie păstrate.'});
});
admin.router.get('/contacts', gdpr.auth.guard(true), async (_req, res) => res.set('Cache-Control', 'no-store').json({ok: true, items: (await gdpr.visibleContacts()).reverse()}));
admin.router.patch('/contacts/:id', gdpr.auth.guard(true), express.json({limit: '16kb'}), async (req, res) => {
  try {
    const entry = await gdpr.updateContact(req.params.id, req.body ?? {});
    entry ? res.json({ok: true, item: entry}) : res.status(404).json({ok: false, error: 'Cererea nu mai există.'});
  } catch (error) {
    res.status(error.status || 422).json({ok: false, error: error.status ? error.message : 'Status necunoscut.'});
  }
});
admin.router.delete('/contacts/:id', gdpr.auth.guard(true), async (req, res) =>
  (await gdpr.manualDelete(req.gdprActor.id, 'contacts', [req.params.id])) ? res.json({ok: true}) : res.status(404).json({ok: false, error: 'Cererea nu mai există.'}),
);
admin.router.get('/smtp', async (_req, res) => res.json({ok: true, settings: await mailer.publicSettings()}));
admin.router.put('/smtp', express.json({limit: '8kb'}), async (req, res) => {
  const r = await mailer.save(req.body ?? {});
  res.status(r.error ? 422 : 200).json(r.error ? {ok: false, error: r.error} : {ok: true, settings: r.settings});
});
admin.router.post('/smtp/test', async (_req, res) => {
  try {
    await mailer.test();
    res.json({ok: true});
  } catch (err) {
    res.status(502).json({ok: false, error: err.message});
  }
});
admin.router.get('/recaptcha', async (_req, res) => res.json({ok: true, settings: await recaptcha.adminSettings()}));
admin.router.put('/recaptcha', express.json({limit: '8kb'}), async (req, res) => {
  const r = await recaptcha.save(req.body ?? {});
  res.status(r.error ? 422 : 200).json(r.error ? {ok: false, error: r.error} : {ok: true, settings: r.settings});
});
app.use('/api/admin', admin.router);
app.use('/api/admin', (error, _req, res, _next) => res.status(error.status || 500).json({ok: false, error: error.status ? error.message : 'Operațiunea nu a reușit.'}));
app.get('/content.js', admin.contentScript);
// full record of a project or post (content.js carries them without their long fields)
app.get('/api/item/:collection/:slug', (req, res) => {
  const item = fullItem(admin.current(), req.params.collection, req.params.slug);
  if (!item) return res.status(404).json({ok: false});
  res.set('Cache-Control', 'no-cache').json(item);
});

app.all('/api/{*rest}', (_req, res) => res.status(404).json({ok: false, error: 'Not found'}));

// --- Images: lighter WebP copies of large jpg/png/webp, same URLs (see server/images.mjs) ---------------------
app.use(imageOptimizer({root: path.join(root, isProd ? 'dist' : 'public'), cacheDir: path.resolve(root, process.env.IMAGE_CACHE_DIR || 'data/image-cache')}));

// --- Pages --------------------------------------------------------------------
// Real page URLs: the routes of src/routes.ts (dist/routes.json in production) + collection items.
const staticRoutes = new Set(
  isProd
    ? JSON.parse(await readFile(path.join(root, 'dist', 'routes.json'), 'utf8'))
    : [...(await readFile(path.join(root, 'src', 'routes.ts'), 'utf8')).matchAll(/^\s*["'](\/[^"']*)["']\s*:/gm)].map((m) => m[1]),
);
const isKnown = Object.assign((pathname, data) => isKnownPath(pathname, staticRoutes, data), {data: () => admin.current()});

app.get('/robots.txt', (_req, res) => res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(robotsTxt()));
app.get('/sitemap.xml', (_req, res) =>
  res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(sitemapXml(sitemapUrls(staticRoutes, admin.current()))),
);

if (isProd) {
  const dist = path.join(root, 'dist');
  const adminHtml = await readFile(path.join(dist, 'admin.html'), 'utf8');

  app.use('/assets', express.static(path.join(dist, 'assets'), {immutable: true, maxAge: '1y', index: false, redirect: false}));
  // fonts with content-hashed names
  app.use('/_next/static', express.static(path.join(dist, '_next', 'static'), {immutable: true, maxAge: '1y', index: false, redirect: false}));
  // Images can be replaced from the admin, so they are revalidated (ETag) instead of cached blindly.
  app.use(express.static(dist, {index: false, redirect: false, maxAge: 0}));

  app.get(['/admin', '/admin/{*rest}'], (_req, res) => res.type('html').set('Cache-Control', 'no-cache').send(adminHtml));

  // Every page is rendered on the server (see server/ssr.mjs); unknown URLs get a real 404.
  app.get('{*path}', createPages({root, isProd, isKnown}));
} else {
  const {createServer} = await import('vite');
  // HMR shares this HTTP server, so no extra port is needed.
  const vite = await createServer({root, server: {middlewareMode: true, hmr: {server}}, appType: 'custom'});
  app.get(['/admin', '/admin/{*rest}'], async (req, res, next) => {
    try {
      const html = await readFile(path.join(root, 'admin.html'), 'utf8');
      res.type('html').send(await vite.transformIndexHtml(req.originalUrl, html));
    } catch (err) {
      next(err);
    }
  });
  app.use(vite.middlewares);
  app.get('{*path}', createPages({root, isProd, vite, isKnown}));
}

server.listen(port, host, () => {
  console.log(`Server ${isProd ? '(production)' : '(dev)'} on http://localhost:${port}`);
  console.log(`Contact submissions -> ${path.relative(root, dataFile)}`);
  console.log(`Admin: http://localhost:${port}/admin` + (admin.generated ? ' — initial password saved in data/admin-password.txt' : ''));
});
