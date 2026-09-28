// An energy "sigil" traced over the transmutation circle, built from the same
// node measurements as the hotspots so it lines up with the artwork: outer
// rings, the pentagram and pentagon through the five nodes, rune rings at each
// node, and a centre-to-node energy path per section.
//
// Two copies are used: one inside the hub camera (viewBox "meet", aligned to
// the contained artwork) and one over the intro backdrop (viewBox "slice",
// aligned to the cover-fitted blurred circle).
import type { SectionId } from '../../content/types';
import { CIRCLE_CENTER, CIRCLE_IMAGE, NODES } from '../../stage/nodes';

const R = 304; // outer ring radius in image px (centre → node distance)
const f = (n: number) => n.toFixed(1);

/** Double-stroked path: wide soft glow + thin bright core (no SVG filters). */
function glowPath(d: string, cls: string, core = 2.4): string {
  return `<g class="${cls}">
    <path d="${d}" pathLength="1" class="draw-path sg-glow" stroke-width="${core * 5}"/>
    <path d="${d}" pathLength="1" class="draw-path sg-core" stroke-width="${core}"/>
  </g>`;
}

const circlePath = (cx: number, cy: number, r: number) =>
  `M${f(cx + r)} ${f(cy)}A${r} ${r} 0 1 1 ${f(cx - r)} ${f(cy)}A${r} ${r} 0 1 1 ${f(cx + r)} ${f(cy)}`;

export function sigilMarkup(fit: 'meet' | 'slice', idPrefix: string): string {
  const { x: cx, y: cy } = CIRCLE_CENTER;
  const pts = NODES.map((n) => [n.node.x, n.node.y] as const);
  const star = [0, 2, 4, 1, 3, 0].map((i) => `${f(pts[i][0])} ${f(pts[i][1])}`).join('L');
  const pentagon = [0, 1, 2, 3, 4, 0].map((i) => `${f(pts[i][0])} ${f(pts[i][1])}`).join('L');

  const runes = NODES.map((n, i) => {
    const r1 = n.node.r * 0.95;
    return `<g class="sg-rune" data-node="${n.id}" style="--i:${i}">
      ${glowPath(circlePath(n.node.x, n.node.y, r1), 'sg-rune-ring', 2)}
      ${glowPath(circlePath(n.node.x, n.node.y, r1 * 0.55), 'sg-rune-inner', 1.4)}
    </g>`;
  }).join('');

  // Energy route to each node: centre → node, plus the two star edges that
  // meet at that node.
  const energy = NODES.map((n, i) => {
    const order = [0, 2, 4, 1, 3];
    const k = order.indexOf(i);
    const prev = pts[order[(k + 4) % 5]];
    const next = pts[order[(k + 1) % 5]];
    const d = `M${cx} ${cy}L${n.node.x} ${n.node.y}M${f(prev[0])} ${f(prev[1])}L${n.node.x} ${n.node.y}L${f(next[0])} ${f(next[1])}`;
    return `<g class="sg-energy" data-node="${n.id}">${glowPath(d, 'sg-energy-path', 3)}</g>`;
  }).join('');

  const ticks = Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2;
    const r0 = R + 16;
    const r1 = R + (i % 6 === 0 ? 34 : 24);
    return `M${f(cx + Math.cos(a) * r0)} ${f(cy + Math.sin(a) * r0)}L${f(cx + Math.cos(a) * r1)} ${f(cy + Math.sin(a) * r1)}`;
  }).join('');

  return `<svg class="sigil sigil--${fit}" id="${idPrefix}" viewBox="0 0 ${CIRCLE_IMAGE.width} ${CIRCLE_IMAGE.height}"
      preserveAspectRatio="xMidYMid ${fit}" aria-hidden="true" focusable="false">
    <g class="sg-rings">
      ${glowPath(circlePath(cx, cy, R), 'sg-ring sg-ring--outer', 3)}
      ${glowPath(circlePath(cx, cy, R + 44), 'sg-ring sg-ring--halo', 1.4)}
      ${glowPath(circlePath(cx, cy, 118), 'sg-ring sg-ring--inner', 2)}
      <path class="sg-ticks" d="${ticks}"/>
    </g>
    <g class="sg-star">
      ${glowPath(`M${star}`, 'sg-pentagram', 2.6)}
      ${glowPath(`M${pentagon}`, 'sg-pentagon', 1.6)}
    </g>
    <g class="sg-runes">${runes}</g>
    <g class="sg-energies">${energy}</g>
  </svg>`;
}

export function energyFor(root: ParentNode, id: SectionId): SVGGElement | null {
  return root.querySelector<SVGGElement>(`.sg-energy[data-node="${id}"]`);
}

/** Screen-space centre and scale of the circle for a sigil element's fit. */
export function sigilGeometry(svg: SVGSVGElement): { cx: number; cy: number; scale: number } {
  const rect = svg.getBoundingClientRect();
  const fit = svg.classList.contains('sigil--slice') ? Math.max : Math.min;
  const scale = fit(rect.width / CIRCLE_IMAGE.width, rect.height / CIRCLE_IMAGE.height);
  const ox = rect.left + (rect.width - CIRCLE_IMAGE.width * scale) / 2;
  const oy = rect.top + (rect.height - CIRCLE_IMAGE.height * scale) / 2;
  return { cx: ox + CIRCLE_CENTER.x * scale, cy: oy + CIRCLE_CENTER.y * scale, scale };
}

export const SIGIL_RADIUS = R;
