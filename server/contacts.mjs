// Contact submissions: validation (same rules as the form) and storage in a local JSON file.
import {mkdir, readFile, rename, writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';

const FIELDS = {
  name: 200,
  email: 254,
  country: 100,
  phone: 50,
  projectType: 100,
  pages: 50,
  budget: 100,
  message: 5000,
  preferred_response_method: 50,
};
const HONEYPOT = 'company_website';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function parseSubmission(formData) {
  const value = (key) => String(formData.get(key) ?? '').trim();
  const fields = {};
  for (const [key, max] of Object.entries(FIELDS)) {
    const v = value(key);
    if (v.length > max) return {error: 'Unul dintre câmpuri este prea lung.'};
    fields[key] = v;
  }

  if (!fields.name) return {error: 'Te rugăm să îți scrii numele.'};
  if (!fields.email) return {error: 'Te rugăm să îți scrii emailul.'};
  if (!EMAIL_RE.test(fields.email)) return {error: 'Adresa de email nu pare corectă.'};
  if (!fields.country) return {error: 'Te rugăm să alegi țara.'};
  if (!fields.budget) return {error: 'Te rugăm să alegi un buget.'};
  if (!fields.preferred_response_method) return {error: 'Te rugăm să alegi cum să îți răspundem.'};
  if (fields.preferred_response_method === 'WhatsApp' && !fields.phone)
    return {error: 'Adaugă un număr de telefon ca să te putem contacta pe WhatsApp.'};

  return {fields, spam: value(HONEYPOT) !== ''};
}

export const STATUSES = ['new', 'in_progress', 'replied', 'done', 'rejected'];

export function createContactStore(file) {
  let queue = Promise.resolve();

  async function readAll() {
    try {
      return JSON.parse(await readFile(file, 'utf8'));
    } catch (err) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }
  }

  // Writes are serialised and atomic (temp file + rename), so concurrent
  // submissions and admin edits can't corrupt the JSON.
  function write(change) {
    const run = queue.then(async () => {
      await mkdir(path.dirname(file), {recursive: true});
      const all = await readAll();
      const result = change(all);
      const tmp = `${file}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(all, null, 2) + '\n', 'utf8');
      await rename(tmp, file);
      return result;
    });
    queue = run.catch(() => {});
    return run;
  }

  function append(fields, meta) {
    const entry = {id: randomUUID(), createdAt: new Date().toISOString(), status: 'new', ...fields, meta};
    return write((all) => (all.push(entry), entry));
  }

  // Admin edits: status and internal note only. Returns the entry, or null if it is gone.
  function update(id, {status, note}) {
    if (status !== undefined && !STATUSES.includes(status)) return Promise.reject(new Error('bad status'));
    return write((all) => {
      const entry = all.find((e) => e.id === id);
      if (!entry) return null;
      if (status !== undefined) entry.status = status;
      if (note !== undefined) entry.note = String(note).slice(0, 5000);
      entry.updatedAt = new Date().toISOString();
      return entry;
    });
  }

  function remove(id) {
    return write((all) => {
      const i = all.findIndex((e) => e.id === id);
      return i >= 0 ? (all.splice(i, 1), true) : false;
    });
  }

  function privacyApply(id, action, fields = {}) {
    return write((all) => {
      const index = all.findIndex(e => e.id === id);
      if (index < 0) return false;
      if (action === 'delete') all.splice(index, 1);
      else if (action === 'anonymize') {
        // Keep no free text, metadata, exact date, contact details or original identifier.
        all[index] = {id: randomUUID(), anonymized: true, status: 'done'};
      } else if (action === 'rectify') {
        for (const [key, value] of Object.entries(fields)) {
          if (!Object.hasOwn(FIELDS, key) || typeof value !== 'string' || value.length > FIELDS[key]) throw new Error('Invalid rectification');
          if (key === 'email' && !EMAIL_RE.test(value)) throw new Error('Invalid email');
          all[index][key] = value;
        }
        all[index].updatedAt = new Date().toISOString();
      } else throw new Error('Invalid privacy action');
      return true;
    });
  }

  return {append, readAll, update, remove, privacyApply};
}

// Fixed-window rate limit per IP, kept in memory.
export function createRateLimiter({limit, windowMs}) {
  const hits = new Map();
  return (key) => {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now - entry.start > windowMs) {
      if (hits.size > 5000) {
        for (const [ip, seen] of hits) if (seen.start + windowMs < now) hits.delete(ip);
      }
      hits.set(key, {start: now, count: 1});
      return true;
    }
    entry.count++;
    return entry.count <= limit;
  };
}
