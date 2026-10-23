// Opens pages in a real Chrome (phone and desktop) and reports React hydration mismatches.
// usage: npm run dev (or npm start), then: node tests/hydration-check.mjs http://localhost:5000 / /services ...
import {chromium, devices} from 'playwright';
const [base, ...paths] = process.argv.slice(2);
const browser = await chromium.launch({channel: 'chrome', headless: true});
for (const mobile of [true, false]) {
  const ctx = await browser.newContext(mobile ? devices['Moto G4'] : {viewport: {width: 1350, height: 940}});
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text().slice(0, 600)); });
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message.slice(0, 600)));
  for (const p of paths) {
    errs.length = 0;
    await page.goto(base + p, {waitUntil: 'networkidle'});
    await page.waitForTimeout(1500);
    const rel = errs.filter((e) => /hydrat|did not match|418|mismatch|server rendered/i.test(e));
    console.log(mobile ? 'MOBILE' : 'DESKTOP', p, rel.length ? rel.join('\n---\n') : 'ok (' + errs.length + ' other msgs)');
  }
  await ctx.close();
}
await browser.close();
