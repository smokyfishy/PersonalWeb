// Dignity Health volunteer leadership: coordination, not a clinical scene.
// A shift board of colour-coded volunteer blocks, two hands passing a
// clipboard (handoff/onboarding), a lanyard badge, and a heart-with-pulse care
// motif. No patients, no faces, no medical emblems.
import { C, baseDefs, f, rng, type Art } from './kit';

const art: Art = {
  viewBox: '0 0 1000 1000',
  render(uid) {
    const rand = rng(13);
    // Shift board.
    const bx = 110;
    const by = 90;
    const bw = 780;
    const bh = 420;
    const cols = 7;
    const rows = 6;
    const cw = (bw - 120) / cols;
    const rh = (bh - 90) / rows;
    const colors = [C.arc, C.teal, C.lilac, C.rose, C.brassHi];
    let blocks = '';
    for (let r = 0; r < rows; r++) {
      let c = 0;
      while (c < cols) {
        const span = 1 + Math.floor(rand() * 3);
        if (rand() < 0.78) {
          const w = Math.min(span, cols - c) * cw - 8;
          blocks += `<rect x="${f(bx + 100 + c * cw + 4)}" y="${f(by + 70 + r * rh + 6)}" width="${f(w)}" height="${f(rh - 12)}" rx="8" fill="${colors[(r + c) % colors.length]}" opacity="0.7"/>`;
        }
        c += span;
      }
    }
    const avatars = Array.from({ length: rows }, (_, r) => `<circle cx="${bx + 50}" cy="${f(by + 70 + r * rh + rh / 2)}" r="16" fill="${C.plum3}" stroke="${C.lilac}" stroke-opacity="0.5" stroke-width="2"/>`).join('');
    const heads = Array.from({ length: cols }, (_, c) => `<rect x="${f(bx + 100 + c * cw + 18)}" y="${by + 30}" width="${f(cw - 36)}" height="12" rx="6" fill="${C.lilac}" opacity="0.35"/>`).join('');

    // Clipboard handoff.
    const cbx = 380;
    const cby = 560;
    const clipboard = `
      <g transform="rotate(-6 500 720)">
        <rect x="${cbx}" y="${cby}" width="240" height="320" rx="16" fill="#6b4e2e" stroke="#3a2818" stroke-width="3"/>
        <rect x="${cbx + 18}" y="${cby + 34}" width="204" height="270" rx="6" fill="${C.chalk}"/>
        <rect x="${cbx + 80}" y="${cby - 12}" width="80" height="36" rx="8" fill="${C.steel}"/>
        ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${cbx + 60}" y="${cby + 70 + i * 36}" width="${130 - (i % 3) * 22}" height="9" rx="4" fill="${C.plum3}" opacity="0.4"/><rect x="${cbx + 34}" y="${cby + 66 + i * 36}" width="16" height="16" rx="3" fill="none" stroke="${C.plum3}" stroke-width="2"/>${i < 4 ? `<path d="M${cbx + 37} ${cby + 74 + i * 36}l4 5 8-10" stroke="${C.teal}" stroke-width="3" fill="none"/>` : ''}`).join('')}
      </g>`;

    // Hands: sleeves enter from each side; thumbs on the front of the board,
    // fingers behind its edge.
    const hand = (side: 'left' | 'right') => {
      const m = side === 'left' ? 1 : -1;
      const ex = side === 'left' ? cbx + 6 : cbx + 234;
      const ey = side === 'left' ? 800 : 640;
      const sleeve = side === 'left' ? '#5a3a8f' : '#2f6f8f';
      return `<g>
        <path d="M${ex - m * 260} ${ey + 70}L${ex - m * 60} ${ey + 10}L${ex - m * 40} ${ey + 80}L${ex - m * 250} ${ey + 150}Z" fill="${sleeve}"/>
        <rect x="${side === 'left' ? ex - 72 : ex + 44}" y="${ey + 4}" width="28" height="84" rx="8" fill="${C.chalk}" opacity="0.85" transform="rotate(${-m * 16} ${ex} ${ey + 40})"/>
        <path d="M${ex - m * 48} ${ey + 10}C${ex - m * 20} ${ey - 4} ${ex + m * 8} ${ey + 6} ${ex + m * 10} ${ey + 28}C${ex + m * 12} ${ey + 60} ${ex - m * 6} ${ey + 90} ${ex - m * 40} ${ey + 92}Z" fill="#c9a07e"/>
        <path d="M${ex - m * 4} ${ey + 22}C${ex + m * 26} ${ey + 12} ${ex + m * 44} ${ey + 20} ${ex + m * 46} ${ey + 34}C${ex + m * 44} ${ey + 44} ${ex + m * 24} ${ey + 46} ${ex + m * 2} ${ey + 44}" fill="#d8b08c" stroke="#a37d5c" stroke-width="2"/>
      </g>`;
    };

    const badge = `
      <path d="M770 530C790 600 800 640 820 680M870 530C850 600 840 640 820 680" stroke="${C.teal}" stroke-width="6" fill="none"/>
      <rect x="770" y="680" width="100" height="136" rx="12" fill="${C.chalk}"/>
      <rect x="770" y="680" width="100" height="36" rx="12" fill="${C.teal}"/>
      <circle cx="820" cy="752" r="20" fill="${C.plum3}" opacity="0.5"/>
      <rect x="788" y="782" width="64" height="8" rx="4" fill="${C.plum3}" opacity="0.5"/>
      <rect x="798" y="796" width="44" height="6" rx="3" fill="${C.plum3}" opacity="0.35"/>`;

    const heart = `
      <path d="M170 700c-40-40-100-10-90 40 8 40 60 70 90 96 30-26 82-56 90-96 10-50-50-80-90-40Z" fill="${C.rose}" opacity="0.85"/>
      <path d="M90 740H138L152 712L172 770L188 728L200 740H250" stroke="${C.chalk}" stroke-width="4.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;

    return `${baseDefs(uid)}
      <rect width="1000" height="1000" fill="url(#${uid}-bg)"/>
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="20" fill="#130c1b" stroke="${C.lilac}" stroke-opacity="0.3" stroke-width="2"/>
      ${heads}
      ${avatars}
      <g class="anim-fade" style="--d:200ms">${blocks}</g>
      <g class="anim-pop" style="--d:900ms">${heart}</g>
      <g class="anim-fade" style="--d:400ms">${badge}</g>
      <g class="anim-fade" style="--d:600ms">
        ${hand('left')}
        ${clipboard}
        ${hand('right')}
      </g>
    `;
  },
};

export default art;
