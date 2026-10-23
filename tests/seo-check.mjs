// Self-check of server/seo.mjs: per-page head, JSON-LD, sitemap and robots.txt.
// usage: node tests/seo-check.mjs
import assert from 'node:assert/strict';
import {SITE, headTags, pageMeta, plain, robotsTxt, sitemapUrls, sitemapXml} from '../server/seo.mjs';
import {fullItem, itemScript, liteData} from '../server/content.mjs';

const data = {
  '/': {'meta-title': 'ESA | Home'},
  '/services/web': {'meta-title': 'Site-uri | ESA'},
  'settings/seo': {'company-name': 'ESA', 'company-description': 'Descriere firmă.', 'social-links': 'https://x.com/esa\nnu-e-link'},
  _collections: {
    posts: [{slug: 'p1', title: 'Articol', metaTitle: 'Articol | ESA', excerpt: 'Rezumat <b>scurt</b>.', image: '/media/a.jpg', date: '2026-03-02'}],
    projects: [{slug: 'ascuns', published: false}],
    plans: [{name: 'Start', price: '2.490'}],
  },
};
const page = (h1, p) => `<header><svg><path d="M0"/></svg></header><main id="vv-main"><h1><span>Site</span><span>-uri</span></h1><p>${p}</p></main><footer>f</footer>`;

// plain text: inline tags do not split words, block tags do, entities decoded
assert.equal(plain('<h1><span>Tem</span><span>plate</span></h1><p>a &amp; b .</p>'), 'Template a & b.');

// a service page: description from its first real paragraph, canonical on the site, Service + breadcrumbs
const long = 'Construim site-uri de prezentare rapide, ușor de administrat și gândite pentru clienții tăi reali.';
const m = pageMeta('/services/web', data, page('', long), true);
assert.equal(m.title, 'Site-uri | ESA');
assert.equal(m.description, long);
assert.equal(m.url, `${SITE}/services/web`);
assert.match(m.robots, /^index/);
const types = m.jsonLd[0]['@graph'].map((g) => g['@type']);
assert.deepEqual(types, ['Service', 'WebPage', 'BreadcrumbList']);
assert.equal(m.jsonLd[0]['@graph'][2].itemListElement.at(-1).name, 'Site-uri');

// home: organization (only real social links) + website; no rating/review is ever invented
const home = pageMeta('/', data, page('', long), true);
const org = home.jsonLd[0]['@graph'].find((g) => g['@id'] === `${SITE}/#organization`);
assert.deepEqual(org.sameAs, ['https://x.com/esa']);
assert.equal(org.hasOfferCatalog.itemListElement[0].priceSpecification.minPrice, 2490);
assert.ok(!JSON.stringify(home.jsonLd).includes('aggregateRating'));

// blog post: its own title, excerpt, image and an article with a valid date
const post = pageMeta('/blog/p1', data, page('', ''), true);
assert.equal(post.description, 'Rezumat scurt.');
assert.equal(post.image, `${SITE}/media/a.jpg`);
assert.equal(post.ogType, 'article');
assert.equal(post.jsonLd[0]['@graph'][0].datePublished, '2026-03-02');

// unknown URL and the thank-you page are not indexable
assert.match(pageMeta('/nu-exista', data, '', false).robots, /^noindex/);
assert.match(pageMeta('/contact/thank-you', data, page('', long), true).robots, /^noindex/);

// head is escaped and JSON-LD cannot close its <script>
const tags = headTags({...m, title: 'A "B" <C>', jsonLd: [{x: '</script>'}]});
assert.ok(tags.includes('<title>A &quot;B&quot; &lt;C&gt;</title>'));
assert.ok(!tags.includes('</script></script>'));

// sitemap: static pages + published items only, never the thank-you page
const urls = sitemapUrls(new Set(['/', '/contact/thank-you', '/services/web']), data).map((u) => u.loc);
assert.deepEqual(urls, ['/', '/services/web', '/blog/p1']);
assert.ok(sitemapXml([{loc: '/blog/p1', lastmod: '2026-03-02'}]).includes(`<loc>${SITE}/blog/p1</loc><lastmod>2026-03-02</lastmod>`));

// robots: public pages open to search and AI crawlers, admin/api closed, sitemap listed
const robots = robotsTxt();
assert.match(robots, /User-agent: OAI-SearchBot/);
assert.match(robots, /Disallow: \/admin/);
assert.ok(robots.includes(`Sitemap: ${SITE}/sitemap.xml`));

// content.js without the long fields; the full record only for published items, inlined safely
const withHtml = {...data, _collections: {...data._collections, posts: [{...data._collections.posts[0], html: '<p>x</script>'}]}};
const lite = liteData(withHtml);
assert.equal(lite._collections.posts[0].html, undefined);
assert.equal(lite._collections.posts[0]._lite, true);
assert.equal(withHtml._collections.posts[0].html, '<p>x</script>', 'source data untouched');
assert.equal(fullItem(withHtml, 'projects', 'ascuns'), undefined);
assert.equal(fullItem(withHtml, 'plans', 'Start'), undefined);
const inlined = itemScript('/blog/p1', withHtml);
assert.ok(inlined.includes('"posts/p1"') && !inlined.slice(8, -9).includes('</'));
assert.equal(itemScript('/blog', withHtml), '');

console.log('seo-check: ok');
