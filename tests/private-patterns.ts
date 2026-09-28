import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Fragments of the home address and phone number that must never be published.
 * They are kept out of the repository: one per line in the git-ignored
 * `tests/private-patterns.local.txt`, or comma-separated in `PRIVATE_PATTERNS`.
 * With neither present, the privacy checks are skipped.
 */
export function privatePatterns(): string[] {
  const file = fileURLToPath(new URL('private-patterns.local.txt', import.meta.url));
  const raw = process.env.PRIVATE_PATTERNS ?? (existsSync(file) ? readFileSync(file, 'utf8').replace(/\r?\n/g, ',') : '');
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}
