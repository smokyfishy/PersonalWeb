// Clean Plate Labs: small-business inventory → forecasting. A shop shelf of
// generic products (with low-stock gaps) feeds a demand chart: history, a
// "now" divider, a forecast with its confidence band, and a reorder line.
// Deliberately number-free; real metrics are in the HTML.
import { C, baseDefs, f, rng, type Art } from './kit';

const art: Art = {
  viewBox: '0 0 1600 900',
  compactViewBox: '0 -150 1600 1200',
  render(uid) {
    const rand = rng(5);
    // Shelf unit with an awning.
    const sx = 90;
    const sy = 190;
    const sw = 520;
    const shelfY = [370, 540, 710];
    const palette = [C.arc, C.teal, C.rose, C.lilac, C.brassHi, C.ice];
    const product = (x: number, base: number, kind: number, color: string) => {
      switch (kind) {
        case 0: // jar
          return `<rect x="${x}" y="${base - 70}" width="50" height="70" rx="10" fill="${color}" opacity="0.8"/><rect x="${x + 4}" y="${base - 82}" width="42" height="14" rx="4" fill="${C.steel}"/><rect x="${x + 8}" y="${base - 50}" width="34" height="22" rx="3" fill="${C.ink}" opacity="0.35"/>`;
        case 1: // box
          return `<rect x="${x}" y="${base - 94}" width="62" height="94" rx="4" fill="${color}" opacity="0.75"/><path d="M${x} ${base - 70}H${x + 62}" stroke="${C.ink}" stroke-opacity="0.3" stroke-width="3"/>`;
        case 2: // bottle
          return `<path d="M${x + 14} ${base - 110}h20v22c10 8 14 16 14 28V${base}H${x}V${base - 60}c0-12 4-20 14-28Z" fill="${color}" opacity="0.8"/><rect x="${x + 12}" y="${base - 118}" width="24" height="10" rx="3" fill="${C.steel}"/>`;
        default: // can
          return `<rect x="${x}" y="${base - 60}" width="44" height="60" rx="6" fill="${color}" opacity="0.8"/><ellipse cx="${x + 22}" cy="${base - 60}" rx="22" ry="5" fill="${C.ice}" opacity="0.5"/>`;
      }
    };
    let goods = '';
    const gaps: Array<{ x: number; y: number }> = [];
    shelfY.forEach((y, row) => {
      let x = sx + 26;
      let slot = 0;
      while (x < sx + sw - 80) {
        const kind = Math.floor(rand() * 4);
        const w = [50, 62, 48, 44][kind];
        const empty = (row === 0 && slot === 4) || (row === 1 && slot === 2) || (row === 2 && slot === 5);
        if (empty) {
          gaps.push({ x: x + w / 2, y: y - 40 });
          goods += `<rect x="${x}" y="${y - 70}" width="${w}" height="70" rx="6" fill="none" stroke="${C.brassHi}" stroke-dasharray="5 5" stroke-width="2"/>`;
        } else {
          goods += product(x, y, kind, palette[Math.floor(rand() * palette.length)]);
        }
        x += w + 18;
        slot++;
      }
    });
    const awning = Array.from({ length: 8 }, (_, i) => {
      const x = sx - 20 + i * ((sw + 40) / 8);
      const w = (sw + 40) / 8;
      return `<path d="M${f(x)} ${sy}h${f(w)}v34a${f(w / 2)} ${f(w / 2)} 0 0 1 ${f(-w)} 0Z" fill="${i % 2 ? C.plum3 : C.violet}"/>`;
    }).join('');

    // Chart.
    const cx0 = 820;
    const cy0 = 190;
    const cw = 690;
    const ch = 540;
    const nowX = cx0 + cw * 0.58;
    const val = (t: number) => 0.52 + 0.16 * Math.sin(t * 22) + 0.1 * t + 0.05 * Math.sin(t * 61);
    const X = (t: number) => cx0 + 50 + t * (cw - 80);
    const Y = (v: number) => cy0 + ch - 50 - v * (ch - 110);
    const hist = Array.from({ length: 59 }, (_, i) => {
      const t = i / 100;
      return `${i ? 'L' : 'M'}${f(X(t))} ${f(Y(val(t) + (rand() - 0.5) * 0.05))}`;
    }).join('');
    let upper = '';
    let lower = '';
    let fc = '';
    for (let i = 58; i <= 100; i++) {
      const t = i / 100;
      const spread = 0.02 + (t - 0.58) * 0.32;
      fc += `${i === 58 ? 'M' : 'L'}${f(X(t))} ${f(Y(val(t)))}`;
      upper += `${i === 58 ? 'M' : 'L'}${f(X(t))} ${f(Y(val(t) + spread))}`;
      lower = `L${f(X(t))} ${f(Y(val(t) - spread))}` + lower;
    }
    const band = `${upper}${lower}Z`;
    const reorderY = Y(0.34);

    // Data motes flowing from shelves to chart.
    const motes = Array.from({ length: 12 }, (_, i) => {
      const t = i / 11;
      const x = 640 + t * 160;
      const y = 460 + Math.sin(t * Math.PI * 2) * 40 - t * 40;
      return `<g class="anim-pop" style="--d:${300 + i * 60}ms"><circle cx="${f(x)}" cy="${f(y)}" r="${f(4 + (i % 3))}" fill="${C.arc}" opacity="${f(0.4 + t * 0.6)}"/></g>`;
    }).join('');

    return `${baseDefs(uid)}
      <rect x="-100" y="-200" width="1800" height="1300" fill="url(#${uid}-bg)"/>
      <rect x="-100" y="-200" width="1800" height="1300" fill="url(#${uid}-grid)"/>

      <rect x="${sx}" y="${sy}" width="${sw}" height="${shelfY[2] - sy + 40}" rx="8" fill="#150e20" stroke="${C.lilac}" stroke-opacity="0.3" stroke-width="2"/>
      ${awning}
      ${shelfY.map((y) => `<rect x="${sx}" y="${y}" width="${sw}" height="14" fill="#3b2a4d"/>`).join('')}
      <g class="anim-fade">${goods}</g>
      ${gaps.map((g, i) => `<g class="anim-pop" style="--d:${600 + i * 120}ms"><circle cx="${f(g.x)}" cy="${f(g.y)}" r="9" fill="${C.brassHi}"/></g>`).join('')}

      ${motes}

      <rect x="${cx0}" y="${cy0}" width="${cw}" height="${ch}" rx="22" fill="#130c1b" stroke="${C.lilac}" stroke-opacity="0.3" stroke-width="2"/>
      <g stroke="${C.lilac}" stroke-opacity="0.12">${[0.25, 0.5, 0.75].map((v) => `<path d="M${cx0 + 50} ${f(Y(v))}H${cx0 + cw - 30}"/>`).join('')}</g>
      <path d="M${cx0 + 50} ${cy0 + 40}V${cy0 + ch - 50}H${cx0 + cw - 30}" stroke="${C.mist}" stroke-opacity="0.55" stroke-width="2" fill="none"/>
      <path d="M${f(nowX)} ${cy0 + 40}V${cy0 + ch - 50}" stroke="${C.mist}" stroke-opacity="0.5" stroke-dasharray="6 6" stroke-width="1.5"/>
      <g class="anim-fade" style="--d:900ms"><path d="${band}" fill="${C.arc}" opacity="0.16"/></g>
      <g class="anim-draw" style="--d:400ms"><path d="${hist}" pathLength="1" stroke="${C.chalk}" stroke-width="3" fill="none" stroke-linejoin="round"/></g>
      <g class="anim-draw" style="--d:900ms"><path d="${fc}" pathLength="1" stroke="${C.arc}" stroke-width="3.5" fill="none"/></g>
      <path d="M${cx0 + 50} ${f(reorderY)}H${cx0 + cw - 30}" stroke="${C.brassHi}" stroke-width="2" stroke-dasharray="10 8" opacity="0.8"/>
      <g class="anim-pop" style="--d:1300ms">
        <rect x="${f(X(0.9) - 18)}" y="${f(reorderY - 60)}" width="36" height="30" rx="4" fill="none" stroke="${C.brassHi}" stroke-width="2.5"/>
        <path d="M${f(X(0.9) - 18)} ${f(reorderY - 50)}H${f(X(0.9) + 18)}M${f(X(0.9))} ${f(reorderY - 30)}V${f(reorderY - 6)}" stroke="${C.brassHi}" stroke-width="2.5"/>
      </g>
    `;
  },
};

export default art;
