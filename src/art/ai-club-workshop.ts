// AI & Computing Club: a teaching scene. A presenter beside a screen showing a
// convolutional network diagram; students working in pairs at laptops, one
// pointing at a partner's screen. Figures are faceless silhouettes.
import { C, baseDefs, f, type Art } from './kit';

/** Faceless seated or standing figure seen from behind/three-quarter. */
function figure(x: number, y: number, s: number, tone: string, opts: { standing?: boolean; arm?: 'point' | 'rest' | 'up'; turn?: number } = {}): string {
  const turn = opts.turn ?? 0;
  const bodyH = opts.standing ? 170 : 110;
  const head = `<circle cx="${f(x + turn * 4 * s)}" cy="${f(y - bodyH * s - 34 * s)}" r="${f(30 * s)}" fill="${tone}"/>
    <path d="M${f(x - 26 * s + turn * 4 * s)} ${f(y - bodyH * s - 44 * s)}a${f(28 * s)} ${f(26 * s)} 0 0 1 ${f(54 * s)} -2" stroke="${C.ink}" stroke-opacity="0.35" stroke-width="${f(10 * s)}" fill="none" stroke-linecap="round"/>`;
  const torso = `<path d="M${f(x - 52 * s)} ${f(y)}C${f(x - 56 * s)} ${f(y - bodyH * s * 0.7)} ${f(x - 40 * s)} ${f(y - bodyH * s)} ${f(x)} ${f(y - bodyH * s)}C${f(x + 40 * s)} ${f(y - bodyH * s)} ${f(x + 56 * s)} ${f(y - bodyH * s * 0.7)} ${f(x + 52 * s)} ${f(y)}Z" fill="${tone}"/>`;
  let arm = '';
  if (opts.arm === 'point') {
    arm = `<path d="M${f(x + 34 * s)} ${f(y - bodyH * s * 0.8)}C${f(x + 80 * s)} ${f(y - bodyH * s * 0.55)} ${f(x + 110 * s)} ${f(y - bodyH * s * 0.62)} ${f(x + 150 * s)} ${f(y - bodyH * s * 0.75)}" stroke="${tone}" stroke-width="${f(20 * s)}" stroke-linecap="round" fill="none"/>`;
  } else if (opts.arm === 'up') {
    arm = `<path d="M${f(x + 36 * s)} ${f(y - bodyH * s * 0.82)}C${f(x + 80 * s)} ${f(y - bodyH * s)} ${f(x + 96 * s)} ${f(y - bodyH * s * 1.2)} ${f(x + 118 * s)} ${f(y - bodyH * s * 1.34)}" stroke="${tone}" stroke-width="${f(20 * s)}" stroke-linecap="round" fill="none"/>`;
  }
  // Rim light on the side facing the screen glow.
  const rim = `<path d="M${f(x - 50 * s)} ${f(y - 10 * s)}C${f(x - 54 * s)} ${f(y - bodyH * s * 0.7)} ${f(x - 38 * s)} ${f(y - bodyH * s + 4 * s)} ${f(x - 4 * s)} ${f(y - bodyH * s)}" stroke="${C.arc}" stroke-opacity="0.45" stroke-width="${f(3 * s)}" fill="none"/>`;
  return `<g>${torso}${arm}${head}${rim}</g>`;
}

function laptop(x: number, y: number, s: number, content: string): string {
  return `<g>
    <path d="M${f(x - 70 * s)} ${f(y)}L${f(x - 58 * s)} ${f(y - 92 * s)}H${f(x + 58 * s)}L${f(x + 70 * s)} ${f(y)}Z" fill="#1c2033" stroke="${C.steel}" stroke-width="${f(2 * s)}"/>
    <path d="M${f(x - 50 * s)} ${f(y - 10 * s)}L${f(x - 42 * s)} ${f(y - 82 * s)}H${f(x + 42 * s)}L${f(x + 50 * s)} ${f(y - 10 * s)}Z" fill="${C.arc}" opacity="0.2"/>
    ${content}
    <rect x="${f(x - 82 * s)}" y="${f(y)}" width="${f(164 * s)}" height="${f(10 * s)}" rx="${f(4 * s)}" fill="#2a2f45"/>
  </g>`;
}

const art: Art = {
  viewBox: '0 0 1000 1000',
  render(uid) {
    // Projection screen with a CNN: input grid → conv feature maps → dense → outputs.
    const sx = 300;
    const sy = 110;
    const sw = 620;
    const sh = 360;
    const grid = Array.from({ length: 6 }, (_, r) =>
      Array.from({ length: 6 }, (_, c) => `<rect x="${sx + 50 + c * 17}" y="${sy + 110 + r * 17}" width="15" height="15" fill="${C.ice}" opacity="${f(0.2 + ((r * 7 + c * 3) % 5) * 0.16)}"/>`).join(''),
    ).join('');
    const maps = (x: number, n: number, size: number) =>
      Array.from({ length: n }, (_, i) => `<rect x="${x + i * 12}" y="${sy + 150 - size / 2 + i * 12}" width="${size}" height="${size}" rx="3" fill="${C.plum2}" stroke="${C.arc}" stroke-width="2"/>`).join('');
    const dense = Array.from({ length: 6 }, (_, i) => `<circle cx="${sx + 450}" cy="${sy + 105 + i * 30}" r="8" fill="${C.ink}" stroke="${C.ice}" stroke-width="2"/>`).join('');
    const outs = Array.from({ length: 3 }, (_, i) => `<circle cx="${sx + 540}" cy="${sy + 150 + (i - 1) * 44}" r="11" fill="${i === 1 ? C.brassHi : C.ink}" stroke="${C.ice}" stroke-width="2"/>`).join('');
    const links = Array.from({ length: 6 }, (_, i) => Array.from({ length: 3 }, (_, j) => `<line x1="${sx + 450}" y1="${sy + 105 + i * 30}" x2="${sx + 540}" y2="${sy + 150 + (j - 1) * 44}"/>`).join('')).join('');

    const screen = `
      <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="14" fill="#130c1b" stroke="${C.arc}" stroke-opacity="0.5" stroke-width="3"/>
      <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="14" fill="url(#${uid}-grid)"/>
      <g class="anim-fade" style="--d:200ms">${grid}</g>
      <g class="anim-fade" style="--d:350ms">${maps(sx + 190, 4, 110)}</g>
      <g class="anim-fade" style="--d:500ms">${maps(sx + 320, 5, 64)}</g>
      <g class="anim-fade" style="--d:650ms"><g stroke="${C.arc}" stroke-opacity="0.35">${links}</g>${dense}${outs}</g>
      <g class="anim-draw" style="--d:300ms" stroke="${C.brassHi}" stroke-width="2" fill="none">
        <path d="M${sx + 152} ${sy + 160}H${sx + 186}" pathLength="1"/><path d="M${sx + 292} ${sy + 160}H${sx + 318}" pathLength="1"/><path d="M${sx + 400} ${sy + 160}H${sx + 438}" pathLength="1"/>
      </g>`;

    // Room glow from the screen.
    return `${baseDefs(uid)}
      <rect width="1000" height="1000" fill="url(#${uid}-bg)"/>
      <ellipse cx="610" cy="300" rx="420" ry="260" fill="${C.arc}" opacity="0.12" filter="url(#${uid}-soft)"/>
      <path d="M0 640H1000V1000H0Z" fill="#150e20"/>
      <path d="M0 640H1000" stroke="${C.lilac}" stroke-opacity="0.2"/>
      ${screen}
      <g class="anim-fade" style="--d:100ms">${figure(190, 640, 1.05, '#3f2b58', { standing: true, arm: 'up', turn: 1 })}</g>

      <rect x="80" y="780" width="400" height="18" rx="6" fill="#2b1e3b"/>
      <rect x="540" y="780" width="400" height="18" rx="6" fill="#2b1e3b"/>
      <g class="anim-fade" style="--d:500ms">
        ${laptop(210, 780, 0.9, `<path d="M${f(180)} ${f(752)}l14-18 14 10 18-26" stroke="${C.teal}" stroke-width="3" fill="none"/>`)}
        ${laptop(680, 780, 0.9, `<g fill="${C.ice}" opacity="0.8">${[0, 1, 2].map((i) => `<rect x="${660 + i * 16}" y="${742 - i * 8}" width="10" height="${20 + i * 8}"/>`).join('')}</g>`)}
      </g>
      <g class="anim-fade" style="--d:650ms">
        ${figure(150, 960, 0.95, '#2d2040')}
        ${figure(330, 960, 0.95, '#35264b', { arm: 'point', turn: -1 })}
        ${figure(620, 960, 0.95, '#2d2040')}
        ${figure(800, 960, 0.95, '#35264b', { turn: -1 })}
      </g>
    `;
  },
};

export default art;
