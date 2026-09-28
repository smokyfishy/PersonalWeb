// Pure view/route model. No DOM access here so it can be unit-tested.
import type { SectionId } from '../content/types';

export const SECTION_IDS: readonly SectionId[] = ['about', 'projects', 'research', 'experience', 'contact'];

export type IntroSlide = 0 | 1 | 2;

/** Number of Edward slides before the Door of Truth. */
export const LAST_SLIDE: IntroSlide = 2;

export type View =
  | { kind: 'intro'; slide: IntroSlide }
  | { kind: 'door' }
  | { kind: 'circle' }
  | { kind: 'section'; id: SectionId };

export type TransitionKind =
  | 'none'
  | 'slide-forward' // intro slide 1 → 2
  | 'slide-back' // intro slide 2 → 1
  | 'to-door' // last Edward slide → Door of Truth
  | 'from-door' // Door of Truth → last Edward slide
  | 'gate' // Door of Truth → circle (through the door)
  | 'skip' // intro → circle (Skip intro: short fade)
  | 'replay' // circle → intro
  | 'enter' // circle → section (fly toward node)
  | 'leave' // section → circle (pull back)
  | 'switch' // section → section
  | 'jump'; // anything else (e.g. section → intro); plain crossfade

export function isSectionId(value: string): value is SectionId {
  return (SECTION_IDS as readonly string[]).includes(value);
}

// The site may be served from a subpath (GitHub Pages: /PersonalWeb/). Vite's
// BASE_URL is "/" locally and "/PersonalWeb/" in the Pages build.
const BASE = (import.meta.env?.BASE_URL ?? '/').replace(/\/+$/, '');

/** Prefixes a site-relative path ("about", "img/x.webp") with the base path. */
export function sitePath(rel: string): string {
  return `${BASE}/${rel.replace(/^\/+/, '')}`;
}

/** Parses a pathname. Returns null for "/" because home depends on intro state. */
export function parsePath(pathname: string): View | null | 'unknown' {
  if (BASE && pathname.toLowerCase().startsWith(BASE.toLowerCase())) pathname = pathname.slice(BASE.length);
  const clean = pathname.replace(/\/+$/, '').replace(/^\/+/, '').toLowerCase();
  if (clean === '' || clean === 'index.html') return null;
  if (isSectionId(clean)) return { kind: 'section', id: clean };
  return 'unknown';
}

export function pathFor(view: View): string {
  return sitePath(view.kind === 'section' ? view.id : '');
}

export function sameView(a: View, b: View): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'intro' && b.kind === 'intro') return a.slide === b.slide;
  if (a.kind === 'section' && b.kind === 'section') return a.id === b.id;
  return true;
}

export function planTransition(from: View, to: View): TransitionKind {
  if (sameView(from, to)) return 'none';
  if (from.kind === 'intro' && to.kind === 'intro') return to.slide > from.slide ? 'slide-forward' : 'slide-back';
  if (from.kind === 'intro' && to.kind === 'door') return 'to-door';
  if (from.kind === 'door' && to.kind === 'intro') return 'from-door';
  if (from.kind === 'door' && to.kind === 'circle') return 'gate';
  if (from.kind === 'intro' && to.kind === 'circle') return 'skip';
  if (from.kind === 'circle' && to.kind === 'intro') return 'replay';
  if (from.kind === 'circle' && to.kind === 'section') return 'enter';
  if (from.kind === 'section' && to.kind === 'circle') return 'leave';
  if (from.kind === 'section' && to.kind === 'section') return 'switch';
  return 'jump';
}

/** Which views get their own browser-history entry. Intro steps and the door never do. */
export function historyPolicy(from: View, to: View): 'push' | 'replace' {
  if (to.kind === 'section' || (from.kind === 'section' && to.kind === 'circle')) return 'push';
  return 'replace';
}
