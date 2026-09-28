// ASU Sun Robotics Lab: the build process on a bench — a 3D-printed hand
// mid-assembly (fingers still loose), fishing-line tendon spool, servo bank,
// microcontroller, a clamped webcam, springs, and a laptop showing a ROS2-style
// node graph. Distinct from the THETA hero, which shows the working system.
import { OPEN_HAND, place, roboticHand } from './hand';
import { C, baseDefs, f, type Art } from './kit';
import { board, servo, webcam } from './parts';

const art: Art = {
  viewBox: '0 0 1000 1000',
  render(uid) {
    // Cutting mat.
    const mat = { x: 60, y: 120, w: 880, h: 780 };
    const matGrid = Array.from({ length: 18 }, (_, i) => `<path d="M${mat.x + 20 + i * 48} ${mat.y}V${mat.y + mat.h}"/>`).join('') +
      Array.from({ length: 16 }, (_, i) => `<path d="M${mat.x} ${mat.y + 20 + i * 48}H${mat.x + mat.w}"/>`).join('');

    // Hand lying on the mat: palm + thumb/index/middle attached; ring and pinky
    // still loose beside it.
    const S = 1.25;
    const p = place(OPEN_HAND, 430, 700, S);
    // Thumb, index and middle are attached; ring and pinky lie loose beside it.
    const assembled = roboticHand(p, S, uid, 'anim-draw', [0, 1, 2]);
    const loose = [0, 1].map((k) => {
      const x = 700 + k * 70;
      const y = 560;
      return `<g transform="rotate(${-18 + k * 10} ${x} ${y})">
        ${[0, 1, 2].map((s) => `<rect x="${x - 13}" y="${y - s * 58}" width="26" height="48" rx="12" fill="#8f9bb6" stroke="#1d2233" stroke-width="2"/><circle cx="${x}" cy="${y - s * 58 + 4}" r="5" fill="${C.plum}" stroke="${C.steel}" stroke-width="2"/>`).join('')}
      </g>`;
    }).join('');

    // Tendon spool with line running to the palm.
    const spool = `
      <circle cx="190" cy="800" r="46" fill="#2a2140" stroke="${C.steel}" stroke-width="3"/>
      <circle cx="190" cy="800" r="30" fill="none" stroke="${C.ice}" stroke-opacity="0.7" stroke-width="7" stroke-dasharray="2 2"/>
      <circle cx="190" cy="800" r="9" fill="${C.ink}"/>
      <g class="anim-draw" style="--d:900ms"><path d="M226 780C300 760 360 760 ${f(p[0][0] - 10)} ${f(p[0][1] + 34)}" pathLength="1" stroke="${C.ice}" stroke-width="1.5" fill="none"/></g>`;

    // Springs.
    const spring = (x: number, y: number) => {
      let d = `M${x} ${y}`;
      for (let i = 0; i < 9; i++) d += `l6 ${i % 2 ? 8 : -8}`;
      return `<path d="${d}" stroke="${C.brassHi}" stroke-width="2.4" fill="none" stroke-linejoin="round"/>`;
    };

    // Laptop with node graph.
    const lap = { x: 610, y: 690, w: 300, h: 190 };
    const gnodes = [
      [lap.x + 60, lap.y + 60],
      [lap.x + 150, lap.y + 45],
      [lap.x + 240, lap.y + 70],
      [lap.x + 100, lap.y + 135],
      [lap.x + 210, lap.y + 140],
    ];
    const gedges = [
      [0, 1],
      [1, 2],
      [0, 3],
      [3, 4],
      [4, 2],
      [1, 4],
    ]
      .map(([a, b]) => `<line x1="${gnodes[a][0]}" y1="${gnodes[a][1]}" x2="${gnodes[b][0]}" y2="${gnodes[b][1]}"/>`)
      .join('');
    const laptop = `
      <rect x="${lap.x}" y="${lap.y}" width="${lap.w}" height="${lap.h}" rx="12" fill="#0f0b18" stroke="${C.steel}" stroke-width="3"/>
      <rect x="${lap.x + 12}" y="${lap.y + 12}" width="${lap.w - 24}" height="${lap.h - 24}" rx="6" fill="#120d1d"/>
      <g stroke="${C.arc}" stroke-opacity="0.6" stroke-width="2">${gedges}</g>
      ${gnodes.map(([x, y], i) => `<g class="anim-pop" style="--d:${700 + i * 90}ms"><circle cx="${x}" cy="${y}" r="13" fill="${C.plum2}" stroke="${i === 2 ? C.brassHi : C.arc}" stroke-width="2.5"/></g>`).join('')}
      <path d="M${lap.x - 20} ${lap.y + lap.h}h${lap.w + 40}l-14 22H${lap.x - 6}Z" fill="#2a2f45" stroke="${C.steel}" stroke-width="2"/>`;

    // Servo bank on a bracket, leads to the board.
    const servos = [0, 1, 2, 3, 4].map((i) => servo(640 + i * 0, 170 + i * 58, 0.8, i * 18 - 36, true)).join('');

    // Screws scattered.
    const screws = [
      [300, 920 - 90],
      [330, 845],
      [360, 872],
      [560, 610],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="${C.steel}"/><path d="M${x - 4} ${y}h8" stroke="${C.ink}" stroke-width="2"/>`)
      .join('');

    return `${baseDefs(uid)}
      <rect width="1000" height="1000" fill="url(#${uid}-bg)"/>
      <rect x="${mat.x}" y="${mat.y}" width="${mat.w}" height="${mat.h}" rx="18" fill="#17122a" stroke="${C.lilac}" stroke-opacity="0.25" stroke-width="2"/>
      <g stroke="${C.arc}" stroke-opacity="0.09" stroke-width="1">${matGrid}</g>

      ${webcam(170, 160, 58, 1.2, 'clamp')}
      <path d="M200 205L380 470L200 470Z" fill="${C.arc}" opacity="0.05"/>

      <g class="anim-fade" style="--d:200ms">${board(760, 170 + 0, 170, 120, uid)}</g>
      <g class="anim-fade" style="--d:350ms">
        <rect x="560" y="140" width="165" height="300" rx="14" fill="#1e2233" stroke="${C.steel}" stroke-width="2"/>
        ${servos}
      </g>
      <g class="anim-draw" style="--d:500ms" fill="none" stroke-width="2.4">
        <path d="M586 220C660 240 700 250 760 262" pathLength="1" stroke="${C.rose}"/>
        <path d="M586 336C690 330 710 300 760 276" pathLength="1" stroke="${C.brass}"/>
      </g>

      <g class="anim-fade" style="--d:450ms">${assembled}</g>
      ${loose}
      ${spool}
      <g>${spring(260, 560)}${spring(250, 600)}</g>
      ${screws}
      <g class="anim-fade" style="--d:600ms">${laptop}</g>
    `;
  },
};

export default art;
