// QA helper: captures frames of the fly-to-node and pull-back transitions.
// node scripts/flight.mjs <baseUrl> <prefix> <section> [width] [height]
import { chromium } from '@playwright/test';

const [base = 'http://localhost:5173', prefix = 'qa/f', id = 'projects', w = '1440', h = '900'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(`${base}/?intro`, { waitUntil: 'networkidle' });
await page.click('#intro-skip');
await page.waitForTimeout(1200);
await page.screenshot({ path: `${prefix}-hub.png` });
await page.click(`.hotspot[data-section="${id}"]`, { force: true }).catch(() => page.click(`.hub-list-link[data-section="${id}"]`));
let t = 0;
for (const at of [300, 650, 900, 1300]) {
  await page.waitForTimeout(at - t);
  t = at;
  await page.screenshot({ path: `${prefix}-in-${at}.png` });
}
await page.waitForTimeout(600);
await page.click('#return-btn');
t = 0;
for (const at of [250, 600, 1400]) {
  await page.waitForTimeout(at - t);
  t = at;
  await page.screenshot({ path: `${prefix}-out-${at}.png` });
}
console.log(errors.length ? errors.join('\n') : 'no errors', '| focus:', await page.evaluate(() => document.activeElement?.getAttribute('data-section') ?? document.activeElement?.id));
await browser.close();
