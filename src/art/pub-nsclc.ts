// Publication visual for the NSCLC paper: feature selection. A dense field of
// candidate features funnels down to exactly 100 selected predictors (a 10×10
// grid), beside an abstract ROC-style curve and an award star.
import { C, baseDefs, f, rng, type Art } from './kit';

const art: Art = {
  viewBox: '0 0 1000 1000',
  render(uid) {
    const rand = rng(99);
    // Candidate features: a wide cloud above the funnel.
    const cloud = Array.from({ length: 360 }, () => {
      const x = 90 + rand() * 560;
      const y = 110 + rand() * 250;
      const kept = rand() < 0.12;
      return `<circle cx="${f(x)}" cy="${f(y)}" r="${kept ? 4 : 2.6}" fill="${kept ? C.arc : C.lilac}" opacity="${kept ? 0.95 : 0.35}"/>`;
    }).join('');
    const funnel = `<path d="M80 390H660L440 610V660H300V610Z" fill="${C.arc}" fill-opacity="0.07" stroke="${C.arc}" stroke-opacity="0.5" stroke-width="2" stroke-linejoin="round"/>`;
    // Exactly 100 selected predictors.
    const selected = Array.from({ length: 100 }, (_, i) => {
      const r = Math.floor(i / 10);
      const c = i % 10;
      return `<rect x="${250 + c * 24}" y="${690 + r * 24}" width="18" height="18" rx="4" fill="${C.arc}" opacity="${f(0.55 + ((r + c) % 4) * 0.13)}"/>`;
    }).join('');
    const flow = Array.from({ length: 14 }, (_, i) => {
      const x = 330 + (i % 7) * 12;
      const y = 430 + Math.floor(i / 7) * 60 + (i % 3) * 14;
      return `<circle cx="${x}" cy="${y}" r="3.5" fill="${C.arc}"/>`;
    }).join('');

    // ROC-style panel.
    const rx = 700;
    const ry = 520;
    const rs = 220;
    let roc = '';
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const tpr = 1 - Math.pow(1 - t, 6);
      roc += `${i ? 'L' : 'M'}${f(rx + t * rs)} ${f(ry + rs - tpr * rs)}`;
    }

    const star = (x: number, y: number, r: number) => {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 ? r * 0.45 : r;
        return `${f(x + Math.cos(a) * rr)},${f(y + Math.sin(a) * rr)}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="${C.brassHi}"/>`;
    };

    return `${baseDefs(uid)}
      <rect width="1000" height="1000" fill="url(#${uid}-bg)"/>
      <rect width="1000" height="1000" fill="url(#${uid}-grid)"/>
      <g class="anim-fade">${cloud}</g>
      <g class="anim-fade" style="--d:300ms">${funnel}${flow}</g>
      <g class="anim-fade" style="--d:700ms">${selected}</g>
      <g class="anim-fade" style="--d:500ms">
        <rect x="${rx - 30}" y="${ry - 30}" width="${rs + 60}" height="${rs + 60}" rx="18" fill="#130c1b" stroke="${C.lilac}" stroke-opacity="0.3" stroke-width="1.5"/>
        <path d="M${rx} ${ry}V${ry + rs}H${rx + rs}" stroke="${C.mist}" stroke-opacity="0.6" stroke-width="2" fill="none"/>
        <path d="M${rx} ${ry + rs}L${rx + rs} ${ry}" stroke="${C.mist}" stroke-opacity="0.35" stroke-dasharray="6 6" stroke-width="1.5"/>
      </g>
      <g class="anim-draw" style="--d:900ms"><path d="${roc}" pathLength="1" stroke="${C.arc}" stroke-width="3.5" fill="none"/></g>
      <g class="anim-pop" style="--d:1200ms">
        <circle cx="830" cy="200" r="74" fill="${C.brassHi}" opacity="0.12"/>
        <circle cx="830" cy="200" r="58" fill="none" stroke="${C.brassHi}" stroke-width="2.5"/>
        ${star(830, 200, 38)}
      </g>
    `;
  },
};

export default art;
