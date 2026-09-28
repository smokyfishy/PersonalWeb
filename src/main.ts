import '@fontsource-variable/fraunces';
import '@fontsource-variable/source-sans-3';
import './styles/tokens.css';
import './styles/base.css';
import './styles/scene.css';
import './styles/sections.css';
import './styles/art.css';

import { Director, type SceneRefs } from './app/director';
import { Particles } from './app/fx/particles';
import { sigilMarkup } from './app/fx/sigil';
import { Navigator } from './app/navigator';
import { LAST_SLIDE, historyPolicy, parsePath, pathFor, sitePath, type IntroSlide, type View } from './app/views';
import { hydrateArt } from './art';
import { SECTIONS, SITE } from './content/sections';
import type { SectionId } from './content/types';
import { renderSectionHTML, renderSwitcher } from './sections/render';
import { markHotspot, renderHotspots, renderHubList } from './stage/hotspots';

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`Missing element ${sel}`);
  return el;
};

const INTRO_SEEN_KEY = 'ak-intro-seen';
const storage = {
  get(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      /* storage unavailable (private mode); the intro simply shows again */
    }
  },
};

// ------------------------------------------------------------------ DOM refs

// Energy sigil inside the hub camera, so it zooms with the circle artwork.
$('#circle-camera').insertAdjacentHTML('beforeend', sigilMarkup('meet', 'hub-sigil'));

const refs: SceneRefs = {
  intro: $('#intro'),
  introBackdrop: $('#intro-backdrop'),
  introFigure: $('#intro-figure'),
  introRim: $('.intro-rim'),
  edBody: $('#ed-body'),
  bubbles: [...document.querySelectorAll<HTMLElement>('.ed-bubble')],
  introControls: $('#intro-controls'),
  skip: $('#intro-skip'),
  prev: $<HTMLButtonElement>('#intro-prev'),
  next: $<HTMLButtonElement>('#intro-next'),
  step: $('#intro-step'),
  introLive: $('#intro-live'),
  hubSigil: document.getElementById('hub-sigil') as unknown as SVGSVGElement,
  hub: $('#hub'),
  hubChrome: [$('.hub-head'), $('.hub-foot'), $('#hub-list')],
  hotspots: $('#hotspots'),
  frame: $('#circle-frame'),
  camera: $('#circle-camera'),
  blurImg: $('.circle-img--blur'),
  sharpImg: $('.circle-img--sharp'),
  fog: $('.fog'),
  fogPlanes: [...document.querySelectorAll<HTMLElement>('.fog-plane')],
  sectionView: $('#section-view'),
  flare: $('#flare'),
  irisRim: document.getElementById('iris-rim') as unknown as SVGSVGElement,
  door: $('#door'),
  doorSurround: $('.door-surround'),
  doorStage: $('#door-stage'),
  doorBack: $('#door-back'),
  doorFront: $('#door-front'),
  doorGlyphs: $('#door-glyphs'),
  doorEye: $('#door-eye'),
  doorShade: $('#door-shade'),
  doorControls: $('#door-controls'),
  doorEnter: $<HTMLButtonElement>('#door-enter'),
  doorPrev: $<HTMLButtonElement>('#door-prev'),
  doorSkip: $('#door-skip'),
  gateVoid: $('#gate-void'),
};
const sectionMain = $('#section-main');
const switcher = $('#section-switch');
const routeLive = $('#route-live');

renderHotspots(refs.hotspots);
renderHubList($('#hub-list'));
// index.html links to "/"; point them at the base path when served from a subpath.
$<HTMLAnchorElement>('#replay-intro').href = sitePath('?intro');
$<HTMLAnchorElement>('#return-btn').href = sitePath('');

const params = new URLSearchParams(location.search);
if (params.get('debug') === 'hotspots') document.body.classList.add('debug-hotspots');

// ----------------------------------------------------------- section content

let renderedSection: SectionId | null = null;
let pendingHash: string | null = null;

function renderSection(id: SectionId): void {
  if (renderedSection !== id) {
    sectionMain.innerHTML = renderSectionHTML(id);
    switcher.innerHTML = renderSwitcher(id);
    renderedSection = id;
    hydrateArt(sectionMain);
  }
}

// ---------------------------------------------------------------- navigator

const director = new Director(refs, { renderSection }, new Particles($<HTMLCanvasElement>('#fx-canvas')));

function viewTitle(view: View): string {
  if (view.kind === 'section') return `${SECTIONS[view.id].title} — ${SITE.name}`;
  if (view.kind === 'door') return `The Gate of Truth — ${SITE.name}`;
  return SITE.title;
}

function updateMeta(view: View): void {
  document.title = viewTitle(view);
  const description = view.kind === 'section' ? SECTIONS[view.id].description : SITE.description;
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
}

let lastSection: SectionId | null = null;

function focusView(view: View): void {
  if (view.kind === 'section') {
    if (pendingHash) {
      const target = document.getElementById(pendingHash);
      pendingHash = null;
      if (target) {
        target.scrollIntoView({ block: 'start' });
        const heading = target.querySelector<HTMLElement>('h2, h3');
        if (heading) {
          heading.tabIndex = -1;
          heading.focus({ preventScroll: true });
          // On short screens a tall illustration can push the heading below
          // the fold; make sure the title the visitor asked for is visible.
          const rect = heading.getBoundingClientRect();
          if (rect.bottom > window.innerHeight || rect.top < 0) heading.scrollIntoView({ block: 'center' });
          return;
        }
      }
    }
    document.getElementById('section-title')?.focus({ preventScroll: true });
  } else if (view.kind === 'circle') {
    const back = lastSection && refs.hotspots.querySelector<HTMLElement>(`.hotspot[data-section="${lastSection}"]`);
    const visibleBack = back && back.offsetParent !== null ? back : null;
    const listLink = lastSection && document.querySelector<HTMLElement>(`.hub-list-link[data-section="${lastSection}"]`);
    const target = visibleBack ?? (listLink && listLink.offsetParent !== null ? listLink : null) ?? $('#hub-title');
    target.focus({ preventScroll: true });
  } else if (view.kind === 'door') {
    refs.doorEnter.focus({ preventScroll: true });
  }
}

const nav = new Navigator(initialView(), {
  perform: (kind, from, to) => {
    updateMeta(to);
    if (from.kind === 'section') lastSection = from.id;
    return director.perform(kind, from, to);
  },
  hurry: () => director.hurry(),
  commitHistory: (view, mode) => {
    const hash = view.kind === 'section' && pendingHash ? `#${encodeURIComponent(pendingHash)}` : '';
    const path = pathFor(view) + hash;
    const state = { path, fromCircle: nav.view.kind === 'circle' };
    if (mode === 'push') history.pushState(state, '', path);
    else history.replaceState(state, '', path);
  },
  onSettled: (view) => {
    if (view.kind === 'circle') {
      storage.set(INTRO_SEEN_KEY, '1');
      markHotspot(refs.hotspots, lastSection, 'is-previous');
    }
    if (view.kind === 'section') {
      routeLive.textContent = `${SECTIONS[view.id].title} section`;
    } else if (view.kind === 'circle') {
      routeLive.textContent = 'Transmutation circle. Choose a section.';
    } else if (view.kind === 'door') {
      routeLive.textContent = 'The Gate of Truth. Choose Enter the Gate of Truth to continue, or Previous to go back.';
    }
    focusView(view);
  },
  onBusyChange: (busy) => document.body.classList.toggle('is-transitioning', busy),
});

function initialView(): View {
  const parsed = parsePath(location.pathname);
  if (parsed && parsed !== 'unknown') return parsed;
  const wantsIntro = params.has('intro') || !storage.get(INTRO_SEEN_KEY);
  if (parsed === 'unknown') {
    history.replaceState({ path: sitePath('') }, '', sitePath(''));
    return { kind: 'circle' };
  }
  if (params.has('intro') || params.has('debug')) history.replaceState({ path: sitePath('') }, '', sitePath('') + (params.has('debug') ? location.search : ''));
  return wantsIntro && !params.has('debug') ? { kind: 'intro', slide: 0 } : { kind: 'circle' };
}

function go(to: View, historyMode?: 'push' | 'replace' | 'none'): void {
  void nav.go({ to, history: historyMode ?? historyPolicy(nav.view, to) });
}

// -------------------------------------------------------------- first paint

{
  const view = nav.view;
  if (view.kind === 'section') {
    renderSection(view.id);
    if (location.hash) pendingHash = decodeURIComponent(location.hash.slice(1));
  }
  director.commit(view);
  updateMeta(view);
  history.replaceState({ path: pathFor(view), fromCircle: false }, '', pathFor(view) + (params.has('debug') ? location.search : '') + location.hash);
  if (view.kind === 'intro') {
    void director.introEntrance();
  } else if (view.kind === 'section') {
    requestAnimationFrame(() => focusView(view));
  }
}

// ------------------------------------------------------------------ intro UI

refs.next.addEventListener('click', () => {
  const v = nav.view;
  if (v.kind !== 'intro') return;
  if (v.slide < LAST_SLIDE) go({ kind: 'intro', slide: (v.slide + 1) as IntroSlide });
  else go({ kind: 'door' });
});

refs.prev.addEventListener('click', () => {
  const v = nav.view;
  if (v.kind === 'intro' && v.slide > 0) go({ kind: 'intro', slide: (v.slide - 1) as IntroSlide });
});

// Door of Truth controls.
refs.doorEnter.addEventListener('click', () => {
  if (nav.view.kind === 'door') go({ kind: 'circle' });
});
refs.doorPrev.addEventListener('click', () => {
  if (nav.view.kind === 'door') go({ kind: 'intro', slide: LAST_SLIDE });
});

// Skip intro (on Edward's slides or the door) goes straight to the clear circle.
for (const btn of [$('#intro-skip'), refs.doorSkip]) {
  btn.addEventListener('click', () => {
    if (nav.view.kind !== 'intro' && nav.view.kind !== 'door') return;
    director.fastDescent = true;
    go({ kind: 'circle' });
  });
}

window.addEventListener('resize', () => director.layoutDoor());

// Arrow keys step through the intro while it is showing.
document.addEventListener('keydown', (event) => {
  const v = nav.view;
  if (nav.isBusy || event.altKey || event.ctrlKey || event.metaKey) return;
  if (v.kind === 'intro') {
    if (event.key === 'ArrowRight') refs.next.click();
    if (event.key === 'ArrowLeft' && v.slide > 0) refs.prev.click();
  } else if (v.kind === 'door' && event.key === 'ArrowLeft') {
    refs.doorPrev.click();
  }
});

// --------------------------------------------------------- link interception

document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const target = event.target as Element | null;

  const copyBtn = target?.closest<HTMLButtonElement>('[data-copy]');
  if (copyBtn) {
    const status = copyBtn.closest('.contact')?.querySelector('.copy-status');
    const value = copyBtn.dataset.copy ?? '';
    copyText(value).then(
      (ok) => {
        if (status) status.textContent = ok ? 'Email address copied.' : `Copy failed. The address is ${value}.`;
      },
      () => undefined,
    );
    return;
  }

  const link = target?.closest<HTMLAnchorElement>('a[href]');
  if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin) return;

  // In-page anchors on the current section: let the browser scroll.
  if (url.pathname === location.pathname && url.hash) return;

  if (link.id === 'replay-intro') {
    event.preventDefault();
    go({ kind: 'intro', slide: 0 }, 'replace');
    return;
  }

  if (link.id === 'return-btn') {
    event.preventDefault();
    // Return along the same history entry when we came from the circle, so
    // Back/Forward stay symmetrical with the on-screen control.
    if ((history.state as { fromCircle?: boolean } | null)?.fromCircle && !nav.isBusy) history.back();
    else go({ kind: 'circle' }, 'push');
    return;
  }

  const parsed = parsePath(url.pathname);
  if (parsed === 'unknown') return;
  event.preventDefault();
  if (parsed === null) {
    go({ kind: 'circle' }, 'push');
    return;
  }
  pendingHash = url.hash ? decodeURIComponent(url.hash.slice(1)) : null;
  if (parsed.kind === 'section' && nav.view.kind === 'section' && nav.view.id === parsed.id) {
    focusView(parsed);
    return;
  }
  go(parsed);
});

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

// Esc from a section returns to the circle.
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || nav.view.kind !== 'section') return;
  const open = document.activeElement?.closest('details[open]');
  if (open) return;
  $('#return-btn').click();
});

// ------------------------------------------------------------ back/forward

window.addEventListener('popstate', () => {
  const parsed = parsePath(location.pathname);
  const to: View = parsed && parsed !== 'unknown' ? parsed : { kind: 'circle' };
  const current = nav.view;
  // Fragment-only navigation inside the same section: nothing to animate.
  if (to.kind === 'section' && current.kind === 'section' && to.id === current.id) return;
  // Home while still in the intro or at the door stays there.
  if (to.kind === 'circle' && (current.kind === 'intro' || current.kind === 'door')) return;
  if (location.hash && to.kind === 'section') pendingHash = decodeURIComponent(location.hash.slice(1));
  void nav.go({ to, history: 'none' });
});

// Keep the skip link pointed at the visible view's heading.
$('#skip-link').addEventListener('click', (event) => {
  event.preventDefault();
  const v = nav.view;
  if (v.kind === 'section') document.getElementById('section-title')?.focus();
  else if (v.kind === 'circle') $('#hub-title').focus();
  else if (v.kind === 'door') refs.doorEnter.focus();
  else refs.next.focus();
});

