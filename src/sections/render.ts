// Renders each portfolio section from the content modules. Layout decisions
// live here and in styles/sections.css; wording lives in src/content.
import { ABOUT, CERTIFICATIONS, EDUCATION, HONORS, SKILLS, SKILLS_ART } from '../content/about';
import { CONTACT } from '../content/contact';
import { LEADERSHIP, ROLES } from '../content/experience';
import { PROJECTS } from '../content/projects';
import { ONGOING_RESEARCH, PUBLICATIONS } from '../content/research';
import { SECTIONS, SECTION_ORDER } from '../content/sections';
import type { CaseStudy, Role, SectionId } from '../content/types';
import { NODES } from '../stage/nodes';
import { CIRCLE_CENTER, CIRCLE_IMAGE } from '../stage/nodes';
import { artFigure, esc, externalLink, list } from './html';
import { sitePath } from '../app/views';

/** "You are here" miniature of the circle, marking the current node. */
function miniMap(id: SectionId): string {
  const s = 100 / CIRCLE_IMAGE.height; // scale image px → mini units
  const cx = CIRCLE_CENTER.x * s;
  const cy = CIRCLE_CENTER.y * s;
  const dots = NODES.map((n) => {
    const active = n.id === id;
    return `<circle cx="${(n.node.x * s).toFixed(1)}" cy="${(n.node.y * s).toFixed(1)}" r="${active ? 5 : 3.2}" class="${active ? 'mm-dot mm-dot--on' : 'mm-dot'}"/>`;
  }).join('');
  const pts = NODES.map((n) => `${(n.node.x * s).toFixed(1)},${(n.node.y * s).toFixed(1)}`);
  // Pentagram through the nodes in star order (0,2,4,1,3).
  const star = [0, 2, 4, 1, 3, 0].map((i) => pts[i]).join(' ');
  return `<svg class="minimap" viewBox="${cx - 42} ${cy - 42} 84 84" aria-hidden="true">
    <circle cx="${cx}" cy="${cy}" r="32" class="mm-ring"/>
    <polyline points="${star}" class="mm-star"/>
    ${dots}
  </svg>`;
}

function sectionHead(id: SectionId): string {
  const meta = SECTIONS[id];
  return `
    <header class="sec-head">
      ${miniMap(id)}
      <div class="sec-head-text">
        <h1 id="section-title" tabindex="-1">${esc(meta.heading)}</h1>
        <p class="sec-lede">${esc(meta.lede)}</p>
      </div>
    </header>`;
}

// ------------------------------------------------------------------ About

function renderAbout(): string {
  return `
    ${sectionHead('about')}
    <section class="about-intro" aria-label="Introduction">
      <div class="prose">${ABOUT.intro.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
      <figure class="portrait">
        <picture>
          <source type="image/avif" srcset="${sitePath('img/akshay-portrait-480.avif')} 480w, ${sitePath('img/akshay-portrait-800.avif')} 800w" sizes="(min-width: 900px) 420px, 88vw" />
          <source type="image/webp" srcset="${sitePath('img/akshay-portrait-480.webp')} 480w, ${sitePath('img/akshay-portrait-800.webp')} 800w" sizes="(min-width: 900px) 420px, 88vw" />
          <img src="${sitePath('img/akshay-portrait-800.webp')}" width="800" height="1000" alt="${esc(ABOUT.portrait.alt)}" decoding="async" />
        </picture>
      </figure>
    </section>

    <section class="about-edu" aria-labelledby="edu-title">
      <h2 id="edu-title">Education</h2>
      <ol class="timeline">
        ${EDUCATION.map(
          (e) => `
          <li class="timeline-item">
            <p class="timeline-period">${esc(e.period)}</p>
            <div>
              <h3>${esc(e.place)}</h3>
              <p>${esc(e.detail)}</p>
              ${e.notes.length ? list(e.notes, 'timeline-notes') : ''}
            </div>
          </li>`,
        ).join('')}
      </ol>
      <div class="honors">
        <h3>Selected honors</h3>
        ${list(HONORS, 'honors-list')}
      </div>
    </section>

    <section class="about-skills" aria-labelledby="skills-title">
      <div class="skills-art">${artFigure(SKILLS_ART, 'square')}</div>
      <div>
        <h2 id="skills-title">Tools I work with</h2>
        <dl class="skill-groups">
          ${SKILLS.map(
            (g) => `
            <div class="skill-group">
              <dt>${esc(g.name)} <span>${esc(g.description)}</span></dt>
              <dd><ul>${g.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></dd>
            </div>`,
          ).join('')}
        </dl>
        <p class="certs"><strong>Certifications:</strong> ${CERTIFICATIONS.map(esc).join('; ')}</p>
      </div>
    </section>

    <section class="about-outro" aria-label="Outside of work">
      <aside class="personal">
        <p>${esc(ABOUT.personal)}</p>
      </aside>
      ${artFigure(ABOUT.art, 'square', 'outro-art')}
    </section>`;
}

// --------------------------------------------------------------- Projects

function caseStudy(p: CaseStudy, index: number): string {
  const layout = index === 0 ? 'feature' : index % 2 === 1 ? 'art-right' : 'art-left';
  return `
    <article class="case case--${layout}" id="${p.id}" aria-labelledby="${p.id}-title">
      ${artFigure(p.art, 'wide', 'case-art')}
      <div class="case-body">
        <header class="case-head">
          <h2 id="${p.id}-title">${esc(p.title)}</h2>
          <p class="case-subject">${esc(p.subject)}</p>
          <p class="case-period">${esc(p.period)}</p>
        </header>
        <p class="case-summary">${esc(p.summary)}</p>
        <dl class="results">
          ${p.results.map((m) => `<div class="result"><dt>${esc(m.label)}</dt><dd>${esc(m.value)}</dd></div>`).join('')}
        </dl>
        ${p.caveat ? `<p class="caveat">${esc(p.caveat)}</p>` : ''}
        <p class="case-role"><strong>Akshay’s role.</strong> ${esc(p.role)}</p>
        <p class="case-methods"><strong>Methods.</strong> ${p.methods.map(esc).join('; ')}.</p>
        <details class="more">
          <summary>How it works</summary>
          ${p.details.map((d) => `<p>${esc(d)}</p>`).join('')}
        </details>
        ${p.links.length ? `<p class="case-links">${p.links.map((l) => externalLink(l)).join(' ')}</p>` : ''}
      </div>
    </article>`;
}

function renderProjects(): string {
  return `
    ${sectionHead('projects')}
    <nav class="jump-nav" aria-label="Projects on this page">
      <ul>${PROJECTS.map((p) => `<li><a href="#${p.id}">${esc(p.title)}</a></li>`).join('')}</ul>
    </nav>
    <div class="cases">${PROJECTS.map(caseStudy).join('')}</div>`;
}

// --------------------------------------------------------------- Research

function renderResearch(): string {
  return `
    ${sectionHead('research')}
    <section aria-labelledby="pubs-title">
      <h2 id="pubs-title" class="visually-hidden">Publications</h2>
      <div class="pubs">
        ${PUBLICATIONS.map(
          (p) => `
          <article class="pub" id="${p.id}" aria-labelledby="${p.id}-title">
            ${artFigure(p.art, 'square', 'pub-art')}
            <div class="pub-body">
              <p class="pub-venue">${esc(p.venue)}, ${esc(p.year)}</p>
              <h3 id="${p.id}-title">${esc(p.title)}</h3>
              <p class="pub-authors">${esc(p.authors)}</p>
              ${p.award ? `<p class="pub-award"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.7L10 14.8l-5.1 2.7 1-5.7-4.1-4 5.7-.8z" fill="currentColor"/></svg>${esc(p.award)}</p>` : ''}
              <p>${esc(p.summary)}</p>
              <p class="pub-links">${p.link ? externalLink(p.link) : ''}<a class="text-link" href="${sitePath('projects')}#${p.relatedProject}" data-internal>Read the project case study</a></p>
            </div>
          </article>`,
        ).join('')}
      </div>
    </section>
    <section class="ongoing" aria-labelledby="ongoing-title">
      ${artFigure({ id: 'dmd-network', alt: 'Gene interaction network linked to a protein structure with seven residue clusters.' }, 'wide', 'ongoing-art')}
      <div class="ongoing-body">
        <h2 id="ongoing-title">${esc(ONGOING_RESEARCH.title)}</h2>
        <p class="case-period">Independent research, ${esc(ONGOING_RESEARCH.period)}</p>
        <p>${esc(ONGOING_RESEARCH.summary)}</p>
        <p class="caveat">${esc(ONGOING_RESEARCH.caveat)}</p>
        <p><a class="text-link" href="${sitePath('projects')}#${ONGOING_RESEARCH.relatedProject}" data-internal>Read the project case study</a></p>
      </div>
    </section>
`;
}

// ------------------------------------------------------------- Experience

function role(r: Role, compact = false): string {
  return `
    <article class="role ${compact ? 'role--compact' : ''}" id="${r.id}" aria-labelledby="${r.id}-title">
      ${artFigure(r.art, compact ? 'wide' : 'square', 'role-art')}
      <div class="role-body">
        <h3 id="${r.id}-title">${esc(r.org)}</h3>
        <p class="role-title">${esc(r.role)}</p>
        <p class="role-meta">${esc(r.period)}, ${esc(r.location)}</p>
        <p class="role-summary">${esc(r.summary)}</p>
        ${list(r.highlights, 'role-points')}
        ${r.note ? `<p class="caveat">${esc(r.note)}</p>` : ''}
        ${r.links?.length ? `<p>${r.links.map((l) => externalLink(l)).join(' ')}</p>` : ''}
      </div>
    </article>`;
}

function renderExperience(): string {
  return `
    ${sectionHead('experience')}
    <section aria-labelledby="work-title">
      <h2 id="work-title" class="block-title">Work</h2>
      <div class="roles">${ROLES.map((r) => role(r)).join('')}</div>
    </section>
    <section aria-labelledby="service-title" class="service">
      <h2 id="service-title" class="block-title">Leadership and service</h2>
      <div class="service-grid">${LEADERSHIP.map((r) => role(r, true)).join('')}</div>
    </section>
`;
}

// ---------------------------------------------------------------- Contact

function renderContact(): string {
  return `
    ${sectionHead('contact')}
    <section class="contact" aria-label="Contact options">
      <p class="contact-email"><a href="mailto:${CONTACT.email}">${CONTACT.email}</a></p>
      <p class="contact-note">${esc(CONTACT.note)}</p>
      <div class="contact-actions">
        <a class="btn btn--primary" href="mailto:${CONTACT.email}">Email Akshay</a>
        <button class="btn" type="button" data-copy="${CONTACT.email}">Copy email address</button>
        ${externalLink({ ...CONTACT.linkedin, label: 'Open LinkedIn profile' }, 'btn')}
      </div>
      <p class="copy-status" role="status" aria-live="polite"></p>
      <p class="contact-more">Code for THETA is public: ${externalLink(CONTACT.github)}</p>
    </section>`;
}

const RENDERERS: Record<SectionId, () => string> = {
  about: renderAbout,
  projects: renderProjects,
  research: renderResearch,
  experience: renderExperience,
  contact: renderContact,
};

export function renderSectionHTML(id: SectionId): string {
  return `<div class="sec sec--${id}">${RENDERERS[id]()}</div>`;
}

export function renderSwitcher(active: SectionId): string {
  return `<ul>${SECTION_ORDER.map(
    (id) => `<li><a href="${sitePath(id)}" data-section="${id}" ${id === active ? 'aria-current="page"' : ''}>${esc(SECTIONS[id].title)}</a></li>`,
  ).join('')}</ul>`;
}
