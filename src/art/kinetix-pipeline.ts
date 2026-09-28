// KINETIX role illustration: the closed inverse-design loop the CTO built.
// Target release curve → model → lattice geometry → printed scaffold tested
// in a vial → measured release feeding back.
import { C, baseDefs, f, type Art } from './kit';

const art: Art = {
  viewBox: '0 0 1000 1000',
  render(uid) {
    const cx = 500;
    const cy = 500;
    const R = 300;
    const station = (a: number) => ({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R });
    const top = station(-Math.PI / 2);
    const right = station(0);
    const bottom = station(Math.PI / 2);
    const left = station(Math.PI);

    // Arcs between stations with arrowheads (clockwise).
    const arcs = [0, 1, 2, 3]
      .map((i) => {
        const a0 = -Math.PI / 2 + i * (Math.PI / 2) + 0.36;
        const a1 = a0 + Math.PI / 2 - 0.72;
        const p0 = { x: cx + Math.cos(a0) * R, y: cy + Math.sin(a0) * R };
        const p1 = { x: cx + Math.cos(a1) * R, y: cy + Math.sin(a1) * R };
        const tx = -Math.sin(a1);
        const ty = Math.cos(a1);
        const nx = Math.cos(a1);
        const ny = Math.sin(a1);
        const head = `M${f(p1.x - tx * 14 + nx * 8)} ${f(p1.y - ty * 14 + ny * 8)}L${f(p1.x)} ${f(p1.y)}L${f(p1.x - tx * 14 - nx * 8)} ${f(p1.y - ty * 14 - ny * 8)}`;
        return `<g class="anim-draw" style="--d:${300 + i * 250}ms">
          <path d="M${f(p0.x)} ${f(p0.y)}A${R} ${R} 0 0 1 ${f(p1.x)} ${f(p1.y)}" pathLength="1" fill="none" stroke="${C.arc}" stroke-width="3"/>
          <path d="${head}" fill="none" stroke="${C.arc}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </g>`;
      })
      .join('');

    const disc = (p: { x: number; y: number }) =>
      `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="112" fill="${C.plum}" stroke="${C.lilac}" stroke-opacity="0.35" stroke-width="2"/>`;

    // Station 1: target release curve with a tolerance band.
    const curve = (x0: number, y0: number, w: number, h: number, tau: number) =>
      Array.from({ length: 31 }, (_, i) => {
        const t = i / 30;
        return `${i ? 'L' : 'M'}${f(x0 + t * w)} ${f(y0 - (1 - Math.exp(-t / tau)) * h)}`;
      }).join('');
    const target = `
      <path d="M${top.x - 70} ${top.y - 60}V${top.y + 50}H${top.x + 76}" stroke="${C.mist}" stroke-opacity="0.6" stroke-width="2" fill="none"/>
      <path d="${curve(top.x - 70, top.y + 50, 140, 96, 0.3)}" stroke="${C.brassHi}" stroke-width="3.5" fill="none"/>
      <path d="${curve(top.x - 70, top.y + 50, 140, 96, 0.3)}" stroke="${C.brassHi}" stroke-opacity="0.18" stroke-width="16" fill="none"/>`;

    // Station 2: model (layered network).
    const cols = [3, 4, 2];
    const nodes = cols.map((n, ci) => Array.from({ length: n }, (_, k) => ({ x: right.x - 56 + ci * 56, y: right.y + (k - (n - 1) / 2) * 36 })));
    const edges = nodes.slice(0, -1).flatMap((col, ci) => col.flatMap((a) => nodes[ci + 1].map((b) => `<line x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}"/>`))).join('');
    const model = `<g stroke="${C.arc}" stroke-opacity="0.35" stroke-width="1.5">${edges}</g>
      <g fill="${C.ink}" stroke="${C.ice}" stroke-width="2.5">${nodes.flat().map((n) => `<circle cx="${f(n.x)}" cy="${f(n.y)}" r="9"/>`).join('')}</g>`;

    // Station 3: lattice geometry (top view grid with varied strand spacing).
    const lattice = Array.from({ length: 6 }, (_, i) => {
      const o = -62 + i * 25;
      return `<line x1="${f(bottom.x - 70)}" y1="${f(bottom.y + o)}" x2="${f(bottom.x + 70)}" y2="${f(bottom.y + o)}" stroke="#7c69c6" stroke-width="10" stroke-linecap="round"/>
        <line x1="${f(bottom.x + o)}" y1="${f(bottom.y - 70)}" x2="${f(bottom.x + o)}" y2="${f(bottom.y + 70)}" stroke="#9884dc" stroke-width="10" stroke-linecap="round"/>`;
    }).join('');

    // Station 4: bench test — vial with scaffold immersed and a sampling pipette.
    const vial = `
      <path d="M${left.x - 40} ${left.y - 70}V${left.y + 60}a40 30 0 0 0 80 0V${left.y - 70}" fill="${C.arc}" fill-opacity="0.08" stroke="${C.ice}" stroke-opacity="0.7" stroke-width="3"/>
      <path d="M${left.x - 40} ${left.y - 10}H${left.x + 40}V${left.y + 60}a40 30 0 0 1 -80 0Z" fill="${C.teal}" fill-opacity="0.22"/>
      <rect x="${left.x - 46}" y="${left.y - 86}" width="92" height="18" rx="5" fill="${C.steel}"/>
      <g stroke="#9884dc" stroke-width="5" stroke-linecap="round">
        ${[0, 1, 2].map((i) => `<line x1="${left.x - 22}" y1="${left.y + 24 + i * 12}" x2="${left.x + 22}" y2="${left.y + 24 + i * 12}"/>`).join('')}
      </g>
      ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${left.x - 24 + i * 12}" cy="${left.y + 6 - (i % 2) * 9}" r="3" fill="${C.teal}"/>`).join('')}`;

    // Centre: predicted vs measured overlay — the loop's check.
    const centre = `
      <circle cx="${cx}" cy="${cy}" r="120" fill="${C.ink}" stroke="${C.arc}" stroke-opacity="0.4" stroke-width="1.5"/>
      <circle cx="${cx}" cy="${cy}" r="132" fill="none" stroke="${C.arc}" stroke-opacity="0.15" stroke-width="1"/>
      <path d="${curve(cx - 70, cy + 50, 140, 96, 0.3)}" stroke="${C.arc}" stroke-width="3" fill="none"/>
      ${[0.1, 0.22, 0.36, 0.52, 0.7, 0.9].map((t) => `<circle cx="${f(cx - 70 + t * 140)}" cy="${f(cy + 50 - (1 - Math.exp(-t / 0.3)) * 96 + (t * 13 % 4 - 2))}" r="5" fill="${C.chalk}"/>`).join('')}`;

    return `${baseDefs(uid)}
      <rect width="1000" height="1000" fill="url(#${uid}-bg)"/>
      <rect width="1000" height="1000" fill="url(#${uid}-grid)"/>
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.arc}" stroke-opacity="0.12" stroke-width="30" filter="url(#${uid}-soft)"/>
      ${arcs}
      ${[top, right, bottom, left].map(disc).join('')}
      <g class="anim-fade" style="--d:100ms">${target}</g>
      <g class="anim-fade" style="--d:350ms">${model}</g>
      <g class="anim-fade" style="--d:600ms">${lattice}</g>
      <g class="anim-fade" style="--d:850ms">${vial}</g>
      <g class="anim-fade" style="--d:1100ms">${centre}</g>
    `;
  },
};

export default art;
