// End-to-end test of the section-based admin + the public site, in a real browser.
//   npm i -D playwright            (once; uses your installed Chrome/Chromium)
//   ADMIN_PASSWORD=... node tests/admin-e2e.mjs [baseUrl]      (default http://localhost:5000)
// The test edits real content through the admin UI, checks the public site, and puts everything back
// (the final step proves it: every section's revision must equal the one from the start).
// Environment: CHROME_PATH=/path/to/chrome to use a specific browser binary.
import {chromium} from 'playwright';

const BASE = process.argv[2] || process.env.BASE_URL || 'http://localhost:5000';
const PASSWORD = process.env.ADMIN_PASSWORD;
if (!PASSWORD) {
  console.error('Set ADMIN_PASSWORD (the same one the server uses; or the contents of data/admin-password.txt).');
  process.exit(2);
}

const results = [];
const check = (name, ok, detail = '') => {
  results.push({name, ok});
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : detail ? '  → ' + detail : ''}`);
};
const section = async (name, fn) => {
  try {
    await fn();
  } catch (err) {
    check(`${name} (exception)`, false, String(err?.message ?? err).split("\n").slice(0,14).join(" | "));
  }
};

const browser = await chromium.launch({executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox']});
const context = await browser.newContext({viewport: {width: 1360, height: 900}});
const admin = await context.newPage();
const site = await context.newPage();

const problems = [];
for (const [label, page] of [['admin', admin], ['site', site]]) {
  page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    // 401 = the admin's own "am I logged in?" probe before login; failed asset loads are reported separately
    if (/status of 401|Failed to load resource/.test(text)) return;
    problems.push(`${label} console: ${text}`);
  });
}

// ---- helpers --------------------------------------------------------------------------------
const api = (path, init) =>
  admin.evaluate(async ([p, i]) => {
    const r = await fetch(p, {credentials: 'same-origin', ...i, headers: {'x-admin': '1', 'content-type': 'application/json', ...(i?.headers || {})}});
    return {status: r.status, body: await r.json().catch(() => null)};
  }, [path, init]);
const revs = async () => Object.fromEntries((await api('/api/admin/sections')).body.sections.map((s) => [s.key, s.rev]));
const openSection = async (key) => {
  await admin.click(`[data-section=${key}]`);
  await admin.waitForSelector(`[data-section=${key}].is-active`);
  await admin.waitForSelector('.a-bar-title h1');
};
const field = (label) => admin.locator('.a-field', {has: admin.locator('.a-field-label', {hasText: label})}).first();
const group = (title) => admin.locator(`.a-pair[aria-label="${title}"]`);
const save = async () => {
  await admin.click('[data-save]');
  await admin.waitForSelector('.a-toast:not(.is-error)', {timeout: 8000});
  await admin.waitForFunction(() => document.querySelector('[data-save]')?.textContent === 'Salvat');
};
const siteText = async (path, selector) => {
  await site.goto(BASE + path, {waitUntil: 'networkidle'});
  return site.locator(selector).allInnerTexts();
};
const status = async (path) => (await site.request.get(BASE + path)).status();

// ---- login ----------------------------------------------------------------------------------
await admin.goto(BASE + '/admin');
await admin.fill('input[type=password]', PASSWORD);
await admin.click('button.a-btn-primary');
await admin.waitForSelector('[data-section]');
const initial = await revs();
check('login + 12 sections in navigation', Object.keys(initial).length === 12 && (await admin.locator('[data-section]').count()) === 12);

// ---- 0. structure: Header and Footer exist exactly once, in Global settings ---------------------------
await section('structure', async () => {
  const labels = await admin.locator('[data-section]').allInnerTexts();
  check('Header and Footer appear once each in the navigation', labels.filter((l) => /^Header$/.test(l.trim())).length === 1 && labels.filter((l) => /^Footer$/.test(l.trim())).length === 1);
  await admin.goto(BASE + '/admin/advanced');
  await admin.waitForSelector('.a-nav-item');
  const text = (await admin.locator('.a-side').innerText());
  check('advanced editor no longer lists Header/Footer', !/\bHeader\b/.test(text) && !/^Footer$/m.test(text));
  await admin.goto(BASE + '/admin');
  await admin.waitForSelector('[data-section]');
});

// ---- 1. Header: one place, visible on the site -------------------------------------------------------
await section('header', async () => {
  await openSection('header');
  const row = group('2. Despre noi');
  await row.locator('input').first().fill('About Us TEST');
  await save();
  const labels = await siteText('/', 'header nav a');
  check('Header: edited label appears on the site', labels.some((t) => t.includes('About Us TEST')), labels.join('|'));
  const other = await siteText('/contact', 'header nav a');
  check('Header: same change on another page', other.some((t) => t.includes('About Us TEST')));
  await openSection('header');
  await group('2. Despre noi').locator('input').first().fill('About Us');
  await save();
});

// ---- 2. Footer: contact e-mail is one value, used by Footer and by the Header's mobile menu --------------
await section('footer', async () => {
  await openSection('footer');
  await field('E-mail').locator('input').fill('test@example.com');
  await save();
  await site.goto(BASE + '/', {waitUntil: 'networkidle'});
  const mails = await site.locator('a[href^="mailto:"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  check('Footer e-mail updates every use (Footer + Header)', mails.length >= 2 && mails.every((m) => m === 'mailto:test@example.com'), mails.join(','));
  await openSection('footer');
  await field('E-mail').locator('input').fill('contact@visuvate.com');
  await save();
});

// ---- 3. Hero title (rich *highlight*), persistence after refresh ---------------------------------------
await section('hero', async () => {
  await openSection('hero');
  const title = field('Titlu — rândul 1');
  const original = await title.locator('input').inputValue();
  await title.locator('input').fill('Crafted *Sites*');
  await save();
  await admin.reload();
  await admin.waitForSelector('[data-section]');
  await openSection('hero');
  check('Hero: value persists after refresh', (await field('Titlu — rândul 1').locator('input').inputValue()) === 'Crafted *Sites*');
  const h1 = await siteText('/', 'h1');
  check('Hero: headline on the site', h1.some((t) => /Crafted\s*Sites/.test(t)), h1.join('|'));
  await field('Titlu — rândul 1').locator('input').fill('Crafted *Sites');
  await admin.click('[data-save]');
  check('Hero: invalid highlight markup shows an error next to the field', await field('Titlu — rândul 1').locator('.a-error').isVisible());
  await field('Titlu — rândul 1').locator('input').fill(original);
  await save();
});

// ---- validation + unsaved changes ------------------------------------------------------------------------
await section('validation and unsaved changes', async () => {
  await openSection('header');
  await group('1. Pagina de start').locator('input').nth(1).fill('not a url');
  await admin.click('[data-save]');
  await admin.waitForSelector('.a-error');
  check('server validation error is shown next to the field', /Adresă invalidă/.test(await group('1. Pagina de start').innerText()));
  await admin.click('[data-section=footer]');
  check('unsaved changes: leaving asks for confirmation', await admin.locator('.a-modal').isVisible());
  await admin.click('text=Rămâi aici');
  check('unsaved changes: "stay" keeps the editor', (await admin.locator('[data-section=header].is-active').count()) === 1);
  await admin.click('[data-section=footer]');
  await admin.click('text=Renunță la modificări');
  await admin.waitForSelector('[data-section=footer].is-active');
  await openSection('header');
  check('discarded change is gone', (await group('1. Pagina de start').locator('input').nth(1).inputValue()) === '/');
});

// ---- 4/5. Works: add, edit, reorder, hide, delete ------------------------------------------------------------
await section('works', async () => {
  await openSection('works');
  const before = (await admin.locator('[data-collection=projects] .a-row').count());
  await admin.click('text=+ Adaugă proiect');
  await field('Titlu').locator('input').fill('ZZ Test Project');
  await field('Categorie').locator('input').fill('Testing');
  // same image as an existing project, so the card renders like a real one
  const existing = (await api('/api/admin/sections')).body.sections.find((x) => x.key === 'works').blocks.find((b) => b.collection).items.find((i) => i.image).image;
  await field('Imagine card').locator('input.a-input').fill(existing);
  await admin.click('.a-crumb .a-link');
  check('Works: new project in the list', (await admin.locator('[data-collection=projects] .a-row').count()) === before + 1);
  await save();
  check('Works: new project page exists (200)', (await status('/works/zz-test-project')) === 200);
  check('Works: new project is in /works', (await siteText('/works', 'main')).join(' ').includes('ZZ Test Project'));
  await site.goto(BASE + '/', {waitUntil: 'networkidle'});
  await site.evaluate(() => document.getElementById('works').scrollIntoView());
  await site.waitForFunction(() => document.querySelectorAll('nav[aria-label="Featured work"] a').length > 0);
  const featured = await site.locator('nav[aria-label="Featured work"] a').evaluateAll((as) => as.map((a) => a.textContent));
  check('Works: new project appears in the home section', featured.some((t) => t.includes('ZZ Test Project')), `${featured.length} items`);

  // edit
  await openSection('works');
  await admin.locator('[data-collection=projects] .a-row', {hasText: 'ZZ Test Project'}).locator('.a-row-main').click();
  await field('Categorie').locator('input').fill('Testing 2');
  await admin.click('.a-crumb .a-link');
  await save();
  check('Works: edited category on the site', (await siteText('/works', 'main')).join(' ').includes('Testing 2'));

  // reorder (move up in the list)
  await openSection('works');
  const last = admin.locator('[data-collection=projects] .a-row').last();
  await last.locator('button[title="Mai sus"]').click();
  await save();
  await openSection('works');
  const names = await admin.locator('[data-collection=projects] .a-row strong').allInnerTexts();
  check('Works: reorder persisted', names[names.length - 2] === 'ZZ Test Project', names.slice(-3).join('|'));

  // hide, then delete
  await admin.locator('[data-collection=projects] .a-row', {hasText: 'ZZ Test Project'}).locator('.a-eye').click();
  await save();
  await site.goto(BASE + '/works/zz-test-project', {waitUntil: 'networkidle'});
  check('Works: hidden project is no longer a page', /doesn.t exist/.test(await site.locator('body').innerText()));
  check('Works: hidden project is not in /works', !(await siteText('/works', 'main')).join(' ').includes('ZZ Test Project'));
  admin.once('dialog', (d) => d.accept());
  await openSection('works');
  await admin.locator('[data-collection=projects] .a-row', {hasText: 'ZZ Test Project'}).locator('button[title="Șterge"]').click();
  await save();
  await openSection('works');
  check('Works: project deleted', (await admin.locator('[data-collection=projects] .a-row', {hasText: 'ZZ Test Project'}).count()) === 0);
});

// ---- 6. Services: add, appears in the grid (desktop + mobile), then delete -----------------------------------
await section('services', async () => {
  await site.goto(BASE + '/', {waitUntil: 'networkidle'});
  const n0 = await site.locator('.svc-grid li').count();
  await openSection('services');
  await admin.click('text=+ Adaugă serviciu');
  await field('Denumire — rândul 1').locator('input').fill('ZZ Test');
  await field('Denumire — rândul 2').locator('input').fill('Service');
  await admin.click('.a-crumb .a-link');
  await save();
  await site.goto(BASE + '/', {waitUntil: 'networkidle'});
  check('Services: new card in the grid', (await site.locator('.svc-grid li').count()) === n0 + 1);
  await site.setViewportSize({width: 390, height: 800});
  await site.goto(BASE + '/', {waitUntil: 'networkidle'});
  const overflow = await site.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('Services: grid fine on mobile (no horizontal overflow)', overflow <= 1, `overflow ${overflow}px`);
  await site.setViewportSize({width: 1360, height: 900});
  admin.once('dialog', (d) => d.accept());
  await openSection('services');
  await admin.locator('[data-collection=services] .a-row', {hasText: 'ZZ Test'}).locator('button[title="Șterge"]').click();
  await save();
});

// ---- 7. Pricing, Testimonials, FAQs ------------------------------------------------------------------------------
await section('pricing/testimonials/faqs', async () => {
  await openSection('pricing');
  await admin.locator('[data-collection=plans] .a-row').first().locator('.a-row-main').click();
  const usd = field('Preț de la — USD').locator('input');
  const usdOriginal = await usd.inputValue();
  await usd.fill('850');
  await admin.click('.a-crumb .a-link');
  await save();
  check('Pricing: price on the site', (await siteText('/', '#pricing')).join(' ').includes('850'));
  await openSection('pricing');
  await admin.locator('[data-collection=plans] .a-row').first().locator('.a-row-main').click();
  await field('Preț de la — USD').locator('input').fill(usdOriginal);
  await admin.click('.a-crumb .a-link');
  await save();

  await openSection('testimonials');
  const stat = group('Cifra 1').locator('input').first();
  const statOriginal = await stat.inputValue();
  await stat.fill('31');
  await save();
  check('Testimonials: stat on the site', (await siteText('/', '#testimonials')).join(' ').includes('31'));
  await openSection('testimonials');
  await group('Cifra 1').locator('input').first().fill(statOriginal);
  await save();

  await openSection('faqs');
  await admin.click('text=+ Adaugă întrebare');
  await field('Întrebare').locator('input').fill('ZZ Test question?');
  await field('Răspuns').locator('textarea').fill('ZZ test answer.');
  await admin.click('.a-crumb .a-link');
  await save();
  await admin.reload();
  await admin.waitForSelector('[data-section]');
  await openSection('faqs');
  check('FAQs: new question persisted after refresh', (await admin.locator('[data-collection=faqs] .a-row', {hasText: 'ZZ Test question?'}).count()) === 1);
  check('FAQs: on the site', (await siteText('/', '#faqs')).join(' ').includes('ZZ Test question?'));
  admin.once('dialog', (d) => d.accept());
  await admin.locator('[data-collection=faqs] .a-row', {hasText: 'ZZ Test question?'}).locator('button[title="Șterge"]').click();
  await save();
});

// ---- 8. saving one section never touches another -------------------------------------------------------------------
await section('isolation', async () => {
  const before = await revs();
  await openSection('intro');
  const f = field('Titlu — rândul 1').locator('input');
  const original = await f.inputValue();
  await f.fill(original + ' x');
  await save();
  const after = await revs();
  const changed = Object.keys(after).filter((k) => after[k] !== before[k]);
  check('saving Intro changes only Intro', changed.length === 1 && changed[0] === 'intro', changed.join(','));
  await openSection('intro');
  await field('Titlu — rândul 1').locator('input').fill(original);
  await save();
});

// ---- 9. site: sections, anchors, responsive, errors ------------------------------------------------------------------
await section('public site', async () => {
  await site.goto(BASE + '/', {waitUntil: 'networkidle'});
  const ids = await site.evaluate(() => ['hero', 'works', 'services', 'pricing', 'approach', 'testimonials', 'faqs'].filter((id) => document.getElementById(id)));
  check('anchor ids kept (hero, works, services, pricing, approach, testimonials, faqs)', ids.length === 7, ids.join(','));
  check('Header + Footer rendered once', (await site.locator('body > * header, header.fixed').count()) >= 1 && (await site.locator('footer').count()) === 1);
  await site.setViewportSize({width: 390, height: 800});
  await site.goto(BASE + '/', {waitUntil: 'networkidle'});
  const overflow = await site.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('mobile: no horizontal overflow', overflow <= 1, `${overflow}px`);
  await site.setViewportSize({width: 1360, height: 900});
});

// ---- 10. everything back as it was ------------------------------------------------------------------------------------
await section('restore', async () => {
  const end = await revs();
  const diff = Object.keys(initial).filter((k) => initial[k] !== end[k]);
  check('all sections restored to their original state', diff.length === 0, diff.join(','));
});
check('no JavaScript/console errors in admin or site', problems.length === 0, problems.slice(0, 3).join(' | '));

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
