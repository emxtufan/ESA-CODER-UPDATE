// One-time, idempotent migration to the section-based content model.
//   node scripts/migrate-sections.mjs            (writes source_data.json, backup in data/)
//   node scripts/migrate-sections.mjs --dry      (prints a summary only)
//
// What it does (nothing visible changes; scripts/ssr-check.mjs proves it):
//   - tools        ← the 8 logos hardcoded in TechStack.tsx
//   - services     ← the 10 cards hardcoded in services/servicesData.ts
//   - marquee      ← the 4 phrases of the text band (4 separate text keys)
//   - plans        ← the 3 pricing cards (texts + prices that were hardcoded in Pricing.tsx)
//   - published    ← `true` on every record of the collections that can be hidden
//   - global/Site  ← the contact e-mail, stored 3× (Header, Footer ×2) until now
//   - Header       ← the two identical "Let's connect" links become one `cta-link`
// The text keys that moved into collections are removed from their scope, so there is one source only.
import {copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const file = path.join(root, 'source_data.json');
const dry = process.argv.includes('--dry');
const data = JSON.parse(readFileSync(file, 'utf8'));
const col = (data._collections ??= {});
const log = [];

const take = (scope, key) => {
  const v = data[scope]?.[key];
  if (v === undefined) throw new Error(`missing text ${scope} → ${key}`);
  delete data[scope][key];
  return v;
};
// same function the site used for the card links (src/lib/slugify.ts: "&" → "and")
const slugify = (s) =>
  s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// --- tools ------------------------------------------------------------------
if (!col.tools) {
  const T = 'components/sections/TechStack';
  const logos = [
    ['wix-studio', '/tech/wix-studio.webp', 720], ['notion', '/tech/notion.webp', 348], ['figma', '/tech/figma.webp', 433],
    ['adobe', '/tech/adobe.webp', 455], ['claude', '/tech/claude.svg', 550], ['framer', '/tech/framer.svg', 446],
    ['blender', '/tech/blender.webp', 447], ['google-analytics', '/tech/analytics.webp', 489],
  ];
  col.tools = logos.map(([key, logo, w]) => ({name: take(T, key), logo, w, published: true}));
  log.push('tools: 8');
}

// --- services -----------------------------------------------------------------
if (!col.services) {
  const src = readFileSync(path.join(root, 'src/components/services/servicesData.ts'), 'utf8');
  const t = data['components/services/servicesData'];
  const $t = (k) => {
    if (typeof t?.[k] !== 'string') throw new Error(`missing servicesData text ${k}`);
    return t[k];
  };
  const body = src.slice(src.indexOf('export const SERVICES'));
  const list = new Function('$t', body.replace('export const SERVICES =', 'return ').replace(/;\s*$/, ';'))($t);
  col.services = list.map((s) => ({
    title: s.label[0],
    subtitle: s.label[1],
    href: `/services/${slugify(s.label.join(' '))}`,
    icon: '',
    viewBox: s.viewBox,
    paths: s.paths,
    published: true,
  }));
  delete data['components/services/servicesData'];
  log.push(`services: ${col.services.length}`);
}

// --- marquee --------------------------------------------------------------------
if (!col.marquee) {
  const M = 'components/sections/Marquee';
  col.marquee = ['ui-ux-design', 'brand-identity', 'code-customization', 'website-design-development'].map((k) => ({text: take(M, k), published: true}));
  log.push('marquee: 4');
}

// --- plans ----------------------------------------------------------------------
if (!col.plans) {
  const P = 'components/sections/Pricing';
  const plan = (name, price, desc, feats, cta, det) => ({
    name: take(P, name[0]),
    priceUsd: price[0],
    priceInr: price[1],
    description: take(P, desc),
    features: feats.map((k) => take(P, k)),
    ctaLink: take(P, cta),
    detailsLink: take(P, det),
    published: true,
  });
  col.plans = [
    plan(['business-website'], ['800', '20,000'], 'the-full-presence-three-core-pages',
      ['3-core-pages-custom-design', 'cms-for-your-own-updates', 'animation-and-interactions', 'basic-seo-setup'], 'start-a-project-link', 'details-link'),
    plan(['ecommerce-store'], ['1,500', '50,000'], 'a-complete-store-catalogue-cart-and',
      ['product-cart-and-checkout-pages', 'payment-and-shipping-integration', 'store-management-dashboard', 'mobile-first-shopping-experience'], 'start-a-project-2-link', 'details-2-link'),
    plan(['custom-build'], ['3,000', '1,00,000'], 'larger-platforms-and-long-running-partnerships',
      ['discovery-and-scoping-first', 'multi-collection-cms-architecture', 'advanced-motion-and-interaction', 'maintenance-and-support-plans'], 'start-a-project-3-link', 'details-3-link'),
  ];
  log.push('plans: 3');
}

// --- published flag ---------------------------------------------------------------
for (const name of ['projects', 'testimonials', 'faqs', 'tools', 'services', 'marquee', 'plans']) {
  let n = 0;
  for (const item of col[name] ?? []) if (item.published === undefined) (item.published = true), n++;
  if (n) log.push(`published: ${name} +${n}`);
}

// --- global contact e-mail ---------------------------------------------------------
if (!data['global/Site']) {
  const email = data['components/layout/Footer']['email-address'];
  if (data['components/layout/Header']['contact-visuvate-com'] !== email) throw new Error('Header and Footer e-mails differ — check by hand');
  if (data['components/layout/Footer']['email-contact-visuvate-com'] !== `Email: ${email}`) throw new Error('Footer e-mail label is not "Email: <address>"');
  data['global/Site'] = {email};
  delete data['components/layout/Header']['contact-visuvate-com'];
  delete data['components/layout/Footer']['email-address'];
  delete data['components/layout/Footer']['email-contact-visuvate-com'];
  data['components/layout/Footer']['email-prefix'] = 'Email: ';
  log.push('global/Site: email');
}

// --- header CTA link --------------------------------------------------------------
const H = data['components/layout/Header'];
if ('let-s-connect-link' in H) {
  if (H['let-s-connect-link'] !== H['connect-link']) throw new Error('Header CTA links differ — check by hand');
  H['cta-link'] = H['let-s-connect-link'];
  delete H['let-s-connect-link'];
  delete H['connect-link'];
  log.push('header: cta-link');
}

console.log(log.length ? log.join('\n') : 'already migrated');
if (dry || !log.length) process.exit(0);

mkdirSync(path.join(root, 'data'), {recursive: true});
const backup = path.join(root, 'data', 'source_data.before-sections.json');
if (!existsSync(backup)) copyFileSync(file, backup);
const tmp = `${file}.${process.pid}.tmp`;
writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n');
renameSync(tmp, file);
console.log('source_data.json updated (backup: data/source_data.before-sections.json)');
