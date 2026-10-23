import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import {chromium} from 'playwright';

const browser = await chromium.launch({headless: true});
try {
  const page = await browser.newPage({viewport: {width: 1440, height: 1000}, reducedMotion: 'no-preference'});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('vv-theme', 'dark'));
  await page.goto('http://localhost:5000/', {waitUntil: 'networkidle'});
  const reject = page.getByRole('button', {name: 'Respinge opționale', exact: true});
  if (await reject.isVisible()) await reject.click();
  const mark = page.locator('footer .vv-footer-mark');
  assert.equal(await mark.getAttribute('src'), '/brand/esa-coder-solutions-lockup-transparent.png');
  assert.equal(await page.locator('footer img').count(), 1);
  await mark.evaluate(image => { image.loading = 'eager'; return image.decode(); });
  await page.evaluate(() => document.fonts.ready);

  for (const width of [1440, 390, 768]) {
    await page.setViewportSize({width, height: 1000});
    await page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
    await page.waitForFunction(() => {
      const image = document.querySelector('.vv-footer-mark');
      const offset = image.getBoundingClientRect().top - image.parentElement.getBoundingClientRect().top;
      return Number(getComputedStyle(image).opacity) < 0.01 && Math.abs(offset - 12) < 1;
    });
    const {start, end} = await mark.evaluate(image => {
      const top = image.parentElement.getBoundingClientRect().top + scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;
      return {start: Math.max(0, Math.min(max, top - innerHeight * 0.9)), end: Math.max(0, Math.min(max, top - innerHeight * 0.7))};
    });
    assert.ok(end > start);
    for (const progress of [0, 0.5, 1, 0.5, 0]) {
      await page.evaluate(top => window.scrollTo({top, behavior: 'instant'}), start + (end - start) * progress);
      await page.waitForFunction(expected => Math.abs(Number(getComputedStyle(document.querySelector('.vv-footer-mark')).opacity) - expected) < 0.003, progress);
      const state = await mark.evaluate(image => {
        const box = image.getBoundingClientRect();
        return {width: box.width, height: box.height, center: box.x + box.width / 2, offset: box.top - image.parentElement.getBoundingClientRect().top,
          buttonGap: box.top - image.closest('footer').firstElementChild.lastElementChild.getBoundingClientRect().bottom,
          blur: getComputedStyle(image.nextElementSibling).backdropFilter};
      });
      assert.equal(state.width, width < 768 ? 288 : 630);
      assert.ok(Math.abs(state.width / state.height - 2) < 0.001);
      assert.ok(Math.abs(state.center - width / 2) < 1);
      assert.ok(Math.abs(state.offset - (12 - (state.height + 54) * progress)) < 4, JSON.stringify({progress, ...state}));
      assert.ok(state.blur.includes('blur(20px)'));
      assert.ok(state.buttonGap >= 20, JSON.stringify({progress, ...state}));
      if (progress > 0 && width !== 768) await page.screenshot({path: path.join(os.tmpdir(), `esa-footer-scroll-${width}-${progress}.png`)});
    }
    await page.evaluate(top => window.scrollTo({top, behavior: 'instant'}), end);
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.vv-footer-mark')).opacity) > 0.997);
    await page.getByRole('switch', {name: 'Switch to light mode', exact: true}).click();
    assert.equal(await mark.evaluate(image => getComputedStyle(image).filter), 'brightness(0)');
    await page.waitForFunction(() => !document.documentElement.dataset.vvThemeVt);
    if (width === 1440) await page.screenshot({path: path.join(os.tmpdir(), 'esa-footer-scroll-light.png')});
    await page.getByRole('switch', {name: 'Switch to dark mode', exact: true}).click();
    await page.waitForFunction(() => !document.documentElement.dataset.vvThemeVt);
    assert.equal(await mark.evaluate(image => getComputedStyle(image).filter), 'brightness(0) invert(1)');

    await page.emulateMedia({reducedMotion: 'reduce'});
    await page.waitForFunction(() => !document.querySelector('.vv-footer-mark').style.getPropertyValue('--vv-footer-reveal'));
    for (const top of [start, end]) {
      await page.evaluate(y => window.scrollTo({top: y, behavior: 'instant'}), top);
      await page.waitForFunction(() => getComputedStyle(document.querySelector('.vv-footer-mark')).opacity === '1');
      const position = await mark.evaluate(image => image.getBoundingClientRect().bottom - image.parentElement.getBoundingClientRect().top);
      assert.ok(Math.abs(position + 42) < 1);
    }
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.waitForFunction(() => document.querySelector('.vv-footer-mark').style.getPropertyValue('--vv-footer-reveal') !== '');
    console.log(`PASS ${width}px: scroll forward/reverse, blur, centering, themes and reduced motion.`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
