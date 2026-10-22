// Searchable documents built from source_data.json. Pure functions, no I/O: the same data always
// produces the same documents (ids come from slug/key/id/index), so the index can be rebuilt and
// compared. Collections without useful text (testimonials, marquee, countries) are left out.
import {createHash} from 'node:crypto';

// Blocks that never carry the text a visitor reads.
const DROP_RE = /<(script|style|noscript|svg|nav|header|footer|form|iframe|template)\b[^>]*>[\s\S]*?<\/\1>/gi;
const ENTITIES = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'", '#x27': "'"};
// Documents shorter than this are page furniture ("Trimite", "Vezi proiectul"), not knowledge.
const MIN_TEXT = 20;
// The project fields that describe the work (icons, images, refs and URLs are left out).
const PROJECT_FIELDS = ['title', 'category', 'platform', 'overview', 'brief', 'approach', 'outcome', 'about', 'pagesList', 'featuresList'];
const TOOLS_TITLE = 'Tehnologii folosite';
const SERVICES_TITLE = 'Servicii oferite de ESA Coder Solutions';
const PROJECTS_TITLE = 'Proiecte realizate (portofoliu)';
// Interface scopes (forms, cookie banners, header, 404): labels a visitor clicks, not knowledge.
const UI_SCOPE_RE = /ContactForm|CookieBanner|CookieSettings|Header|NotFound|^404$|PageTransition/;
// The contact document: one place with phone, email and the company line.
const CONTACT_TITLE = 'Date de contact ESA Coder Solutions (telefon, email, adresă, firmă)';
const CONTACT_SCOPES = ['components/layout/Footer', '/contact'];
const COMPANY_KEYS = ['company-phone', 'company-email', 'company-address'];
const PHONE_LABEL_RE = /^telefon\s*:\s*/i;
const PHONE_FORM_RE = /(\+?40|0)7\d{2}[\s.]?\d{3}[\s.]?\d{3}/;
const PHONE_FULL_RE = /^\+?\d{9,13}$/;
const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;

// Text that reads like an instruction for the model, not like knowledge. Chunks that match are
// flagged at indexing time and never retrieved, so a source can't steer the assistant.
export const INJECTION_RE = /\b(ignor(ă|a|e)\w*\s+(toate\s+)?(instruc[tț]iunile|regulile|indica[tț]iile)|ignore\s+(all\s+|any\s+|the\s+)?(previous\s+|prior\s+|above\s+)?(instructions|rules)|disregard\s+(the\s+)?(previous|above|system)|system\s+prompt|prompt(ul)?\s+de\s+sistem|you\s+are\s+now|e[sș]ti\s+acum|act\s+as|jailbreak|developer\s+mode)/i;

/** True when a text carries an instruction aimed at the model, with or without diacritics. */
export function looksLikeInjection(text) {
  const raw = String(text ?? '');
  if (INJECTION_RE.test(raw)) return true;
  return INJECTION_RE.test(raw.normalize('NFD').replace(/\p{M}+/gu, ''));
}

/** Every public document of the site: collections plus the admin text scopes. */
export function siteDocuments(data) {
  const collections = data?._collections ?? {};
  const docs = [];
  const add = (kind, key, title, url, text) => {
    const body = normalize(text);
    if (!key || body.length < MIN_TEXT) return;
    docs.push({id: `site:${kind}:${key}`, kind, title: normalize(title || key), url: url || '', text: body});
  };
  const list = (name) => (Array.isArray(collections[name]) ? collections[name].filter((item) => item?.published !== false) : []);

  for (const item of list('projects')) {
    if (!item?.slug) continue;
    add('project', item.slug, item.title, `/works/${item.slug}`, PROJECT_FIELDS.map((field) => fieldText(item[field])).filter(Boolean).join('\n'));
  }
  const projects = list('projects').filter((item) => item?.slug && item?.title);
  if (projects.length) {
    docs.push({
      id: 'site:overview:projects',
      kind: 'project',
      title: PROJECTS_TITLE,
      url: '/works',
      text: 'Proiecte realizate:\n' + projects.map((item) => `- ${normalize(item.title)}${item.category ? ' — ' + normalize(item.category) : ''}${item.platform ? ' (' + normalize(item.platform) + ')' : ''}: /works/${item.slug}`).join('\n'),
    });
  }
  const posts = list('posts').filter((item) => item?.slug && item?.title);
  if (posts.length) {
    docs.push({
      id: 'site:overview:posts',
      kind: 'post',
      title: 'Blog: articole publicate',
      url: '/blog',
      text: 'Blogul ESA Coder Solutions are articole despre:\n' + posts.map((item) => `- ${normalize(item.title)}: /blog/${item.slug}`).join('\n'),
    });
  }
  for (const item of list('posts')) {
    if (!item?.slug) continue;
    const body = htmlToText(item.html) || normalize(item.excerpt);
    add('post', item.slug, item.title, `/blog/${item.slug}`, body);
  }
  for (const item of list('postCategories')) {
    if (!item?.key) continue;
    add('category', item.key, item.label, `/blog/category/${item.key}`, [item.label, item.description].filter(Boolean).join('. '));
  }
  for (const item of list('pages')) {
    if (!item?.slug) continue;
    add('page', item.slug, item.title, `/${item.slug}`, [normalize(item.intro), htmlToText(item.body)].filter(Boolean).join('\n'));
  }
  list('faqs').forEach((item, index) => {
    const question = normalize(item?.question);
    const answer = htmlToText(item?.answer) || normalize(item?.answer);
    if (!question) return;
    add('faq', index + 1, question, '', `Întrebare: ${question}\nRăspuns: ${answer}`);
  });
  for (const plan of list('plans')) {
    if (!plan?.id) continue;
    add('plan', plan.id, plan.name || plan.id, '', planText(plan));
  }
  for (const item of list('services')) {
    const label = [normalize(item?.title), normalize(item?.subtitle)].filter(Boolean).join(' ');
    const key = item?.href || label;
    if (!key) continue;
    add('service', key.replace(/^\/+/, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/-+$/, ''), label, item.href || '', label);
  }
  const services = list('services').filter((item) => item?.title);
  if (services.length) {
    docs.push({
      id: 'site:overview:services',
      kind: 'service',
      title: SERVICES_TITLE,
      url: '/services',
      text: 'Servicii oferite:\n' + services.map((item) => `- ${[normalize(item.title), normalize(item.subtitle)].filter(Boolean).join(' ')}${item.href ? ' (' + item.href + ')' : ''}`).join('\n'),
    });
  }
  const tools = list('tools').map((item) => normalize(item?.name)).filter(Boolean);
  if (tools.length) add('text', 'tools', TOOLS_TITLE, '', tools.join(', '));

  for (const [scope, value] of Object.entries(data ?? {})) {
    if (scope.startsWith('_') || UI_SCOPE_RE.test(scope)) continue;
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    add('page', scopeKey(scope), scopeTitle(value) || scope, scope.startsWith('/') ? scope : '', scopeText(value));
  }
  const contact = contactText(data ?? {});
  if (contact) add('contact', 'main', CONTACT_TITLE, '/contact', contact);
  return docs;
}

/** Readable text of an HTML fragment: dropped blocks, line breaks kept, tags and entities removed. */
export function htmlToText(html) {
  return normalize(
    String(html ?? '')
      .replace(DROP_RE, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|li|h[1-6]|div|blockquote|tr)\s*>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&#x([0-9a-f]+);/gi, (m, hex) => codePoint(parseInt(hex, 16), m))
      .replace(/&#(\d+);/g, (m, digits) => codePoint(parseInt(digits, 10), m))
      .replace(/&(#?\w+);/g, (m, entity) => ENTITIES[entity.toLowerCase()] ?? m),
  );
}

/** The <title> of a page, or ''. */
export function titleOf(html) {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(String(html ?? ''));
  return match ? htmlToText(match[1]) : '';
}

// Longest suffix first, so "planurilor" loses "urilor" and not "ilor".
const SUFFIXES = ['urilor', 'ilor', 'elor', 'ului', 'uri', 'ele', 'ile', 'ul', 'ii', 'ei', 'le', 'a', 'e', 'i', 'u'];

const ABBREV = {
  tel: 'telefon', tlf: 'telefon', nr: 'numar', mail: 'email', 'e-mail': 'email', mobil: 'telefon', whatsapp: 'telefon',
};

// ponytail: naive Romanian suffix stemmer; swap for a real stemmer if recall suffers
function stem(term) {
  for (const suffix of SUFFIXES) {
    if (!term.endsWith(suffix)) continue;
    const root = term.slice(0, -suffix.length);
    return root.length >= 3 ? root : term;
  }
  return term;
}

/** Search terms of a text: lowercase, no diacritics, no punctuation, no stopwords, min 2 chars, stemmed. */
export function tokenize(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .split(/[^\p{L}\p{N}]+/u)
    .map((term) => ABBREV[term] ?? term)
    .filter((term) => term.length >= 2 && !STOPWORDS.has(term))
    .map(stem);
}

/** Splits a text into chunks of ~`size` chars, each starting with the tail of the previous one. */
export function chunkText(text, size = 900, overlap = 120) {
  const max = Math.max(1, Number(size) || 900);
  const units = [];
  for (const paragraph of normalize(String(text ?? '')).split(/\n+/)) {
    const block = paragraph.trim();
    if (!block) continue;
    if (block.length <= max) {
      units.push(block);
      continue;
    }
    for (const sentence of block.split(/(?<=[.!?…])\s+/u)) {
      const line = sentence.trim();
      if (line) units.push(...cutToSize(line, max));
    }
  }
  const raw = [];
  let current = '';
  for (const unit of units) {
    if (current && current.length + 1 + unit.length > max) {
      raw.push(current);
      current = unit;
    } else {
      current = current ? `${current}\n${unit}` : unit;
    }
  }
  if (current) raw.push(current);
  const step = Math.max(0, Number(overlap) || 0);
  if (!step) return raw;
  return raw.map((chunk, index) => {
    if (!index) return chunk;
    const tail = tailOf(raw[index - 1], step);
    return tail ? `${tail}\n${chunk}` : chunk;
  });
}

/** sha256 of the parts joined with a NUL, so the parts can never run into each other. */
export function hashOf(...parts) {
  return createHash('sha256')
    .update(parts.map((part) => String(part ?? '')).join('\u0000'))
    .digest('hex');
}

const STOPWORDS = new Set([
  'si', 'sau', 'de', 'la', 'in', 'cu', 'pe', 'pentru', 'din', 'un', 'o', 'ce', 'care', 'este', 'sunt',
  'a', 'al', 'ai', 'ale', 'lui', 'lor', 'se', 'sa', 'nu', 'mai', 'ca', 'fie', 'fost', 'prin', 'intre',
  'despre', 'dupa', 'pana', 'cel', 'cea', 'cei', 'cele', 'dar', 'iar', 'deci', 'ori', 'sub', 'peste',
  'langa', 'fara', 'spre', 'catre', 'acest', 'aceasta', 'aceste', 'cand', 'cum', 'unde', 'asa',
  'cat', 'cata', 'cate', 'cati', 'va', 'pot', 'poate', 'puteti', 'aveti', 'imi', 'mi', 'ma', 'noi',
  'voi', 'eu', 'tu', 'vreau', 'ati', 'foarte',
  'acel', 'acea', 'aceea', 'acela', 'aia', 'ala', 'asta', 'ast', 'am', 'avem', 'da', 'inseamna',
  'the', 'and', 'or', 'of', 'to', 'is', 'are', 'for', 'with', 'on', 'it', 'this', 'that', 'be', 'as',
  'at', 'by', 'an', 'from', 'we', 'you', 'your', 'our', 'can', 'will', 'not', 'have', 'has', 'was',
  'but', 'they', 'their', 'its', 'if', 'so', 'do', 'does', 'more', 'than', 'my', 'how', 'what', 'i',
]);

// One line per paragraph, never more than two blank-free newlines in a row.
function normalize(text) {
  return String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\f\v\u00a0]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function codePoint(number, fallback) {
  try {
    return String.fromCodePoint(number);
  } catch {
    return fallback;
  }
}

// A field of a collection item: plain text or HTML for strings, the titles for lists.
function fieldText(value) {
  if (typeof value === 'string') return /<[a-z/!]/i.test(value) ? htmlToText(value) : normalize(value);
  if (!Array.isArray(value)) return '';
  return value
    .map((entry) => fieldText(typeof entry === 'string' ? entry : entry?.title ?? entry?.text ?? entry?.label ?? ''))
    .filter(Boolean)
    .join('\n');
}

// "Plan Business: preț 4.990 lei (one-time). Infrastructură: 25 €/monthly. …"
function planText(plan) {
  const parts = [];
  const head = `Plan ${normalize(plan.name)}:`;
  const price = [normalize(plan.price), normalize(plan.currency)].filter(Boolean).join(' ');
  const type = normalize(plan.priceType);
  parts.push(`${head}${price ? ` preț ${price}` : ''}${type ? ` (${type})` : ''}.`);
  const infra = [normalize(plan.infraPrice), normalize(plan.infraCurrency) + (plan.infraFrequency ? `/${normalize(plan.infraFrequency)}` : '')]
    .filter(Boolean)
    .join(' ');
  if (infra) parts.push(`Infrastructură: ${infra}.`);
  const description = sentence(plan.description);
  if (description) parts.push(description);
  const features = (Array.isArray(plan.features) ? plan.features : []).map(normalize).filter(Boolean);
  if (features.length) parts.push(`Include: ${features.join('; ')}.`);
  const missing = (Array.isArray(plan.notIncluded) ? plan.notIncluded : []).map(normalize).filter(Boolean);
  if (missing.length) parts.push(`Nu include: ${missing.join('; ')}.`);
  return parts.join(' ');
}

// Ends the sentence with a period unless it already carries punctuation.
function sentence(value) {
  const text = normalize(value);
  if (!text) return '';
  return /[.!?…:]$/.test(text) ? text : `${text}.`;
}

// A text scope ("/services/crafted-websites", "components/layout/Footer", "404").
function scopeTitle(fields) {
  return normalize(fields['meta-title'] || fields.title);
}

function scopeKey(scope) {
  return scope === '/' ? 'home' : scope.replace(/^\/+/, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
}

// Every useful string of a scope, recursively, without the SEO keys and the page furniture.
function scopeText(scope) {
  const values = [];
  walkText(scope, values);
  return values.join('\n');
}

function walkText(value, values) {
  if (typeof value === 'string') {
    const text = usefulValue(value);
    if (text) values.push(text);
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) walkText(entry, values);
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) if (!key.startsWith('meta-')) walkText(entry, values);
  }
}

const URL_RE = /^(?:https?:\/\/|\/|[a-z0-9-]+\.(?:ro|com|net|org)\b)/i;
const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const NUMBER_RE = /^-?\d+(?:[.,]\d+)?$/;

// Drops paths, URLs, colors, bare numbers and labels too short to mean anything on their own.
function usefulValue(value) {
  const text = normalize(typeof value === 'string' && /<[a-z/!]/i.test(value) ? htmlToText(value) : value);
  if (!text) return '';
  if (URL_RE.test(text) || HEX_RE.test(text) || NUMBER_RE.test(text)) return '';
  const words = text.split(/\s+/);
  if (words.length < 3 && !/\d/.test(text)) return '';
  return text;
}

// The contact document: phones, emails and the company line, taken from the footer, the contact
// page, data.seo and every scope that holds company-phone / company-email. Empty when neither a
// phone nor an email is found.
function contactText(data) {
  const pairs = [];
  for (const scope of CONTACT_SCOPES) walkPairs(data?.[scope], pairs);
  walkPairs(data?.seo, pairs);
  for (const value of Object.values(data ?? {})) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    for (const key of COMPANY_KEYS) if (typeof value[key] === 'string') pairs.push([key, value[key]]);
  }

  const phones = [];
  const numbers = new Map();
  const emails = [];
  const seenEmails = new Set();
  let companyLine = '';
  let fallbackLine = '';
  let address = '';
  for (const [key, value] of pairs) {
    const text = normalize(value);
    if (!text) continue;
    if (key === 'company-address') {
      if (!address) address = text;
      continue;
    }
    const phone = phoneOf(text);
    if (phone) {
      const number = phoneKey(phone);
      const known = numbers.get(number);
      if (!known) {
        const entry = {text: phone};
        numbers.set(number, entry);
        phones.push(entry);
      } else if (!known.text.includes(phone)) {
        known.text = `${known.text} (${phone})`;
      }
    }
    for (const email of text.match(EMAIL_RE) ?? []) {
      const lower = email.toLowerCase();
      if (seenEmails.has(lower)) continue;
      seenEmails.add(lower);
      emails.push(email);
    }
    if (!/S\.R\.L\.|CUI/.test(text)) continue;
    if (key === 'company-line') companyLine = text;
    else if (!fallbackLine) fallbackLine = text;
  }
  if (!phones.length && !emails.length) return '';

  const parts = [];
  if (phones.length) parts.push(`Număr de telefon de contact: ${phones.map((entry) => entry.text).join(' / ')}.`);
  if (emails.length) parts.push(`Email de contact: ${emails.join(', ')}.`);
  const line = companyLine || fallbackLine;
  if (line) parts.push(`Date firmă: ${line}.`);
  if (address) parts.push(`Adresa sediului: ${address}.`);
  parts.push('Pagina de contact: /contact.');
  return parts.join('\n');
}

// Every string of a scope as a [key, value] pair, recursively.
function walkPairs(value, pairs, key = '') {
  if (typeof value === 'string') {
    pairs.push([key, value]);
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) walkPairs(entry, pairs, key);
    return;
  }
  if (value && typeof value === 'object') {
    for (const [name, entry] of Object.entries(value)) walkPairs(entry, pairs, name);
  }
}

// The phone number of a value ("Telefon: 0748 452 215"), or '' when the value is not a phone.
// Links are skipped: a WhatsApp URL carries the number but is not one.
function phoneOf(text) {
  if (URL_RE.test(text)) return '';
  const plain = text.replace(PHONE_LABEL_RE, '').trim();
  if (PHONE_FULL_RE.test(plain.replace(/[\s.]/g, ''))) return plain;
  const match = PHONE_FORM_RE.exec(plain);
  return match ? match[0].trim() : '';
}

// Phones are deduped by digits: "0748 452 215" and "+40748452215" are the same number.
function phoneKey(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.length > 10 ? digits.replace(/^0*40/, '') : digits.replace(/^0+/, '');
}

// A paragraph longer than the chunk size is cut at word boundaries.
function cutToSize(text, max) {
  const pieces = [];
  let rest = text;
  while (rest.length > max) {
    let at = rest.lastIndexOf(' ', max);
    if (at <= 0) at = max;
    pieces.push(rest.slice(0, at).trim());
    rest = rest.slice(at).trim();
  }
  if (rest) pieces.push(rest);
  return pieces.filter(Boolean);
}

// The last `size` chars of a chunk, started at a word boundary.
function tailOf(text, size) {
  if (text.length <= size) return text;
  const slice = text.slice(-size);
  const space = slice.search(/\s/);
  return (space >= 0 ? slice.slice(space + 1) : slice).trim();
}
