// Reusable hardware glyphs: webcam (side profile on a stand), hobby servo,
// and a generic microcontroller board. No logos or text.
import { C, f } from './kit';

/**
 * Webcam seen in side profile. (x, y) is the pivot on top of the stand; the
 * head is rotated by `aim` degrees so the lens points at its subject.
 * `mount` chooses a tripod or a bench clamp.
 */
export function webcam(x: number, y: number, aim: number, scale = 1, mount: 'tripod' | 'clamp' | 'none' = 'tripod', led = true): string {
  const s = scale;
  const stand =
    mount === 'tripod'
      ? `<g stroke="${C.steel}" stroke-width="${f(3 * s)}" stroke-linecap="round" fill="none">
          <path d="M${x} ${y}V${f(y + 70 * s)}M${x} ${f(y + 70 * s)}L${f(x - 34 * s)} ${f(y + 120 * s)}M${x} ${f(y + 70 * s)}L${f(x + 34 * s)} ${f(y + 120 * s)}M${x} ${f(y + 70 * s)}V${f(y + 124 * s)}"/>
        </g>`
      : mount === 'clamp'
        ? `<g fill="none" stroke="${C.steel}" stroke-width="${f(3 * s)}" stroke-linecap="round" stroke-linejoin="round">
            <path d="M${x} ${y}V${f(y + 46 * s)}"/>
            <path d="M${f(x - 26 * s)} ${f(y + 46 * s)}H${f(x + 26 * s)}V${f(y + 86 * s)}H${f(x + 8 * s)}M${f(x - 26 * s)} ${f(y + 46 * s)}V${f(y + 60 * s)}"/>
            <path d="M${f(x + 18 * s)} ${f(y + 86 * s)}V${f(y + 104 * s)}" stroke-width="${f(5 * s)}"/>
          </g>`
        : '';
  return `<g>
    ${stand}
    <g transform="translate(${x} ${y}) rotate(${aim}) scale(${s} ${Math.abs(aim) > 90 ? -s : s})">
      <rect x="-40" y="-50" width="62" height="42" rx="12" fill="#2a2f45" stroke="${C.steel}" stroke-width="2.5"/>
      <rect x="22" y="-44" width="16" height="30" rx="4" fill="#1c2033" stroke="${C.steel}" stroke-width="2.5"/>
      <ellipse cx="38" cy="-29" rx="4.5" ry="13" fill="${C.arc}" opacity="0.9"/>
      <ellipse cx="38" cy="-33" rx="1.6" ry="4" fill="${C.ice}"/>
      ${led ? `<circle cx="-24" cy="-40" r="3.2" fill="${C.teal}" class="anim-blink"/>` : ''}
      <path d="M-9 -8V0" stroke="${C.steel}" stroke-width="5" stroke-linecap="round"/>
    </g>
  </g>`;
}

/** Hobby servo seen from above with output horn and a three-wire lead. */
export function servo(x: number, y: number, scale = 1, hornAngle = 0, lead = true): string {
  const s = scale;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-40" y="-18" width="80" height="36" rx="4" fill="#23283b" stroke="${C.steel}" stroke-width="2"/>
    <rect x="-52" y="-8" width="104" height="16" rx="3" fill="none" stroke="${C.steel}" stroke-width="2"/>
    <circle cx="-46" cy="0" r="2.5" fill="${C.steel}"/><circle cx="46" cy="0" r="2.5" fill="${C.steel}"/>
    <circle cx="18" cy="0" r="10" fill="#343b55" stroke="${C.ice}" stroke-opacity="0.6" stroke-width="1.5"/>
    <g transform="rotate(${hornAngle} 18 0)">
      <rect x="14" y="-26" width="8" height="52" rx="4" fill="${C.chalk}" opacity="0.9"/>
    </g>
    <circle cx="18" cy="0" r="3" fill="${C.ink}"/>
    ${
      lead
        ? `<g fill="none" stroke-width="2.4" stroke-linecap="round">
      <path d="M-40 -5c-14 0-18 10-30 10" stroke="#8a5a3c"/>
      <path d="M-40 0c-14 0-18 12-30 12" stroke="${C.rose}"/>
      <path d="M-40 5c-14 0-18 14-30 14" stroke="${C.brass}"/>
    </g>`
        : ''
    }
  </g>`;
}

/** Generic microcontroller board: header rows, main chip, USB port, LED. */
export function board(x: number, y: number, w = 210, h = 140, uid = 'b'): string {
  const pins = (py: number) =>
    Array.from({ length: Math.floor((w - 60) / 12) }, (_, i) => `<rect x="${f(x + 40 + i * 12)}" y="${py}" width="6" height="6" fill="${C.ink}" stroke="${C.brassHi}" stroke-opacity="0.7" stroke-width="1"/>`).join('');
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#15413f" stroke="${C.teal}" stroke-opacity="0.7" stroke-width="2"/>
    <rect x="${x + 34}" y="${y + 8}" width="${w - 50}" height="12" rx="2" fill="#0d2322"/>${pins(y + 11)}
    <rect x="${x + 34}" y="${y + h - 20}" width="${w - 50}" height="12" rx="2" fill="#0d2322"/>${pins(y + h - 17)}
    <rect x="${x - 10}" y="${y + 26}" width="34" height="30" rx="3" fill="#9aa6bf" stroke="${C.ink}" stroke-width="1.5"/>
    <rect x="${x + w * 0.42}" y="${y + h * 0.36}" width="${w * 0.34}" height="${h * 0.3}" rx="3" fill="#0b0f18"/>
    ${Array.from({ length: 8 }, (_, i) => `<rect x="${f(x + w * 0.44 + i * (w * 0.3 / 8))}" y="${f(y + h * 0.32)}" width="3" height="5" fill="${C.steel}"/><rect x="${f(x + w * 0.44 + i * (w * 0.3 / 8))}" y="${f(y + h * 0.66)}" width="3" height="5" fill="${C.steel}"/>`).join('')}
    <circle cx="${x + w - 22}" cy="${y + h * 0.5}" r="4" fill="${C.teal}" class="anim-blink" id="${uid}-led"/>
    <circle cx="${x + 18}" cy="${y + h - 30}" r="9" fill="none" stroke="${C.steel}" stroke-width="2"/>
  </g>`;
}

/** Screen position of the lens glass for a webcam drawn with webcam(). */
export function lensPoint(x: number, y: number, aim: number, scale = 1): { x: number; y: number } {
  const a = (aim * Math.PI) / 180;
  const ly = Math.abs(aim) > 90 ? 29 : -29;
  return {
    x: x + (38 * Math.cos(a) - ly * Math.sin(a)) * scale,
    y: y + (38 * Math.sin(a) + ly * Math.cos(a)) * scale,
  };
}
