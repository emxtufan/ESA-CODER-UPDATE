import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import path from 'node:path';
import os from 'node:os';

const base = process.env.BLOG_TEST_URL || 'http://localhost:5000';
const data = JSON.parse(readFileSync('source_data.json', 'utf8'));
const posts = data._collections.posts.filter(item => item.published !== false);
const categories = data._collections.postCategories.filter(item => item.published !== false);
assert.ok(posts.length >= 10);
assert.equal(new Set(posts.map(post => post.slug)).size, posts.length);
const sitemap = await (await fetch(base + '/sitemap.xml')).text();
for (const post of posts) {
  assert.ok(categories.some(category => category.key === post.category));
  assert.ok(sitemap.includes(`/blog/${post.slug}`));
  assert.ok(post.related.every(slug => slug !== post.slug && posts.some(item => item.slug === slug)));
  assert.equal((await fetch(base + post.image)).status, 200);
}
const browser = await chromium.launch({headless: true});
try {
  const page = await browser.newPage({viewport: {width: 1440, height: 900}, reducedMotion: 'reduce'});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const links = new Set();
  for (const width of [1440, 390]) {
    await page.setViewportSize({width, height: 900});
    await page.goto(base + '/blog');
    await page.locator('#boot').waitFor({state: 'hidden'});
    assert.equal(await page.locator('main [data-reveal]').count(), posts.length);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    if (width === 1440) {
      await page.getByRole('button', {name: /^Respinge/}).click();
      await page.screenshot({path: path.join(os.tmpdir(), 'esa-blog-desktop.png'), fullPage: true});
    }
    for (const post of posts) {
      const response = await page.goto(base + '/blog/' + post.slug);
      assert.equal(response.status(), 200);
      await page.locator('#boot').waitFor({state: 'hidden'});
      assert.equal(await page.locator('h1').innerText(), post.title);
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://esa-coder-solutions.com/blog/' + post.slug);
      assert.ok(await page.locator('meta[name="description"]').getAttribute('content'));
      assert.ok((await page.locator('article').innerText()).split(/\s+/).length >= 300);
      assert.ok(await page.locator('article h2').count() >= 4);
      assert.equal(await page.locator('main header img').evaluate(img => img.complete && img.naturalWidth > 0), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, post.slug);
      for (const href of await page.locator('article a[href^="/"], main a[href^="/blog/category/"]').evaluateAll(anchors => anchors.map(a => a.getAttribute('href')))) links.add(href);
    }
  }
  for (const category of categories) {
    await page.goto(base + '/blog/category/' + category.key);
    await page.locator('#boot').waitFor({state: 'hidden'});
    assert.equal(await page.locator('h1').innerText(), category.label);
    assert.equal(await page.locator('main [data-reveal]').count(), posts.filter(post => post.category === category.key).length);
  }
  for (const href of links) assert.equal((await fetch(base + href)).status, 200, href);
  assert.deepEqual(errors, []);
  console.log(`PASS: ${posts.length} articles, ${categories.length} categories, covers, related posts, sitemap, metadata, internal links, mobile/desktop, no JS errors`);
} finally {
  await browser.close();
}
