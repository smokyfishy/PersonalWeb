// QA helper: screenshots every settled stage of the opening at one size:
// slides 1–3, the door, and the circle after entering the gate.
// node scripts/stages.mjs <baseUrl> <prefix> [width] [height] [reduced]
import { chromium } from '@playwright/test';

const [base = 'http://localhost:5173', prefix = 'qa/st', w = '1440', h = '900', reduced = ''] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
page.on('requestfailed', (r) => errors.push(`FAILED ${r.url()}`));
const idle = () => page.waitForFunction(() => !document.body.classList.contains('is-transitioning'), null, { timeout: 15000 });
const shot = (n) => page.screenshot({ path: `${prefix}-${n}.png` });

await page.goto(`${base}/?intro`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelector('#intro')?.classList.contains('is-ready'));
await page.waitForTimeout(300);
await shot('1-slide1');
for (const n of [2, 3]) {
  await page.click('#intro-next');
  await idle();
  await page.waitForTimeout(200);
  await shot(`${n}-slide${n}`);
}
await page.click('#intro-next');
await idle();
await page.waitForTimeout(400);
await shot('4-door');
const box = await page.locator('#door-enter').boundingBox();
console.log('enter button', JSON.stringify(box), 'focused', await page.evaluate(() => document.activeElement?.id));
await page.click('#door-enter');
await idle();
await page.waitForTimeout(300);
await shot('5-circle');
console.log('view', await page.evaluate(() => document.body.dataset.view), 'url', page.url());
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();
