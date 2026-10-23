// Per-page <head> for crawlers and link previews: title, description, canonical, Open Graph,
// Twitter card and JSON-LD, all built from the current source_data.json and the page's own
// server-rendered HTML (so nothing here can drift from what visitors see). Also robots.txt
// and sitemap.xml.
export const SITE = (typeof window === 'undefined'
  ? process.env.SITE_URL || 'https://esa-coder-solutions.com'
  : new URL(document.querySelector('link[rel="canonical"]')?.href || 'https://esa-coder-solutions.com').origin
).replace(/\/+$/, '');

// Pages that exist for visitors but have no value in search results.
const NOINDEX = new Set(['/contact/thank-you']);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ENTITIES = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'", '#x27': "'"};
export const plain = (html) =>
  html
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ')
    // inline tags split words in the markup only (e.g. letters wrapped for an animation)
    .replace(/<\/?(span|a|em|strong|b|i|u|small|sup|sub|mark|code)\b[^>]*>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#?\w+);/g, (m, e) => ENTITIES[e] ?? m)
    .replace(/\s+/g, ' ')
    .replace(/ ([.,;:!?…])/g, '$1')
    .trim();
const clip = (s, n = 160) => {
  s = plain(s);
  if (s.length <= n) return s;
  const cut = s.slice(0, n - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:.–-]+$/, '') + '…';
};
const abs = (url) => (!url ? '' : /^https?:\/\//.test(url) ? url : SITE + (url.startsWith('/') ? url : '/' + url));
const brandless = (title) => String(title || '').split(/\s+[|·]\s+/)[0].trim();

function find(data, name, field, value) {
  return (data._collections?.[name] ?? []).find((item) => item?.published !== false && item?.[field] === value);
}

// The <main> part of the rendered page (header and footer are the same everywhere).
function mainOf(html) {
  const start = html.indexOf('id="vv-main"');
  const end = html.lastIndexOf('<footer');
  return start >= 0 ? html.slice(start, end > start ? end : undefined) : html;
}
const firstH1 = (html) => plain(html.match(/<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/)?.[1] ?? '');
// First real paragraph of the page: the visible intro, used when nothing better is set.
function firstParagraph(html) {
  for (const m of html.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/g)) {
    const t = plain(m[1]);
    if (t.length >= 70) return t;
  }
  return '';
}
const isoDate = (v) => {
  const d = v && new Date(v);
  return d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : undefined;
};

function organization(seo, plans) {
  const sameAs = String(seo['social-links'] || '')
    .split(/\s+/)
    .filter((u) => /^https:\/\/\S+$/.test(u));
  const org = {
    '@type': 'ProfessionalService',
    '@id': `${SITE}/#organization`,
    name: seo['company-name'] || 'ESA Coder Solutions',
    legalName: seo['legal-name'] || undefined,
    taxID: seo['company-cui'] || undefined,
    identifier: seo['company-reg'] || undefined,
    url: `${SITE}/`,
    logo: `${SITE}/icon.png`,
    image: abs(seo['og-image'] || '/social-card.jpg'),
    description: seo['company-description'] || undefined,
    email: seo['company-email'] || undefined,
    telephone: seo['company-phone'] || undefined,
    address: seo['company-address'] ? {'@type': 'PostalAddress', streetAddress: seo['company-address'], addressCountry: 'RO'} : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  };
  // Pricing plans as shown on the home page (admin → Pricing), in lei.
  if (plans?.length)
    org.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: 'Servicii de dezvoltare web',
      itemListElement: plans.map((p) => ({
        '@type': 'Offer',
        name: p.name,
        description: p.description || undefined,
        priceSpecification: Number(String(p.price).replace(/\D/g, ''))
          ? {'@type': 'PriceSpecification', minPrice: Number(String(p.price).replace(/\D/g, '')), priceCurrency: 'RON'}
          : undefined,
      })),
    };
  return org;
}

/** Everything the <head> needs for one URL. `known` = the URL is a real page (200). */
export function pageMeta(pathname, data, html, known) {
  const seo = data['settings/seo'] ?? {};
  const main = mainOf(html);
  const h1 = firstH1(main);
  const url = SITE + (pathname === '/' ? '/' : pathname);
  let title = data[pathname]?.['meta-title'];
  let description = data[pathname]?.['meta-description'] || '';
  let image = '';
  let pageType = 'WebPage';
  let ogType = 'website';
  const graph = [];
  const crumbs = [];
  let m;

  if (!known) {
    return {
      title: data['404']?.['meta-title'] || `Pagina nu există | ${seo['company-name'] || 'ESA Coder Solutions'}`,
      description: '',
      robots: 'noindex, follow',
      jsonLd: [],
      url: '',
      image: abs(seo['og-image'] || '/social-card.jpg'),
      ogType,
      seo,
    };
  }

  if ((m = pathname.match(/^\/works\/([^/]+)$/))) {
    const item = find(data, 'projects', 'slug', decodeURIComponent(m[1]));
    title = item?.metaTitle;
    description = item?.overview || '';
    image = item?.image;
    crumbs.push(['/works', data['/works']?.['meta-title']], [pathname, item?.title]);
    if (item)
      graph.push({
        '@type': 'CreativeWork',
        '@id': `${url}#work`,
        name: item.title,
        description: item.overview ? clip(item.overview, 300) : undefined,
        image: abs(item.image),
        url: item.url || undefined,
        genre: item.category || undefined,
        creator: {'@id': `${SITE}/#organization`},
      });
  } else if ((m = pathname.match(/^\/blog\/category\/([^/]+)$/))) {
    const cat = find(data, 'postCategories', 'key', decodeURIComponent(m[1]));
    title = cat?.metaTitle;
    description = cat?.description || '';
    pageType = 'CollectionPage';
    crumbs.push(['/blog', data['/blog']?.['meta-title']], [pathname, cat?.label]);
  } else if ((m = pathname.match(/^\/blog\/([^/]+)$/))) {
    const post = find(data, 'posts', 'slug', decodeURIComponent(m[1]));
    title = post?.metaTitle;
    description = post?.excerpt || '';
    image = post?.image;
    ogType = 'article';
    crumbs.push(['/blog', data['/blog']?.['meta-title']], [pathname, post?.title]);
    if (post)
      graph.push({
        '@type': 'BlogPosting',
        '@id': `${url}#article`,
        headline: post.title,
        description: post.excerpt ? clip(post.excerpt, 300) : undefined,
        image: post.image ? abs(post.image) : undefined,
        datePublished: isoDate(post.date),
        author: {'@id': `${SITE}/#organization`},
        publisher: {'@id': `${SITE}/#organization`},
        mainEntityOfPage: {'@id': `${url}#webpage`},
        inLanguage: 'ro',
      });
  } else if (pathname.startsWith('/services/')) {
    crumbs.push(['/services', data['/services']?.['meta-title']], [pathname, h1 || brandless(title)]);
    graph.push({
      '@type': 'Service',
      '@id': `${url}#service`,
      name: h1 || brandless(title),
      description: undefined, // filled below once the description is known
      provider: {'@id': `${SITE}/#organization`},
      url,
    });
  } else if (pathname !== '/') {
    crumbs.push([pathname, h1 || brandless(title)]);
    if (pathname === '/contact') pageType = 'ContactPage';
    if (pathname === '/about-us') pageType = 'AboutPage';
    if (['/works', '/blog', '/services'].includes(pathname)) pageType = 'CollectionPage';
  }

  if (pathname === '/') description = description || seo['company-description'] || '';
  description = clip(description || firstParagraph(main) || seo['company-description'] || '');
  title = title || (h1 ? `${h1} | ${seo['company-name'] || 'ESA Coder Solutions'}` : seo['company-name'] || 'ESA Coder Solutions');
  const service = graph.find((g) => g['@type'] === 'Service');
  if (service) service.description = description || undefined;

  if (pathname === '/') {
    graph.push(organization(seo, data._collections?.plans?.filter((p) => p?.published !== false)), {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: `${SITE}/`,
      name: seo['company-name'] || 'ESA Coder Solutions',
      description: seo['company-description'] || undefined,
      inLanguage: 'ro',
      publisher: {'@id': `${SITE}/#organization`},
    });
  }
  graph.push({
    '@type': pageType,
    '@id': `${url}#webpage`,
    url,
    name: title,
    description: description || undefined,
    inLanguage: 'ro',
    isPartOf: {'@id': `${SITE}/#website`},
    about: pathname === '/' ? {'@id': `${SITE}/#organization`} : undefined,
    breadcrumb: crumbs.length ? {'@id': `${url}#breadcrumb`} : undefined,
    primaryImageOfPage: image ? {'@type': 'ImageObject', url: abs(image)} : undefined,
  });
  if (crumbs.length)
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [['/', 'Acasă'], ...crumbs].map(([href, name], i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: brandless(name) || href,
        item: SITE + (href === '/' ? '/' : href),
      })),
    });

  return {
    title,
    description,
    robots: NOINDEX.has(pathname) ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1',
    url,
    image: abs(image || seo['og-image'] || '/social-card.jpg'),
    imageIsDefault: !image,
    ogType,
    jsonLd: [{'@context': 'https://schema.org', '@graph': graph}],
    seo,
  };
}

export function headTags(meta) {
  const site = meta.seo['company-name'] || 'ESA Coder Solutions';
  const t = [
    `<title>${esc(meta.title)}</title>`,
    meta.description && `<meta name="description" content="${esc(meta.description)}"/>`,
    `<meta name="robots" content="${meta.robots}"/>`,
    meta.url && `<link rel="canonical" href="${esc(meta.url)}"/>`,
    `<meta property="og:site_name" content="${esc(site)}"/>`,
    `<meta property="og:locale" content="ro_RO"/>`,
    `<meta property="og:type" content="${meta.ogType}"/>`,
    `<meta property="og:title" content="${esc(meta.title)}"/>`,
    meta.description && `<meta property="og:description" content="${esc(meta.description)}"/>`,
    meta.url && `<meta property="og:url" content="${esc(meta.url)}"/>`,
    `<meta property="og:image" content="${esc(meta.image)}"/>`,
    meta.imageIsDefault && `<meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/>`,
    `<meta property="og:image:alt" content="${esc(meta.title)}"/>`,
    `<meta name="twitter:card" content="summary_large_image"/>`,
    `<meta name="twitter:title" content="${esc(meta.title)}"/>`,
    meta.description && `<meta name="twitter:description" content="${esc(meta.description)}"/>`,
    `<meta name="twitter:image" content="${esc(meta.image)}"/>`,
    meta.seo['google-site-verification'] && `<meta name="google-site-verification" content="${esc(meta.seo['google-site-verification'])}"/>`,
    meta.seo['bing-site-verification'] && `<meta name="msvalidate.01" content="${esc(meta.seo['bing-site-verification'])}"/>`,
    ...meta.jsonLd.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`),
  ];
  return t.filter(Boolean).join('\n    ');
}

// Every public, indexable URL: static pages from the build plus published collection items.
export function sitemapUrls(staticRoutes, data) {
  const c = data._collections ?? {};
  const live = (list) => (list ?? []).filter((i) => i?.published !== false);
  return [
    ...[...staticRoutes].filter((p) => !NOINDEX.has(p) && p !== '/privacy-policy').map((p) => ({loc: p})),
    ...live(c.projects).map((p) => ({loc: `/works/${p.slug}`})),
    ...live(c.postCategories).map((p) => ({loc: `/blog/category/${p.key}`})),
    ...live(c.posts).map((p) => ({loc: `/blog/${p.slug}`, lastmod: isoDate(p.date)})),
    ...live(c.pages).map((p) => ({loc: `/${p.slug}`})),
  ];
}

export function sitemapXml(urls) {
  const rows = urls.map(
    (u) => `  <url><loc>${esc(SITE + (u.loc === '/' ? '/' : encodeURI(u.loc)))}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
}

// Search engines and AI search/assistant crawlers are welcome on public pages (GPTBot included,
// per the owner); the admin and the API are not pages.
export function robotsTxt() {
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

# AI search and assistants (explicit, same rules as above)
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: GPTBot
User-agent: PerplexityBot
User-agent: ClaudeBot
User-agent: Claude-SearchBot
User-agent: Google-Extended
User-agent: Bingbot
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${SITE}/sitemap.xml
`;
}
