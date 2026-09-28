// Cuts Edward and his speech bubbles out of the supplied white-background
// artwork, without redrawing anything:
//   1. The white background is flood-filled from the top and right edges only,
//      so white areas enclosed by line art (bubble interior, eyes, coat trim)
//      stay opaque.
//   2. Anti-aliased edge pixels are un-premultiplied from white, so no pale
//      halo shows on the dark scene.
//   3. The bubble (interior + outline + text) is separated into its own layer
//      so the intro can animate the bubble while Edward stays perfectly still.
import sharp from 'sharp';

const WHITE_MIN = 226; // min(r,g,b) above this counts as background white
const FRINGE = 3; // px band of edge pixels to un-premultiply

/** Seed inside each bubble (image px) and the bubble's bounding box. */
const BUBBLE = { seed: [1180, 60], box: { x0: 850, y0: 5, x1: 1500, y1: 485 } };
const TAIL_TIP = { x0: 856, y0: 432, x1: 905, y1: 466 };

async function load(file) {
  // All Edward slides share one 1619×972 canvas (the third source is 1px shorter).
  const { data, info } = await sharp(file).resize(1619, 972, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

const isWhite = (d, i) => Math.min(d[i * 3], d[i * 3 + 1], d[i * 3 + 2]) > WHITE_MIN;

/** Scanline-free BFS flood fill over pixels accepted by `ok`. */
function flood(w, h, seeds, ok) {
  const mask = new Uint8Array(w * h);
  const stack = [];
  for (const i of seeds) {
    if (ok(i) && !mask[i]) {
      mask[i] = 1;
      stack.push(i);
    }
  }
  while (stack.length) {
    const i = stack.pop();
    const x = i % w;
    const y = (i - x) / w;
    const push = (j) => {
      if (!mask[j] && ok(j)) {
        mask[j] = 1;
        stack.push(j);
      }
    };
    if (x > 0) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (y > 0) push(i - w);
    if (y < h - 1) push(i + w);
  }
  return mask;
}

function dilate(mask, w, h, r) {
  let cur = mask;
  for (let k = 0; k < r; k++) {
    const next = cur.slice();
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (cur[i]) continue;
        if ((x > 0 && cur[i - 1]) || (x < w - 1 && cur[i + 1]) || (y > 0 && cur[i - w]) || (y < h - 1 && cur[i + w])) next[i] = 1;
      }
    cur = next;
  }
  return cur;
}

/** Bubble mask = interior flood (inside the bubble box), dilated, holes filled. */
function bubbleMask({ data, w, h }) {
  const { seed, box } = BUBBLE;
  const inBox = (i) => {
    const x = i % w;
    const y = (i - x) / w;
    return x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1;
  };
  const interior = flood(w, h, [seed[1] * w + seed[0]], (i) => inBox(i) && isWhite(data, i));
  // Fill holes (the letters): anything in the box not reachable from the box
  // border through non-mask pixels is inside the bubble.
  const borderSeeds = [];
  for (let x = box.x0; x <= box.x1; x++) borderSeeds.push(box.y0 * w + x, box.y1 * w + x);
  for (let y = box.y0; y <= box.y1; y++) borderSeeds.push(y * w + box.x0, y * w + box.x1);
  const fillHoles = (m) => {
    const outside = flood(w, h, borderSeeds, (i) => inBox(i) && !m[i]);
    const out = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) if (inBox(i) && !outside[i]) out[i] = 1;
    return out;
  };
  return {
    // Interior white + text: protected from background removal.
    keep: fillHoles(interior),
    // Interior + outline: the pixels that belong to the bubble layer.
    region: fillHoles(dilate(interior, w, h, 9)),
  };
}

/** RGBA cut-out with the background removed and edges cleaned. */
function cutout({ data, w, h }, keep) {
  const seeds = [];
  for (let x = 0; x < w; x++) seeds.push(x); // top edge
  for (let y = 0; y < h; y++) seeds.push(y * w + (w - 1)); // right edge
  const bg = flood(w, h, seeds, (i) => !keep[i] && isWhite(data, i));
  const band = dilate(bg, w, h, FRINGE);
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];
    let a = 255;
    let [cr, cg, cb] = [r, g, b];
    if (bg[i]) {
      a = 0;
    } else if (band[i] && !keep[i]) {
      // Un-premultiply from white: pixel = a·c + (1−a)·white.
      const alpha = 1 - Math.min(r, g, b) / 255;
      if (alpha < 0.02) a = 0;
      else {
        a = Math.round(alpha * 255);
        const un = (v) => Math.max(0, Math.min(255, Math.round((v - 255 * (1 - alpha)) / alpha)));
        [cr, cg, cb] = [un(r), un(g), un(b)];
      }
    }
    out[i * 4] = cr;
    out[i * 4 + 1] = cg;
    out[i * 4 + 2] = cb;
    out[i * 4 + 3] = a;
  }
  return out;
}

function splitLayer(rgba, mask, w, h, inside) {
  const out = Buffer.from(rgba);
  for (let i = 0; i < w * h; i++) if (Boolean(mask[i]) !== inside) out[i * 4 + 3] = 0;
  return out;
}

/**
 * Produces body (from the first image) and one bubble layer per image, all at
 * full canvas size so they overlay exactly.
 * @returns {Promise<{w:number,h:number,body:Buffer,bubbles:Buffer[],stats:object}>}
 */
export async function makeEdwardLayers(files) {
  const imgs = await Promise.all(files.map(load));
  const { w, h } = imgs[0];
  const masks = imgs.map(bubbleMask);
  const cuts = imgs.map((img, k) => cutout(img, masks[k].keep));
  // Split on a grown region so the outline's outer anti-aliasing and the tail
  // tip go with the bubble instead of ghosting on the body layer.
  const split = masks.map(({ region }) => {
    const grown = dilate(region, w, h, 7);
    // The tail narrows to a point the interior flood cannot reach; hand the
    // tip region (clear of the hair, which ends left of x≈850) to the bubble.
    for (let y = TAIL_TIP.y0; y <= TAIL_TIP.y1; y++) for (let x = TAIL_TIP.x0; x <= TAIL_TIP.x1; x++) grown[y * w + x] = 1;
    return grown;
  });
  const body = splitLayer(cuts[0], split[0], w, h, false);
  const bubbles = cuts.map((c, k) => splitLayer(c, split[k], w, h, true));
  const stats = masks.map((m) => m.region.reduce((s, v) => s + v, 0));
  return { w, h, body, bubbles, stats };
}
