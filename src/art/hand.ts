// Shared hand geometry built on the standard 21 hand landmarks
// (wrist; then CMC/MCP/IP/TIP for the thumb and MCP/PIP/DIP/TIP for each
// finger). Drawing both the human hand and the robotic hand from the same
// landmarks keeps finger counts, joint order, and proportions plausible.
import { C, f } from './kit';

export type Pt = [number, number];

/** Relaxed open hand, fingers up, wrist at the origin (unit ≈ 1 px at scale 1). */
export const OPEN_HAND: Pt[] = [
  [0, 0], // 0 wrist
  [-36, -40], [-68, -74], [-88, -106], [-101, -134], // 1-4 thumb
  [-32, -122], [-40, -174], [-44, -206], [-47, -234], // 5-8 index
  [0, -128], [0, -186], [0, -222], [0, -252], // 9-12 middle
  [29, -122], [35, -173], [39, -206], [42, -231], // 13-16 ring
  [54, -108], [66, -149], [72, -175], [77, -197], // 17-20 pinky
];

export const FINGERS: number[][] = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16],
  [17, 18, 19, 20],
];

/** Widths of each digit, thumb → pinky. */
const WIDTHS = [30, 26, 27, 25, 21];

export function place(points: Pt[], ox: number, oy: number, scale: number, mirror = false): Pt[] {
  return points.map(([x, y]) => [ox + (mirror ? -x : x) * scale, oy + y * scale]);
}

const pl = (pts: Pt[]) => pts.map(([x, y]) => `${f(x)},${f(y)}`).join(' ');

/** Soft silhouette of a human hand. */
export function humanHand(p: Pt[], scale: number, fill = C.lilac, opacity = 0.34): string {
  const palm = [p[0], [p[1][0] - 4 * scale, p[1][1]] as Pt, p[5], p[9], p[13], p[17], [p[0][0] + 40 * scale, p[0][1] - 4 * scale] as Pt];
  const digits = FINGERS.map((idx, i) => {
    const chain = i === 0 ? [p[1], ...idx.slice(1).map((k) => p[k])] : idx.map((k) => p[k]);
    return `<polyline points="${pl(chain)}" fill="none" stroke="${fill}" stroke-width="${f(WIDTHS[i] * scale)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join('');
  return `<g opacity="${opacity}">
    <polygon points="${pl(palm)}" fill="${fill}" stroke="${fill}" stroke-width="${f(26 * scale)}" stroke-linejoin="round"/>
    ${digits}
    <polygon points="${f(p[0][0] - 40 * scale)},${f(p[0][1] - 6 * scale)} ${f(p[0][0] + 44 * scale)},${f(p[0][1] - 8 * scale)} ${f(p[0][0] + 50 * scale)},${f(p[0][1] + 90 * scale)} ${f(p[0][0] - 46 * scale)},${f(p[0][1] + 90 * scale)}" fill="${fill}"/>
  </g>`;
}

/** Landmark skeleton overlay: palm connections + digit chains + 21 points. */
export function landmarks(p: Pt[], color = C.arc, r = 5, cls = ''): string {
  const bones: Array<[number, number]> = [
    [0, 1], [0, 5], [5, 9], [9, 13], [13, 17], [0, 17],
  ];
  FINGERS.forEach((idx, i) => {
    const chain = i === 0 ? idx : idx;
    for (let k = 0; k < chain.length - 1; k++) bones.push([chain[k], chain[k + 1]]);
  });
  const lines = bones
    .map(([a, b]) => `<line x1="${f(p[a][0])}" y1="${f(p[a][1])}" x2="${f(p[b][0])}" y2="${f(p[b][1])}"/>`)
    .join('');
  const dots = p.map(([x, y], i) => `<circle cx="${f(x)}" cy="${f(y)}" r="${i === 0 ? r * 1.4 : r}"/>`).join('');
  return `<g class="${cls}">
    <g stroke="${color}" stroke-width="2.2" stroke-linecap="round" opacity="0.9">${lines}</g>
    <g fill="${C.ink}" stroke="${color}" stroke-width="2.4">${dots}</g>
  </g>`;
}

/**
 * Tendon-driven robotic hand drawn from the same landmarks: jointed links,
 * pin joints, a palm plate with fasteners, and tendons (fishing line)
 * running from each fingertip down through the palm.
 */
export function roboticHand(p: Pt[], scale: number, uid: string, tendonCls = 'anim-draw', include: number[] = [0, 1, 2, 3, 4]): string {
  const fingers = FINGERS.filter((_, i) => include.includes(i));
  const widthOf = (idx: number[]) => WIDTHS[FINGERS.indexOf(idx)];
  const link = (a: Pt, b: Pt, w: number) => {
    // Shorten each link a little so joints read as separate parts.
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    const g = Math.min(6 * scale, len * 0.18);
    const ax = a[0] + (dx / len) * g;
    const ay = a[1] + (dy / len) * g;
    const bx = b[0] - (dx / len) * g;
    const by = b[1] - (dy / len) * g;
    // Layered solid strokes (a bounding-box gradient would vanish on vertical links).
    return `<line x1="${f(ax)}" y1="${f(ay)}" x2="${f(bx)}" y2="${f(by)}" stroke="#4a5570" stroke-width="${f(w)}" stroke-linecap="round"/>
      <line x1="${f(ax)}" y1="${f(ay)}" x2="${f(bx)}" y2="${f(by)}" stroke="#a9b5ce" stroke-width="${f(w * 0.62)}" stroke-linecap="round"/>
      <line x1="${f(ax)}" y1="${f(ay)}" x2="${f(bx)}" y2="${f(by)}" stroke="${C.ice}" stroke-opacity="0.35" stroke-width="${f(w * 0.18)}" stroke-linecap="round" transform="translate(${f(-w * 0.18)},0)"/>`;
  };
  const palm: Pt[] = [
    [p[5][0] - 12 * scale, p[5][1]],
    [p[9][0], p[9][1] - 4 * scale],
    [p[17][0] + 12 * scale, p[17][1]],
    [p[0][0] + 44 * scale, p[0][1] + 8 * scale],
    [p[0][0] - 44 * scale, p[0][1] + 8 * scale],
  ];
  const cx = palm.reduce((s, q) => s + q[0], 0) / palm.length;
  const cy = palm.reduce((s, q) => s + q[1], 0) / palm.length;
  const links = fingers.map((idx) => {
    const chain = idx.map((k) => p[k]);
    let out = '';
    for (let k = 0; k < chain.length - 1; k++) out += link(chain[k], chain[k + 1], widthOf(idx) * scale * 0.9);
    return out;
  }).join('');
  const joints = FINGERS.flatMap((idx) => (fingers.includes(idx) ? idx.slice(0, 3) : idx.slice(0, 1)))
    .map((k) => `<circle cx="${f(p[k][0])}" cy="${f(p[k][1])}" r="${f(6.5 * scale)}" fill="${C.plum}" stroke="${C.steel}" stroke-width="${f(2 * scale)}"/><circle cx="${f(p[k][0])}" cy="${f(p[k][1])}" r="${f(2 * scale)}" fill="${C.ice}"/>`)
    .join('');
  const tips = fingers.map((idx) => p[idx[idx.length - 1]]);
  // Tendons: from fingertip back along the finger, through the palm to the wrist.
  const tendons = fingers.map((idx, i) => {
    const pts = [...idx].reverse().map((k) => p[k]);
    const off = 5 * scale;
    const d = pts.map(([x, y], k) => `${k ? 'L' : 'M'}${f(x + off)} ${f(y)}`).join('') + `L${f(p[0][0] + (i - 2) * 9 * scale)} ${f(p[0][1] + 34 * scale)}`;
    return `<path d="${d}" pathLength="1"/>`;
  }).join('');
  return `
    <defs>
      <linearGradient id="${uid}-metal" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#5d6a86"/><stop offset="0.45" stop-color="#b8c4dc"/><stop offset="1" stop-color="#4a5570"/>
      </linearGradient>
    </defs>
    <g>
      <polygon points="${pl(palm)}" fill="#3a4560" stroke="${C.steel}" stroke-width="${f(3 * scale)}" stroke-linejoin="round"/>
      <polygon points="${pl(palm)}" fill="none" stroke="#1d2233" stroke-width="${f(14 * scale)}" stroke-linejoin="round" opacity="0.35"/>
      ${[0.3, 0.7].map((t) => `<circle cx="${f(cx + (t - 0.5) * 50 * scale)}" cy="${f(cy + 6 * scale)}" r="${f(3.2 * scale)}" fill="${C.steel}"/>`).join('')}
      ${links}
      ${joints}
      ${tips.map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(4 * scale)}" fill="${C.steel}"/>`).join('')}
      <g class="${tendonCls}" style="--d:500ms" fill="none" stroke="${C.ice}" stroke-width="${f(1.3 * scale)}" stroke-opacity="0.85" stroke-linejoin="round">${tendons}</g>
    </g>`;
}
