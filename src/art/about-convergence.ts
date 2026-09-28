// About / education: four strands of Akshay's work converge on one glowing
// centre — circuit traces (computing/ECE), a DNA double helix (biology), a
// robotic joint (engineering), and a neural-network lattice (ML). No logos.
import { C, baseDefs, f, type Art } from './kit';

const art: Art = {
  viewBox: '0 0 1000 1000',
  render(uid) {
    const cx = 500;
    const cy = 500;

    // Circuit traces from the top-left.
    const traces = [
      'M90 160H260L330 230V330L420 420',
      'M90 230H220L280 290V380L430 450',
      'M160 90V190L250 280',
      'M260 90V170L300 210V300L445 440',
    ]
      .map((d, i) => `<g class="anim-draw" style="--d:${i * 120}ms"><path d="${d}" pathLength="1" stroke="${C.arc}" stroke-width="4" fill="none" stroke-linejoin="round"/></g>`)
      .join('');
    const vias = [
      [90, 160],
      [90, 230],
      [160, 90],
      [260, 90],
      [330, 330],
      [280, 380],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="${C.ink}" stroke="${C.arc}" stroke-width="4"/>`)
      .join('');

    // DNA helix from the bottom-left toward the centre.
    let s1 = '';
    let s2 = '';
    let rungs = '';
    const n = 60;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = 110 + t * 330;
      const y = 880 - t * 330;
      const w = Math.sin(t * Math.PI * 4) * 44;
      const nx = 0.707;
      const ny = 0.707;
      s1 += `${i ? 'L' : 'M'}${f(x + nx * w)} ${f(y + ny * w)}`;
      s2 += `${i ? 'L' : 'M'}${f(x - nx * w)} ${f(y - ny * w)}`;
      if (i % 4 === 2) rungs += `<line x1="${f(x + nx * w)}" y1="${f(y + ny * w)}" x2="${f(x - nx * w)}" y2="${f(y - ny * w)}"/>`;
    }
    const dna = `<g stroke="${C.teal}" stroke-opacity="0.55" stroke-width="3">${rungs}</g>
      <path d="${s1}" stroke="${C.teal}" stroke-width="5" fill="none"/><path d="${s2}" stroke="${C.rose}" stroke-width="5" fill="none"/>`;

    // Robotic joint from the right: two links on a pin joint with a bolt circle.
    const joint = `
      <g>
        <path d="M900 700L700 600" stroke="#4a5570" stroke-width="54" stroke-linecap="round"/>
        <path d="M900 700L700 600" stroke="#a9b5ce" stroke-width="34" stroke-linecap="round"/>
        <path d="M700 600L590 520" stroke="#4a5570" stroke-width="44" stroke-linecap="round"/>
        <path d="M700 600L590 520" stroke="#a9b5ce" stroke-width="26" stroke-linecap="round"/>
        <circle cx="700" cy="600" r="44" fill="#2a2f45" stroke="${C.steel}" stroke-width="4"/>
        ${Array.from({ length: 6 }, (_, i) => `<circle cx="${f(700 + Math.cos((i * Math.PI) / 3) * 28)}" cy="${f(600 + Math.sin((i * Math.PI) / 3) * 28)}" r="4.5" fill="${C.steel}"/>`).join('')}
        <circle cx="700" cy="600" r="12" fill="${C.ice}"/>
        <path d="M646 560A66 66 0 0 1 760 572" stroke="${C.brassHi}" stroke-width="3" fill="none"/>
      </g>`;

    // Neural lattice from the top-right.
    const layers = [
      Array.from({ length: 4 }, (_, i) => [900, 120 + i * 80]),
      Array.from({ length: 3 }, (_, i) => [780, 170 + i * 80]),
      Array.from({ length: 2 }, (_, i) => [660, 250 + i * 80]),
    ];
    const nnEdges = layers
      .slice(0, -1)
      .flatMap((l, i) => l.flatMap(([ax, ay]) => layers[i + 1].map(([bx, by]) => `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}"/>`)))
      .join('');
    const nnNodes = layers.flat().map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="${C.ink}" stroke="${C.lilac}" stroke-width="3"/>`).join('');
    const nnToCore = `<path d="M660 330C620 360 580 400 548 452" stroke="${C.lilac}" stroke-width="3" fill="none"/>`;

    return `${baseDefs(uid)}
      <rect width="1000" height="1000" fill="url(#${uid}-bg)"/>
      <rect width="1000" height="1000" fill="url(#${uid}-grid)"/>
      <circle cx="${cx}" cy="${cy}" r="210" fill="${C.arc}" opacity="0.1" filter="url(#${uid}-soft)"/>
      ${traces}${vias}
      <g class="anim-fade" style="--d:200ms">${dna}</g>
      <g class="anim-fade" style="--d:400ms">${joint}</g>
      <g class="anim-fade" style="--d:600ms"><g stroke="${C.lilac}" stroke-opacity="0.4" stroke-width="2">${nnEdges}</g>${nnNodes}${nnToCore}</g>
      <g class="anim-pop" style="--d:900ms">
        <circle cx="${cx}" cy="${cy}" r="74" fill="${C.ink}" stroke="url(#${uid}-arc)" stroke-width="5" filter="url(#${uid}-glow)"/>
        <circle cx="${cx}" cy="${cy}" r="92" fill="none" stroke="${C.arc}" stroke-opacity="0.3" stroke-width="1.5"/>
        <polygon points="${[0, 1, 2, 3, 4].map((k) => { const a = -Math.PI / 2 + (k * 4 * Math.PI) / 5; return `${f(cx + Math.cos(a) * 56)},${f(cy + Math.sin(a) * 56)}`; }).join(" ")}" fill="none" stroke="${C.ice}" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="${cx}" cy="${cy}" r="10" fill="${C.brassHi}"/>
      </g>
    `;
  },
};

export default art;
