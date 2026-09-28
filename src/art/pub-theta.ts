// Publication visual for the THETA paper: the estimation pipeline in three
// steps — segmentation mask → joint-angle arcs on the hand skeleton → a wheel
// of 40 gesture classes with one selected.
import { FINGERS, OPEN_HAND, landmarks, place } from './hand';
import { C, arrow, baseDefs, f, type Art } from './kit';

const art: Art = {
  viewBox: '0 0 1000 1000',
  render(uid) {
    // Step 1: pixel-grid segmentation mask of the hand (top-left).
    const s1 = place(OPEN_HAND, 250, 420, 1.05);
    const inHand = (x: number, y: number) => {
      // Point is "in the mask" if near any digit bone or inside the palm hull.
      const near = (ax: number, ay: number, bx: number, by: number, w: number) => {
        const dx = bx - ax;
        const dy = by - ay;
        const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
        return Math.hypot(x - (ax + t * dx), y - (ay + t * dy)) < w;
      };
      for (const idx of FINGERS) for (let k = 0; k < idx.length - 1; k++) if (near(s1[idx[k]][0], s1[idx[k]][1], s1[idx[k + 1]][0], s1[idx[k + 1]][1], 14)) return true;
      const palmX = [s1[1][0], s1[5][0], s1[17][0]];
      return x > Math.min(...palmX) + 6 && x < Math.max(...palmX) && y > s1[9][1] && y < s1[0][1] + 10;
    };
    let mask = '';
    for (let gy = 110; gy < 460; gy += 12) {
      for (let gx = 110; gx < 400; gx += 12) {
        const on = inHand(gx + 6, gy + 6);
        mask += `<rect x="${gx}" y="${gy}" width="11" height="11" fill="${on ? C.arc : C.lilac}" opacity="${on ? 0.85 : 0.08}"/>`;
      }
    }

    // Step 2: skeleton with joint-angle arcs (top-right).
    const s2 = place(OPEN_HAND, 720, 420, 1.05);
    const arcs = FINGERS.flatMap((idx) => idx.slice(0, 2).map((k, j) => {
      const [x, y] = s2[idx[j + 1] ?? k];
      return `<path d="M${f(x - 14)} ${f(y + 4)}A15 15 0 0 1 ${f(x + 14)} ${f(y + 4)}" stroke="${C.brassHi}" stroke-width="2.5" fill="none"/>`;
    })).join('');

    // Step 3: gesture wheel with 40 classes (bottom centre).
    const wx = 500;
    const wy = 760;
    const R = 150;
    const r = 96;
    const seg = Array.from({ length: 40 }, (_, i) => {
      const a0 = (i / 40) * Math.PI * 2 - Math.PI / 2 + 0.012;
      const a1 = ((i + 1) / 40) * Math.PI * 2 - Math.PI / 2 - 0.012;
      const p = (a: number, rr: number) => `${f(wx + Math.cos(a) * rr)} ${f(wy + Math.sin(a) * rr)}`;
      const on = i === 13;
      return `<path d="M${p(a0, r)}L${p(a0, R)}A${R} ${R} 0 0 1 ${p(a1, R)}L${p(a1, r)}A${r} ${r} 0 0 0 ${p(a0, r)}Z" fill="${on ? C.brassHi : C.plum3}" stroke="${on ? C.brassHi : C.lilac}" stroke-opacity="${on ? 1 : 0.3}" ${on ? `filter="url(#${uid}-glow)"` : ''}/>`;
    }).join('');

    return `${baseDefs(uid)}
      <rect width="1000" height="1000" fill="url(#${uid}-bg)"/>
      <rect x="90" y="90" width="330" height="390" rx="18" fill="#130c1b" stroke="${C.lilac}" stroke-opacity="0.25"/>
      <g class="anim-fade">${mask}</g>
      <rect x="560" y="90" width="330" height="390" rx="18" fill="#130c1b" stroke="${C.lilac}" stroke-opacity="0.25"/>
      <g class="anim-fade" style="--d:400ms">${landmarks(s2, C.arc, 5)}${arcs}</g>
      ${arrow(440, 285, 540, 285, C.arc, 'anim-draw', 300)}
      ${arrow(700, 500, 612, 630, C.arc, "anim-draw", 700)}
      <g class="anim-fade" style="--d:800ms">
        ${seg}
        <circle cx="${wx}" cy="${wy}" r="${r - 16}" fill="#130c1b" stroke="${C.arc}" stroke-opacity="0.4"/>
        ${landmarks(place(OPEN_HAND, wx, wy + 58, 0.44), C.brassHi, 3)}
      </g>
    `;
  },
};

export default art;
