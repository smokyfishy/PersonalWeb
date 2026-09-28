// QA helper: opens each section by direct URL, scrolls to reveal all
// illustrations, then captures a full-page screenshot.
// node scripts/sections.mjs <baseUrl> <prefix> [width] [height] [sections...]
import { chromium } from '@playwright/test';

const [base = 'http://localhost:5173', prefix = 'qa/s', w = '1440', h = '900', ...list] = process.argv.slice(2);
const sections = list.length ? list : ['about', 'projects', 'research', 'experience', 'contact'];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
page.on('requestfailed', (r) => errors.push(`FAILED ${r.url()}`));

for (const id of sections) {
  await page.goto(`${base}/${id}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const title = await page.title();
  const heading = await page.textContent('#section-title');
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += Math.floor(Number(h) * 0.6)) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(160);
  }
  await page.waitForTimeout(1800);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  const figs = await page.evaluate(() =>
    [...document.querySelectorAll('figure.art')].map((f) => `${f.dataset.art}:${f.dataset.state}`),
  );
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log(`${id} | title="${title}" | h1="${heading}" | overflowX=${overflow} | art=${figs.join(', ')}`);
  await page.screenshot({ path: `${prefix}-${id}.png`, fullPage: true });
}
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'));
else console.log('no console errors');
await browser.close();
