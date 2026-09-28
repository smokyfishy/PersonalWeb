// Derived layers for the Door of Truth scene, all aligned to the supplied
// 1672×941 artwork (nothing is redrawn):
//   • door-glyphs: the dark engraved lines on the two stone leaves, re-coloured
//     blue-violet with a soft halo, so the carvings themselves can pulse.
//   • door-blur: a blurred, darkened plate that fills the screen around the
//     door on portrait phones.
import path from 'node:path';
import sharp from 'sharp';

const W = 1672;
const H = 941;

/** Front faces of the two stone leaves (image px), excluding the opening. */
export const LEAVES = [
  [
    [540, 84],
    [764, 26],
    [794, 858],
    [502, 864],
  ],
  [
    [872, 26],
    [1124, 86],
    [1164, 864],
    [872, 858],
  ],
];

const polySvg = (fill) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${LEAVES.map(
      (p) => `<polygon points="${p.map(([x, y]) => `${x},${y}`).join(' ')}" fill="${fill}"/>`,
    ).join('')}</svg>`,
  );

export async function makeDoorLayers(src, outDir) {
  // Engraving mask: dark pixels on the leaves.
  const leafMask = await sharp(polySvg('#fff')).resize(W, H).extractChannel(0).raw().toBuffer();
  const gray = await sharp(src).resize(W, H).grayscale().extractChannel(0).raw().toBuffer();
  // Local contrast: carved lines are much darker than the stone around them.
  const local = await sharp(gray, { raw: { width: W, height: H, channels: 1 } }).blur(7).extractChannel(0).raw().toBuffer();
  const rgba = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const inLeaf = leafMask[i] > 128;
    const a = inLeaf ? Math.max(0, Math.min(1, (local[i] - gray[i] - 26) / 22)) : 0;
    rgba[i * 4] = 176;
    rgba[i * 4 + 1] = 168;
    rgba[i * 4 + 2] = 255;
    rgba[i * 4 + 3] = Math.round(a * 255);
  }
  const lines = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  const halo = await sharp(lines).blur(4).png().toBuffer();
  const glyphs = sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([
    { input: halo },
    { input: halo },
    { input: lines },
  ]);
  await glyphs.clone().webp({ quality: 80, alphaQuality: 90 }).toFile(path.join(outDir, 'door-glyphs.webp'));

  await sharp(src)
    .resize({ width: 960 })
    .blur(18)
    .modulate({ brightness: 0.6 })
    .webp({ quality: 70 })
    .toFile(path.join(outDir, 'door-blur.webp'));
}
