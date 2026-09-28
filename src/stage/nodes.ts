// Positions of the five navigation nodes, measured in pixels of the supplied
// circle artwork (assets-src/transmutation-circle.png, 1672×941). Hotspots are
// laid out as percentages of these values, so they stay anchored to the image at
// any size. Re-measure with /?debug=hotspots if the artwork ever changes.
import type { SectionId } from '../content/types';

export const CIRCLE_IMAGE = { width: 1672, height: 941 } as const;
/** Centre of the large circle in image pixels. */
export const CIRCLE_CENTER = { x: 835, y: 452 } as const;

export interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface NodeSpec {
  id: SectionId;
  /** Where the node sits on the artwork, as written in the brief. */
  position: string;
  node: { x: number; y: number; r: number };
  label: Box;
}

export const NODES: NodeSpec[] = [
  { id: 'about', position: 'top', node: { x: 835, y: 148, r: 54 }, label: { x1: 858, y1: 40, x2: 976, y2: 72 } },
  { id: 'projects', position: 'upper right', node: { x: 1145, y: 368, r: 54 }, label: { x1: 1258, y1: 298, x2: 1420, y2: 332 } },
  { id: 'research', position: 'lower right', node: { x: 1025, y: 725, r: 54 }, label: { x1: 1178, y1: 717, x2: 1348, y2: 751 } },
  { id: 'experience', position: 'lower left', node: { x: 638, y: 722, r: 54 }, label: { x1: 318, y1: 717, x2: 520, y2: 751 } },
  { id: 'contact', position: 'upper left', node: { x: 520, y: 360, r: 54 }, label: { x1: 266, y1: 298, x2: 414, y2: 332 } },
];

export function nodeFor(id: SectionId): NodeSpec {
  const spec = NODES.find((n) => n.id === id);
  if (!spec) throw new Error(`Unknown node ${id}`);
  return spec;
}

/** Union of the node circle and its label, padded, as the clickable area. */
export function hitBox(spec: NodeSpec, pad = 14): Box {
  const { node, label } = spec;
  return {
    x1: Math.min(node.x - node.r, label.x1) - pad,
    y1: Math.min(node.y - node.r, label.y1) - pad,
    x2: Math.max(node.x + node.r, label.x2) + pad,
    y2: Math.max(node.y + node.r, label.y2) + pad,
  };
}

export function toPercent(x: number, y: number): { left: number; top: number } {
  return { left: (x / CIRCLE_IMAGE.width) * 100, top: (y / CIRCLE_IMAGE.height) * 100 };
}

/** Unit vector from the circle centre toward the node; drives motion direction. */
export function directionOf(spec: NodeSpec): { dx: number; dy: number } {
  const dx = spec.node.x - CIRCLE_CENTER.x;
  const dy = spec.node.y - CIRCLE_CENTER.y;
  const len = Math.hypot(dx, dy) || 1;
  return { dx: dx / len, dy: dy / len };
}

/** Image rect when fitted with object-fit: contain into a W×H box. */
export function containFit(boxW: number, boxH: number, imgW = CIRCLE_IMAGE.width, imgH = CIRCLE_IMAGE.height) {
  const scale = Math.min(boxW / imgW, boxH / imgH);
  const width = imgW * scale;
  const height = imgH * scale;
  return { scale, width, height, x: (boxW - width) / 2, y: (boxH - height) / 2 };
}
