// QA helper: crop a full-page screenshot region at native scale.
// node scripts/crop.mjs <in.png> <out.png> <top> <height>
import sharp from 'sharp';
const [src, out, top, height] = process.argv.slice(2);
const meta = await sharp(src).metadata();
await sharp(src).extract({ left: 0, top: Number(top), width: meta.width, height: Math.min(Number(height), meta.height - Number(top)) }).toFile(out);
