// QA helper: walks the visitor journey and captures each state, including a
// frame sequence through the intro → circle descent.
// node scripts/journey.mjs <baseUrl> <prefix> [width] [height] [reduced]
import { chromium } from '@playwright/test';

const [base = 'http://localhost:5173', prefix = 'qa/j', w = '1440', h = '900', reduced = ''] = process.argv.slice(2);
const DESCENT_FRAMES = [250, 700, 1100, 1500, 1800, 2300, 2900, 3500, 4100, 4600, 5100, 5800];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
page.on('requestfailed', (r) => errors.push(`FAILED ${r.url()}`));
const shot = (name) => page.screenshot({ path: `${prefix}-${name}.png` });
const settle = () => page.waitForFunction(() => !document.body.classList.contains('is-transitioning'), null, { timeout: 15000 });

await page.goto(base + '/?intro', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await shot('entrance-700');
await page.waitForTimeout(1600);
await shot('slide1');
await page.click('#intro-next');
await page.waitForTimeout(420);
await shot('slide-mid');
await settle();
await page.waitForTimeout(200);
await shot('slide2');

// Measure frame pacing during the descent.
await page.evaluate(() => {
  const w = window;
  w.__frames = [];
  let last = performance.now();
  const loop = (t) => {
    w.__frames.push(t - last);
    last = t;
    if (w.__frames.length < 600) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});
await page.click('#intro-next');
let t = 0;
for (const at of DESCENT_FRAMES) {
  await page.waitForTimeout(at - t);
  t = at;
  await shot(`descent-${at}`);
}
await settle();
await page.waitForTimeout(400);
await shot('circle');
const frames = await page.evaluate(() => window.__frames.slice(2));
const long = frames.filter((d) => d > 40).length;
const avg = frames.reduce((a, b) => a + b, 0) / frames.length;
console.log(`frames=${frames.length} avg=${avg.toFixed(1)}ms >40ms=${long}`);
console.log('url after descent', page.url(), 'focus', await page.evaluate(() => document.activeElement?.id || document.activeElement?.className));
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'));
else console.log('no console errors');
await browser.close();
