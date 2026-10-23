// Cookieless visit beacons (server/analytics.mjs): one "visit" per browser session with the utm_* tags and referrer
// of the landing URL, then one "view" per page. The session id lives in sessionStorage only: no cookie, nothing
// that survives closing the tab. Optional statistics still require consent.
import {currentConsent} from './consent';
const KEY = 'vv-visit';

function session(): {sid: string; fresh: boolean} {
  try {
    const sid = sessionStorage.getItem(KEY);
    if (sid) return {sid, fresh: false};
    const created = crypto.randomUUID();
    sessionStorage.setItem(KEY, created);
    return {sid: created, fresh: true};
  } catch {
    // storage blocked (private mode): one id per page load
    const w = window as {__vvSid?: string};
    const fresh = !w.__vvSid;
    w.__vvSid ??= Math.random().toString(36).slice(2);
    return {sid: w.__vvSid, fresh};
  }
}

const send = (body: Record<string, unknown>) => {
  const payload = JSON.stringify(body);
  try {
    if (!navigator.sendBeacon?.('/api/visits', new Blob([payload], {type: 'text/plain'}))) throw 0;
  } catch {
    fetch('/api/visits', {method: 'POST', headers: {'content-type': 'text/plain'}, body: payload, keepalive: true, credentials: 'same-origin'}).catch(() => {});
  }
};

let lastPath = '';
export function trackView(path: string) {
  if (typeof window === 'undefined') return;
  if (!currentConsent()?.statistics) { lastPath = ''; return; }
  if (navigator.webdriver || path === lastPath) return;
  lastPath = path;
  const {sid, fresh} = session();
  if (!fresh) return send({type: 'view', sid, path});
  const q = new URLSearchParams(location.search);
  const width = Math.min(screen.width, screen.height);
  send({
    type: 'visit',
    sid,
    path,
    source: q.get('utm_source') ?? '',
    medium: q.get('utm_medium') ?? '',
    campaign: q.get('utm_campaign') ?? '',
    content: q.get('utm_content') ?? '',
    term: q.get('utm_term') ?? '',
    gclid: q.has('gclid') || q.has('gbraid') || q.has('wbraid'),
    fbclid: q.has('fbclid'),
    referrer: document.referrer,
    device: width < 600 ? 'mobile' : width < 1024 && navigator.maxTouchPoints > 0 ? 'tablet' : 'desktop',
    lang: navigator.language,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${screen.width}x${screen.height}`,
  });
}
