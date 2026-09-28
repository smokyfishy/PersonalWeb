// Tiny HTML helpers for the section renderers.
import type { ArtRef, ExternalLink } from '../content/types';

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/** Placeholder figure; src/art/index.ts hydrates it with the SVG on demand. */
export function artFigure(art: ArtRef, variant: 'wide' | 'square' | 'tall' = 'wide', extraClass = ''): string {
  return `
    <figure class="art art--${variant} ${extraClass}" data-art="${art.id}">
      <div class="art-canvas" role="img" aria-label="${esc(art.alt)}"></div>
      ${art.caption ? `<figcaption class="art-caption">${esc(art.caption)}</figcaption>` : ''}
    </figure>`;
}

export function externalLink(link: ExternalLink, className = 'text-link'): string {
  return `<a class="${className}" href="${esc(link.href)}" target="_blank" rel="noopener noreferrer">${esc(link.label)}<span class="visually-hidden"> (opens in a new tab)</span><svg class="ext-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3h7v7M13 3 5.5 10.5M11 9.5V13H3V5h3.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>`;
}

export function list(items: string[], className: string): string {
  return `<ul class="${className}">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
}
