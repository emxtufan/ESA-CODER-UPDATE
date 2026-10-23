// Runs against an isolated content file; never edits the website's project records.
import assert from 'node:assert/strict';
import {mkdtemp, readFile, writeFile, rm, unlink} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash, randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {chromium} from 'playwright';

const original = await readFile('source_data.json', 'utf8');
const data = JSON.parse(original);
const projects = data._collections.projects.filter(p => p.published !== false);
assert.ok(projects.length >= 2);
const first = projects[0];
const dir = await mkdtemp(path.join(os.tmpdir(), 'esa-hero-test-'));
const content = path.join(dir, 'source_data.json');
await writeFile(content, original);
const socket = net.createServer();
socket.listen(0, '127.0.0.1');
await once(socket, 'listening');
const port = socket.address().port;
await new Promise(resolve => socket.close(resolve));
const base = `http://127.0.0.1:${port}`;
const password = randomUUID();
const child = spawn(process.execPath, ['server/index.mjs', '--prod'], {
  env: {...process.env, HOST: '127.0.0.1', PORT: String(port), ADMIN_PASSWORD: password,
    CONTENT_FILE: content, CONTACTS_FILE: path.join(dir, 'contacts.json'),
    ANALYTICS_FILE: path.join(dir, 'analytics.json'), SMTP_FILE: path.join(dir, 'smtp.json'),
    RECAPTCHA_FILE: path.join(dir, 'recaptcha.json'), IMAGE_CACHE_DIR: path.join(dir, 'images')},
  windowsHide: true,
});
let output = '';
child.stdout.on('data', chunk => { output += chunk; });
child.stderr.on('data', chunk => { output += chunk; });
const uploadFiles = [];
let browser;
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server did not start: ' + output)), 15000);
    child.once('error', reject);
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`Server exited (${code}): ${output}`)); });
    child.stdout.on('data', () => { if (output.includes('Server (production)')) { clearTimeout(timer); resolve(); } });
  });
  browser = await chromium.launch({headless: true});
  const context = await browser.newContext({viewport: {width: 1440, height: 1000}, reducedMotion: 'reduce'});
  const admin = await context.newPage();
  const page = await context.newPage();
  const errors = [];
  for (const tab of [admin, page]) tab.on('pageerror', e => errors.push(e.message));
  await page.goto(base + '/');
  await page.locator('#boot').waitFor({state: 'hidden'});
  assert.equal(await page.locator('.esa-studio-slide img').first().getAttribute('src'), first.heroDesktop || first.image, 'Existing desktop image remains the fallback');
  await admin.goto(base + '/admin/works');
  await admin.locator('input[type=password]').fill(password);
  await admin.locator('button.a-btn-primary').click();
  await admin.locator('[data-collection=projects] .a-row-main').filter({hasText: first.title}).click();
  const uploaded = {};
  for (const [key, label, width, height] of [
    ['heroDesktop', 'Slider hero — Desktop', 1920, 1080],
    ['heroMobile', 'Slider hero — iPhone', 1080, 1920],
  ]) {
    const buffer = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#075085"/><text x="20" y="40" fill="white">${key}-${randomUUID()}</text></svg>`);
    const file = `${createHash('sha1').update(buffer).digest('hex').slice(0, 12)}.svg`;
    for (const root of ['public/uploads', 'dist/uploads']) {
      const target = path.resolve(root, file);
      assert.equal(path.dirname(target), path.resolve(root));
      assert.equal(existsSync(target), false);
      uploadFiles.push(target);
    }
    const field = admin.locator('.a-field').filter({has: admin.getByText(label, {exact: true})});
    await field.locator('input[type=file]').setInputFiles({name: file, mimeType: 'image/svg+xml', buffer});
    await admin.waitForFunction(({label, url}) => [...document.querySelectorAll('.a-field')]
      .some(el => el.querySelector('.a-field-label')?.textContent === label && el.querySelector('input.a-input')?.value === url), {label, url: '/uploads/' + file});
    uploaded[key] = '/uploads/' + file;
  }
  await admin.locator('[data-save]').click();
  await admin.waitForFunction(() => document.querySelector('[data-save]')?.textContent === 'Salvat');
  const saved = JSON.parse(await readFile(content, 'utf8'));
  assert.deepEqual(saved._collections.projects, data._collections.projects.map(p => p.slug === first.slug ? {...p, ...uploaded} : p));
  await admin.reload();
  await admin.locator('[data-collection=projects] .a-row-main').filter({hasText: first.title}).click();
  for (const [key, label] of [['heroDesktop', 'Slider hero — Desktop'], ['heroMobile', 'Slider hero — iPhone']]) {
    assert.equal(await admin.locator('.a-field').filter({has: admin.getByText(label, {exact: true})}).locator('input.a-input').inputValue(), uploaded[key]);
  }

  for (const width of [1920, 1440, 1024, 768, 430, 390, 320]) {
    await page.setViewportSize({width, height: 1000});
    await page.goto(base + '/');
    await page.locator('#boot').waitFor({state: 'hidden'});
    const reject = page.getByRole('button', {name: /^Respinge/});
    if (await reject.isVisible()) await reject.click();
    const studio = page.locator('.esa-studio');
    await studio.scrollIntoViewIfNeeded();
    assert.equal(await studio.getAttribute('data-mode'), width < 640 ? 'mobile' : 'desktop');
    for (const [label, key, mode] of [['Desktop', 'heroDesktop', 'desktop'], ['iPhone', 'heroMobile', 'mobile']]) {
      await studio.getByRole('button', {name: label, exact: true}).click();
      assert.equal(await studio.getAttribute('data-mode'), mode);
      assert.equal(await studio.locator('.esa-studio-slide img').first().getAttribute('src'), uploaded[key]);
      await studio.locator('.esa-studio-slide img').first().evaluate(img => img.decode());
      const box = await studio.locator('.esa-studio-slide').first().boundingBox();
      if (mode === 'desktop') {
        const viewport = await studio.locator('.esa-studio-viewport').boundingBox();
        assert.ok(Math.abs(box.width - viewport.width) < 1, 'Desktop image fills the preview width');
        assert.ok(Math.abs(box.width / box.height - 16 / 9) < 0.01, 'Desktop image keeps the 1920x1080 aspect ratio');
        assert.ok(Math.abs(viewport.width / viewport.height - 16 / 9) < 0.01, 'Desktop viewport keeps a 16:9 aspect ratio');
      } else {
        assert.ok(Math.abs(box.width / box.height - 9 / 16) < 0.01, 'Mobile image keeps the 1080x1920 aspect ratio');
        if (width < 640) {
          const viewport = await studio.locator('.esa-studio-viewport').boundingBox();
          assert.ok(Math.abs(box.width - viewport.width) < 1, 'Mobile image fills the preview width');
          assert.ok(Math.abs(viewport.width / viewport.height - 9 / 16) < 0.01, 'Mobile viewport keeps a 9:16 aspect ratio');
        } else assert.equal(Math.round(box.width), 400);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    await page.screenshot({path: path.join(os.tmpdir(), `esa-hero-${width}.png`)});
    await studio.locator('.esa-studio-slide').first().click();
    assert.equal(await studio.locator('dialog').count(), 0);
    assert.equal(await studio.locator('.esa-studio-zoom-hint').count(), 0);
    assert.equal(await studio.locator('button.esa-studio-slide').count(), 0);
  }
  await page.setViewportSize({width: 1440, height: 1000});
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.goto(base + '/');
  await page.locator('#boot').waitFor({state: 'hidden'});
  const studio = page.locator('.esa-studio');
  await studio.scrollIntoViewIfNeeded();
  const assertSoloCentered = async (mobile) => {
    assert.equal(await studio.locator('.esa-studio-slide').count(), 1, 'Only the selected project is rendered');
    const [view, slide, img] = await studio.evaluate(el =>
      ['.esa-studio-viewport', '.esa-studio-slide', '.esa-studio-slide img']
        .map(selector => el.querySelector(selector).getBoundingClientRect().toJSON()));
    assert.ok(Math.abs(slide.x + slide.width / 2 - view.x - view.width / 2) < 1, 'Selected project is centered horizontally');
    assert.ok(Math.abs(slide.y - view.y) < 1 && Math.abs(slide.height - view.height) < 1, 'Selected image fills the preview height');
    if (!mobile) {
      assert.ok(Math.abs(slide.width - view.width) < 1, 'Desktop preview fills the available width');
      assert.ok(Math.abs(slide.width / slide.height - 16 / 9) < 0.01, 'Selected desktop project stays 16:9');
    } else {
      assert.ok(Math.abs(slide.width / slide.height - 9 / 16) < 0.01, 'Selected mobile project stays 9:16');
      if (page.viewportSize().width < 640) assert.ok(Math.abs(slide.width - view.width) < 1, 'Selected mobile project fills the preview width');
    }
    assert.ok(Math.abs(img.width - slide.width) < 1 && Math.abs(img.height - slide.height) < 1, 'Image fills its card');
  };
  const position = () => studio.locator('.esa-studio-track').evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
  const moving = await position();
  await page.waitForTimeout(250);
  assert.ok(Math.abs(await position() - moving) > 3, 'Autoplay moves');
  await studio.getByRole('button', {name: 'Oprește banda', exact: true}).click();
  const stopped = await position();
  await page.waitForTimeout(250);
  assert.ok(Math.abs(await position() - stopped) < 1, 'Pause stops autoplay');
  await studio.getByRole('button', {name: 'iPhone', exact: true}).click();
  const switched = await position();
  await page.waitForTimeout(250);
  assert.ok(Math.abs(await position() - switched) < 1, 'Device switch preserves pause');
  await studio.getByRole('button', {name: 'Pornește banda', exact: true}).click();
  await studio.getByRole('button', {name: /Viteza sliderului/}).click();
  assert.match(await studio.getByRole('button', {name: /Viteza sliderului/}).getAttribute('aria-label'), /1.5/);
  await studio.getByRole('button', {name: 'Ascunde panourile', exact: true}).click();
  assert.equal(await studio.locator('.esa-studio-projects').isVisible(), false);
  await studio.getByRole('button', {name: 'Arată panourile', exact: true}).click();
  await studio.locator('.esa-studio-project-list button').nth(1).click();
  assert.equal(await studio.locator('.esa-studio-project-list button').nth(1).getAttribute('aria-pressed'), 'true');
  await assertSoloCentered(true);
  assert.equal(await studio.locator('.esa-studio-slide img').getAttribute('alt'), projects[1].title);
  await studio.getByRole('button', {name: 'Desktop', exact: true}).click();
  await assertSoloCentered(false);
  const shine = studio.locator('.esa-studio-slide .vv-shine-lyr-a');
  const frameShine = studio.locator('.esa-studio-frame > .vv-shine-lyr-a');
  await studio.getByRole('button', {name: 'Desktop', exact: true}).evaluate(el => el.blur());
  await page.mouse.move(0, 0);
  assert.equal(await frameShine.evaluate(el => getComputedStyle(el).animationName), 'vv-shine-a', 'Large frame border starts without hover or keyboard focus');
  assert.equal(await frameShine.evaluate(el => getComputedStyle(el).pointerEvents), 'none', 'Frame border does not block controls');
  assert.equal(await shine.evaluate(el => getComputedStyle(el).animationName), 'none', 'Frame animation does not animate every project');
  await studio.locator('.esa-studio-slide').hover();
  assert.equal(await shine.evaluate(el => getComputedStyle(el).animationName), 'vv-shine-a');
  const shineAngle = await shine.evaluate(el => getComputedStyle(el).getPropertyValue('--vv-shine-a'));
  await page.waitForTimeout(200);
  assert.notEqual(await shine.evaluate(el => getComputedStyle(el).getPropertyValue('--vv-shine-a')), shineAngle, 'Colored border moves around the image');
  await page.emulateMedia({reducedMotion: 'reduce'});
  assert.equal(await shine.evaluate(el => getComputedStyle(el).animationName), 'none', 'Border respects reduced motion');
  assert.equal(await frameShine.evaluate(el => getComputedStyle(el).animationName), 'none', 'Frame border respects reduced motion');
  assert.equal(await shine.evaluate(el => getComputedStyle(el).opacity), '1', 'Reduced-motion border remains visible on hover');
  await page.emulateMedia({reducedMotion: 'no-preference'});
  assert.equal(await studio.locator('.esa-studio-slide img').getAttribute('alt'), projects[1].title, 'Device changes preserve the selected project');
  await page.setViewportSize({width: 390, height: 844});
  await assertSoloCentered(false);
  await studio.getByRole('button', {name: 'iPhone', exact: true}).click();
  await assertSoloCentered(true);
  await page.setViewportSize({width: 1440, height: 1000});
  await studio.getByRole('button', {name: 'Ascunde panourile', exact: true}).click();
  await assertSoloCentered(true);
  await studio.getByRole('button', {name: 'Arată panourile', exact: true}).click();
  await studio.getByRole('button', {name: 'Pornește banda', exact: true}).click();
  assert.ok(await studio.locator('.esa-studio-slide').count() > 1, 'Play restores the full gallery');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  const offscreen = await position();
  await page.waitForTimeout(250);
  assert.ok(Math.abs(await position() - offscreen) < 1, 'Offscreen autoplay is stopped');
  await studio.scrollIntoViewIfNeeded();
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.locator('.esa-studio[data-reduced="true"]').waitFor();
  assert.equal(await studio.locator('.esa-studio-slide[data-copy="1"]').count(), 0);
  await studio.locator('.esa-studio-project-list button').nth(1).click();
  await assertSoloCentered(true);
  await studio.getByRole('button', {name: 'Înapoi la galerie', exact: true}).click();
  assert.equal(await studio.locator('.esa-studio-slide').count(), projects.length);
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await page.screenshot({path: path.join(os.tmpdir(), 'esa-hero-light.png')});
  const onlyFirst = saved._collections.projects.map(p => ({...p, published: p.slug === first.slug}));
  const single = await context.request.put(base + '/api/admin/collections/projects', {headers: {'x-admin': '1'}, data: {items: onlyFirst}});
  assert.equal(single.status(), 200, await single.text());
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.goto(base + '/');
  await page.locator('#boot').waitFor({state: 'hidden'});
  await page.locator('.esa-studio').scrollIntoViewIfNeeded();
  await page.getByRole('button', {name: 'Ascunde panourile', exact: true}).click();
  await page.waitForFunction(() => {
    const viewport = document.querySelector('.esa-studio-viewport');
    const slide = document.querySelector('.esa-studio-slide');
    return slide && Math.abs(slide.clientWidth - viewport.clientWidth) < 1;
  });
  assert.ok(await page.locator('.esa-studio-slide').count() >= 2, 'A full-width project has a duplicate for the seamless loop');
  const empty = await context.request.put(base + '/api/admin/collections/projects', {headers: {'x-admin': '1'}, data: {items: onlyFirst.map(p => ({...p, published: false}))}});
  assert.equal(empty.status(), 200, await empty.text());
  await page.goto(base + '/');
  await page.locator('#boot').waitFor({state: 'hidden'});
  assert.equal(await page.locator('.esa-studio').count(), 0, 'An empty collection does not render broken controls');
  assert.deepEqual(errors, []);
  assert.equal(await readFile('source_data.json', 'utf8'), original);
  console.log('PASS: separate admin uploads/save/reload; existing projects unchanged; responsive 16:9 desktop and 9:16 mobile; animated border and reduced motion; preview without zoom/pause/speed/panels; offscreen pause; single/empty collections; no browser errors.');
} finally {
  await browser?.close();
  if (child.exitCode === null) { const stopped = once(child, 'exit'); child.kill(); await stopped; }
  for (const file of uploadFiles) if (existsSync(file)) await unlink(file);
  assert.equal(path.dirname(dir), os.tmpdir());
  assert.ok(path.basename(dir).startsWith('esa-hero-test-'));
  await rm(dir, {recursive: true, force: true});
}
