// Skills constellation: three clusters (machine learning, robotics &
// embedded, software), one star per listed tool, joined through a centre.
// Colours match the dots beside each skill group in the HTML.
import { C, baseDefs, f, type Art } from './kit';

export const SKILL_COLORS = [C.arc, C.teal, C.lilac];

const art: Art = {
  viewBox: '0 0 1000 1000',
  render(uid) {
    const cx = 500;
    const cy = 500;
    const clusters = [
      { a: -Math.PI / 2 - 0.35, n: 3, color: SKILL_COLORS[0] },
      { a: Math.PI / 6 + 0.1, n: 2, color: SKILL_COLORS[1] },
      { a: (5 * Math.PI) / 6, n: 4, color: SKILL_COLORS[2] },
    ];
    let out = '';
    clusters.forEach((cl, ci) => {
      const hx = cx + Math.cos(cl.a) * 250;
      const hy = cy + Math.sin(cl.a) * 250;
      const stars = Array.from({ length: cl.n }, (_, i) => {
        const a = cl.a + (i - (cl.n - 1) / 2) * 0.9;
        return { x: hx + Math.cos(a) * 120, y: hy + Math.sin(a) * 120 };
      });
      out += `<g class="anim-draw" style="--d:${200 + ci * 200}ms"><path d="M${cx} ${cy}L${f(hx)} ${f(hy)}" pathLength="1" stroke="${cl.color}" stroke-opacity="0.5" stroke-width="2"/></g>`;
      out += stars.map((s) => `<path d="M${f(hx)} ${f(hy)}L${f(s.x)} ${f(s.y)}" stroke="${cl.color}" stroke-opacity="0.45" stroke-width="1.6"/>`).join('');
      out += `<circle cx="${f(hx)}" cy="${f(hy)}" r="46" fill="${cl.color}" opacity="0.1"/><circle cx="${f(hx)}" cy="${f(hy)}" r="12" fill="${cl.color}"/>`;
      out += stars
        .map(
          (s, i) => `<g class="anim-pop" style="--d:${500 + ci * 200 + i * 80}ms">
            <circle cx="${f(s.x)}" cy="${f(s.y)}" r="20" fill="${cl.color}" opacity="0.18"/>
            <circle cx="${f(s.x)}" cy="${f(s.y)}" r="8" fill="${C.chalk}"/>
          </g>`,
        )
        .join('');
    });
    const dust = Array.from({ length: 60 }, (_, i) => {
      const a = i * 2.4;
      const r = 80 + ((i * 53) % 400);
      return `<circle cx="${f(cx + Math.cos(a) * r)}" cy="${f(cy + Math.sin(a) * r)}" r="1.6" fill="${C.mist}" opacity="0.35"/>`;
    }).join('');
    return `${baseDefs(uid)}
      <rect width="1000" height="1000" fill="url(#${uid}-bg)"/>
      ${dust}
      <circle cx="${cx}" cy="${cy}" r="300" fill="none" stroke="${C.arc}" stroke-opacity="0.12" stroke-width="1.5"/>
      <circle cx="${cx}" cy="${cy}" r="250" fill="none" stroke="${C.arc}" stroke-opacity="0.08" stroke-width="1" stroke-dasharray="4 10"/>
      ${out}
      <circle cx="${cx}" cy="${cy}" r="22" fill="${C.brassHi}" filter="url(#${uid}-glow)"/>
    `;
  },
};

export default art;
