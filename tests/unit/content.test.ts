import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ABOUT, EDUCATION, HONORS, SKILLS, SKILLS_ART } from '../../src/content/about';
import { CONTACT } from '../../src/content/contact';
import { LEADERSHIP, ROLES } from '../../src/content/experience';
import { PROJECTS } from '../../src/content/projects';
import { PUBLICATIONS } from '../../src/content/research';
import type { ArtRef } from '../../src/content/types';
import { privatePatterns } from '../private-patterns';

const root = path.resolve(__dirname, '../..');
const artDir = path.join(root, 'src/art');

const allArt: ArtRef[] = [
  ABOUT.art,
  SKILLS_ART,
  ...PROJECTS.map((p) => p.art),
  ...PUBLICATIONS.map((p) => p.art),
  ...ROLES.map((r) => r.art),
  ...LEADERSHIP.map((r) => r.art),
];

describe('content', () => {
  it('gives every major entry an illustration with alt text and a module', () => {
    for (const art of allArt) {
      expect(art.alt.length, art.id).toBeGreaterThan(30);
      expect(existsSync(path.join(artDir, `${art.id}.ts`)), art.id).toBe(true);
    }
  });

  it('uses a distinct illustration for every project, paper, and role', () => {
    const ids = allArt.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps the resume metrics exactly as stated', () => {
    const text = JSON.stringify({ PROJECTS, PUBLICATIONS, ROLES, LEADERSHIP });
    for (const fact of ['~8,000', '50+', '0.96', '$295', '48,000+', '97%+', '< 250 ms', '220', '94.3%', '188', '99.5%', '98.3%', '18 businesses', '$5,000', '30+', '165']) {
      expect(text, fact).toContain(fact);
    }
  });

  it('caveats clinical and research maturity', () => {
    const byId = Object.fromEntries(PROJECTS.map((p) => [p.id, p]));
    expect(byId.kinetix.caveat).toMatch(/not been used in patients/);
    expect(byId.spatialize.caveat).toMatch(/does not provide real-time or intraoperative/);
    expect(byId.dmd.caveat).toMatch(/candidate/);
    expect(byId.nsclc.caveat).toMatch(/not a validated clinical test/);
  });

  it('uses the confirmed KINETIX and ASU dates', () => {
    const kinetix = ROLES.find((r) => r.id === 'kinetix-role');
    const asu = ROLES.find((r) => r.id === 'asu-role');
    expect(kinetix?.period).toBe('Aug 2025 – present');
    expect(PROJECTS.find((p) => p.id === 'kinetix')?.period).toBe('Aug 2025 – present');
    expect(asu?.period).toBe('Aug 2024 – Sep 2025');
  });

  it('lists every honor from both resumes, plus GPA and SAT', () => {
    const honors = HONORS.join(' | ');
    for (const h of [
      'Regeneron ISEF Finalist',
      'EXPLR National STEM Festival Champion',
      'IEEE ICTIIA Best Paper Award',
      'AzSEF Best of Fair',
      'AzSEF 1st Place, Robotics & Intelligent Machines',
      'AzSEF 2nd Place, Materials Science',
      'Future Innovator of the Year, Honorable Mention',
      'AP Capstone Diploma',
      '3× AP Scholar with Distinction',
    ]) {
      expect(honors, h).toContain(h);
    }
    const hs = EDUCATION.find((e) => e.place.startsWith('Hamilton'));
    expect(hs?.detail).toContain('Summa Cum Laude');
    expect(hs?.notes.join(' ')).toContain('GPA 4.0 unweighted, 4.8 weighted');
    expect(hs?.notes.join(' ')).toContain('SAT 1570');
  });

  it('never shows the provisional patent number', () => {
    expect(JSON.stringify(ROLES)).not.toContain('63/791,603');
  });

  it('describes the Duke degrees as in progress', () => {
    expect(ABOUT.intro[0]).toMatch(/working toward/);
  });

  it('only lists skills that appear on the resumes', () => {
    const allowed = new Set(['Python', 'Java', 'Git', 'PyTorch', 'TensorFlow', 'scikit-learn', 'Flask', 'ROS2', 'Arduino']);
    for (const item of SKILLS.flatMap((g) => g.items)) expect(allowed.has(item), item).toBe(true);
  });

  it('links both papers to IEEE Xplore', () => {
    expect(PUBLICATIONS.map((p) => p.link?.href)).toEqual([
      'https://ieeexplore.ieee.org/abstract/document/10761308/',
      'https://ieeexplore.ieee.org/abstract/document/11424109',
    ]);
  });

  it('exposes only public contact channels', () => {
    expect(CONTACT.email).toBe('akshay.karthik@duke.edu');
    expect(CONTACT.linkedin.href).toBe('https://www.linkedin.com/in/akshay-karthik-a219a7311/');
  });
});

const PRIVATE_TEXT = privatePatterns();

describe.skipIf(PRIVATE_TEXT.length === 0)('privacy', () => {
  const PRIVATE = PRIVATE_TEXT.map((s) => s.toLowerCase());

  function scan(dir: string): string[] {
    const hits: string[] = [];
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) {
        if (['node_modules', '.git', 'qa', 'test-results'].includes(name)) continue;
        hits.push(...scan(full));
      } else if (/\.(ts|js|html|css|json|md|txt|svg)$/.test(name)) {
        const text = readFileSync(full, 'utf8').toLowerCase();
        if (PRIVATE.some((s) => text.includes(s))) hits.push(full);
      }
    }
    return hits;
  }

  it('keeps the home address and phone number out of the source', () => {
    const hits = scan(path.join(root, 'src')).concat(scan(path.join(root, 'public')));
    expect(hits).toEqual([]);
  });

  it('keeps them out of the production build and ships no resume PDF', () => {
    const dist = path.join(root, 'dist');
    if (!existsSync(dist)) return; // run `npm run build` first; CI runs build before test
    expect(scan(dist)).toEqual([]);
    const pdfs = readdirSync(dist, { recursive: true }).filter((f) => String(f).endsWith('.pdf'));
    expect(pdfs).toEqual([]);
  });
});
