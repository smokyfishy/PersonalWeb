// QA helper: tiles screenshots into one contact sheet.
// node scripts/sheet.mjs <out.png> <cols> <tileWidth> <in1.png> <in2.png> ...
import sharp from 'sharp';
const [out, cols, tw, ...files] = process.argv.slice(2);
const c = Number(cols);
const W = Number(tw);
const first = await sharp(files[0]).metadata();
const H = Math.round((W * first.height) / first.width);
const rows = Math.ceil(files.length / c);
const tiles = await Promise.all(files.map((f) => sharp(f).resize(W, H).png().toBuffer()));
await sharp({ create: { width: c * W + (c - 1) * 6, height: rows * H + (rows - 1) * 6, channels: 3, background: '#ffffff' } })
  .composite(tiles.map((input, i) => ({ input, left: (i % c) * (W + 6), top: Math.floor(i / c) * (H + 6) })))
  .png()
  .toFile(out);
