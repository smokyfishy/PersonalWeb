import { expect, test, type Page } from '@playwright/test';
import { privatePatterns } from '../private-patterns';

const SECTIONS = [
  { id: 'about', heading: 'About Akshay', node: { x: 835, y: 148 } },
  { id: 'projects', heading: 'Projects', node: { x: 1145, y: 368 } },
  { id: 'research', heading: 'Research', node: { x: 1025, y: 725 } },
  { id: 'experience', heading: 'Experience', node: { x: 638, y: 722 } },
  { id: 'contact', heading: 'Get in touch', node: { x: 520, y: 360 } },
] as const;

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('requestfailed', (r) => errors.push(`request failed: ${r.url()}`));
  return errors;
}

const settled = (page: Page) =>
  page.waitForFunction(() => !document.body.classList.contains('is-transitioning') && document.getAnimations().filter((a) => a.playState === 'running' && !(a instanceof CSSAnimation)).length === 0);

async function toCircle(page: Page) {
  await page.goto('/?intro');
  await page.getByRole('button', { name: 'Skip intro' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-view', 'circle');
  await settled(page);
}

/** Opens a section from the circle: hotspot on wide screens, list on narrow. */
async function openFromCircle(page: Page, id: string) {
  const list = page.locator(`.hub-list-link[data-section="${id}"]`);
  if (await list.isVisible()) await list.click();
  else await page.locator(`.hotspot[data-section="${id}"]`).click();
}

test.describe('introduction', () => {
  const bubble = (page: Page) => page.locator('.ed-bubble.is-active img');
  const ready = (page: Page) => page.waitForFunction(() => document.querySelector('#intro')?.classList.contains('is-ready'));

  async function toDoor(page: Page) {
    await page.goto('/?intro');
    await ready(page);
    for (let i = 0; i < 3; i++) {
      await page.locator('#intro-next').click();
      await settled(page);
    }
    await expect(page.locator('body')).toHaveAttribute('data-view', 'door');
  }

  test('three Edward slides, both directions, with Edward anchored bottom-left', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/?intro');
    await expect(page.locator('body')).toHaveAttribute('data-view', 'intro');
    await ready(page);
    await expect(bubble(page)).toHaveAttribute('alt', /Hello! It is nice to meet you\./);
    await expect(page.locator('.intro-backdrop-img')).toBeVisible();
    const fig = await page.locator('#intro-figure').boundingBox();
    const vp = page.viewportSize()!;
    expect(Math.round(fig!.x)).toBe(0);
    expect(Math.round(fig!.y + fig!.height)).toBe(vp.height);
    await expect(page.locator('#intro-prev')).toBeHidden();

    const next = page.locator('#intro-next');
    await next.click();
    await settled(page);
    await expect(bubble(page)).toHaveAttribute('alt', /My name is Akshay Karthik, welcome to my website!/);
    await next.click();
    await settled(page);
    await expect(bubble(page)).toHaveAttribute('alt', /Are you ready to learn the truth\?/);
    await expect(page.locator('#intro-prev')).toBeVisible();
    // Edward's body never moves between slides.
    expect(await page.locator('#intro-figure').boundingBox()).toEqual(fig);

    await page.getByRole('button', { name: 'Previous' }).click();
    await settled(page);
    await expect(bubble(page)).toHaveAttribute('alt', /My name is Akshay Karthik/);
    expect(errors).toEqual([]);
  });

  test('the Door of Truth: Previous returns to the question, Enter crosses to the circle', async ({ page }) => {
    const errors = watchErrors(page);
    await toDoor(page);
    await expect(page).toHaveTitle(/Gate of Truth/);
    const enter = page.getByRole('button', { name: 'Enter the Gate of Truth' });
    await expect(enter).toBeVisible();
    await expect(enter).toBeFocused();
    await expect(page.locator('#door-back img')).toHaveAttribute('alt', /stone double door/);

    await page.locator('#door-prev').click();
    await settled(page);
    await expect(page.locator('body')).toHaveAttribute('data-view', 'intro');
    await expect(bubble(page)).toHaveAttribute('alt', /Are you ready to learn the truth\?/);

    await page.locator('#intro-next').click();
    await settled(page);
    await expect(page.locator('body')).toHaveAttribute('data-view', 'door');
    await enter.click();
    // Nodes are not clickable while the camera moves.
    await expect(page.locator('#hub')).toHaveJSProperty('inert', true);
    await expect(page.locator('body')).toHaveAttribute('data-view', 'circle', { timeout: 12000 });
    await settled(page);
    await expect(page.locator('#hub')).toHaveJSProperty('inert', false);
    await expect(page.locator('#door')).toBeHidden();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('.circle-img--sharp')).toHaveCSS('opacity', '1');
    await expect(page.locator('.circle-img--blur')).toHaveCSS('opacity', '0');
    expect(errors).toEqual([]);
  });

  test('Skip intro goes straight to the clear circle', async ({ page }) => {
    await toCircle(page);
    await expect(page.locator('#hub-title')).toBeFocused();
    await expect(page.locator('.hotspot')).toHaveCount(5);
  });

  test('Skip intro from the door also lands on the circle', async ({ page }) => {
    await toDoor(page);
    await page.locator('#door-skip').click();
    await expect(page.locator('body')).toHaveAttribute('data-view', 'circle');
    await settled(page);
    await expect(page.locator('#door')).toBeHidden();
  });

  test('rapid clicks never skip past the door or strand a scene', async ({ page }) => {
    await page.goto('/?intro');
    await ready(page);
    for (let i = 0; i < 10; i++) await page.locator('#intro-next').click({ force: true, noWaitAfter: true }).catch(() => undefined);
    await settled(page);
    await expect(page.locator('body')).toHaveAttribute('data-view', 'door');
    await expect(page.locator('#intro')).toBeHidden();
    await expect(page.locator('#door')).toBeVisible();
    for (let i = 0; i < 6; i++) await page.locator('#door-enter').click({ force: true, noWaitAfter: true }).catch(() => undefined);
    await expect(page.locator('body')).toHaveAttribute('data-view', 'circle', { timeout: 12000 });
    await settled(page);
    await expect(page.locator('#door')).toBeHidden();
    await expect(page.locator('#intro')).toBeHidden();
    await expect(page.locator('#section-view')).toBeHidden();
  });

  test('browser Back mid-gate leaves a consistent scene', async ({ page }) => {
    await page.goto('/about');
    await page.goto('/?intro');
    await ready(page);
    for (let i = 0; i < 3; i++) {
      await page.locator('#intro-next').click();
      await settled(page);
    }
    await page.locator('#door-enter').click();
    await page.waitForTimeout(700);
    await page.goBack();
    await settled(page);
    const view = await page.evaluate(() => document.body.dataset.view);
    expect(['circle', 'section']).toContain(view);
    await expect(page.locator('#door')).toBeHidden();
    await expect(page.locator('#intro')).toBeHidden();
    if (view === 'section') await expect(page.locator('#section-title')).toHaveText('About Akshay');
  });

  test('returning visitors land on the circle, not the intro', async ({ page }) => {
    await toCircle(page);
    await page.reload();
    await expect(page.locator('body')).toHaveAttribute('data-view', 'circle');
  });
});

test.describe('circle navigation', () => {
  test('hotspots sit on the nodes of the artwork', async ({ page }, info) => {
    test.skip(info.project.name.startsWith('phone'), 'checked on wide layouts');
    await toCircle(page);
    const frame = await page.locator('#circle-frame').boundingBox();
    expect(frame).not.toBeNull();
    for (const s of SECTIONS) {
      const ring = await page.locator(`.hotspot[data-section="${s.id}"] .hs-ring`).boundingBox();
      const cx = ring!.x + ring!.width / 2;
      const cy = ring!.y + ring!.height / 2;
      const ex = frame!.x + (s.node.x / 1672) * frame!.width;
      const ey = frame!.y + (s.node.y / 941) * frame!.height;
      expect(Math.abs(cx - ex) / frame!.width, `${s.id} x`).toBeLessThan(0.03);
      expect(Math.abs(cy - ey) / frame!.height, `${s.id} y`).toBeLessThan(0.03);
      const hit = await page.locator(`.hotspot[data-section="${s.id}"]`).boundingBox();
      expect(Math.min(hit!.width, hit!.height)).toBeGreaterThanOrEqual(44);
    }
  });

  for (const s of SECTIONS) {
    test(`${s.id}: opens, returns, and follows Back/Forward`, async ({ page }) => {
      const errors = watchErrors(page);
      await toCircle(page);
      await openFromCircle(page, s.id);
      await expect(page).toHaveURL(new RegExp(`/${s.id}$`));
      await expect(page.locator('#section-title')).toHaveText(s.heading);
      await settled(page);
      await expect(page.locator('#section-title')).toBeFocused();
      await expect(page).toHaveTitle(new RegExp(s.id, 'i'));

      await page.getByRole('link', { name: 'Return to circle' }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator('body')).toHaveAttribute('data-view', 'circle');
      await settled(page);

      await page.goForward();
      await expect(page).toHaveURL(new RegExp(`/${s.id}$`));
      await expect(page.locator('body')).toHaveAttribute('data-view', 'section');
      await settled(page);
      await page.goBack();
      await expect(page.locator('body')).toHaveAttribute('data-view', 'circle');
      await settled(page);
      expect(errors).toEqual([]);
    });

    test(`${s.id}: direct URL and refresh stay on the section`, async ({ page }) => {
      await page.goto(`/${s.id}`);
      await expect(page.locator('body')).toHaveAttribute('data-view', 'section');
      await expect(page.locator('#section-title')).toHaveText(s.heading);
      await expect(page.locator('#intro')).toBeHidden();
      await page.reload();
      await expect(page.locator('#section-title')).toHaveText(s.heading);
      await expect(page.getByRole('link', { name: 'Return to circle' })).toBeVisible();
    });
  }

  test('Return from a deep link animates back to the circle', async ({ page }) => {
    await page.goto('/research');
    await page.getByRole('link', { name: 'Return to circle' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-view', 'circle');
    await expect(page).toHaveURL(/\/$/);
  });

  test('Back during a fly-in ends in a consistent state', async ({ page }) => {
    await toCircle(page);
    await openFromCircle(page, 'projects');
    await page.waitForTimeout(150);
    await page.goBack();
    await settled(page);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('body')).toHaveAttribute('data-view', 'circle');
    await expect(page.locator('#section-view')).toBeHidden();
    await expect(page.locator('.hub')).toBeVisible();
  });

  test('clicking several nodes rapidly shows exactly one section', async ({ page }, info) => {
    test.skip(info.project.name.startsWith('phone'), 'hotspot spam checked on wide layouts');
    await toCircle(page);
    for (const id of ['about', 'projects', 'contact']) {
      await page.locator(`.hotspot[data-section="${id}"]`).click({ force: true, noWaitAfter: true }).catch(() => undefined);
    }
    await settled(page);
    await expect(page.locator('body')).toHaveAttribute('data-view', 'section');
    const heading = await page.locator('#section-title').textContent();
    const path = new URL(page.url()).pathname.slice(1);
    expect(SECTIONS.find((s) => s.id === path)?.heading).toBe(heading);
    await expect(page.locator('.sec')).toHaveCount(1);
  });

  test('keyboard: Tab reaches a node and Enter opens it', async ({ page }, info) => {
    test.skip(info.project.name.startsWith('phone'), 'keyboard checked on desktop and tablet');
    await toCircle(page);
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-section'));
    expect(focused).toBeTruthy();
    await expect(page.locator(':focus')).toHaveCSS('outline-style', 'dashed');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/${focused}$`));
    await settled(page);
    await expect(page.locator('#section-title')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('body')).toHaveAttribute('data-view', 'circle');
    await settled(page);
    await expect(page.locator(`.hotspot[data-section="${focused}"]`)).toBeFocused();
  });
});

test.describe('content and links', () => {
  test('contact actions work', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByRole('link', { name: 'Email Akshay' })).toHaveAttribute('href', 'mailto:akshay.karthik@duke.edu');
    const li = page.getByRole('link', { name: /Open LinkedIn profile/ });
    await expect(li).toHaveAttribute('href', 'https://www.linkedin.com/in/akshay-karthik-a219a7311/');
    await expect(li).toHaveAttribute('target', '_blank');
    await expect(li).toHaveAttribute('rel', /noopener/);
    for (const text of privatePatterns()) await expect(page.locator('body')).not.toContainText(text);
  });

  test('papers link to IEEE Xplore and the hub has no tagline or footer', async ({ page }) => {
    await page.goto('/research');
    const links = page.getByRole('link', { name: /Read on IEEE Xplore/ });
    await expect(links).toHaveCount(2);
    await expect(links.first()).toHaveAttribute('href', 'https://ieeexplore.ieee.org/abstract/document/10761308/');
    await expect(page.locator('.site-foot')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('Square Enix');
    await expect(page.locator('body')).not.toContainText('Machine learning for robotics and biomedical engineering');
    await page.goto('/about');
    await expect(page.locator('.portrait img')).toHaveJSProperty('complete', true);
    expect(await page.locator('.portrait img').evaluate((i: HTMLImageElement) => i.naturalWidth)).toBeGreaterThan(0);
  });

  test('THETA links to its verified repository', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.getByRole('link', { name: /Source code on GitHub/ })).toHaveAttribute('href', 'https://github.com/smokyfishy/THETA');
  });

  test('every illustration loads on each section', async ({ page }) => {
    const errors = watchErrors(page);
    for (const s of SECTIONS) {
      await page.goto(`/${s.id}`);
      const figs = page.locator('figure.art');
      const count = await figs.count();
      for (let i = 0; i < count; i++) {
        await figs.nth(i).scrollIntoViewIfNeeded();
        await expect(figs.nth(i)).toHaveAttribute('data-state', 'ready');
        await expect(figs.nth(i).locator('.art-canvas')).toHaveAttribute('aria-label', /.{30,}/);
      }
    }
    expect(errors).toEqual([]);
  });

  test('research case-study link jumps to the project', async ({ page }) => {
    await page.goto('/research');
    await page.getByRole('link', { name: 'Read the project case study' }).first().click();
    await expect(page).toHaveURL(/\/projects#nsclc$/);
    await settled(page);
    await expect(page.locator('#nsclc-title')).toBeInViewport();
  });

  test('no horizontal scrolling', async ({ page }) => {
    for (const s of SECTIONS) {
      await page.goto(`/${s.id}`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, s.id).toBeLessThanOrEqual(0);
    }
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the full journey, through the door, uses short fades', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/?intro');
    await page.waitForFunction(() => document.querySelector('#intro')?.classList.contains('is-ready'));
    const start = Date.now();
    for (let i = 0; i < 3; i++) {
      await page.locator('#intro-next').click();
      await settled(page);
    }
    await expect(page.locator('body')).toHaveAttribute('data-view', 'door');
    await page.getByRole('button', { name: 'Enter the Gate of Truth' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-view', 'circle');
    await settled(page);
    expect(Date.now() - start).toBeLessThan(3500);
    await openFromCircle(page, 'about');
    await expect(page.locator('#section-title')).toHaveText('About Akshay');
    await settled(page);
    await page.getByRole('link', { name: 'Return to circle' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-view', 'circle');
    expect(errors).toEqual([]);
  });
});
