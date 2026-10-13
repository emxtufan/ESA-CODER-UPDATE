// Cookieless visit analytics (same idea as GreenTech): the browser sends one "visit" beacon per session with the
// utm_* tags and referrer of the landing URL, then one "view" beacon per page. The session id lives only in
// sessionStorage (no cookie). The file keeps daily counts plus the latest visits in detail; the IP address is kept
// only on those detailed visits, so it rolls off after RECENT_LIMIT visits. The user agent is never stored.
import {existsSync, readFileSync} from 'node:fs';
import {mkdir, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {getCountriesForTimezone} from 'countries-and-timezones';

const RECENT_LIMIT = 1000;
const VIEWS_PER_VISIT = 40;
const MAX_DAYS = 800;
const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|whatsapp|telegram|discord|skype|curl|wget|python|axios|node-fetch/i;
const COUNTERS = ['sources', 'mediums', 'campaigns', 'contents', 'terms', 'referrers', 'devices', 'browsers', 'os', 'countries', 'cities', 'langs', 'screens', 'hours', 'weekdays', 'pages', 'landings'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Hour and weekday in the visitor's own time zone (server time if the zone is unknown).
function localTime(tz) {
  const parts = (zone) => Object.fromEntries(new Intl.DateTimeFormat('en-US', {hour: 'numeric', hourCycle: 'h23', weekday: 'short', timeZone: zone}).formatToParts(new Date()).map((p) => [p.type, p.value]));
  let p;
  try {
    p = parts(tz || undefined);
  } catch {
    p = parts(undefined);
  }
  return {hour: String(Number(p.hour) % 24), weekday: p.weekday};
}
// "1.2.3.4" / "::ffff:1.2.3.4" → "1.2.3.4"
const cleanIp = (ip) => clip(String(ip || '').replace(/^::ffff:/, ''), 45);

const clip = (v, n = 80) => String(v ?? '').replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, n);
const dayKey = (d) => d.toISOString().slice(0, 10);
const emptyDay = () => ({visits: 0, views: 0, ...Object.fromEntries(COUNTERS.map((k) => [k, {}]))});
const bump = (map, key) => key && (map[key] = (map[key] || 0) + 1);

export const isBot = (ua) => !ua || BOT_RE.test(ua);

// utm_source wins; without one the referrer decides; nothing at all is a direct visit.
export function sourceOf(utmSource, referrerHost) {
  const tag = clip(utmSource, 40).toLowerCase();
  const s = tag || referrerHost;
  if (!s) return 'direct';
  if (/facebook|^fb$|fb\.|messenger/.test(s)) return 'facebook';
  if (/instagram|^ig$/.test(s)) return 'instagram';
  if (/tiktok/.test(s)) return 'tiktok';
  if (/linkedin|lnkd\.in/.test(s)) return 'linkedin';
  if (/twitter|^x$|x\.com|t\.co/.test(s)) return 'x';
  if (/google|bing|duckduckgo|yahoo|yandex|ecosia|brave|search/.test(s)) return tag || 'search';
  if (/newsletter|email|mail/.test(s)) return 'email';
  return tag || referrerHost;
}

export function browserOf(ua = '') {
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/SamsungBrowser/.test(ua)) return 'Samsung';
  if (/Firefox\/|FxiOS/.test(ua)) return 'Firefox';
  if (/Chrome\/|CriOS/.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'Altul';
}
export function osOf(ua = '') {
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X|Macintosh/.test(ua)) return 'macOS';
  if (/Linux|CrOS/.test(ua)) return 'Linux';
  return 'Altul';
}
const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
};

// Country, never from an IP lookup: a CDN header when the site runs behind one (Cloudflare, Vercel…), else the
// device's time zone (Europe/Bucharest → RO), else the region of the browser language. The language comes last:
// a Romanian with an English browser sends "en-US".
const langCountry = (lang) => /^[a-z]{2,3}[-_]([A-Za-z]{2})\b/.exec(String(lang || ''))?.[1].toUpperCase() ?? '';
const tzCountry = (tz) => (tz ? getCountriesForTimezone(String(tz))[0]?.id ?? '' : '');
export function countryOf(headers, lang, tz) {
  const h = String(headers['cf-ipcountry'] || headers['x-vercel-ip-country'] || headers['x-country-code'] || '').toUpperCase();
  if (/^[A-Z]{2}$/.test(h) && h !== 'XX') return h;
  return tzCountry(tz) || langCountry(lang);
}

export function createAnalytics(file) {
  let doc = {version: 1, days: {}, recent: [], totals: {visits: 0, views: 0}};
  try {
    if (existsSync(file)) doc = {...doc, ...JSON.parse(readFileSync(file, 'utf8'))};
  } catch (err) {
    console.error('[analytics] unreadable file, starting fresh:', err.message);
  }
  // visits saved before the time zone counted got their country from the language: correct them
  for (const v of doc.recent) {
    const fixed = tzCountry(v.tz);
    if (!fixed || v.country === fixed || v.country !== langCountry(v.lang)) continue;
    const day = doc.days[v.at.slice(0, 10)];
    if (day?.countries?.[v.country] > 0 && !--day.countries[v.country]) delete day.countries[v.country];
    if (day) day.countries[fixed] = (day.countries[fixed] || 0) + 1;
    v.country = fixed;
  }
  // ponytail: whole document in memory, flushed at most once a second; a database if traffic ever outgrows a JSON file
  let timer = null;
  const flush = async () => {
    timer = null;
    await mkdir(path.dirname(file), {recursive: true});
    const tmp = `${file}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(doc));
    await rename(tmp, file);
  };
  const save = () => {
    timer ??= setTimeout(() => flush().catch((err) => console.error('[analytics] save failed', err)), 1000);
  };
  const today = () => {
    const key = dayKey(new Date());
    if (!doc.days[key]) {
      doc.days[key] = emptyDay();
      const keys = Object.keys(doc.days).sort();
      while (keys.length > MAX_DAYS) delete doc.days[keys.shift()];
    }
    return doc.days[key];
  };

  function record(input, {headers = {}, ip = ''} = {}) {
    const ua = String(headers['user-agent'] || '');
    if (isBot(ua) || !input || typeof input !== 'object') return;
    const sid = clip(input.sid, 40);
    const path_ = clip(input.path, 160) || '/';
    if (!sid || path_.startsWith('/admin')) return;
    const day = today();
    const at = new Date().toISOString();

    if (input.type === 'visit') {
      if (doc.recent.some((v) => v.sid === sid)) return;
      const referrer = hostOf(input.referrer);
      const selfHost = hostOf(`http://${headers.host || ''}`);
      const ref = referrer && referrer !== selfHost ? referrer : '';
      const visit = {
        sid,
        at,
        last: at,
        source: sourceOf(input.source, ref),
        medium: clip(input.medium, 40).toLowerCase(),
        campaign: clip(input.campaign, 60).toLowerCase(),
        content: clip(input.content, 60).toLowerCase(),
        term: clip(input.term, 60).toLowerCase(),
        tagged: !!clip(input.source),
        clickId: input.gclid ? 'gclid' : input.fbclid ? 'fbclid' : '',
        referrer: ref,
        landing: path_,
        device: ['mobile', 'tablet', 'desktop'].includes(input.device) ? input.device : 'desktop',
        browser: browserOf(ua),
        os: osOf(ua),
        country: countryOf(headers, input.lang, input.tz),
        lang: clip(input.lang, 12),
        tz: clip(input.tz, 40),
        ip: cleanIp(ip),
        // Cloudflare "visitor location headers", when enabled
        city: clip(headers['cf-ipcity'], 60),
        screen: /^\d{3,5}x\d{3,5}$/.test(input.screen) ? input.screen : '',
        ...localTime(clip(input.tz, 40)),
        views: [],
      };
      // a click id without utm tags still tells where the visit came from
      if (!visit.tagged && visit.clickId) visit.source = visit.clickId === 'gclid' ? 'google ads' : 'facebook';
      day.visits++;
      doc.totals.visits++;
      bump(day.sources, visit.source);
      bump(day.mediums, visit.medium);
      bump(day.campaigns, visit.campaign);
      bump(day.contents, visit.content);
      bump(day.terms, visit.term);
      bump(day.referrers, visit.referrer);
      bump(day.devices, visit.device);
      bump(day.browsers, visit.browser);
      bump(day.os, visit.os);
      bump(day.countries, visit.country);
      bump(day.cities, visit.city && `${visit.city}, ${visit.country}`);
      bump(day.langs, visit.lang);
      bump(day.screens, visit.screen);
      bump(day.hours, visit.hour);
      bump(day.weekdays, visit.weekday);
      bump(day.landings, visit.landing);
      doc.recent.unshift(visit);
      doc.recent.length = Math.min(doc.recent.length, RECENT_LIMIT);
    }

    // every visit also counts its landing page as a view
    day.views++;
    doc.totals.views++;
    bump(day.pages, path_);
    const visit = doc.recent.find((v) => v.sid === sid);
    if (visit) {
      visit.last = at;
      if (visit.views.length < VIEWS_PER_VISIT && visit.views.at(-1)?.path !== path_) visit.views.push({path: path_, at});
    }
    save();
  }

  function summary(daysParam) {
    const span = Math.max(1, Math.min(365, Number(daysParam) || 30));
    const now = new Date();
    const daily = [];
    const range = emptyDay();
    for (let i = span - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setUTCDate(now.getUTCDate() - i);
      const key = dayKey(d);
      const day = doc.days[key];
      daily.push({date: key, visits: day?.visits ?? 0, views: day?.views ?? 0});
      if (!day) continue;
      range.visits += day.visits;
      range.views += day.views;
      for (const k of COUNTERS) for (const [name, n] of Object.entries(day[k] || {})) range[k][name] = (range[k][name] || 0) + n;
    }
    const top = (map, n = 15) => Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n).map(([key, count]) => ({key, count}));
    const since = Date.now() - span * 86400000;
    const inRange = doc.recent.filter((v) => Date.parse(v.at) >= since);
    // campaign = source / medium / campaign together, from the visits still in the live feed
    const campaigns = {};
    for (const v of inRange) {
      if (!v.campaign && !v.tagged) continue;
      const key = [v.source, v.medium || '—', v.campaign || '—'].join(' · ');
      const c = (campaigns[key] ||= {key, visits: 0, views: 0});
      c.visits++;
      c.views += v.views.length;
    }
    const sum = (n) => daily.slice(-n).reduce((t, d) => t + d.visits, 0);

    // engagement, exits and IPs come from the visits kept in detail
    const durations = inRange.map((v) => (Date.parse(v.last) - Date.parse(v.at)) / 1000);
    const bounces = inRange.filter((v) => v.views.length <= 1).length;
    const exits = {};
    for (const v of inRange) bump(exits, v.views.at(-1)?.path ?? v.landing);
    const ips = {};
    for (const v of [...inRange].reverse()) {
      if (!v.ip) continue;
      const e = (ips[v.ip] ||= {ip: v.ip, visits: 0, views: 0, first: v.at, last: v.last, country: v.country, city: v.city, device: v.device, browser: v.browser, os: v.os});
      e.visits++;
      e.views += v.views.length;
      e.last = v.last;
    }
    // returning: an IP already seen in an earlier detailed visit (also before the period)
    const seen = new Set();
    let returning = 0;
    for (const v of [...doc.recent].reverse()) {
      if (v.ip && seen.has(v.ip) && Date.parse(v.at) >= since) returning++;
      if (v.ip) seen.add(v.ip);
    }
    return {
      days: span,
      totals: {today: sum(1), last7: sum(Math.min(7, span)), range: range.visits, views: range.views, allTime: doc.totals.visits},
      daily,
      ...Object.fromEntries(COUNTERS.map((k) => [k, top(range[k])])),
      hours: Array.from({length: 24}, (_, h) => range.hours[h] || 0),
      weekdays: WEEKDAYS.map((d) => range.weekdays[d] || 0),
      engagement: {
        sample: inRange.length,
        avgDuration: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
        bounceRate: inRange.length ? bounces / inRange.length : 0,
        pagesPerVisit: inRange.length ? inRange.reduce((t, v) => t + Math.max(1, v.views.length), 0) / inRange.length : 0,
        returning,
      },
      exits: top(exits),
      ips: Object.values(ips).sort((a, b) => b.visits - a.visits || Date.parse(b.last) - Date.parse(a.last)).slice(0, 30),
      campaignDetails: Object.values(campaigns).sort((a, b) => b.visits - a.visits).slice(0, 20),
      online: doc.recent.filter((v) => Date.now() - Date.parse(v.last) < 5 * 60000).length,
      recent: doc.recent.slice(0, 100),
    };
  }

  return {record, summary, flush};
}
