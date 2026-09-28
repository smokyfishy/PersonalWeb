// Kinetix Spatialize concept: a planning-software window with a stylised
// axial MRI slice (segmented region outlined), a wireframe 3D brain volume
// with the modelled cavity, ranked candidate sites, and coordinate ticks.
import { C, baseDefs, f, rng, type Art } from './kit';

const art: Art = {
  viewBox: '0 0 1600 900',
  compactViewBox: '420 0 1200 900',
  render(uid) {
    const rand = rng(11);
    // --- Window chrome
    const win = { x: 70, y: 60, w: 1460, h: 780 };

    // --- Axial MRI slice (left panel), greyscale-lilac, no text.
    const sx = 330;
    const sy = 440;
    const gyri = Array.from({ length: 26 }, (_, i) => {
      const a = (i / 26) * Math.PI * 2;
      const r1 = 150;
      const r2 = 118 + rand() * 14;
      const x1 = sx + Math.cos(a) * r1 * 0.86;
      const y1 = sy + Math.sin(a) * r1;
      const x2 = sx + Math.cos(a + 0.05) * r2 * 0.86;
      const y2 = sy + Math.sin(a + 0.05) * r2;
      return `<path d="M${f(x1)} ${f(y1)}Q${f((x1 + x2) / 2 + (rand() - 0.5) * 16)} ${f((y1 + y2) / 2 + (rand() - 0.5) * 16)} ${f(x2)} ${f(y2)}"/>`;
    }).join('');
    const slice = `
      <ellipse cx="${sx}" cy="${sy}" rx="${190 * 0.86}" ry="190" fill="#231a2c" stroke="#8a7e98" stroke-width="10" stroke-opacity="0.5"/>
      <ellipse cx="${sx}" cy="${sy}" rx="${168 * 0.86}" ry="168" fill="#6d6378"/>
      <ellipse cx="${sx}" cy="${sy}" rx="${140 * 0.86}" ry="140" fill="#8a8095"/>
      <g stroke="#554a61" stroke-width="5" fill="none" stroke-linecap="round">${gyri}</g>
      <path d="M${sx} ${sy - 168}V${sy + 168}" stroke="#3a3042" stroke-width="5"/>
      <path d="M${sx - 34} ${sy - 30}c-10 26-6 58 10 72c8-18 6-50-10-72ZM${sx + 34} ${sy - 30}c10 26 6 58-10 72c-8-18-6-50 10-72Z" fill="#241b2b"/>
      <g class="anim-fade" style="--d:500ms">
        <path d="M${sx + 50} ${sy - 96}c32-10 66 6 70 38c4 30-18 56-50 56c-30 0-44-24-40-52c2-20 6-36 20-42Z" fill="${C.arc}" fill-opacity="0.35" stroke="${C.arc}" stroke-width="3" filter="url(#${uid}-glow)"/>
      </g>
      <g stroke="${C.brassHi}" stroke-opacity="0.7" stroke-width="1.5" stroke-dasharray="6 6">
        <path d="M${sx - 200} ${sy - 56}H${sx + 200}M${sx + 86} ${sy - 220}V${sy + 220}"/>
      </g>`;

    // Slice stack thumbnails.
    const thumbs = Array.from({ length: 6 }, (_, i) => {
      const tx = 150 + i * 62;
      const on = i === 3;
      return `<rect x="${tx}" y="700" width="50" height="58" rx="8" fill="${on ? C.plum3 : C.plum}" stroke="${on ? C.arc : C.lilac}" stroke-opacity="${on ? 0.9 : 0.3}" stroke-width="1.5"/>
        <ellipse cx="${tx + 25}" cy="729" rx="${14 + Math.sin(i / 1.8) * 4}" ry="${18 + Math.sin(i / 1.8) * 4}" fill="#6d6378" opacity="${on ? 1 : 0.6}"/>`;
    }).join('');

    // --- 3D view (right panel): wireframe ellipsoid brain with a cavity.
    const bx = 1000;
    const by = 450;
    const RX = 300;
    const RY = 215;
    const tilt = 0.32; // perspective squash for parallels
    let wire = '';
    for (let i = 1; i < 9; i++) {
      const t = (i / 9) * Math.PI;
      const rx = RX * Math.abs(Math.cos(t - Math.PI / 2 - Math.PI / 2));
      wire += `<ellipse cx="${bx}" cy="${by}" rx="${f(Math.abs(RX * Math.sin(t)))}" ry="${RY}" transform="rotate(0)" />`;
      void rx;
    }
    for (let j = 1; j < 8; j++) {
      const phi = -Math.PI / 2 + (j / 8) * Math.PI;
      const y = by + RY * Math.sin(phi);
      const rx = RX * Math.cos(phi);
      wire += `<ellipse cx="${bx}" cy="${f(y)}" rx="${f(rx)}" ry="${f(rx * tilt)}"/>`;
    }
    // Candidate sites along the cavity rim; top three ranked.
    const cav = { x: bx + 90, y: by - 70 };
    const rim = Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return { x: cav.x + Math.cos(a) * 92, y: cav.y + Math.sin(a) * 62 };
    });
    const ranked = [2, 7, 10];
    const samples = rim
      .map((p, i) => (ranked.includes(i) ? '' : `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="6" fill="${C.lilac}" opacity="0.55"/>`))
      .join('');
    const markers = ranked
      .map((idx, r) => {
        const p = rim[idx];
        const out = { x: p.x + (p.x - cav.x) * 0.9, y: p.y + (p.y - cav.y) * 1.2 };
        return `<g class="anim-pop" style="--d:${1000 + r * 180}ms">
          <line x1="${f(p.x)}" y1="${f(p.y)}" x2="${f(out.x)}" y2="${f(out.y)}" stroke="${C.brassHi}" stroke-width="1.5"/>
          <circle cx="${f(p.x)}" cy="${f(p.y)}" r="9" fill="${C.brassHi}"/>
          <circle cx="${f(out.x)}" cy="${f(out.y)}" r="19" fill="${C.ink}" stroke="${C.brassHi}" stroke-width="2.5"/>
          ${rankGlyph(r + 1, out.x, out.y)}
        </g>`;
      })
      .join('');

    // Coordinate ticks around the 3D box.
    const ticks = Array.from({ length: 11 }, (_, i) => {
      const x = bx - RX + (i / 10) * RX * 2;
      return `<line x1="${f(x)}" y1="${by + RY + 40}" x2="${f(x)}" y2="${by + RY + (i % 5 === 0 ? 56 : 48)}"/>`;
    }).join('') + Array.from({ length: 9 }, (_, i) => {
      const y = by - RY + (i / 8) * RY * 2;
      return `<line x1="${bx + RX + 40}" y1="${f(y)}" x2="${bx + RX + (i % 4 === 0 ? 56 : 48)}" y2="${f(y)}"/>`;
    }).join('');

    // Ranked list (right strip): score bars only, no numbers.
    const list = [0.92, 0.78, 0.66, 0.4, 0.31]
      .map(
        (v, i) => `<g opacity="${i < 3 ? 1 : 0.5}">
          <rect x="1390" y="${250 + i * 64}" width="110" height="46" rx="10" fill="${C.plum}" stroke="${i < 3 ? C.brassHi : C.lilac}" stroke-opacity="${i < 3 ? 0.6 : 0.25}"/>
          ${i < 3 ? rankGlyph(i + 1, 1410, 273 + i * 64, 0.62) : `<circle cx="1410" cy="${273 + i * 64}" r="5" fill="${C.lilac}"/>`}
          <rect x="1428" y="${268 + i * 64}" width="${f(60 * v)}" height="10" rx="5" fill="${i < 3 ? C.brassHi : C.lilac}"/>
        </g>`,
      )
      .join('');

    return `${baseDefs(uid)}
      <rect x="-100" y="-100" width="1800" height="1100" fill="url(#${uid}-bg)"/>
      <rect x="${win.x}" y="${win.y}" width="${win.w}" height="${win.h}" rx="22" fill="#130c1b" stroke="${C.lilac}" stroke-opacity="0.3" stroke-width="2"/>
      <path d="M${win.x} ${win.y + 52}H${win.x + win.w}" stroke="${C.lilac}" stroke-opacity="0.2"/>
      ${[0, 1, 2].map((i) => `<circle cx="${win.x + 30 + i * 22}" cy="${win.y + 26}" r="6" fill="${C.lilac}" opacity="${0.5 - i * 0.12}"/>`).join('')}
      <rect x="${win.x + 20}" y="${win.y + 72}" width="480" height="${win.h - 92}" rx="16" fill="#0d0913" stroke="${C.lilac}" stroke-opacity="0.15"/>
      <rect x="${win.x + 520}" y="${win.y + 72}" width="${win.w - 540}" height="${win.h - 92}" rx="16" fill="#0f0a17" stroke="${C.lilac}" stroke-opacity="0.15"/>
      <rect x="${win.x + 520}" y="${win.y + 72}" width="${win.w - 540}" height="${win.h - 92}" rx="16" fill="url(#${uid}-grid)"/>

      ${slice}
      ${thumbs}

      <g class="anim-draw" style="--d:300ms"><path d="M${sx + 110} ${sy - 60}C560 330 640 300 ${cav.x - 60} ${cav.y}" pathLength="1" stroke="${C.arc}" stroke-width="2" stroke-opacity="0.6" fill="none"/></g>

      <clipPath id="${uid}-brain"><path d="${BRAIN}"/></clipPath>
      <path d="${BRAIN}" fill="${C.arc}" fill-opacity="0.05"/>
      <g clip-path="url(#${uid}-brain)" fill="none" stroke="${C.arc}" stroke-opacity="0.3" stroke-width="1.3">${wire}</g>
      <path d="${BRAIN}" fill="none" stroke="${C.arc}" stroke-opacity="0.75" stroke-width="2.5" filter="url(#${uid}-glow)"/>
      <path d="M820 520C880 490 940 470 1010 455M985 250C990 320 1000 380 1030 440" stroke="${C.arc}" stroke-opacity="0.5" stroke-width="2" fill="none"/>
      <g class="anim-fade" style="--d:600ms">
        <ellipse cx="${cav.x}" cy="${cav.y}" rx="92" ry="62" fill="${C.arc}" fill-opacity="0.22" stroke="${C.ice}" stroke-width="2.5" filter="url(#${uid}-glow)"/>
        <ellipse cx="${cav.x - 12}" cy="${cav.y + 10}" rx="52" ry="30" fill="${C.ink}" opacity="0.35"/>
      </g>
      ${samples}
      ${markers}
      <g stroke="${C.mist}" stroke-opacity="0.5" stroke-width="1.5">${ticks}</g>
      <g transform="translate(${bx - RX - 10} ${by + RY + 10})" stroke-width="3" stroke-linecap="round">
        <path d="M0 0H56" stroke="${C.rose}"/><path d="M0 0V-56" stroke="${C.teal}"/><path d="M0 0L-30 26" stroke="${C.arc}"/>
      </g>
      ${list}
    `;
  },
};

/** Lateral silhouette of a brain (frontal lobe left, cerebellum lower right). */
const BRAIN =
  "M712 470C690 330 800 222 965 214C1130 206 1262 272 1296 392C1314 458 1296 520 1246 546C1222 558 1196 560 1174 550C1206 600 1154 652 1084 634C1054 626 1040 606 1030 590L1018 660H990L994 588C930 596 866 600 826 570C790 546 792 512 818 498C774 514 722 516 712 470Z";

/** Drawn rank numerals 1–3 (paths, so no font dependency). */
function rankGlyph(n: number, x: number, y: number, s = 1): string {
  const paths: Record<number, string> = {
    1: 'M-3 -8L2 -11V11M-4 11H8',
    2: 'M-7 -6C-6 -12 7 -12 7 -5C7 1 -7 6 -7 11H8',
    3: 'M-7 -9H7L0 -1C5 -1 8 2 8 6C8 12 -4 13 -8 8',
  };
  return `<path d="${paths[n]}" transform="translate(${f(x)} ${f(y)}) scale(${s})" fill="none" stroke="${C.brassHi}" stroke-width="${f(2.6 / s)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

export default art;
