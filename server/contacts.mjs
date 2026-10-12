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
    if (v.length > max) return {error: 'One of the fields is too long.'};
    fields[key] = v;
  }

  if (!fields.name) return {error: 'Please add your name.'};
  if (!fields.email) return {error: 'Please add your email.'};
  if (!EMAIL_RE.test(fields.email)) return {error: 'That email address does not look right.'};
  if (!fields.country) return {error: 'Please choose your country.'};
  if (!fields.budget) return {error: 'Please choose a budget range.'};
  if (!fields.preferred_response_method) return {error: 'Please choose how we should reply.'};
  if (fields.preferred_response_method === 'WhatsApp' && !fields.phone)
    return {error: 'Add a phone number so we can reach you on WhatsApp.'};

  return {fields, spam: value(HONEYPOT) !== ''};
}

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
  // submissions can't corrupt the JSON.
  function append(fields, meta) {
    const entry = {id: randomUUID(), createdAt: new Date().toISOString(), ...fields, meta};
    const run = queue.then(async () => {
      await mkdir(path.dirname(file), {recursive: true});
      const all = await readAll();
      all.push(entry);
      const tmp = `${file}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(all, null, 2) + '\n', 'utf8');
      await rename(tmp, file);
      return entry;
    });
    queue = run.catch(() => {});
    return run;
  }

  return {append, readAll};
}

// Fixed-window rate limit per IP, kept in memory.
export function createRateLimiter({limit, windowMs}) {
  const hits = new Map();
  return (key) => {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now - entry.start > windowMs) {
      hits.set(key, {start: now, count: 1});
      return true;
    }
    entry.count++;
    return entry.count <= limit;
  };
}
