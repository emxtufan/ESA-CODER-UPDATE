// Cookie consent and the trackers it gates (set in the admin: Setări globale › Cookies & tracking).
// Like Cookiebot's prior blocking: no Google or Meta script is loaded before the visitor agrees, and only for the
// categories they agree to. Statistics = Google Analytics; marketing = Google Ads + Meta Pixel.
// With no tracker configured there is nothing to ask, so the banner never shows.
import {sourceData} from '@/lib/text';

export type Consent = {statistics: boolean; marketing: boolean};
const KEY = 'vv-consent';

// The IDs end up in script URLs: re-checked here too, whatever the admin stored.
const ID_RE = {ga: /^G-[A-Z0-9]{4,14}$/, ads: /^AW-[0-9]{6,14}$/, label: /^[A-Za-z0-9_-]{4,40}$/, pixel: /^[0-9]{10,20}$/};
export function trackers() {
  const t = (sourceData['settings/tracking'] ?? {}) as Record<string, string>;
  const ok = (v: string | undefined, re: RegExp) => (v && re.test(v) ? v : '');
  return {
    ga: ok(t['google-analytics-id'], ID_RE.ga),
    ads: ok(t['google-ads-id'], ID_RE.ads),
    adsLead: ok(t['google-ads-lead-label'], ID_RE.label),
    pixel: ok(t['meta-pixel-id'], ID_RE.pixel),
  };
}
/** Which consent categories exist, given the trackers that are set. */
export function categories() {
  const t = trackers();
  return {statistics: !!t.ga, marketing: !!(t.ads || t.pixel)};
}
export const needsConsent = () => {
  const c = categories();
  return c.statistics || c.marketing;
};

export function readConsent(): Consent | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {}
  if (raw === 'granted') return {statistics: true, marketing: true}; // choice saved by the old banner
  if (raw === 'denied') return {statistics: false, marketing: false};
  try {
    const v = JSON.parse(raw ?? '');
    return v && typeof v === 'object' ? {statistics: !!v.statistics, marketing: !!v.marketing} : null;
  } catch {
    return null;
  }
}

export function saveConsent(next: Consent) {
  const before = readConsent();
  try {
    localStorage.setItem(KEY, JSON.stringify({...next, at: new Date().toISOString()}));
  } catch {}
  // a script already running cannot be unloaded: withdrawing consent reloads the page without it
  if ((before?.statistics && !next.statistics && loaded.google) || (before?.marketing && !next.marketing && (loaded.google || loaded.meta))) {
    location.reload();
    return;
  }
  applyConsent(next);
}

// Google Consent Mode v2 values for the gtag "consent" command.
export function consentState(c: Consent) {
  const g = (on: boolean) => (on ? 'granted' : 'denied');
  return {analytics_storage: g(c.statistics), ad_storage: g(c.marketing), ad_user_data: g(c.marketing), ad_personalization: g(c.marketing)};
}

type W = Window & {dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; fbq?: ((...args: unknown[]) => void) & Record<string, unknown>; _fbq?: unknown};
const loaded = {google: false, meta: false};
const script = (src: string) => {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
};

/** Loads (once) and configures what the given consent allows. Safe to call again after a new choice. */
export function applyConsent(c: Consent) {
  if (typeof window === 'undefined') return;
  const w = window as W;
  const t = trackers();
  const google = (c.statistics && t.ga) || (c.marketing && t.ads);
  if (google) {
    if (!loaded.google) {
      w.dataLayer = w.dataLayer ?? [];
      w.gtag = function () {
        // gtag expects the arguments object itself
        w.dataLayer!.push(arguments);
      };
      w.gtag('consent', 'default', consentState({statistics: false, marketing: false}));
      w.gtag('js', new Date());
      // the container of a product the visitor allowed (never the Analytics one after "no" to statistics)
      script(`https://www.googletagmanager.com/gtag/js?id=${c.statistics && t.ga ? t.ga : t.ads}`);
      loaded.google = true;
    }
    w.gtag!('consent', 'update', consentState(c));
    if (c.statistics && t.ga) w.gtag!('config', t.ga);
    if (c.marketing && t.ads) w.gtag!('config', t.ads);
  }
  if (c.marketing && t.pixel && !loaded.meta) {
    // Meta's standard stub: queues calls until fbevents.js takes over
    const fbq: any = (...args: unknown[]) => (fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args));
    Object.assign(fbq, {queue: [], loaded: true, version: '2.0', push: fbq});
    w.fbq = w._fbq = fbq;
    script('https://connect.facebook.net/en_US/fbevents.js');
    w.fbq!('init', t.pixel);
    w.fbq!('track', 'PageView');
    loaded.meta = true;
    lastPixelPath = location.pathname;
  }
}

// Google Analytics 4 records SPA page changes itself (history events); the Meta Pixel needs a PageView per page.
let lastPixelPath = '';
export function trackPageView(path: string) {
  const w = window as W;
  if (loaded.meta && w.fbq && path !== lastPixelPath) {
    lastPixelPath = path;
    w.fbq('track', 'PageView');
  }
}

/** A contact request: a conversion for Google Ads and a Lead for Meta (only where consent allowed loading them). */
export function trackLead() {
  const w = window as W;
  const t = trackers();
  if (loaded.google && w.gtag) {
    w.gtag('event', 'generate_lead');
    if (t.ads && t.adsLead) w.gtag('event', 'conversion', {send_to: `${t.ads}/${t.adsLead}`});
  }
  if (loaded.meta && w.fbq) w.fbq('track', 'Lead');
}
