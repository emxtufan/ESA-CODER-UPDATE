// Isolated API + admin UI deletion checks. Never reads or deletes live analytics.
import assert from 'node:assert/strict';
import {mkdtemp, readFile, writeFile, rm} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {chromium} from 'playwright';
import {createAnalytics} from '../server/analytics.mjs';
import {execFile as execFileCallback} from 'node:child_process';
import {promisify} from 'node:util';

const dir = await mkdtemp(path.join(os.tmpdir(), 'esa-analytics-delete-'));
const content = await readFile('source_data.json');
const contacts = JSON.stringify([{id: 'keep-contact', name: 'Test contact'}]);
await writeFile(path.join(dir, 'content.json'), content);
await writeFile(path.join(dir, 'contacts.json'), contacts);
const analyticsFile = path.join(dir, 'analytics.json');
const analytics = createAnalytics(analyticsFile);
const headers = {'user-agent': 'Mozilla/5.0 Chrome/130.0 Safari/537.36'};
for (const sid of ['test-a', 'test-b']) analytics.record({type: 'visit', sid, path: '/', device: 'desktop'}, {headers, ip: '192.0.2.10'});
await analytics.flush();
const seed = JSON.parse(await readFile(analyticsFile, 'utf8'));
seed.days['2020-01-01'] = {visits: 5, views: 5};
seed.totals.visits += 5;
seed.totals.views += 5;
await writeFile(analyticsFile, JSON.stringify(seed));

const socket = net.createServer();
socket.listen(0, '127.0.0.1');
await once(socket, 'listening');
const port = socket.address().port;
await new Promise(resolve => socket.close(resolve));
const base = `http://127.0.0.1:${port}`;
const password = randomUUID();
const child = spawn(process.execPath, ['server/index.mjs'], {
  env: {...process.env, NODE_ENV: 'development', HOST: '127.0.0.1', PORT: String(port), ADMIN_PASSWORD: password,
    CONTENT_FILE: path.join(dir, 'content.json'), CONTACTS_FILE: path.join(dir, 'contacts.json'), ANALYTICS_FILE: analyticsFile,
    SMTP_FILE: path.join(dir, 'smtp.json'), RECAPTCHA_FILE: path.join(dir, 'recaptcha.json'), IMAGE_CACHE_DIR: path.join(dir, 'images'), GDPR_DIR: path.join(dir, 'gdpr')},
  windowsHide: true,
});
let output = '';
child.stdout.on('data', chunk => { output += chunk; });
child.stderr.on('data', chunk => { output += chunk; });
let browser;
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Test server startup failed: ' + output)), 20000);
    child.once('error', error => { clearTimeout(timeout); reject(error); });
    child.once('exit', () => { clearTimeout(timeout); reject(new Error(output)); });
    child.stdout.on('data', () => { if (output.includes('Server (dev)')) { clearTimeout(timeout); resolve(); } });
  });
  browser = await chromium.launch({headless: true});
  const context = await browser.newContext({viewport: {width: 1440, height: 1000}});
  for (const url of ['/api/admin/analytics', '/api/admin/analytics/visits/test-a']) {
    assert.equal((await context.request.delete(base + url, {headers: {'x-admin': '1'}})).status(), 401);
  }
  assert.equal((await context.request.post(base + '/api/admin/gdpr/bootstrap', {headers: {'x-admin': '1'}, data: {id: 'intruder'}})).status(), 403);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/admin');
  await page.locator('input[type=password]').fill(password);
  await page.getByRole('button', {name: 'Continuă', exact: true}).click();
  await page.getByRole('button', {name: 'Trafic', exact: true}).waitFor();
  const gdprPost = async (url, data) => {
    const response = await context.request.post(base + '/api/admin/gdpr' + url, {headers: {'x-admin': '1'}, data});
    assert.equal(response.status(), 200, await response.text());
    return response.json();
  };
  await gdprPost('/bootstrap', {id: 'test-owner', name: 'Responsabil test', password});
  await gdprPost('/login', {id: 'test-owner', password});
  await gdprPost('/users', {id: 'named-auditor', name: 'Auditor test', role: 'auditor', password});
  const auditContext = await browser.newContext();
  const auditPage = await auditContext.newPage();
  await auditPage.goto(base + '/admin/gdpr');
  await auditPage.getByLabel('Identificator cont', {exact: false}).fill('named-auditor');
  await auditPage.getByLabel('Parolă', {exact: false}).fill(password);
  await auditPage.getByRole('button', {name: 'Intră în modulul GDPR', exact: true}).click();
  await auditPage.getByRole('heading', {name: 'Audit Readiness Check', exact: true}).waitFor();
  assert.equal((await auditContext.request.get(base + '/api/admin/content')).status(), 401);
  assert.equal((await auditContext.request.post(base + '/api/admin/gdpr/policies', {headers: {'x-admin': '1'}, data: {}})).status(), 403);
  assert.equal((await auditContext.request.get(base + '/api/admin/gdpr/report/csv')).status(), 200);
  await auditContext.close();
  await page.getByRole('button', {name: 'Trafic', exact: true}).click();
  await page.getByRole('tab', {name: 'Vizitatori', exact: true}).click();
  const remove = page.getByRole('button', {name: /^Șterge vizita/});
  await remove.first().waitFor();
  const summary = async () => (await context.request.get(base + '/api/admin/analytics')).json();
  const del = url => context.request.delete(base + url, {headers: {'x-admin': '1'}});
  assert.equal((await context.request.delete(base + '/api/admin/analytics')).status(), 403);
  assert.equal((await context.request.delete(base + '/api/admin/analytics/visits/test-a')).status(), 403);
  assert.equal((await del('/api/admin/analytics/visits/' + 'x'.repeat(41))).status(), 400);
  assert.equal((await del('/api/admin/analytics/visits/missing')).status(), 404);

  page.once('dialog', dialog => dialog.dismiss());
  await remove.first().click();
  assert.equal((await summary()).recent.length, 2);
  page.once('dialog', dialog => dialog.accept());
  await remove.first().click();
  await page.getByRole('status').filter({hasText: 'Detaliile vizitei au fost șterse.'}).waitFor();
  await page.waitForFunction(() => document.querySelectorAll('button[aria-label^="Șterge vizita"]').length === 1);
  assert.deepEqual((await summary()).recent.map(v => v.sid), ['test-a']);
  assert.equal((await summary()).totals.allTime, 7);
  assert.deepEqual(JSON.parse(await readFile(analyticsFile, 'utf8')).recent.map(v => v.sid), ['test-a']);

  await page.route('**/api/admin/analytics/visits/test-a', route => route.fulfill({status: 500, contentType: 'application/json', body: JSON.stringify({ok: false, error: 'Eroare de test la salvare.'})}));
  page.once('dialog', dialog => dialog.accept());
  await remove.first().click();
  await page.getByRole('alert').filter({hasText: 'Eroare de test la salvare.'}).waitFor();
  assert.equal((await summary()).recent.length, 1);
  await page.unroute('**/api/admin/analytics/visits/test-a');

  const clear = page.getByRole('link', {name: 'Retenție și curățare GDPR', exact: true});
  assert.equal((await summary()).totals.allTime, 7);
  assert.equal((await del('/api/admin/analytics')).status(), 409);
  await clear.click();
  await page.getByRole('heading', {name: 'Audit Readiness Check', exact: true}).waitFor();
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({width, height: 1000});
    await page.screenshot({path: path.join(os.tmpdir(), `esa-gdpr-${width}.png`)});
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  }
  await page.setViewportSize({width: 1440, height: 1000});
  for (const name of ['Registrul datelor', 'Politici de retenție', 'Cereri GDPR', 'Ștergeri și anonimizări', 'Jurnal de audit', 'Backup și restaurare', 'Furnizori și procesatori', 'Incidente de securitate', 'Rapoarte pentru audit', 'Acces GDPR']) {
    await page.getByRole('button', {name, exact: true}).click();
    assert.equal(await page.locator('.gdpr h2').count() > 0 || await page.locator('.gdpr table').count() > 0, true);
  }
  await page.getByRole('button', {name: 'Politici de retenție', exact: true}).click();
  const policyForm = page.getByRole('form', {name: 'Politică nouă, inactivă'});
  await policyForm.getByLabel('Sursa datelor').selectOption('visits');
  await policyForm.getByLabel('Retenție în zile', {exact: false}).fill('365');
  await policyForm.getByLabel('Acțiune la expirare').selectOption('delete');
  await policyForm.getByLabel('Responsabil intern').fill('Test owner');
  await policyForm.getByLabel('Justificare juridică', {exact: false}).fill('Synthetic UI test policy, never approved');
  await policyForm.getByRole('button', {name: 'Salvează', exact: true}).click();
  await page.getByRole('button', {name: 'Simulează', exact: true}).waitFor();
  await page.getByRole('button', {name: 'Simulează', exact: true}).click();
  await page.getByRole('heading', {name: 'Rezultatul simulării', exact: true}).waitFor();
  const pdf = await context.request.get(base + '/api/admin/gdpr/report/pdf');
  assert.equal(pdf.status(), 200, pdf.headers()['content-type']);
  const pdfBytes = await pdf.body();
  assert.equal(pdfBytes.subarray(0, 4).toString(), '%PDF');
  await writeFile(path.join(os.tmpdir(), 'esa-gdpr-test-report.pdf'), pdfBytes);
  const beforeClear = JSON.parse(await readFile(analyticsFile, 'utf8'));
  for (const [source, ids] of [['visits', ['test-a']], ['analytics_days', Object.keys(beforeClear.days)]]) {
    const {preview} = await gdprPost('/preview', {source, ids, action: 'delete', reason: 'Synthetic fixture cleanup'});
    const {operation} = await gdprPost('/execute', {token: preview.token, confirmation: 'CONFIRM ȘTERGERE'});
    assert.equal(operation.status, 'VERIFIED');
  }
  const empty = await summary();
  assert.equal(empty.totals.allTime, 0);
  assert.equal(empty.totals.views, 0);
  assert.deepEqual(empty.recent, []);
  assert.deepEqual(empty.ips, []);
  assert.deepEqual(JSON.parse(await readFile(analyticsFile, 'utf8')).days, {});
  assert.deepEqual(await readFile(path.join(dir, 'content.json')), content);
  assert.equal(await readFile(path.join(dir, 'contacts.json'), 'utf8'), contacts);
  await context.request.post(base + '/api/visits', {headers, data: {type: 'visit', sid: 'without-consent', path: '/'}});
  assert.equal((await summary()).totals.allTime, 0);
  const consent = await context.request.post(base + '/api/consent', {data: {statistics: true, marketing: false}});
  assert.equal(consent.status(), 200);
  await context.request.post(base + '/api/visits', {headers, data: {type: 'visit', sid: 'after-clear', path: '/'}});
  assert.equal((await summary()).totals.allTime, 1);
  await context.request.post(base + '/api/consent', {data: {statistics: false, marketing: false}});
  await context.request.post(base + '/api/visits', {headers, data: {type: 'visit', sid: 'after-withdrawal', path: '/'}});
  assert.equal((await summary()).totals.allTime, 1);
  const privacy = await promisify(execFileCallback)(process.execPath, ['tests/privacy-check.mjs'], {env: {...process.env, PRIVACY_TEST_URL: base}, windowsHide: true, timeout: 180000});
  console.log(privacy.stdout);
  const oldCookie = (await context.cookies()).find(c => c.name === 'vv_admin').value;
  await context.request.post(base + '/api/admin/logout', {headers: {'x-admin': '1'}});
  assert.equal((await context.request.get(base + '/api/admin/session', {headers: {cookie: `vv_admin=${oldCookie}`}})).status(), 401);
  assert.deepEqual(errors, []);
  console.log('PASS: real admin auth, CSRF, deletion UI, GDPR tabs desktop/tablet/mobile, PDF export, verified reset, consent gate/revocation, logout invalidation.');
  console.log('PASS: content and contact fixtures unchanged; live data was never used.');
} finally {
  await browser?.close();
  if (child.exitCode === null) { child.kill(); await once(child, 'exit'); }
  assert.equal(path.dirname(path.resolve(dir)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(dir).startsWith('esa-analytics-delete-'));
  await rm(dir, {recursive: true, force: true});
}
