// Duchenne muscular dystrophy research: a gene-interaction network scored by
// graph attention, with one highlighted candidate node (NFATC4 in the study),
// linked to a ribbon protein carrying seven residue clusters. Labels are HTML.
import { C, baseDefs, f, rng, type Art } from './kit';

const CLUSTER_COLORS = ['#7fb2ff', '#5fd0c4', '#e07a9a', '#9f86d6', '#f0c26b', '#d8e6ff', '#c49bff'];

const art: Art = {
  viewBox: '0 0 1600 900',
  compactViewBox: '100 0 1200 900',
  render(uid) {
    const rand = rng(41);
    // Network nodes on a jittered disc; candidate near the right edge.
    const cx = 430;
    const cy = 450;
    const nodes = Array.from({ length: 30 }, (_, i) => {
      const a = i * 2.39996; // golden-angle spiral
      const r = 40 + Math.sqrt(i / 30) * 290;
      return { x: cx + Math.cos(a) * r * 1.05 + (rand() - 0.5) * 30, y: cy + Math.sin(a) * r * 0.95 + (rand() - 0.5) * 30, s: 5 + rand() * 9 };
    });
    const cand = { x: 690, y: 400, s: 18 };
    nodes.push(cand);
    const ci = nodes.length - 1;
    const edges: Array<[number, number, number]> = [];
    nodes.forEach((a, i) => {
      nodes.forEach((b, j) => {
        if (j <= i) return;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 150 && rand() < 0.55) edges.push([i, j, d]);
      });
    });
    // Attention edges: strongest paths into the candidate.
    const attn = nodes
      .map((n, i) => ({ i, d: Math.hypot(n.x - cand.x, n.y - cand.y) }))
      .filter((e) => e.i !== ci)
      .sort((a, b) => a.d - b.d)
      .slice(0, 7);

    const edgeSvg = edges.map(([i, j]) => `<line x1="${f(nodes[i].x)}" y1="${f(nodes[i].y)}" x2="${f(nodes[j].x)}" y2="${f(nodes[j].y)}"/>`).join('');
    const attnSvg = attn
      .map(
        (e, k) =>
          `<g class="anim-draw" style="--d:${500 + k * 90}ms"><path d="M${f(nodes[e.i].x)} ${f(nodes[e.i].y)}L${cand.x} ${cand.y}" pathLength="1" stroke="${C.brassHi}" stroke-width="${f(3.4 - k * 0.3)}" stroke-opacity="${f(0.95 - k * 0.08)}"/></g>`,
      )
      .join('');
    const nodeSvg = nodes
      .slice(0, -1)
      .map((n) => `<circle cx="${f(n.x)}" cy="${f(n.y)}" r="${f(n.s)}" fill="${C.plum2}" stroke="${C.arc}" stroke-width="2"/>`)
      .join('');

    // Ribbon protein: backbone path with helices (coils), strands (arrows), loops.
    const px = 1180;
    const py = 450;
    const helix = (x0: number, y0: number, x1: number, y1: number, turns: number) => {
      const dx = x1 - x0;
      const dy = y1 - y0;
      const len = Math.hypot(dx, dy);
      const nx = -dy / len;
      const ny = dx / len;
      let d = '';
      let back = '';
      const steps = turns * 16;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const w = Math.sin(t * turns * Math.PI * 2) * 26;
        const x = x0 + dx * t + nx * w;
        const y = y0 + dy * t + ny * w;
        d += `${i ? 'L' : 'M'}${f(x)} ${f(y)}`;
        if (Math.cos(t * turns * Math.PI * 2) < 0) back += `<circle cx="${f(x)}" cy="${f(y)}" r="6" fill="#3a2a66"/>`;
      }
      return `${back}<path d="${d}" stroke="#8d7ad4" stroke-width="13" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="${d}" stroke="#d6ccff" stroke-opacity="0.45" stroke-width="3" fill="none"/>`;
    };
    const strand = (x0: number, y0: number, x1: number, y1: number) => {
      const ang = Math.atan2(y1 - y0, x1 - x0);
      const len = Math.hypot(x1 - x0, y1 - y0);
      return `<g transform="translate(${x0} ${y0}) rotate(${f((ang * 180) / Math.PI)})">
        <path d="M0 -12H${f(len - 30)}V-24L${f(len)} 0L${f(len - 30)} 24V12H0Z" fill="${C.teal}" fill-opacity="0.5" stroke="${C.teal}" stroke-width="2.5" stroke-linejoin="round"/>
      </g>`;
    };
    const loop = (d: string) => `<path d="${d}" stroke="${C.lilac}" stroke-width="7" fill="none" stroke-linecap="round"/>`;

    const protein = `
      ${loop(`M${px - 250} ${py + 170}C${px - 300} ${py + 60} ${px - 230} ${py - 40} ${px - 190} ${py - 60}`)}
      ${helix(px - 190, py - 60, px + 10, py - 190, 4)}
      ${loop(`M${px + 10} ${py - 190}C${px + 120} ${py - 250} ${px + 220} ${py - 150} ${px + 180} ${py - 70}`)}
      ${strand(px + 180, py - 70, px - 40, py - 20)}
      ${loop(`M${px - 40} ${py - 20}C${px - 110} ${py} ${px - 110} ${py + 50} ${px - 50} ${py + 60}`)}
      ${strand(px - 50, py + 60, px + 170, py + 30)}
      ${loop(`M${px + 170} ${py + 30}C${px + 260} ${py + 40} ${px + 260} ${py + 150} ${px + 180} ${py + 170}`)}
      ${helix(px + 180, py + 170, px - 60, py + 250, 4)}
      ${loop(`M${px - 60} ${py + 250}C${px - 130} ${py + 270} ${px - 190} ${py + 240} ${px - 250} ${py + 170}`)}`;

    const clusters = [
      [px - 150, py - 110],
      [px + 60, py - 220],
      [px + 200, py - 130],
      [px + 40, py - 40],
      [px - 90, py + 40],
      [px + 210, py + 90],
      [px + 40, py + 220],
    ]
      .map(
        ([x, y], i) => `<g class="anim-pop" style="--d:${1100 + i * 110}ms">
          <circle cx="${x}" cy="${y}" r="34" fill="${CLUSTER_COLORS[i]}" opacity="0.22"/>
          ${[0, 1, 2, 3].map((k) => `<circle cx="${f(x + Math.cos(k * 1.7 + i) * 14)}" cy="${f(y + Math.sin(k * 1.7 + i) * 12)}" r="7" fill="${CLUSTER_COLORS[i]}"/>`).join('')}
        </g>`,
      )
      .join('');

    return `${baseDefs(uid)}
      <rect x="-100" y="-100" width="1800" height="1100" fill="url(#${uid}-bg)"/>
      <rect x="-100" y="-100" width="1800" height="1100" fill="url(#${uid}-grid)"/>
      <circle cx="${cx}" cy="${cy}" r="330" fill="${C.arc}" opacity="0.05" filter="url(#${uid}-soft)"/>
      <circle cx="${px}" cy="${py}" r="320" fill="${C.violet}" opacity="0.2" filter="url(#${uid}-soft)"/>
      <g class="anim-fade" stroke="${C.arc}" stroke-opacity="0.22" stroke-width="1.4">${edgeSvg}</g>
      ${attnSvg}
      <g class="anim-fade" style="--d:200ms">${nodeSvg}</g>
      <g class="anim-draw" style="--d:900ms">
        <path d="M${cand.x + 20} ${cand.y}C${cand.x + 140} ${cand.y - 40} ${px - 330} ${py - 140} ${px - 190} ${py - 110}" pathLength="1" stroke="${C.brassHi}" stroke-width="3" stroke-dasharray="1" fill="none" opacity="0.8"/>
      </g>
      <circle cx="${cand.x}" cy="${cand.y}" r="${cand.s + 16}" fill="none" stroke="${C.brassHi}" stroke-opacity="0.35" stroke-width="2"/>
      <circle cx="${cand.x}" cy="${cand.y}" r="${cand.s}" fill="${C.brassHi}" filter="url(#${uid}-glow)"/>
      <g class="anim-fade" style="--d:700ms">${protein}</g>
      ${clusters}
    `;
  },
};

export default art;
