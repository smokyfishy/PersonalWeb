// Dev-only: renders every illustration at full reveal for visual QA.
// Usage: npm run dev, then open /dev/art-preview.html?only=<id>&compact=1
import '../src/styles/tokens.css';
import '../src/styles/art.css';
import type { Art } from '../src/art/kit';

const modules = import.meta.glob<{ default: Art }>('../src/art/*.ts');
const params = new URLSearchParams(location.search);
const only = params.get('only');
const compact = params.has('compact');
if (compact) document.body.classList.add('compact');
const grid = document.getElementById('grid')!;

const skip = new Set(['kit', 'index', 'hand']);
for (const [path, load] of Object.entries(modules)) {
  const id = path.split('/').pop()!.replace('.ts', '');
  if (skip.has(id) || (only && id !== only)) continue;
  const art = (await load()).default;
  const box = compact && art.compactViewBox ? art.compactViewBox : art.viewBox;
  const [, , w, h] = box.split(' ').map(Number);
  const shape = w / h > 1.2 ? 'wide' : 'square';
  const item = document.createElement('section');
  item.className = 'item';
  item.innerHTML = `<h2>${id}</h2><figure class="art is-visible frame ${shape}" style="margin:0"><svg viewBox="${box}" preserveAspectRatio="xMidYMid slice">${art.render(id)}</svg></figure>`;
  item.querySelectorAll("[pathLength]").forEach((el) => el.classList.add("draw-path"));
  grid.append(item);
}
document.body.dataset.ready = '1';
