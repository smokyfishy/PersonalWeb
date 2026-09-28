// Builds the real, focusable links laid over the circle artwork, plus the
// explicit list used on narrow or short screens.
import { SECTIONS, SECTION_ORDER } from '../content/sections';
import type { SectionId } from '../content/types';
import { NODES, hitBox, nodeFor, type NodeSpec } from './nodes';
import { CIRCLE_IMAGE } from './nodes';
import { sitePath } from '../app/views';

const W = CIRCLE_IMAGE.width;
const H = CIRCLE_IMAGE.height;
const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;

function hotspotMarkup(spec: NodeSpec): string {
  const box = hitBox(spec);
  const bw = box.x2 - box.x1;
  const bh = box.y2 - box.y1;
  const meta = SECTIONS[spec.id];
  // Ring and underline are positioned relative to the hotspot's own box.
  const ringSize = spec.node.r * 2.1;
  return `
    <a class="hotspot" href="${sitePath(spec.id)}" data-section="${spec.id}"
       style="left:${pct(box.x1, W)};top:${pct(box.y1, H)};width:${pct(bw, W)};height:${pct(bh, H)}">
      <span class="hs-ring" style="left:${pct(spec.node.x - box.x1, bw)};top:${pct(spec.node.y - box.y1, bh)};width:${pct(ringSize, bw)};aspect-ratio:1"></span>
      <span class="hs-underline" style="left:${pct(spec.label.x1 - box.x1, bw)};top:${pct(spec.label.y2 + 6 - box.y1, bh)};width:${pct(spec.label.x2 - spec.label.x1, bw)}"></span>
      <span class="visually-hidden">${meta.title}: ${meta.description}</span>
    </a>`;
}

export function renderHotspots(container: HTMLElement): void {
  container.innerHTML = NODES.map(hotspotMarkup).join('');
}

export function renderHubList(container: HTMLElement): void {
  container.innerHTML = SECTION_ORDER.map((id) => {
    const spec = nodeFor(id);
    return `<a class="hub-list-link" href="${sitePath(id)}" data-section="${id}">${SECTIONS[id].title}<small>${spec.position}</small></a>`;
  }).join('');
}

export function markHotspot(container: HTMLElement, id: SectionId | null, className: string): void {
  container.querySelectorAll<HTMLElement>('.hotspot').forEach((el) => {
    el.classList.toggle(className, el.dataset.section === id);
  });
}
