// QA helper: screenshot a URL with Playwright.
// node scripts/shot.mjs <url> <out.png> [width] [height] [waitMs] [full] [reduced]
import { chromium } from '@playwright/test';

const [url, out, w = '1440', h = '900', wait = '1500', full = '', reduced = ''] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: Number(w), height: Number(h) },
  reducedMotion: reduced ? 'reduce' : 'no-preference',
});
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
page.on('requestfailed', (r) => errors.push(`FAILED ${r.url()}`));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(Number(wait));
await page.screenshot({ path: out, fullPage: full === 'full' });
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'));
else console.log('no console errors');
await browser.close();
