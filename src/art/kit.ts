// Shared palette and SVG building blocks for every custom illustration, so
// the set reads as one family. Illustrations contain no words: all real text
// is HTML around them.

export const C = {
  ink: '#0d0913',
  plum: '#22112c',
  plum2: '#2f1a3d',
  plum3: '#3d2350',
  violet: '#5a3a8f',
  lilac: '#9f86d6',
  arc: '#7fb2ff',
  arcDeep: '#3e6fd8',
  ice: '#d8e6ff',
  brass: '#d4a24c',
  brassHi: '#f0c26b',
  chalk: '#efe9f7',
  mist: '#b9aecb',
  rose: '#e07a9a',
  teal: '#5fd0c4',
  steel: '#8e9bb5',
};

export interface Art {
  /** Full composition. */
  viewBox: string;
  /** Tighter crop used below 640px wide; must keep the focal subject. */
  compactViewBox?: string;
  render(uid: string): string;
}

/** Common <defs>: background glow, line glow filter, blue and gold gradients. */
export function baseDefs(uid: string): string {
  return `
  <defs>
    <radialGradient id="${uid}-bg" cx="50%" cy="45%" r="75%">
      <stop offset="0" stop-color="${C.plum3}"/>
      <stop offset="0.55" stop-color="${C.plum}"/>
      <stop offset="1" stop-color="${C.ink}"/>
    </radialGradient>
    <linearGradient id="${uid}-arc" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.ice}"/>
      <stop offset="1" stop-color="${C.arc}"/>
    </linearGradient>
    <linearGradient id="${uid}-brass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.brassHi}"/>
      <stop offset="1" stop-color="${C.brass}"/>
    </linearGradient>
    <filter id="${uid}-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="${uid}-soft" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
    <pattern id="${uid}-grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M24 0H0V24" fill="none" stroke="${C.lilac}" stroke-opacity="0.07" stroke-width="1"/>
    </pattern>
  </defs>`;
}

/** Background plate with a faint engineering grid. */
export function plate(uid: string, w: number, h: number, grid = true): string {
  return `<rect width="${w}" height="${h}" fill="url(#${uid}-bg)"/>${grid ? `<rect width="${w}" height="${h}" fill="url(#${uid}-grid)"/>` : ''}`;
}

/** Small arrowhead-terminated connector used in pipeline diagrams. */
export function arrow(x1: number, y1: number, x2: number, y2: number, color = C.arc, cls = 'anim-draw', delay = 0): string {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const a = 9;
  const p1 = `${x2 - a * Math.cos(ang - 0.45)},${y2 - a * Math.sin(ang - 0.45)}`;
  const p2 = `${x2 - a * Math.cos(ang + 0.45)},${y2 - a * Math.sin(ang + 0.45)}`;
  return `<g class="${cls}" style="--d:${delay}ms">
    <path d="M${x1} ${y1}L${x2} ${y2}" pathLength="1" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M${p1}L${x2} ${y2}L${p2}" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

/** Deterministic pseudo-random generator so illustrations render identically. */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const f = (n: number) => n.toFixed(1);
