// AI assistant security: API keys encrypted at rest and outbound fetches that can
// never reach the internal network (SSRF / DNS-rebinding safe).
import {createCipheriv, createDecipheriv, randomBytes} from 'node:crypto';
import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import {isIP} from 'node:net';
import {problem} from '../gdpr-storage.mjs';

const KEY_RE = /^[0-9a-f]{64}$/;
const REDIRECTS = new Set([301, 302, 303, 307, 308]);
const USER_AGENT = 'ESA-KnowledgeBot/1.0';
const ACCEPT = 'text/html,text/plain,application/pdf,*/*;q=0.5';

export function secretKey() {
  const raw = process.env.AI_SECRET_KEY || '';
  if (!KEY_RE.test(raw.toLowerCase())) throw problem('AI_SECRET_KEY lipsește sau e invalidă (64 caractere hex).', 503);
  return Buffer.from(raw, 'hex');
}

export function encryptSecret(plain, aad) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', secretKey(), iv);
  cipher.setAAD(Buffer.from(aad));
  const body = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return 'v1.' + Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64url');
}

export function decryptSecret(blob, aad) {
  const key = secretKey();
  try {
    const [version, payload] = String(blob).split('.');
    if (version !== 'v1' || !payload) throw new Error('unexpected blob');
    const raw = Buffer.from(payload, 'base64url');
    if (raw.length < 28) throw new Error('unexpected length');
    const decipher = createDecipheriv('aes-256-gcm', key, raw.subarray(0, 12));
    decipher.setAAD(Buffer.from(aad));
    decipher.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
  } catch {
    throw problem('Cheia API salvată nu poate fi decriptată.', 503);
  }
}

export function maskSecret(plain) {
  const value = typeof plain === 'string' ? plain : '';
  return value.length >= 8 ? '••••' + value.slice(-4) : '••••';
}

// Hosts the operator explicitly trusts (e.g. a local model gateway), "host:port,host:port".
export function privateHosts() {
  const hosts = new Set();
  for (const entry of String(process.env.AI_PRIVATE_HOSTS || '').split(',')) {
    const host = entry.trim().toLowerCase();
    if (host) hosts.add(host);
  }
  return hosts;
}

function privateV4(ip) {
  const [a, b, c] = ip.split('.').map(Number);
  if (a === 0 || a === 10 || a === 127 || a >= 224) return true; // 0/8, 10/8, 127/8, 224/4, 240/4
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64/10
  if (a === 169 && b === 254) return true; // 169.254/16
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12
  if (a === 192 && b === 0 && c === 0) return true; // 192.0.0/24
  if (a === 192 && b === 168) return true; // 192.168/16
  if (a === 198 && (b === 18 || b === 19)) return true; // 198.18/15
  return false;
}

// IPv6 as 8 unsigned 16-bit groups; an embedded IPv4 tail becomes two groups.
function v6groups(ip) {
  const text = ip.includes('.')
    ? ip.replace(/(\d+\.\d+\.\d+\.\d+)$/, (v4) => {
      const [a, b, c, d] = v4.split('.').map(Number);
      return `${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
    })
    : ip;
  const [head, rest] = text.split('::');
  const left = head ? head.split(':') : [];
  const right = rest ? rest.split(':') : [];
  const groups = rest === undefined ? left : [...left, ...Array(8 - left.length - right.length).fill('0'), ...right];
  return groups.map((group) => parseInt(group, 16) || 0);
}

function privateV6(ip) {
  const g = v6groups(ip);
  if (g.length !== 8) return false;
  if (g.every((group) => group === 0)) return true; // ::
  if (g.slice(0, 7).every((group) => group === 0) && g[7] === 1) return true; // ::1
  if ((g[0] & 0xfe00) === 0xfc00) return true; // fc00::/7
  if ((g[0] & 0xffc0) === 0xfe80) return true; // fe80::/10
  if ((g[0] & 0xff00) === 0xff00) return true; // ff00::/8
  if (g.slice(0, 5).every((group) => group === 0) && g[5] === 0xffff) {
    return privateV4([g[6] >> 8, g[6] & 0xff, g[7] >> 8, g[7] & 0xff].join('.')); // ::ffff:a.b.c.d
  }
  return false;
}

export function isPrivateIp(ip) {
  const text = typeof ip === 'string' ? ip.trim() : '';
  const version = isIP(text);
  if (version === 4) return privateV4(text);
  if (version === 6) return privateV6(text.toLowerCase());
  return false;
}

export async function checkUrl(raw, {allowPrivate = false} = {}) {
  let url;
  try { url = new URL(String(raw)); }
  catch { throw problem('URL invalid.'); }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw problem('URL invalid.');
  if (url.username || url.password) throw problem('URL invalid.');
  if (allowPrivate && privateHosts().has(url.host.toLowerCase())) return url;
  if (url.protocol !== 'https:') throw problem('URL-ul trebuie să fie https.');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(host)) {
    if (isPrivateIp(host)) throw problem('Adresă internă nepermisă.');
    return url;
  }
  let addresses;
  try { addresses = await dns.promises.lookup(host, {all: true}); }
  catch { throw problem('Domeniul nu poate fi rezolvat.'); }
  if (!addresses.length) throw problem('Domeniul nu poate fi rezolvat.');
  if (addresses.some(({address}) => isPrivateIp(address))) throw problem('Adresă internă nepermisă.');
  return url;
}

// The address actually connected to is filtered again, so a hostname that flips
// between checks cannot reach the internal network.
function safeLookup(hostname, options, callback) {
  dns.lookup(hostname, {...options, all: true}, (error, addresses) => {
    if (error) return callback(error);
    if (!addresses.length) return callback(problem('Domeniul nu poate fi rezolvat.'));
    if (addresses.some(({address}) => isPrivateIp(address))) return callback(problem('Adresă internă nepermisă.'));
    if (options?.all) return callback(null, addresses);
    callback(null, addresses[0].address, addresses[0].family);
  });
}

function requestOnce(url, {maxBytes, timeoutMs}) {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === 'https:' ? https : http;
    let settled = false;
    let timedOut = false;
    let tooLarge = false;
    const done = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    };
    const req = lib.request(url, {
      method: 'GET',
      headers: {'user-agent': USER_AGENT, accept: ACCEPT},
      lookup: safeLookup,
    }, (res) => {
      const chunks = [];
      let size = 0;
      res.on('data', (chunk) => {
        size += chunk.length;
        if (size > maxBytes) {
          tooLarge = true;
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });
      res.on('end', () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks)});
      });
      res.on('error', done);
    });
    const timer = setTimeout(() => {
      timedOut = true;
      req.destroy();
    }, timeoutMs);
    req.on('error', (error) => {
      if (tooLarge) return done(problem('Pagina e prea mare.'));
      if (timedOut) return done(problem('Pagina nu a răspuns la timp.'));
      done(error);
    });
    req.end();
  });
}

export async function fetchPublic(raw, {maxBytes = 2_000_000, timeoutMs = 10_000} = {}) {
  let url = await checkUrl(raw);
  for (let redirects = 0; ; redirects++) {
    const res = await requestOnce(url, {maxBytes, timeoutMs});
    if (REDIRECTS.has(res.status)) {
      if (redirects >= 3) throw problem('Prea multe redirecționări.');
      if (!res.headers.location) throw problem(`Pagina a răspuns cu ${res.status}.`);
      let next;
      try { next = new URL(res.headers.location, url); }
      catch { throw problem('URL invalid.'); }
      url = await checkUrl(next.href);
      continue;
    }
    if (res.status < 200 || res.status >= 300) throw problem(`Pagina a răspuns cu ${res.status}.`);
    return {url: url.href, contentType: res.headers['content-type'] || '', body: res.body};
  }
}
