// Lazy loader for the custom illustrations. Each figure rendered by
// src/sections carries data-art="<id>"; its SVG module is imported only when
// the figure approaches the viewport.
import type { ArtId } from '../content/types';
import type { Art } from './kit';

type Loader = () => Promise<{ default: Art }>;

const LOADERS: Record<ArtId, Loader> = {
  'about-convergence': () => import('./about-convergence'),
  'kinetix-scaffold': () => import('./kinetix-scaffold'),
  'kinetix-spatialize': () => import('./kinetix-spatialize'),
  'kinetix-pipeline': () => import('./kinetix-pipeline'),
  'theta-system': () => import('./theta-system'),
  'asu-lab-build': () => import('./asu-lab-build'),
  'nsclc-multiomics': () => import('./nsclc-multiomics'),
  'dmd-network': () => import('./dmd-network'),
  'clean-plate-forecast': () => import('./clean-plate-forecast'),
  'ai-club-workshop': () => import('./ai-club-workshop'),
  'dignity-volunteer': () => import('./dignity-volunteer'),
  'pub-nsclc': () => import('./pub-nsclc'),
  'pub-theta': () => import('./pub-theta'),
  'skills-map': () => import('./skills-map'),
};

export const ART_IDS = Object.keys(LOADERS) as ArtId[];

const compactQuery = window.matchMedia('(max-width: 640px)');

/**
 * Tags stroke-draw paths with a class. CSS targets the class rather than
 * [pathLength]: Chromium does not re-evaluate that case-sensitive SVG attribute
 * selector when an ancestor's class changes, which left lines undrawn.
 */
export function markDrawPaths(root: ParentNode): void {
  root.querySelectorAll('[pathLength]').forEach((el) => el.classList.add('draw-path'));
}
let counter = 0;

async function hydrate(figure: HTMLElement): Promise<void> {
  if (figure.dataset.state) return;
  figure.dataset.state = 'loading';
  const id = figure.dataset.art as ArtId;
  const canvas = figure.querySelector<HTMLElement>('.art-canvas');
  const loader = LOADERS[id];
  if (!canvas || !loader) {
    figure.dataset.state = 'error';
    return;
  }
  try {
    const art = (await loader()).default;
    const uid = `${id}-${++counter}`;
    const box = compactQuery.matches && art.compactViewBox ? art.compactViewBox : art.viewBox;
    canvas.innerHTML = `<svg viewBox="${box}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-full="${art.viewBox}" data-compact="${art.compactViewBox ?? art.viewBox}">${art.render(uid)}</svg>`;
    markDrawPaths(canvas);
    figure.dataset.state = 'ready';
    observeReveal(figure);
  } catch (error) {
    // Keep the labelled placeholder: the text content still explains the work.
    console.warn(`Illustration "${id}" failed to load`, error);
    figure.dataset.state = 'error';
  }
}

const revealObserver =
  'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              revealObserver?.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.3 },
      )
    : null;

function observeReveal(figure: HTMLElement): void {
  if (revealObserver) revealObserver.observe(figure);
  else figure.classList.add('is-visible');
}

const loadObserver =
  'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              loadObserver?.unobserve(entry.target);
              void hydrate(entry.target as HTMLElement);
            }
          }
        },
        { rootMargin: '600px 0px' },
      )
    : null;

/** Starts lazy-loading every illustration placeholder inside root. */
export function hydrateArt(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('figure.art[data-art]').forEach((fig) => {
    if (loadObserver) loadObserver.observe(fig);
    else void hydrate(fig);
  });
}

// Swap crops when crossing the compact breakpoint.
compactQuery.addEventListener('change', () => {
  document.querySelectorAll<SVGSVGElement>('.art-canvas > svg').forEach((svg) => {
    const box = compactQuery.matches ? svg.dataset.compact : svg.dataset.full;
    if (box) svg.setAttribute('viewBox', box);
  });
});
