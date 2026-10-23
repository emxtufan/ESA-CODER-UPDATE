// Google reCAPTCHA v3 for the contact form. Keys are set in the admin and kept in
// data/recaptcha.json (data/ is not in git); the secret key never leaves the server.
import {mkdir, readFile, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';

const DEFAULTS = {enabled: false, siteKey: '', secretKey: '', minScore: 0.5};

export function createRecaptcha(file) {
  async function load() {
    try {
      return {...DEFAULTS, ...JSON.parse(await readFile(file, 'utf8'))};
    } catch (err) {
      if (err.code === 'ENOENT') return {...DEFAULTS};
      throw err;
    }
  }

  const active = (s) => s.enabled && !!s.siteKey && !!s.secretKey;

  // For the public site: the site key only when the check is on.
  async function siteKey() {
    const s = await load();
    return active(s) ? s.siteKey : '';
  }

  async function adminSettings() {
    const {secretKey, ...rest} = await load();
    return {...rest, hasSecret: !!secretKey};
  }

  // Empty secret = keep the saved one.
  async function save(input) {
    const current = await load();
    const next = {
      enabled: !!input.enabled,
      siteKey: String(input.siteKey ?? '').trim(),
      secretKey: input.secretKey ? String(input.secretKey).trim() : current.secretKey,
      minScore: Math.min(1, Math.max(0, Number(input.minScore) || DEFAULTS.minScore)),
    };
    if (next.enabled && (!next.siteKey || !next.secretKey)) return {error: 'Completează cheia site-ului și cheia secretă.'};
    await mkdir(path.dirname(file), {recursive: true});
    const tmp = `${file}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(next, null, 2) + '\n', 'utf8');
    await rename(tmp, file);
    return {settings: await adminSettings()};
  }

  // true = let the submission through. Google being unreachable fails closed.
  async function verify(token, ip) {
    const s = await load();
    if (!active(s)) return true;
    if (!token) return false;
    try {
      const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        body: new URLSearchParams({secret: s.secretKey, response: token, remoteip: ip || ''}),
        signal: AbortSignal.timeout(8000),
      });
      const r = await res.json();
      if (!r.success || r.action !== 'contact' || r.score < s.minScore) {
        console.warn('[contact] reCAPTCHA rejected:', r['error-codes'] ?? '', 'score', r.score, 'action', r.action);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[contact] reCAPTCHA check failed:', err.message);
      return false;
    }
  }

  return {siteKey, adminSettings, save, verify};
}
