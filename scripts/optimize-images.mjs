// Copies the supplied artwork into assets-src/ under stable names, then writes
// responsive AVIF/WebP derivatives into public/img/. The originals in the project
// root are never modified. Run with: npm run images
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { makeEdwardLayers } from './cutout.mjs';
import { makeDoorLayers } from './door.mjs';

const root = path.resolve(import.meta.dirname, '..');
const srcDir = path.join(root, 'assets-src');
const outDir = path.join(root, 'public', 'img');

// Asset mapping (verified by inspecting each image directly — see CLAUDE.md).
const SOURCES = [
  { from: 'ChatGPT Image Sep 26, 2026, 03_21_20 PM-1.png', to: 'edward-hello.png', widths: [800, 1200, 1619] },
  { from: 'ChatGPT Image Sep 26, 2026, 03_21_20 PM-2.png', to: 'edward-welcome.png', widths: [800, 1200, 1619] },
  { from: 'ChatGPT Image Sep 26, 2026, 03_25_13 PM (1).png', to: 'transmutation-circle.png', widths: [900, 1400, 1672] },
  { from: 'ChatGPT Image Sep 26, 2026, 04_57_49 PM-1.png', to: 'edward-truth.png', widths: [] },
  { from: 'ChatGPT Image Sep 26, 2026, 04_57_50 PM-2.png', to: 'door-of-truth.png', widths: [900, 1400, 1672] },
];

await mkdir(srcDir, { recursive: true });
await mkdir(outDir, { recursive: true });

for (const { from, to, widths } of SOURCES) {
  const original = path.join(root, from);
  const stable = path.join(srcDir, to);
  await copyFile(original, stable);
  const base = to.replace(/\.png$/, '');
  for (const w of widths) {
    const img = sharp(stable).resize({ width: w, withoutEnlargement: true });
    await img.clone().avif({ quality: 62, effort: 6 }).toFile(path.join(outDir, `${base}-${w}.avif`));
    await img.clone().webp({ quality: 84 }).toFile(path.join(outDir, `${base}-${w}.webp`));
  }
  console.log(`✓ ${to}`);
}

// Transparent intro layers: one Edward body + a bubble per slide.
{
  const { w, h, body, bubbles, stats } = await makeEdwardLayers([
    path.join(srcDir, 'edward-hello.png'),
    path.join(srcDir, 'edward-welcome.png'),
    path.join(srcDir, 'edward-truth.png'),
  ]);
  const layers = [
    ['edward-body', body],
    ['edward-hello-bubble', bubbles[0]],
    ['edward-welcome-bubble', bubbles[1]],
    ['edward-truth-bubble', bubbles[2]],
  ];
  for (const [name, buf] of layers) {
    const raw = sharp(buf, { raw: { width: w, height: h, channels: 4 } });
    await raw.clone().png().toFile(path.join(srcDir, `${name}.png`));
    for (const width of [800, 1200, 1619]) {
      const img = raw.clone().resize({ width });
      await img.clone().avif({ quality: 66, effort: 6 }).toFile(path.join(outDir, `${name}-${width}.avif`));
      await img.clone().webp({ quality: 88, alphaQuality: 100 }).toFile(path.join(outDir, `${name}-${width}.webp`));
    }
    console.log(`✓ ${name}`);
  }
  console.log(`  bubble mask sizes (px): ${stats.join(', ')}`);
}

// Pre-blurred, dimmed circle used behind the intro and at the start of the descent.
// Blurring once here is far cheaper than animating a CSS filter on a large layer.
await sharp(path.join(srcDir, 'transmutation-circle.png'))
  .resize({ width: 960 })
  .blur(14)
  .modulate({ brightness: 0.55, saturation: 1.1 })
  .webp({ quality: 70 })
  .toFile(path.join(outDir, 'transmutation-circle-blur.webp'));
console.log('✓ transmutation-circle-blur.webp');

// Same plate with a transparent elliptical vignette, for the camera layer: when
// the circle spirals in at a tilt, no rectangular edge can show.
{
  const w = 960;
  const h = 540;
  const vignette = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><radialGradient id="g" cx="50%" cy="48%" r="50%"><stop offset="0.62" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  );
  await sharp(path.join(srcDir, 'transmutation-circle.png'))
    .resize({ width: w, height: h })
    .blur(14)
    .modulate({ brightness: 0.55, saturation: 1.1 })
    .ensureAlpha()
    .composite([{ input: vignette, blend: 'dest-in' }])
    .webp({ quality: 72, alphaQuality: 90 })
    .toFile(path.join(outDir, 'transmutation-circle-blur-soft.webp'));
  console.log('✓ transmutation-circle-blur-soft.webp');
}

// Door of Truth: engraving glow + blurred surround.
await makeDoorLayers(path.join(srcDir, 'door-of-truth.png'), outDir);
console.log('✓ door layers');

// Akshay's portrait (About page): 4:5 crop, head to mid-torso. The original
// photo is left untouched in the project root.
{
  const src = path.join(root, 'IMG_0019 (3).jpg');
  await copyFile(src, path.join(srcDir, 'akshay-portrait.jpg'));
  const crop = sharp(src).rotate().extract({ left: 0, top: 170, width: 941, height: 1176 });
  for (const width of [480, 800]) {
    const img = crop.clone().resize({ width });
    await img.clone().avif({ quality: 60, effort: 6 }).toFile(path.join(outDir, `akshay-portrait-${width}.avif`));
    await img.clone().webp({ quality: 84 }).toFile(path.join(outDir, `akshay-portrait-${width}.webp`));
  }
  console.log('✓ akshay-portrait');
}

// Social preview image (the circle, cropped to 1200×630).
await sharp(path.join(srcDir, 'transmutation-circle.png'))
  .resize({ width: 1200, height: 630, fit: 'cover' })
  .jpeg({ quality: 82 })
  .toFile(path.join(root, 'public', 'og-image.jpg'));
console.log('✓ og-image.jpg');
