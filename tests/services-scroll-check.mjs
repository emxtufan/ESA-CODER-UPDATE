import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import path from 'node:path';
import os from 'node:os';

const base = process.env.SERVICES_TEST_URL || 'http://localhost:5000';
const browser = await chromium.launch({headless: true});
try {
  const context = await browser.newContext({viewport: {width: 1440, height: 900}, reducedMotion: 'no-preference'});
  await context.addInitScript(() => {
    window.__shaderDraws = 0;
    window.__lastShaderDraw = 0;
    const draw = WebGLRenderingContext.prototype.drawArrays;
    WebGLRenderingContext.prototype.drawArrays = function (...args) {
      window.__shaderDraws++;
      window.__lastShaderDraw = performance.now();
      return draw.apply(this, args);
    };
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/services');
  await page.locator('#boot').waitFor({state: 'hidden'});
  await page.getByRole('button', {name: /^Respinge/}).click();
  await page.waitForFunction(() => window.__shaderDraws > 1);
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.svx-cube')).animationPlayState === 'paused');

  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 600);
  await page.waitForFunction(() => scrollY > 50 && performance.now() - window.__lastShaderDraw > 180);
  const draws = await page.evaluate(() => window.__shaderDraws);
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 150);
    await page.waitForTimeout(80);
  }
  assert.equal(await page.evaluate(() => window.__shaderDraws), draws, 'Background must not redraw during wheel/scroll inertia');
  await page.waitForFunction(count => window.__shaderDraws > count, draws, {timeout: 15000});

  await page.locator('main a[href="/services/3d-modeling"]').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.svx-cube')).animationPlayState === 'running');
  await page.waitForFunction(() => getComputedStyle(document.querySelector('main .vv-anim-scroll')).animationPlayState === 'paused');
  await page.locator('main a[href="/services/crafted-websites"]').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => getComputedStyle(document.querySelector('main .vv-anim-scroll')).animationPlayState === 'running');

  // A stationary screenshot while scroll events continue also checks that the frozen backdrop stays visible.
  await page.evaluate(() => { window.__scrollHold = setInterval(() => window.dispatchEvent(new Event('scroll')), 50); });
  await page.waitForFunction(() => performance.now() - window.__lastShaderDraw > 180);
  await page.screenshot({path: path.join(os.tmpdir(), 'esa-services-scroll-desktop.png')});
  await page.evaluate(() => clearInterval(window.__scrollHold));

  for (const width of [390, 768]) {
    await page.setViewportSize({width, height: 844});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  }
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.reload();
  await page.locator('#boot').waitFor({state: 'hidden'});
  await page.waitForFunction(() => window.__shaderDraws > 0 && performance.now() - window.__lastShaderDraw > 250);
  const reducedDraws = await page.evaluate(() => window.__shaderDraws);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(() => window.__shaderDraws), reducedDraws, 'Reduced motion keeps the shader static');
  assert.deepEqual(errors, []);
  console.log('PASS: shader pauses during scrolling and resumes, offscreen cards pause/resume, 390/768/1440 layout, reduced motion, no JS errors');
} finally {
  await browser.close();
}
