// NSCLC multi-omics: four distinguishable data streams (RNA-seq expression,
// copy-number steps, mutation lollipops, RPPA protein heatmap) converge through
// an autoencoder bottleneck into an ensemble classifier panel. No patient data,
// identifiers, or outcome numbers.
import { C, baseDefs, f, rng, type Art } from './kit';

const art: Art = {
  viewBox: '0 0 1600 900',
  compactViewBox: '0 -150 1600 1200',
  render(uid) {
    const rand = rng(23);
    const bands = [150, 340, 530, 720];
    const x0 = 90;
    const x1 = 560;

    // 1. RNA-seq expression bars.
    const rna = Array.from({ length: 30 }, (_, i) => {
      const h = 12 + Math.abs(Math.sin(i * 1.7) + rand() - 0.4) * 44;
      return `<rect x="${x0 + i * 15.5}" y="${f(bands[0] + 40 - h)}" width="10" height="${f(h)}" rx="2" fill="${C.arc}" opacity="${f(0.55 + rand() * 0.45)}"/>`;
    }).join('');

    // 2. CNV step trace around a baseline (gains up, losses down).
    let cnv = `M${x0} ${bands[1]}`;
    const segs = [0, 0.6, 0.6, 0, -0.7, -0.7, 0, 0, 1, 1, 0.4, 0, -0.4, 0];
    segs.forEach((v, i) => {
      const x = x0 + ((i + 1) / segs.length) * (x1 - x0);
      cnv += `V${f(bands[1] - v * 48)}H${f(x)}`;
    });
    const cnvPath = `<path d="M${x0} ${bands[1]}H${x1}" stroke="${C.mist}" stroke-opacity="0.35" stroke-dasharray="4 6"/>
      <path d="${cnv}" stroke="${C.lilac}" stroke-width="3.5" fill="none" stroke-linejoin="round"/>`;

    // 3. Mutation lollipops on a gene track.
    const lolli = Array.from({ length: 11 }, () => {
      const x = x0 + 20 + rand() * (x1 - x0 - 40);
      const h = 18 + rand() * 46;
      return `<line x1="${f(x)}" y1="${bands[2] + 26}" x2="${f(x)}" y2="${f(bands[2] + 26 - h)}" stroke="${C.rose}" stroke-width="2"/>
        <circle cx="${f(x)}" cy="${f(bands[2] + 26 - h)}" r="${f(5 + rand() * 5)}" fill="${C.rose}"/>`;
    }).join('');
    const track = `<rect x="${x0}" y="${bands[2] + 26}" width="${x1 - x0}" height="14" rx="7" fill="${C.plum3}"/>
      <rect x="${x0 + 110}" y="${bands[2] + 26}" width="90" height="14" rx="4" fill="${C.rose}" opacity="0.35"/>
      <rect x="${x0 + 290}" y="${bands[2] + 26}" width="60" height="14" rx="4" fill="${C.rose}" opacity="0.35"/>`;

    // 4. RPPA heatmap.
    const heat = Array.from({ length: 5 }, (_, r) =>
      Array.from({ length: 24 }, (_, c) => {
        const v = 0.5 + 0.5 * Math.sin(c * 0.6 + r * 1.3 + rand() * 1.2);
        return `<rect x="${x0 + c * 19.5}" y="${bands[3] - 48 + r * 19.5}" width="17" height="17" rx="2" fill="${C.teal}" opacity="${f(0.15 + v * 0.85)}"/>`;
      }).join(''),
    ).join('');

    const colors = [C.arc, C.lilac, C.rose, C.teal];

    // Converging ribbons into the encoder.
    const enc = { x: 830, y: 450 };
    const ribbons = bands
      .map((b, i) => {
        const endY = enc.y - 90 + i * 60;
        return `<g class="anim-draw" style="--d:${300 + i * 150}ms">
          <path d="M${x1 + 30} ${b}C${x1 + 150} ${b} ${enc.x - 150} ${endY} ${enc.x - 40} ${endY}" pathLength="1" stroke="${colors[i]}" stroke-width="10" stroke-opacity="0.3" fill="none" stroke-linecap="round"/>
          <path d="M${x1 + 30} ${b}C${x1 + 150} ${b} ${enc.x - 150} ${endY} ${enc.x - 40} ${endY}" pathLength="1" stroke="${colors[i]}" stroke-width="2.5" fill="none"/>
        </g>`;
      })
      .join('');

    // Autoencoder: 8 → 5 → 3 (latent) columns.
    const cols = [
      { x: enc.x, n: 8 },
      { x: enc.x + 80, n: 5 },
      { x: enc.x + 160, n: 3 },
    ];
    const pts = cols.map((c) => Array.from({ length: c.n }, (_, k) => ({ x: c.x, y: enc.y + (k - (c.n - 1) / 2) * 36 })));
    const edges = pts.slice(0, -1).flatMap((col, i) => col.flatMap((a) => pts[i + 1].map((b) => `<line x1="${a.x}" y1="${f(a.y)}" x2="${b.x}" y2="${f(b.y)}"/>`))).join('');
    const hourglass = `<path d="M${enc.x - 30} ${enc.y - 160}L${enc.x + 190} ${enc.y - 70}V${enc.y + 70}L${enc.x - 30} ${enc.y + 160}Z" fill="${C.plum2}" stroke="${C.arc}" stroke-opacity="0.35" stroke-width="1.5" stroke-linejoin="round"/>`;
    const nodeDots = pts
      .map((col, i) => col.map((p) => `<circle cx="${p.x}" cy="${f(p.y)}" r="${i === 2 ? 11 : 8}" fill="${i === 2 ? C.ice : C.ink}" stroke="${C.ice}" stroke-width="2" ${i === 2 ? `filter="url(#${uid}-glow)"` : ''}/>`).join(''))
      .join('');

    // Classifier panel: selected-feature bars → ensemble of trees → meta learner → two outcome nodes.
    const px = 1110;
    const py = 170;
    const bars = Array.from({ length: 7 }, (_, i) => `<rect x="${px + 40}" y="${py + 50 + i * 30}" width="${f(230 - i * 26)}" height="16" rx="8" fill="${C.arc}" opacity="${f(0.95 - i * 0.09)}"/>`).join('');
    const tree = (x: number, y: number) =>
      `<path d="M${x} ${y - 30}L${x - 22} ${y + 10}H${x + 22}Z" fill="none" stroke="${C.teal}" stroke-width="2.5" stroke-linejoin="round"/><path d="M${x} ${y + 10}V${y + 24}" stroke="${C.teal}" stroke-width="2.5"/>
       <circle cx="${x}" cy="${y - 30}" r="4" fill="${C.teal}"/><circle cx="${x - 22}" cy="${y + 10}" r="4" fill="${C.teal}"/><circle cx="${x + 22}" cy="${y + 10}" r="4" fill="${C.teal}"/>`;
    const trees = [0, 1, 2].map((i) => tree(px + 70 + i * 90, py + 350)).join('');
    const meta = { x: px + 160, y: py + 470 };

    return `${baseDefs(uid)}
      <rect x="-100" y="-200" width="1800" height="1300" fill="url(#${uid}-bg)"/>
      <rect x="-100" y="-200" width="1800" height="1300" fill="url(#${uid}-grid)"/>
      ${bands.map((b, i) => `<rect x="${x0 - 30}" y="${b - 80}" width="${x1 - x0 + 60}" height="130" rx="18" fill="${C.plum}" stroke="${colors[i]}" stroke-opacity="0.35" stroke-width="1.5"/>`).join('')}
      <g class="anim-fade">${rna}</g>
      <g class="anim-fade" style="--d:120ms">${cnvPath}</g>
      <g class="anim-fade" style="--d:240ms">${track}${lolli}</g>
      <g class="anim-fade" style="--d:360ms">${heat}</g>
      ${ribbons}
      <g class="anim-fade" style="--d:800ms">
        ${hourglass}
        <g stroke="${C.arc}" stroke-opacity="0.25" stroke-width="1.2">${edges}</g>
        ${nodeDots}
      </g>
      <g class="anim-draw" style="--d:1100ms"><path d="M${enc.x + 200} ${enc.y}C${px - 60} ${enc.y} ${px - 60} ${py + 150} ${px} ${py + 150}" pathLength="1" stroke="${C.ice}" stroke-width="2.5" fill="none"/></g>
      <g class="anim-fade" style="--d:1200ms">
        <rect x="${px}" y="${py}" width="330" height="590" rx="22" fill="#130c1b" stroke="${C.lilac}" stroke-opacity="0.35" stroke-width="2"/>
        ${bars}
        <path d="M${px + 30} ${py + 290}H${px + 300}" stroke="${C.lilac}" stroke-opacity="0.2"/>
        ${trees}
        ${[0, 1, 2].map((i) => `<path d="M${px + 70 + i * 90} ${py + 380}L${meta.x} ${meta.y - 22}" stroke="${C.teal}" stroke-opacity="0.6" stroke-width="2"/>`).join('')}
        <circle cx="${meta.x}" cy="${meta.y}" r="22" fill="${C.plum3}" stroke="${C.ice}" stroke-width="2.5"/>
        <path d="M${meta.x} ${meta.y + 22}L${meta.x - 60} ${meta.y + 70}M${meta.x} ${meta.y + 22}L${meta.x + 60} ${meta.y + 70}" stroke="${C.ice}" stroke-opacity="0.6" stroke-width="2"/>
        <circle cx="${meta.x - 60}" cy="${meta.y + 84}" r="14" fill="none" stroke="${C.mist}" stroke-width="2.5"/>
        <circle cx="${meta.x + 60}" cy="${meta.y + 84}" r="14" fill="${C.brassHi}" filter="url(#${uid}-glow)"/>
      </g>
    `;
  },
};

export default art;
