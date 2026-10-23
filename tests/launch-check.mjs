import assert from 'node:assert/strict';
import {mkdtemp, readFile, writeFile, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import vm from 'node:vm';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {chromium} from 'playwright';
import {liteData} from '../server/content.mjs';

const original = await readFile('source_data.json', 'utf8');
const data = JSON.parse(original);
const hidden = data._collections.posts.filter(item => item.published === false);
const published = data._collections.posts.filter(item => item.published !== false);
assert.equal(hidden.length, 7);
const lite = liteData(data);
assert.equal(lite._collections.posts.length, published.length);
assert.equal(data._collections.posts.length, published.length + hidden.length, 'Filtering must not delete admin records');
assert.ok(!lite._collections.testimonials.some(item => /visuvate/i.test(JSON.stringify(item))));

const dir = await mkdtemp(path.join(os.tmpdir(), 'esa-launch-test-'));
const content = path.join(dir, 'source_data.json');
await writeFile(content, original);
const socket = net.createServer();
socket.listen(0, '127.0.0.1');
await once(socket, 'listening');
const port = socket.address().port;
await new Promise(resolve => socket.close(resolve));
const base = `http://127.0.0.1:${port}`;
const password = 'isolated-launch-test-only';
const child = spawn(process.execPath, ['server/index.mjs', '--prod'], {
  env: {...process.env, PORT: String(port), HOST: '127.0.0.1', ADMIN_PASSWORD: password,
    SITE_URL: 'https://esa-coder-solutions.com', CONTENT_FILE: content,
    CONTACTS_FILE: path.join(dir, 'contacts.json'), ANALYTICS_FILE: path.join(dir, 'analytics.json'),
    SMTP_FILE: path.join(dir, 'smtp-disabled.json'), RECAPTCHA_FILE: path.join(dir, 'recaptcha-disabled.json'),
    IMAGE_CACHE_DIR: path.join(dir, 'image-cache')},
  windowsHide: true,
});
let output = '';
child.stdout.on('data', chunk => { output += chunk; });
child.stderr.on('data', chunk => { output += chunk; });
let browser;
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Test server did not start: ' + output)), 15000);
    child.once('error', reject);
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`Server exited (${code}): ${output}`)); });
    child.stdout.on('data', () => { if (output.includes('Server (production)')) { clearTimeout(timer); resolve(); } });
  });
  assert.equal((await fetch(base + '/api/admin/content')).status, 401);
  const login = await fetch(base + '/api/admin/login', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({password})});
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const headers = {cookie, 'x-admin': '1', 'content-type': 'application/json'};
  const admin = await (await fetch(base + '/api/admin/content', {headers})).json();
  for (const scope of ['/politica-de-confidentialitate', '/politica-de-cookies', '/terms-and-conditions']) {
    const keys = Object.keys(data[scope]);
    assert.deepEqual(Object.keys(admin.data[scope]), keys, `${scope}: all policy fields editable`);
    const body = data[scope]['section-1-body'];
    const save = await fetch(base + '/api/admin/texts', {method: 'PUT', headers, body: JSON.stringify({scope, values: {'section-1-body': body + '\n\nVerificare izolată.'}})});
    assert.equal(save.status, 200);
    assert.ok((await (await fetch(base + scope)).text()).includes('Verificare izolată.'));
    assert.equal(JSON.parse(await readFile(content, 'utf8'))[scope]['section-1-body'], body + '\n\nVerificare izolată.');
    await fetch(base + '/api/admin/texts', {method: 'PUT', headers, body: JSON.stringify({scope, values: {'section-1-body': body}})});
  }
  assert.equal((await fetch(base + '/api/admin/texts', {method: 'PUT', headers, body: JSON.stringify({scope: '/politica-de-cookies', values: {'section-1-body': {html: 'invalid'}}})})).status, 400);
  for (const item of hidden) {
    assert.equal((await fetch(base + '/blog/' + item.slug)).status, 404);
    assert.equal((await fetch(base + '/api/item/posts/' + item.slug)).status, 404);
  }
  const sitemap = await (await fetch(base + '/sitemap.xml')).text();
  assert.ok(!sitemap.includes('/privacy-policy'));
  for (const item of hidden) assert.ok(!sitemap.includes('/blog/' + item.slug));
  const script = await (await fetch(base + '/content.js')).text();
  const publicWindow = {};
  vm.runInNewContext(script, {window: publicWindow});
  assert.equal(publicWindow.__SOURCE_DATA__._collections.posts.length, published.length);

  browser = await chromium.launch({headless: true});
  const context = await browser.newContext({viewport: {width: 1440, height: 900}, reducedMotion: 'no-preference'});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/contact');
  await page.locator('#boot').waitFor({state: 'hidden'});
  await page.getByRole('button', {name: 'Respinge opționale', exact: true}).click();
  const budgets = await page.locator('input[name="budget"]').evaluateAll(inputs => inputs.map(input => input.value));
  assert.equal(budgets.length, 4);
  assert.ok(budgets.every(value => value.includes('lei') && !/[$₹]/.test(value)));
  const footerLinks = await page.locator('footer a').evaluateAll(links => links.map(link => link.href));
  assert.ok(!footerLinks.some(href => /visuvate/i.test(href)));

  const documentId = await page.evaluate(() => window.__launchDocument = Math.random());
  const paths = ['/politica-de-confidentialitate', '/politica-de-cookies', '/terms-and-conditions', '/', '/contact'];
  for (const route of paths) {
    const link = page.locator(`a[href="${route}"]`).filter({visible: true}).first();
    await link.click();
    await page.waitForURL(base + route);
    await page.waitForFunction(expected => document.querySelector('link[rel="canonical"]')?.getAttribute('href') === expected, 'https://esa-coder-solutions.com' + route);
    assert.equal(await page.evaluate(() => window.__launchDocument), documentId, 'Must exercise SPA navigation');
    const direct = await (await fetch(base + route)).text();
    const expectedDescription = direct.match(/<meta name="description" content="([^"]*)"/)?.[1];
    const actual = await page.locator('meta[name="description"]').getAttribute('content');
    const unescaped = await page.evaluate(value => new DOMParser().parseFromString(value, 'text/html').documentElement.textContent, expectedDescription);
    assert.equal(actual, unescaped);
    assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'), 'https://esa-coder-solutions.com' + route);
    assert.equal(await page.locator('script[type="application/ld+json"]').count(), 1);
  }
  await page.goBack();
  await page.waitForFunction(() => document.querySelector('link[rel="canonical"]')?.getAttribute('href') === 'https://esa-coder-solutions.com/');
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({width, height: 900});
    for (const route of ['/contact', '/blog', '/terms-and-conditions']) {
      await page.goto(base + route);
      await page.locator('#boot').waitFor({state: 'hidden'});
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${route} overflow at ${width}`);
      if (route === '/blog' && !published.length) await page.getByText('Momentan nu sunt articole publicate.').waitFor();
    }
  }
  await context.addCookies([{name: 'vv_admin', value: cookie.slice(cookie.indexOf('=') + 1), url: base}]);
  await page.goto(base + '/admin/advanced');
  await page.getByRole('button', {name: 'Politica de cookie-uri', exact: true}).click();
  await page.getByRole('heading', {name: 'Politica de cookie-uri', exact: true}).waitFor();
  const policyField = page.locator('.a-field').filter({has: page.locator('.a-field-label', {hasText: /^Secțiunea 1 · conținut$/})}).locator('textarea');
  assert.equal(await policyField.count(), 1, JSON.stringify(await page.locator('.a-field-label').allTextContents()));
  await policyField.fill('Text de verificare admin, doar în copia izolată.');
  await page.getByRole('button', {name: /^Salvează/}).click();
  await page.getByRole('button', {name: 'Salvat', exact: true}).waitFor();
  assert.equal(JSON.parse(await readFile(content, 'utf8'))['/politica-de-cookies']['section-1-body'], 'Text de verificare admin, doar în copia izolată.');
  await fetch(base + '/api/admin/texts', {method: 'PUT', headers, body: JSON.stringify({scope: '/politica-de-cookies', values: {'section-1-body': data['/politica-de-cookies']['section-1-body']}})});
  assert.deepEqual(errors, []);

  const form = new URLSearchParams({name: 'Test izolat', email: 'launch-test@example.invalid', country: 'Romania', budget: budgets[1], preferred_response_method: 'Email', message: 'Verificare locală, SMTP dezactivat.'});
  assert.equal((await fetch(base + '/api/contact', {method: 'POST', body: form})).status, 200);
  assert.ok(!output.includes('launch-test@example.invalid') && !output.includes('Test izolat'), 'No contact PII in request log');
  assert.equal(JSON.parse(await readFile(path.join(dir, 'contacts.json'), 'utf8')).length, 1);
  console.log('PASS: hidden imports, RON, complete legal admin editing, SPA metadata/back, responsive pages, isolated contact and redacted log');

  const privacy = spawn(process.execPath, ['tests/privacy-check.mjs'], {env: {...process.env, PRIVACY_TEST_URL: base}, stdio: 'inherit', windowsHide: true});
  assert.equal((await once(privacy, 'exit'))[0], 0, 'Privacy regression checks');
  assert.equal(await readFile('source_data.json', 'utf8'), original, 'Working website content must remain unchanged');
} finally {
  await browser?.close();
  if (child.exitCode === null) { const stopped = once(child, 'exit'); child.kill(); await stopped; }
  assert.ok(dir.startsWith(path.join(os.tmpdir(), 'esa-launch-test-')));
  await rm(dir, {recursive: true, force: true});
}
