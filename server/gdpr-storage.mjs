import {createHmac, randomBytes, randomUUID, timingSafeEqual} from 'node:crypto';
import {mkdir, readFile, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';

export function problem(message, status = 422) { return Object.assign(new Error(message), {status}); }
export const clean = (value, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';
export function required(value, label, max = 500) {
  const result = clean(value, max);
  if (!result) throw problem(`Completează ${label}.`);
  return result;
}
export async function atomic(file, value) {
  await mkdir(path.dirname(file), {recursive: true});
  const tmp = `${file}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(value), {mode: 0o600});
  await rename(tmp, file);
}
export async function readJSON(file, fallback) {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT' && fallback !== undefined) return structuredClone(fallback); throw error; }
}

// The key stays outside exports/backups. Filesystem administrators can still replace both;
// keep signed checkpoints independently for evidence against a privileged host compromise.
export async function signedStore(dir, initial) {
  await mkdir(dir, {recursive: true});
  const file = path.join(dir, 'register.json');
  const keyFile = path.join(dir, 'integrity.key');
  let key;
  try { key = await readFile(keyFile); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    if (await readJSON(file, null)) throw problem('Cheia registrului GDPR lipsește. Restaurarea trebuie investigată.', 503);
    key = randomBytes(32);
    await writeFile(keyFile, key, {flag: 'wx', mode: 0o600});
  }
  const mac = value => createHmac('sha256', key).update(JSON.stringify(value)).digest('hex');
  const equal = (a, b) => typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
  function verify(data) {
    let previous = data.auditAnchor || '';
    for (const entry of data.audit) {
      const {hash, ...body} = entry;
      if (body.previous !== previous || !equal(mac(body), hash)) throw problem('Integritatea jurnalului GDPR este compromisă.', 503);
      previous = hash;
    }
    return previous;
  }
  async function load() {
    const saved = await readJSON(file, null);
    if (!saved) return structuredClone(initial);
    if (!equal(mac(saved.data), saved.signature)) throw problem('Semnătura registrului GDPR nu corespunde. Operațiunea a fost oprită.', 503);
    verify(saved.data);
    return saved.data;
  }
  async function save(data) {
    verify(data);
    await atomic(file, {data, signature: mac(data)});
  }
  function event(data, actor, type, details = {}) {
    const body = {id: randomUUID(), at: new Date().toISOString(), actor, type, ...details, previous: data.audit.at(-1)?.hash || data.auditAnchor || ''};
    data.audit.push({...body, hash: mac(body)});
  }
  await load();
  return {load, save, event, verify, fingerprint: (source, id) => mac([source, id])};
}
