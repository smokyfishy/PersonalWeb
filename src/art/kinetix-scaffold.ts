// KINETIX scaffold concept: an isometric log-pile lattice (the 0°/90°
// layered strand structure typical of extrusion-printed scaffolds) with its
// top layers lifted away, a magnified cross-section showing drug diffusing
// out of the pores, and a release-curve inset. Abstract cavity outline behind.
import { C, baseDefs, f, rng, type Art } from './kit';

const COS = 0.866;
const L = 320; // lattice edge length
const N = 8; // strands per layer
const LAYERS = 8;
const DZ = 25;
const W = 17; // strand diameter
const LIFT = 120; // exploded offset of the top layers

const art: Art = {
  viewBox: '0 0 1600 900',
  compactViewBox: '170 0 1200 900',
  render(uid) {
    const ox = 540;
    const oy = 450;
    const iso = (x: number, y: number, z: number) => [ox + (x - y) * COS, oy + (x + y) * 0.5 - z] as const;
    const pitch = L / N;

    const strand = (a: readonly [number, number], b: readonly [number, number], along: 'x' | 'y') => {
      const body = along === 'x' ? '#7c69c6' : '#9884dc';
      return `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="#170d22" stroke-width="${W + 4}" stroke-linecap="round"/>
        <line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${body}" stroke-width="${W}" stroke-linecap="round"/>
        <line x1="${f(a[0])}" y1="${f(a[1] - W * 0.24)}" x2="${f(b[0])}" y2="${f(b[1] - W * 0.24)}" stroke="#e0d8ff" stroke-opacity="0.55" stroke-width="${W * 0.22}" stroke-linecap="round"/>`;
    };

    const layer = (k: number) => {
      const z = k * DZ + DZ / 2;
      let out = '';
      for (let i = 0; i < N; i++) {
        const c = pitch * (i + 0.5);
        out +=
          k % 2 === 0
            ? strand(iso(4, c, z), iso(L - 4, c, z), 'x') // strands along x, stepping in y
            : strand(iso(c, 4, z), iso(c, L - 4, z), 'y');
      }
      return out;
    };

    const base = Array.from({ length: LAYERS - 2 }, (_, k) => layer(k)).join('');
    const lifted = [LAYERS - 2, LAYERS - 1].map((k) => layer(k)).join('');

    // Guides from the lifted layers down to the block corners.
    const topZ = (LAYERS - 2) * DZ;
    const guides = [
      [0, 0],
      [L, 0],
      [0, L],
      [L, L],
    ]
      .map(([x, y]) => {
        const a = iso(x, y, topZ);
        const b = iso(x, y, topZ + LIFT);
        return `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}"/>`;
      })
      .join('');

    // Magnified cross-section (lens).
    const lx = 1140;
    const ly = 360;
    const lr = 205;
    const rand = rng(7);
    let section = '';
    const rows = [-2, -1, 0, 1, 2];
    rows.forEach((r) => {
      const y = ly + r * 62;
      if (r % 2 === 0) {
        for (let i = -4; i <= 4; i++) section += `<circle cx="${lx + i * 60}" cy="${y}" r="21" fill="#8d7ad4" stroke="#170d22" stroke-width="3"/><circle cx="${lx + i * 60 - 6}" cy="${y - 7}" r="5" fill="#e0d8ff" opacity="0.5"/>`;
      } else {
        section += `<rect x="${lx - lr - 20}" y="${y - 19}" width="${lr * 2 + 40}" height="38" rx="4" fill="#7462bf" stroke="#170d22" stroke-width="3"/><rect x="${lx - lr - 20}" y="${y - 14}" width="${lr * 2 + 40}" height="6" fill="#e0d8ff" opacity="0.28"/>`;
      }
    });
    // Drug molecules: dense inside the pores, thinning as they diffuse out.
    let drug = '';
    for (let i = 0; i < 70; i++) {
      const row = rows[Math.floor(rand() * 4)] + 0.5;
      const col = Math.floor(rand() * 8) - 3.5;
      const x = lx + col * 60 + (rand() - 0.5) * 18;
      const y = ly + row * 62 + (rand() - 0.5) * 10;
      drug += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(3 + rand() * 2.5)}" fill="${C.teal}" opacity="${f(0.55 + rand() * 0.45)}"/>`;
    }
    let escaping = '';
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI / 2 + (rand() - 0.2) * 1.6;
      const d = lr + 14 + rand() * 120;
      const x = lx + Math.cos(a) * d;
      const y = ly + Math.sin(a) * d;
      escaping += `<g class="anim-pop" style="--d:${900 + i * 40}ms"><circle cx="${f(x)}" cy="${f(y)}" r="${f(2.5 + rand() * 2)}" fill="${C.teal}" opacity="${f(0.7 - (d - lr) / 220)}"/></g>`;
    }

    const probe = iso(L, L * 0.55, 3 * DZ);

    // Release inset: cumulative release vs time; predicted (dashed) vs measured (dots),
    // plus a slower curve for a denser geometry.
    const px = 960;
    const py = 640;
    const pw = 560;
    const ph = 200;
    const curve = (tau: number) =>
      Array.from({ length: 41 }, (_, i) => {
        const t = i / 40;
        const v = 1 - Math.exp(-t / tau);
        return `${i ? 'L' : 'M'}${f(px + 40 + t * (pw - 70))} ${f(py + ph - 30 - v * (ph - 60))}`;
      }).join('');
    const measured = Array.from({ length: 9 }, (_, i) => {
      const t = (i + 1) / 10;
      const v = 1 - Math.exp(-t / 0.28) + (rand() - 0.5) * 0.03;
      return `<circle cx="${f(px + 40 + t * (pw - 70))}" cy="${f(py + ph - 30 - v * (ph - 60))}" r="4.5" fill="${C.chalk}"/>`;
    }).join('');

    return `${baseDefs(uid)}
      <rect x="-100" y="-100" width="1800" height="1100" fill="url(#${uid}-bg)"/>
      <rect x="-100" y="-100" width="1800" height="1100" fill="url(#${uid}-grid)"/>
      <clipPath id="${uid}-lens"><circle cx="${lx}" cy="${ly}" r="${lr}"/></clipPath>

      <path d="M250 330C230 200 390 110 560 120C760 130 860 230 870 380C880 560 800 760 600 790C400 820 250 720 230 560C220 470 262 420 250 330Z"
        fill="${C.plum3}" opacity="0.45"/>
      <path d="M250 330C230 200 390 110 560 120C760 130 860 230 870 380C880 560 800 760 600 790C400 820 250 720 230 560C220 470 262 420 250 330Z"
        fill="none" stroke="${C.lilac}" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="3 9"/>

      <ellipse cx="${ox}" cy="${oy + L * 0.95}" rx="330" ry="70" fill="#000" opacity="0.35" filter="url(#${uid}-soft)"/>
      <g>${base}</g>
      <g stroke="${C.arc}" stroke-opacity="0.45" stroke-width="1.5" stroke-dasharray="5 6" class="anim-fade" style="--d:900ms">${guides}</g>
      <g class="anim-lift" style="--from:${LIFT}px"><g transform="translate(0 ${-LIFT})">${lifted}</g></g>

      <g class="anim-draw" style="--d:700ms">
        <path d="M${f(probe[0])} ${f(probe[1])}L${lx - lr * 0.94} ${ly + lr * 0.34}" pathLength="1" stroke="${C.arc}" stroke-width="2" fill="none"/>
      </g>
      <circle cx="${f(probe[0])}" cy="${f(probe[1])}" r="16" fill="none" stroke="${C.arc}" stroke-width="2.5" filter="url(#${uid}-glow)"/>

      <g class="anim-fade" style="--d:500ms">
        <circle cx="${lx}" cy="${ly}" r="${lr}" fill="${C.ink}"/>
        <g clip-path="url(#${uid}-lens)">${section}${drug}</g>
        <circle cx="${lx}" cy="${ly}" r="${lr}" fill="none" stroke="url(#${uid}-arc)" stroke-width="5" filter="url(#${uid}-glow)"/>
        <circle cx="${lx}" cy="${ly}" r="${lr + 14}" fill="none" stroke="${C.arc}" stroke-opacity="0.25" stroke-width="1.5"/>
      </g>
      ${escaping}

      <g class="anim-fade" style="--d:1100ms">
        <rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="18" fill="${C.plum}" stroke="${C.lilac}" stroke-opacity="0.3" stroke-width="1.5"/>
        <path d="M${px + 40} ${py + 24}V${py + ph - 30}H${px + pw - 24}" stroke="${C.mist}" stroke-opacity="0.6" stroke-width="1.5" fill="none"/>
        <path d="${curve(0.62)}" stroke="${C.lilac}" stroke-opacity="0.6" stroke-width="2" stroke-dasharray="6 7" fill="none"/>
        <g class="anim-draw" style="--d:1200ms"><path d="${curve(0.28)}" pathLength="1" stroke="${C.arc}" stroke-width="2.6" fill="none"/></g>
        ${measured}
      </g>
    `;
  },
};

export default art;
