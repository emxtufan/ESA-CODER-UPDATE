// Cloudflare edge cache for the public site. The API token is set in the admin and kept in data/cloudflare.json
// (data/ is not in git); it never leaves the server. While on: two cache rules on the zone (pages + static files),
// and the whole cache is emptied after every admin change the site shows, and at startup (a deploy changes files).
import {mkdir, readFile, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';

const API = 'https://api.cloudflare.com/client/v4';
const PHASE = 'http_request_cache_settings';
const TAG = '[ESA admin]'; // our rules are recognised by their description; the other rules of the zone are kept
const DAY = 86400;
const EXT = '"webp" "png" "jpg" "jpeg" "gif" "svg" "avif" "ico" "woff" "woff2" "mp4"';
const DEFAULTS = {enabled: false, zone: '', zoneId: '', token: ''};

/** Cache rules for `zone` (apex + www). Errors are never cached; browsers keep revalidating (origin headers). */
export function cacheRules(zone) {
  const host = `http.host in {"${zone}" "www.${zone}"}`;
  const cache = (ttl) => ({
    cache: true,
    edge_ttl: {mode: 'override_origin', default: ttl, status_code_ttl: [{status_code_range: {from: 400, to: 599}, value: -1}]},
    browser_ttl: {mode: 'respect_origin'},
  });
  return [
    {
      description: `${TAG} pagini (golite automat la fiecare modificare din admin)`,
      expression: `${host} and not starts_with(http.request.uri.path, "/api/") and not starts_with(http.request.uri.path, "/admin")`,
      action: 'set_cache_settings',
      action_parameters: cache(DAY),
      enabled: true,
    },
    {
      description: `${TAG} imagini, fonturi și fișiere statice`,
      expression: `${host} and (starts_with(http.request.uri.path, "/assets/") or starts_with(http.request.uri.path, "/_next/static/") or http.request.uri.path.extension in {${EXT}})`,
      action: 'set_cache_settings',
      action_parameters: cache(30 * DAY),
      enabled: true,
    },
  ];
}

export function createCloudflare(file) {
  const state = {lastPurge: null, lastError: ''};
  let timer = null;

  async function load() {
    try {
      return {...DEFAULTS, ...JSON.parse(await readFile(file, 'utf8'))};
    } catch (err) {
      if (err.code === 'ENOENT') return {...DEFAULTS};
      throw err;
    }
  }

  async function write(s) {
    await mkdir(path.dirname(file), {recursive: true});
    const tmp = `${file}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(s, null, 2) + '\n', {encoding: 'utf8', mode: 0o600});
    await rename(tmp, file);
  }

  async function cf(token, method, url, body) {
    const res = await fetch(API + url, {
      method,
      headers: {authorization: `Bearer ${token}`, 'content-type': 'application/json'},
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success !== false) return json.result;
    const detail = (json.errors ?? []).map((e) => e.message).join('; ') || `HTTP ${res.status}`;
    const denied = res.status === 401 || res.status === 403;
    throw Object.assign(new Error(denied ? `Cloudflare a refuzat tokenul: ${detail}. Verifică permisiunile tokenului.` : `Cloudflare: ${detail}`), {status: res.status});
  }

  // Replaces only our rules; the other cache rules of the zone stay as they are (and, being later, win over ours).
  async function applyRules(s, on) {
    const url = `/zones/${s.zoneId}/rulesets/phases/${PHASE}/entrypoint`;
    let rules = [];
    try {
      rules = (await cf(s.token, 'GET', url)).rules ?? [];
    } catch (err) {
      if (err.status !== 404) throw err; // 404 = the zone has no cache rules yet
    }
    const others = rules.filter((r) => !String(r.description ?? '').startsWith(TAG)).map(({version, last_updated, ...r}) => r);
    if (!on && others.length === rules.length) return;
    await cf(s.token, 'PUT', url, {rules: [...(on ? cacheRules(s.zone) : []), ...others]});
  }

  /** Empties the whole cache. false = cache not on (nothing to do). */
  async function purge(s) {
    s ??= await load();
    if (!s.enabled || !s.token || !s.zoneId) return false;
    try {
      await cf(s.token, 'POST', `/zones/${s.zoneId}/purge_cache`, {purge_everything: true});
      state.lastPurge = new Date().toISOString();
      state.lastError = '';
      return true;
    } catch (err) {
      state.lastError = err.message;
      throw err;
    }
  }

  // Many saves in a row: one purge, a few seconds after the last one.
  function schedulePurge() {
    clearTimeout(timer);
    timer = setTimeout(() => purge().catch((err) => console.error('[cloudflare] purge failed:', err.message)), 3000);
    timer.unref?.();
  }

  // Is the traffic of the site going through Cloudflare (orange cloud) or straight to the server (grey cloud)?
  async function proxyStatus(s) {
    try {
      const records = await cf(s.token, 'GET', `/zones/${s.zoneId}/dns_records?per_page=500`);
      const web = records.filter((r) => [s.zone, `www.${s.zone}`].includes(r.name) && ['A', 'AAAA', 'CNAME'].includes(r.type));
      return {proxied: web.length ? web.every((r) => r.proxied) : null};
    } catch (err) {
      return {proxied: null, dnsError: err.message};
    }
  }

  async function adminSettings() {
    const {token, zoneId, ...rest} = await load();
    return {...rest, hasToken: !!token, ...state, ...(token && zoneId ? await proxyStatus({token, zoneId, zone: rest.zone}) : {})};
  }

  // Empty token = keep the saved one. On: find the zone, set our rules, empty the cache. Off: remove our rules.
  async function save(input) {
    const cur = await load();
    const next = {
      enabled: !!input.enabled,
      zone: String(input.zone ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, ''),
      token: input.token ? String(input.token).trim() : cur.token,
      zoneId: '',
    };
    if (next.enabled && (!next.zone || !next.token)) return {error: 'Completează domeniul și tokenul API.'};
    try {
      if (next.zone && next.token) {
        if (next.zone === cur.zone && next.token === cur.token && cur.zoneId) next.zoneId = cur.zoneId;
        else {
          const zones = await cf(next.token, 'GET', `/zones?name=${encodeURIComponent(next.zone)}`);
          if (!zones?.length) return {error: `Domeniul ${next.zone} nu apare în contul Cloudflare al tokenului. Verifică domeniul și permisiunea Zone → Zone → Read.`};
          next.zoneId = zones[0].id;
        }
      }
      if (next.zoneId && (next.enabled || cur.enabled)) await applyRules(next, next.enabled);
      if (next.enabled) await purge(next);
    } catch (err) {
      return {error: err.message};
    }
    await write(next);
    return {settings: await adminSettings()};
  }

  return {adminSettings, save, purge, schedulePurge};
}
