// THETA hero: three webcams → hand landmarks → vision model → controller →
// tendon-driven robotic hand mirroring the same pose.
import { humanHand, landmarks, OPEN_HAND, place, roboticHand } from './hand';
import { C, arrow, baseDefs, f, type Art } from './kit';
import { board, lensPoint, servo, webcam } from './parts';

const art: Art = {
  viewBox: '0 0 1600 900',
  compactViewBox: '0 -150 1600 1200',
  render(uid) {
    const S = 1.62;
    const human = place(OPEN_HAND, 330, 790, S);
    const robot = place(OPEN_HAND, 1330, 740, S * 0.98);
    const hc = { x: 330, y: 560 };

    // Three cameras surround the operator's hand, each aimed at it.
    const cams = [
      { x: 100, y: 250, scale: 1.05 },
      { x: 600, y: 230, scale: 1.05 },
      { x: 640, y: 720, scale: 0.95 },
    ].map((c) => ({ ...c, aim: (Math.atan2(hc.y - (c.y - 29), hc.x - c.x) * 180) / Math.PI }));

    // View cones: lens → two points either side of the hand, perpendicular to the aim.
    const cones = cams
      .map((c, i) => {
        const lens = lensPoint(c.x, c.y, c.aim, c.scale);
        const dx = hc.x - lens.x;
        const dy = hc.y - lens.y;
        const len = Math.hypot(dx, dy);
        const nx = -dy / len;
        const ny = dx / len;
        const spread = 175;
        const a = { x: hc.x + nx * spread, y: hc.y + ny * spread };
        const b = { x: hc.x - nx * spread, y: hc.y - ny * spread };
        return `<g class="anim-fade" style="--d:${150 + i * 140}ms">
          <path d="M${f(lens.x)} ${f(lens.y)}L${f(a.x)} ${f(a.y)}L${f(b.x)} ${f(b.y)}Z" fill="${C.arc}" opacity="0.07"/>
          <path d="M${f(lens.x)} ${f(lens.y)}L${f(a.x)} ${f(a.y)}M${f(lens.x)} ${f(lens.y)}L${f(b.x)} ${f(b.y)}" stroke="${C.arc}" stroke-opacity="0.3" stroke-dasharray="4 7" stroke-width="1.5"/>
        </g>`;
      })
      .join('');

    // Each camera's feed enters the model on its own port.
    const model = { x: 790, y: 340, w: 210, h: 240 };
    const ports = [model.y + 70, model.y + 120, model.y + 170];
    const feeds = [
      `M140 196C300 70 690 100 ${model.x} ${ports[0]}`,
      `M640 196C720 230 730 ${ports[1]} ${model.x} ${ports[1]}`,
      `M680 690C740 650 740 ${ports[2]} ${model.x} ${ports[2]}`,
    ]
      .map(
        (d, i) => `<g class="anim-draw" style="--d:${500 + i * 160}ms"><path d="${d}" pathLength="1" fill="none" stroke="${C.arc}" stroke-width="2.2" opacity="0.8"/></g>
          <circle cx="${model.x}" cy="${ports[i]}" r="4.5" fill="${C.arc}"/>`,
      )
      .join('');

    const cols = [3, 4, 3];
    const nodes = cols.map((n, ci) =>
      Array.from({ length: n }, (_, k) => ({
        x: model.x + 45 + ci * 60,
        y: model.y + model.h / 2 + (k - (n - 1) / 2) * 46,
      })),
    );
    const edges = nodes
      .slice(0, -1)
      .flatMap((col, ci) => col.flatMap((a) => nodes[ci + 1].map((b) => `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`)))
      .join('');
    const nodeDots = nodes.flat().map((n) => `<circle cx="${n.x}" cy="${n.y}" r="9"/>`).join('');

    const servos = [0, 1, 2, 3, 4].map((i) => servo(1208 + i * 62, 842, 0.5, i * 12 - 24, false)).join('');

    return `${baseDefs(uid)}
      <rect x="-100" y="-200" width="1800" height="1300" fill="url(#${uid}-bg)"/>
      <rect x="-100" y="-200" width="1800" height="1300" fill="url(#${uid}-grid)"/>
      <ellipse cx="330" cy="560" rx="330" ry="300" fill="${C.arc}" opacity="0.05" filter="url(#${uid}-soft)"/>
      <ellipse cx="1330" cy="560" rx="300" ry="300" fill="${C.violet}" opacity="0.18" filter="url(#${uid}-soft)"/>

      ${cones}
      ${humanHand(human, S)}
      <g class="anim-fade" style="--d:400ms">${landmarks(human, C.arc, 5.5)}</g>
      ${cams.map((c) => webcam(c.x, c.y, c.aim, c.scale, 'tripod')).join('')}

      ${feeds}
      <g class="anim-fade" style="--d:700ms">
        <rect x="${model.x}" y="${model.y}" width="${model.w}" height="${model.h}" rx="22" fill="${C.plum2}" stroke="${C.arc}" stroke-opacity="0.6" stroke-width="2"/>
        <g stroke="${C.arc}" stroke-opacity="0.28" stroke-width="1.4">${edges}</g>
        <g fill="${C.ink}" stroke="${C.ice}" stroke-width="2">${nodeDots}</g>
      </g>

      ${arrow(model.x + model.w + 10, model.y + model.h / 2, 1052, model.y + model.h / 2, C.arc, 'anim-draw', 1000)}
      <g class="anim-fade" style="--d:1100ms">${board(1058, 410, 150, 100, uid)}</g>
      <g class="anim-draw" style="--d:1300ms">
        <path d="M1150 510C1150 640 1150 760 1178 830" pathLength="1" fill="none" stroke="${C.rose}" stroke-width="2.2"/>
        <path d="M1166 510C1166 640 1162 760 1188 822" pathLength="1" fill="none" stroke="${C.brass}" stroke-width="2.2"/>
      </g>

      <g class="anim-fade" style="--d:1200ms">
        ${roboticHand(robot, S * 0.98, uid)}
        <rect x="1168" y="812" width="324" height="62" rx="12" fill="#1e2233" stroke="${C.steel}" stroke-width="2"/>
        ${servos}
      </g>
    `;
  },
};

export default art;
