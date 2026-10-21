// Admin API: password login, editing source_data.json and replacing images in place.
import express from 'express';
import {createHash, randomBytes, randomUUID, timingSafeEqual} from 'node:crypto';
import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs';
import {mkdir, readFile, rename, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createRateLimiter} from './contacts.mjs';
import {liteData} from './content.mjs';
import {blockFields, checkRegistry, checkText, hash, loadRegistry, projectItems, recordId, refId, textRefs} from './sections.mjs';

const COOKIE = 'vv_admin';
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const IMAGE_RE = /["'`(](\/(?!_next|assets)[A-Za-z0-9_\-./]+\.(?:jpe?g|png|webp|avif|gif|svg|mp4))(?=["'`)\s?])/g;
// `/intro/${id}.webp` → every .webp in public/intro
const IMAGE_DIR_RE = /`(\/(?!_next|assets)[A-Za-z0-9_\-./]+\/)\$\{[^}]+\}(\.(?:jpe?g|png|webp|avif|gif|svg))`/g;
const IMAGE_TYPES = {
  '.jpg': ['image/jpeg'], '.jpeg': ['image/jpeg'], '.png': ['image/png'], '.webp': ['image/webp'],
  '.avif': ['image/avif'], '.gif': ['image/gif'], '.svg': ['image/svg+xml'], '.mp4': ['video/mp4'],
};
const COMPONENT_IMPORT_RE = /^import\s+(?:(\w+)|\{([^}]+)\})\s+from\s+['"]@\/(components\/[^'"]+)['"]/gm;
const COLLECTION_RE = /collection(?:<[^>]*>)?\(['"](\w+)['"]\)/g;

async function writeAtomic(file, contents) {
  await mkdir(path.dirname(file), {recursive: true});
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, contents);
  await rename(tmp, file);
}

// Password: ADMIN_PASSWORD, otherwise one generated on first start and kept in data/.
function loadPassword(root) {
  if (process.env.ADMIN_PASSWORD) return {password: process.env.ADMIN_PASSWORD, generated: null};
  const file = path.join(root, 'data', 'admin-password.txt');
  if (existsSync(file)) return {password: readFileSync(file, 'utf8').trim(), generated: null};
  const password = randomBytes(9).toString('base64url');
  return {password, generated: file};
}

// Same scope naming as the codemod: pages → route, others → path under src/.
function scopeOf(rel) {
  if (rel.startsWith('pages/')) {
    const r = rel.slice(6).replace(/\.tsx?$/, '');
    if (r === 'Home') return '/';
    if (r === 'NotFound') return '404';
    return '/' + r;
  }
  return rel.replace(/\.tsx?$/, '');
}

function buildImageIndex(srcDir, publicDir) {
  const index = {};
  (function walk(dir) {
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.tsx?$/.test(name)) {
        const rel = path.relative(srcDir, p).replace(/\\/g, '/');
        const found = new Set();
        const code = readFileSync(p, 'utf8');
        for (const m of code.matchAll(IMAGE_RE)) {
          if (existsSync(path.join(publicDir, m[1]))) found.add(m[1]);
        }
        for (const [, dir, ext] of code.matchAll(IMAGE_DIR_RE)) {
          const abs = path.join(publicDir, dir);
          if (existsSync(abs)) for (const f of readdirSync(abs).sort()) if (f.endsWith(ext)) found.add(dir + f);
        }
        if (found.size) index[scopeOf(rel)] = [...(index[scopeOf(rel)] || []), ...found];
      }
    }
  })(srcDir);
  return index;
}

// What each page is made of, in the order it appears on the page: every imported component
// (with all the components it uses in turn) → their scopes and the collections they read.
// Keyed by the page's text scope ("/", "/contact", "templates/project").
export function buildPageIndex(srcDir) {
  const fileOf = (spec) => ['.tsx', '.ts', '/index.tsx', '/index.ts'].map((e) => path.join(srcDir, spec + e)).find((f) => existsSync(f));
  const importsOf = (code) =>
    [...code.matchAll(COMPONENT_IMPORT_RE)].map(([, def, named, spec]) => ({
      spec,
      names: def ? [def] : named.split(',').map((n) => n.trim().split(/\s+as\s+/).pop()).filter(Boolean),
    }));
  const reach = (spec, seen = new Set()) => {
    if (seen.has(spec)) return seen;
    seen.add(spec);
    const file = fileOf(spec);
    if (file) for (const {spec: s} of importsOf(readFileSync(file, 'utf8'))) reach(s, seen);
    return seen;
  };
  const collectionsOf = (specs) => {
    const out = new Set();
    for (const s of specs) {
      const file = fileOf(s);
      if (file) for (const m of readFileSync(file, 'utf8').matchAll(COLLECTION_RE)) out.add(m[1]);
    }
    return [...out];
  };
  const pages = {};
  for (const top of ['pages', 'templates']) {
    (function walk(dir) {
      if (!existsSync(dir)) return;
      for (const name of readdirSync(dir)) {
        const p = path.join(dir, name);
        if (statSync(p).isDirectory()) { walk(p); continue; }
        if (!/\.tsx$/.test(name)) continue;
        const code = readFileSync(p, 'utf8');
        const rel = path.relative(srcDir, p).replace(/\\/g, '/');
        const scope = code.match(/const \$t = text\((["'])([^"']+)\1\)/)?.[2] ?? scopeOf(rel);
        const parts = [];
        for (const {spec, names} of importsOf(code)) {
          if (parts.some((part) => part.spec === spec)) continue;
          const at = Math.min(...names.map((n) => code.search(new RegExp(`<${n}[\\s/>]`))).filter((i) => i >= 0));
          if (!Number.isFinite(at)) continue;
          const specs = [...reach(spec)];
          parts.push({spec, at, name: names[0], scopes: specs, collections: collectionsOf(specs)});
        }
        parts.sort((a, b) => a.at - b.at);
        pages[scope] = {
          collections: [...new Set([...code.matchAll(COLLECTION_RE)].map((m) => m[1]))],
          parts: parts.map(({name, scopes, collections}) => ({name, scopes, collections})),
        };
      }
    })(path.join(srcDir, top));
  }
  return pages;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED = new Set(['works', 'blog', 'admin', 'api', 'assets', 'media', 'uploads', 'content.js', 'robots.txt', 'sitemap.xml', 'favicon.ico', 'templates', 'services', 'contact', 'about-us']);
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

// Field that identifies a record (unique, else slug); null = records are matched by position.
const idFieldOf = (schema) => (schema.fields.find((f) => f.unique) || schema.fields.find((f) => f.type === 'slug'))?.key ?? null;

export async function createAdmin({root, isProd, onChange}) {
  const dataFile = path.resolve(root, process.env.CONTENT_FILE || 'source_data.json');
  const srcDir = path.join(root, 'src');
  const publicDir = path.join(root, 'public');
  const distDir = path.join(root, 'dist');
  // The first version of every replaced image, so it can be restored (data/ is not in git).
  const originalsDir = path.join(root, 'data', 'image-originals');

  const {password, generated} = loadPassword(root);
  if (generated) await writeAtomic(generated, password + '\n');
  const sessions = new Map();

  let content = await readFile(dataFile, 'utf8');
  let parsed = JSON.parse(content);
  let etag = '"' + createHash('sha1').update(content).digest('hex') + '"';
  const images = existsSync(srcDir) ? buildImageIndex(srcDir, publicDir) : {};
  const pages = existsSync(srcDir) ? buildPageIndex(srcDir) : {};
  // Which texts the admin shows (generated by scripts/admin-index.mjs); everything if missing.
  const visibleFile = path.join(root, 'server', 'admin-visible.json');
  const visible = existsSync(visibleFile) ? JSON.parse(readFileSync(visibleFile, 'utf8')) : null;
  const editable = (data) => {
    const out = {};
    for (const [scope, entries] of Object.entries(data)) {
      if (scope.startsWith('_')) continue;
      const keys = visible ? visible[scope] : Object.keys(entries);
      if (!keys?.length) continue;
      out[scope] = Object.fromEntries(keys.filter((k) => k in entries).map((k) => [k, entries[k]]));
    }
    return out;
  };
  const allImages = new Set(Object.values(images).flat());
  const schemaDir = path.join(root, 'server', 'schema');
  // Collection schemas, re-read on every request (a handful of small files).
  const loadSchemas = () => {
    const out = {};
    if (!existsSync(schemaDir)) return out;
    for (const file of readdirSync(schemaDir).filter((f) => f.endsWith('.json')).sort()) {
      try {
        const schema = JSON.parse(readFileSync(path.join(schemaDir, file), 'utf8'));
        if (Array.isArray(schema.fields)) out[file.slice(0, -5)] = schema;
      } catch (err) {
        console.warn(`[admin] schema ${file} ignored:`, err.message);
      }
    }
    return out;
  };
  // First path segment of every static page, so a custom page cannot shadow one.
  const staticSegments = () => {
    let paths = [];
    try {
      const built = path.join(distDir, 'routes.json');
      if (existsSync(built)) paths = JSON.parse(readFileSync(built, 'utf8'));
      else paths = [...readFileSync(path.join(srcDir, 'routes.ts'), 'utf8').matchAll(/^\s*["'](\/[^"']*)["']\s*:/gm)].map((m) => m[1]);
    } catch {}
    return new Set(paths.map((p) => String(p).split('/')[1]).filter(Boolean));
  };
  const imageExists = (p) => {
    if (typeof p !== 'string' || !p.startsWith('/') || p.includes('..') || p.includes('\\')) return false;
    const file = path.join(publicDir, p);
    return file.startsWith(publicDir + path.sep) && existsSync(file) && statSync(file).isFile();
  };
  let queue = Promise.resolve();
  try {
    const problems = checkRegistry(loadRegistry(path.join(root, 'server', 'sections.json')), parsed, loadSchemas(), Object.keys(images).length ? images : null);
    for (const p of problems) console.warn('[admin] sections.json:', p);
  } catch (err) {
    console.warn('[admin] sections.json not usable:', err.message);
  }

  const valid = (token) => {
    const expires = sessions.get(token);
    if (!expires || expires < Date.now()) { sessions.delete(token); return false; }
    return true;
  };
  const cookieOf = (req) => (req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
  const setCookie = (res, value, maxAge) =>
    res.setHeader('Set-Cookie', `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${isProd ? '; Secure' : ''}`);

  const router = express.Router();
  const loginLimit = createRateLimiter({limit: 10, windowMs: 15 * 60 * 1000});

  router.post('/login', express.json({limit: '4kb'}), (req, res) => {
    if (!loginLimit(req.ip)) return res.status(429).json({ok: false, error: 'Prea multe încercări. Reîncearcă mai târziu.'});
    const given = Buffer.from(String(req.body?.password || ''));
    const expected = Buffer.from(password);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      return res.status(401).json({ok: false, error: 'Parolă greșită.'});
    }
    for (const [token, expires] of sessions) if (expires < Date.now()) sessions.delete(token);
    const token = randomBytes(32).toString('base64url');
    sessions.set(token, Date.now() + SESSION_MS);
    setCookie(res, token, SESSION_MS / 1000);
    res.json({ok: true});
  });

  router.post('/logout', (req, res) => {
    if (req.get('x-admin') !== '1') return res.status(403).json({ok: false, error: 'Cerere respinsă.'});
    sessions.delete(cookieOf(req));
    setCookie(res, '', 0);
    res.append('Set-Cookie', `esa_gdpr=; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=0${isProd ? '; Secure' : ''}`);
    res.json({ok: true});
  });

  // Everything below requires a session; the custom header blocks cross-site form posts.
  router.use((req, res, next) => {
    if (!valid(cookieOf(req))) return res.status(401).json({ok: false, error: 'Neautentificat.'});
    if (req.method !== 'GET' && req.get('x-admin') !== '1') return res.status(403).json({ok: false, error: 'Cerere respinsă.'});
    next();
  });

  router.get('/session', (_req, res) => res.json({ok: true}));

  // Text scopes edited from the section editor; the advanced editor leaves their texts out (one place per text).
  const managedScopes = () => {
    try {
      return [...new Set(loadRegistry(path.join(root, 'server', 'sections.json')).sections.flatMap((sec) => textRefs(sec).map((r) => r.scope)))];
    } catch {
      return [];
    }
  };

  router.get('/content', (_req, res) => {
    current();
    const full = JSON.parse(content);
    res.set('Cache-Control', 'no-store').json({ok: true, managed: managedScopes(), data: editable(full), images, pages, collections: full._collections || {}, schemas: loadSchemas()});
  });

  router.put('/texts', express.json({limit: '4mb'}), (req, res) => {
    const {scope, values} = req.body || {};
    const run = queue.then(async () => {
      current();
      const data = JSON.parse(content);
      const entries = data[scope];
      if (!entries || scope.startsWith('_') || typeof values !== 'object' || !values) throw new Error('Secțiune necunoscută.');
      for (const [key, value] of Object.entries(values)) {
        if (!(key in entries)) throw new Error(`Cheie necunoscută: ${key}`);
        const ok = Array.isArray(entries[key])
          ? Array.isArray(value) && value.every((v) => typeof v === 'string')
          : typeof value === 'string';
        if (!ok) throw new Error(`Valoare invalidă pentru ${key}`);
        entries[key] = value;
      }
      const next = JSON.stringify(data, null, 2) + '\n';
      await writeAtomic(dataFile, next);
      content = next;
      parsed = data;
      etag = '"' + createHash('sha1').update(content).digest('hex') + '"';
      // Let the AI assistant refresh its knowledge base; a failing hook never breaks the save.
      try { Promise.resolve(onChange?.()).catch(() => {}); } catch {}
    });
    queue = run.catch(() => {});
    run.then(() => res.json({ok: true}), (err) => res.status(400).json({ok: false, error: err.message}));
  });

  router.post('/image', express.raw({type: ['image/*', 'video/mp4'], limit: '50mb'}), async (req, res) => {
    const target = String(req.query.path || '');
    const ext = path.extname(target).toLowerCase();
    if (!allImages.has(target)) return res.status(400).json({ok: false, error: 'Imagine necunoscută.'});
    if (!IMAGE_TYPES[ext]?.includes(req.get('content-type'))) {
      return res.status(415).json({ok: false, error: `Fișierul trebuie să fie ${ext.slice(1).toUpperCase()}.`});
    }
    if (!req.body?.length) return res.status(400).json({ok: false, error: 'Fișier gol.'});
    try {
      const original = path.join(originalsDir, target);
      if (!existsSync(original) && existsSync(path.join(publicDir, target))) await writeAtomic(original, await readFile(path.join(publicDir, target)));
      await writeAtomic(path.join(publicDir, target), req.body);
      if (existsSync(distDir)) await writeAtomic(path.join(distDir, target), req.body);
      res.json({ok: true, version: Date.now()});
    } catch (err) {
      console.error('[admin] image upload failed', err);
      res.status(500).json({ok: false, error: 'Nu am putut salva imaginea.'});
    }
  });

  router.get('/image/original', (req, res) => {
    const target = String(req.query.path || '');
    res.set('Cache-Control', 'no-store').json({ok: true, exists: allImages.has(target) && existsSync(path.join(originalsDir, target))});
  });

  router.post('/image/restore', async (req, res) => {
    const target = String(req.query.path || '');
    const original = path.join(originalsDir, target);
    if (!allImages.has(target) || !existsSync(original)) return res.status(400).json({ok: false, error: 'Nu există o versiune originală.'});
    try {
      const body = await readFile(original);
      await writeAtomic(path.join(publicDir, target), body);
      if (existsSync(distDir)) await writeAtomic(path.join(distDir, target), body);
      await unlink(original);
      res.json({ok: true, version: Date.now()});
    } catch (err) {
      console.error('[admin] image restore failed', err);
      res.status(500).json({ok: false, error: 'Nu am putut restaura imaginea.'});
    }
  });

  // Validate one value against a field definition; returns the cleaned value (undefined = omit).
  function cleanValue(field, raw, where, errors, ctx) {
    const err = (message) => { errors.push({field: where + field.key, message}); };
    const empty = raw == null || raw === '' || (Array.isArray(raw) && !raw.length);
    switch (field.type) {
      case 'hidden':
        return raw === null ? undefined : raw;
      case 'boolean':
        return raw === true || raw === 'true';
      case 'number':
      case 'rank': {
        if (raw == null || raw === '') {
          if (field.required) err('Câmp obligatoriu.');
          return undefined;
        }
        const n = Number(raw);
        if (!Number.isFinite(n)) return err('Trebuie să fie un număr.');
        return n;
      }
      case 'strings': {
        const list = Array.isArray(raw) ? raw : [];
        if (!list.every((v) => typeof v === 'string')) return err('Listă invalidă.');
        const out = list.map((v) => v.trim()).filter(Boolean);
        if (field.required && !out.length) err('Câmp obligatoriu.');
        return out;
      }
      case 'refs': {
        const list = Array.isArray(raw) ? raw : [];
        const ids = ctx.idsOf(field.collection);
        if (!ids) return err(`Colecție necunoscută: ${field.collection}.`);
        const bad = list.find((v) => typeof v !== 'string' || !ids.has(v));
        if (bad !== undefined) return err(`Referință inexistentă: ${bad}.`);
        if (field.required && !list.length) err('Câmp obligatoriu.');
        return [...new Set(list)];
      }
      case 'list': {
        const list = Array.isArray(raw) ? raw : [];
        const out = list.map((row, i) => {
          if (!isObj(row)) {
            err('Element invalid.');
            return {};
          }
          return cleanRecord(field.fields || [], row, row, `${where}${field.key}[${i}].`, errors, ctx);
        });
        if (field.required && !out.length) err('Câmp obligatoriu.');
        return out;
      }
      default:
    }
    if (field.type === 'select' && field.collection) {
      const ids = ctx.idsOf(field.collection);
      if (!ids) return err(`Colecție necunoscută: ${field.collection}.`);
      if (empty) {
        if (field.required) err('Câmp obligatoriu.');
        return '';
      }
      if (typeof raw !== 'string' || !ids.has(raw)) return err('Element inexistent.');
      return raw;
    }
    if (empty) {
      if (field.required) err('Câmp obligatoriu.');
      return field.type === 'image' || field.type === 'select' ? undefined : '';
    }
    if (typeof raw !== 'string') return err('Valoare invalidă.');
    const value = field.type === 'html' || field.type === 'textarea' ? raw : raw.trim();
    if (field.type === 'slug' && !SLUG_RE.test(value)) return err('Doar litere mici, cifre și cratime (ex: pagina-mea).');
    if (field.type === 'image' && !imageExists(value)) return err('Imaginea nu există pe server.');
    if (field.type === 'select' && field.options && !field.options.includes(value)) return err('Opțiune invalidă.');
    if (field.type === 'url' && !/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(value)) return err('Adresă invalidă (https://… sau /cale).');
    return value;
  }

  // `base` holds fields the schema does not show (kept as they were).
  function cleanRecord(fields, input, base, where, errors, ctx) {
    const out = {...base};
    for (const field of fields) {
      if (field.type === 'hidden' && input[field.key] === undefined) continue;
      // an image that did not change is not re-checked: one missing file must not block saving unrelated edits
      if (field.type === 'image' && typeof input[field.key] === 'string' && input[field.key] === base[field.key]) continue;
      const value = cleanValue(field, input[field.key], where, errors, ctx);
      if (value === undefined) delete out[field.key];
      else out[field.key] = value;
    }
    return out;
  }

  // `{field}` placeholders of a schema default, filled from the submitted record (new records only).
  const fillDefaults = (defaults = {}, input = {}) =>
    Object.fromEntries(
      Object.entries(defaults).map(([k, v]) => [k, typeof v === 'string' ? v.replace(/\{(\w+)\}/g, (_m, key) => String(input[key] ?? '')) : structuredClone(v)]),
    );

  // Applies the submitted records of one collection onto `data` (no write). Shared by the list editor and the
  // section editor. `fields` = the fields the caller may change (the other fields of a record are kept as they were);
  // `positionOnly` = the list is read-only except for that one field (e.g. which projects show in the Hero).
  // Pushes validation errors to `errors` (with `index` = position in `items`) and returns the new list.
  function applyCollection({name, fields, items, positionOnly, data, schemas, errors}) {
    const full = schemas[name];
    const schema = {...full, fields};
    const collections = (data._collections ||= {});
    const idKey = idFieldOf(full);
    const oldItems = Array.isArray(collections[name]) ? collections[name] : [];
    const oldKey = (o, i) => (idKey ? String(o?.[idKey] ?? '') : String(i));
    const oldById = new Map(oldItems.map((o, i) => [oldKey(o, i), o]));
    const newIds = new Set(idKey ? items.map((it) => (isObj(it) && typeof it[idKey] === 'string' ? it[idKey].trim() : '')).filter(Boolean) : []);
    const ctx = {
      idsOf: (coll) => {
        if (coll === name) return newIds;
        const other = schemas[coll];
        if (!other) return null;
        const key = idFieldOf(other);
        if (!key) return null;
        return new Set((collections[coll] || []).map((o) => o?.[key]).filter(Boolean));
      },
    };
    if (positionOnly) {
      const field = fields.find((f) => f.key === positionOnly);
      const next = [...oldItems];
      const at = new Map(oldItems.map((o, i) => [oldKey(o, i), i]));
      items.forEach((item, i) => {
        const idx = isObj(item) && typeof item._id === 'string' ? at.get(item._id) : undefined;
        if (idx === undefined) return;
        const local = [];
        next[idx] = cleanRecord([field], item, oldItems[idx], '', local, ctx);
        errors.push(...local.map((e) => ({index: i, ...e})));
      });
      return next;
    }
    const reserved = name === 'pages' ? staticSegments() : null;
    const cleaned = [];
    const taken = new Set();
    items.forEach((item, i) => {
      if (!isObj(item)) return errors.push({index: i, field: idKey || '', message: 'Element invalid.'});
      const {_id, ...input} = item;
      // `_id` = the id the record had when loaded (the id field itself may have been edited)
      const known = oldById.get(typeof _id === 'string' ? _id : idKey ? input[idKey] : undefined);
      const old = known || fillDefaults(full.defaults, input);
      const local = [];
      const record = cleanRecord(fields, input, old, '', local, ctx);
      if (!known && full.fields.some((f) => f.key === 'id' && f.type === 'hidden') && !record.id) record.id = randomUUID();
      const id = idKey ? record[idKey] : null;
      if (!idKey) {
        // matched by position, nothing to check
      } else if (typeof id === 'string' && id) {
        if (taken.has(id)) local.push({field: idKey, message: 'Valoare duplicată.'});
        taken.add(id);
        if (reserved && (RESERVED.has(id) || reserved.has(id))) local.push({field: idKey, message: 'Adresa este rezervată de o pagină existentă.'});
      } else if (!local.some((e) => e.field === idKey)) {
        local.push({field: idKey, message: 'Câmp obligatoriu.'});
      }
      errors.push(...local.map((e) => ({index: i, ...e})));
      cleaned.push(record);
    });
    return cleaned;
  }

  const touch = async (data) => {
    const next = JSON.stringify(data, null, 2) + '\n';
    await writeAtomic(dataFile, next);
    content = next;
    parsed = data;
    etag = '"' + createHash('sha1').update(content).digest('hex') + '"';
    // Let the AI assistant refresh its knowledge base; a failing hook never breaks the save.
    try { Promise.resolve(onChange?.()).catch(() => {}); } catch {}
  };

  router.put('/collections/:name', express.json({limit: '8mb'}), (req, res) => {
    const name = req.params.name;
    const run = queue.then(async () => {
      current();
      const schemas = loadSchemas();
      const schema = schemas[name];
      if (!schema) throw Object.assign(new Error('Colecție necunoscută.'), {status: 404});
      const items = req.body?.items;
      if (!Array.isArray(items)) throw new Error('Lista de elemente lipsește.');
      const data = JSON.parse(content);
      const errors = [];
      const cleaned = applyCollection({name, fields: schema.fields, items, data, schemas, errors});
      if (errors.length) throw Object.assign(new Error('Unele câmpuri sunt invalide.'), {errors});
      data._collections[name] = cleaned;
      await touch(data);
      return cleaned;
    });
    queue = run.catch(() => {});
    run.then(
      (items) => res.json({ok: true, items}),
      (err) => res.status(err.status || 400).json({ok: false, error: err.message, errors: err.errors}),
    );
  });

  // --- Sections: the admin is organised by the visible sections of the site (server/sections.json) ---
  const registryFile = path.join(root, 'server', 'sections.json');

  const imagesOf = (spec) => (spec.files ? spec.files.filter((p) => allImages.has(p)) : images[spec.scope] ?? []).filter((p) => (!spec.prefix || p.startsWith(spec.prefix)) && /\.(jpe?g|png|webp|avif|gif|svg|mp4)$/i.test(p));

  // Everything the editor of one section needs, straight from the current data.
  function sectionView(section, data, schemas) {
    const texts = {};
    for (const ref of textRefs(section)) texts[refId(ref)] = data[ref.scope]?.[ref.key] ?? '';
    const blocks = section.blocks.map((block) => {
      if (block.images) return {...block, files: imagesOf(block.images)};
      if (!block.collection) return block;
      const schema = schemas[block.collection];
      const fields = blockFields(block, schema);
      const records = Array.isArray(data._collections?.[block.collection]) ? data._collections[block.collection] : [];
      return {
        ...block,
        schema: {label: schema.label, itemLabel: schema.itemLabel, itemImage: schema.itemImage, route: schema.route, defaults: schema.defaults ?? {}, fields},
        items: projectItems(block, schema, records),
      };
    });
    return {key: section.key, group: section.group, label: section.label, description: section.description, footnote: section.footnote, view: section.view, blocks, texts, rev: hash({texts, blocks: blocks.map((b) => b.items ?? null)})};
  }

  router.get('/sections', (_req, res) => {
    current();
    const registry = loadRegistry(registryFile);
    const schemas = loadSchemas();
    const data = JSON.parse(content);
    res.set('Cache-Control', 'no-store').json({
      ok: true,
      groups: registry.groups,
      sections: registry.sections.map((section) => sectionView(section, data, schemas)),
    });
  });

  router.put('/sections/:key', express.json({limit: '8mb'}), (req, res) => {
    const run = queue.then(async () => {
      current();
      const registry = loadRegistry(registryFile);
      const section = registry.sections.find((s) => s.key === req.params.key);
      if (!section) throw Object.assign(new Error('Secțiune necunoscută.'), {status: 404});
      const schemas = loadSchemas();
      const data = JSON.parse(content);
      const before = sectionView(section, data, schemas);
      if (req.body?.rev !== before.rev) {
        throw Object.assign(new Error('Secțiunea a fost modificată în altă parte (alt tab sau alt editor). Reîncarc datele; modificările tale de aici nu au fost salvate.'), {status: 409});
      }
      const errors = [];
      const refs = new Map(textRefs(section).map((r) => [refId(r), r]));
      const submitted = isObj(req.body?.texts) ? req.body.texts : {};
      for (const [id, value] of Object.entries(submitted)) {
        const ref = refs.get(id);
        if (!ref) {
          errors.push({field: id, message: 'Câmp necunoscut.'});
          continue;
        }
        const problem = checkText(ref.type, value, ref.optional, ref.pattern);
        if (problem) errors.push({field: id, message: problem});
        else (data[ref.scope] ||= {})[ref.key] = value;
      }
      const submittedCollections = isObj(req.body?.collections) ? req.body.collections : {};
      for (const name of Object.keys(submittedCollections)) {
        if (!section.blocks.some((b) => b.collection === name)) errors.push({collection: name, field: '', message: 'Colecție necunoscută pentru această secțiune.'});
      }
      const lists = {};
      for (const block of section.blocks.filter((b) => b.collection)) {
        const items = submittedCollections[block.collection];
        if (items === undefined) continue;
        if (!Array.isArray(items)) {
          errors.push({collection: block.collection, field: '', message: 'Lista de elemente lipsește.'});
          continue;
        }
        const local = [];
        lists[block.collection] = applyCollection({
          name: block.collection,
          fields: blockFields(block, schemas[block.collection]),
          items,
          positionOnly: block.fixed ? block.position : null,
          data,
          schemas,
          errors: local,
        });
        errors.push(...local.map((e) => ({collection: block.collection, ...e})));
      }
      if (errors.length) throw Object.assign(new Error('Unele câmpuri sunt invalide.'), {errors});
      for (const [name, list] of Object.entries(lists)) (data._collections ||= {})[name] = list;
      await touch(data);
      // every section is returned: sections that share a collection (Hero/Works → projects) must see the new revision
      return {section: sectionView(section, data, schemas), sections: registry.sections.map((sec) => sectionView(sec, data, schemas))};
    });
    queue = run.catch(() => {});
    run.then(
      (views) => res.json({ok: true, ...views}),
      (err) => res.status(err.status || 400).json({ok: false, error: err.message, errors: err.errors}),
    );
  });

  router.post('/upload', express.raw({type: 'image/*', limit: '15mb'}), async (req, res) => {
    const ext = Object.keys(IMAGE_TYPES).find((e) => e !== '.jpeg' && IMAGE_TYPES[e][0] === req.get('content-type'));
    if (!ext) return res.status(415).json({ok: false, error: 'Format acceptat: JPG, PNG, WebP, AVIF, GIF sau SVG.'});
    if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ok: false, error: 'Fișier gol.'});
    try {
      const rel = `/uploads/${createHash('sha1').update(req.body).digest('hex').slice(0, 12)}${ext}`;
      await writeAtomic(path.join(publicDir, rel), req.body);
      if (existsSync(distDir)) await writeAtomic(path.join(distDir, rel), req.body);
      res.json({ok: true, path: rel});
    } catch (err) {
      console.error('[admin] upload failed', err);
      res.status(500).json({ok: false, error: 'Nu am putut salva imaginea.'});
    }
  });

  // Texts for the production site, always current (the bundle does not embed them).
  let script = '';
  let scriptFor = '';
  const contentScript = (req, res) => {
    res.set({'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-cache', ETag: etag});
    if (req.headers['if-none-match'] === etag) return res.status(304).end();
    if (scriptFor !== etag) {
      script = `window.__SOURCE_DATA__=${JSON.stringify(liteData(parsed)).replace(/</g, '\\u003c')};`;
      scriptFor = etag;
    }
    res.send(script);
  };

  // Re-read the file if it was changed outside the admin (e.g. by hand or a script).
  let mtime = 0;
  const current = () => {
    try {
      const m = statSync(dataFile).mtimeMs;
      if (m !== mtime) {
        mtime = m;
        const fresh = readFileSync(dataFile, 'utf8');
        if (fresh !== content) {
          content = fresh;
          parsed = JSON.parse(fresh);
          etag = '"' + createHash('sha1').update(content).digest('hex') + '"';
        }
      }
    } catch {}
    return parsed;
  };

  return {router, contentScript: (req, res) => (current(), contentScript(req, res)), current, password, generated, hasSession: req => valid(cookieOf(req))};
}
