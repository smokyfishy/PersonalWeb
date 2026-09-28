// QA helper: deterministic frames of a transition. Triggers the transition,
// pauses every Web Animation, then scrubs them to exact times before each
// screenshot. (Canvas particles are timer-driven and won't appear.)
// node scripts/scrub.mjs <baseUrl> <prefix> <door|gate|enter:<id>|leave:<id>> [width] [height] [t1,t2,...]
import { chromium } from '@playwright/test';

const [base = 'http://localhost:5173', prefix = 'qa/x', what = 'descent', w = '1440', h = '900', times = '0,500,1000,1500,2000,2500,3000,3500,4000,4500,5000,5500'] =
  process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
const idle = () => page.waitForFunction(() => !document.body.classList.contains('is-transitioning'), null, { timeout: 15000 });

async function trigger() {
  const [kind, id] = what.split(':');
  const toSlide3 = async () => {
    await page.goto(`${base}/?intro`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('#intro')?.classList.contains('is-ready'));
    for (let i = 0; i < 2; i++) {
      await page.click('#intro-next');
      await idle();
    }
  };
  if (kind === 'door') {
    await toSlide3();
    await page.click('#intro-next');
  } else if (kind === 'gate') {
    await toSlide3();
    await page.click('#intro-next');
    await idle();
    await page.click('#door-enter');
  } else if (kind === 'descent') {
    await page.goto(`${base}/?intro`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('#intro')?.classList.contains('is-ready'));
    await page.click('#intro-next');
    await idle();
    await page.click('#intro-next');
  } else {
    await page.goto(`${base}/?intro`, { waitUntil: 'networkidle' });
    await page.click('#intro-skip');
    await idle();
    await page.waitForTimeout(300);
    if (kind === 'enter') await page.click(`.hotspot[data-section="${id}"]`);
    else {
      await page.click(`.hotspot[data-section="${id}"]`);
      await idle();
      await page.waitForTimeout(300);
      await page.click('#return-btn');
    }
  }
  // Freeze everything immediately.
  await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
  await page.waitForTimeout(250);
  await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
}

await trigger();
for (const t of times.split(',').map(Number)) {
  await page.evaluate((tt) => {
    for (const a of document.getAnimations()) {
      if (a instanceof CSSAnimation || a instanceof CSSTransition) continue;
      a.currentTime = tt;
    }
  }, t);
  await page.waitForTimeout(80);
  await page.screenshot({ path: `${prefix}-${String(t).padStart(4, '0')}.png` });
}
console.log('done');
await browser.close();
