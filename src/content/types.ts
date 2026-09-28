// Shapes for all editable portfolio content. Copy lives in the sibling files;
// renderers in src/sections/ read these objects and never hard-code wording.

export type SectionId = 'about' | 'projects' | 'research' | 'experience' | 'contact';

export type ArtId =
  | 'about-convergence'
  | 'kinetix-scaffold'
  | 'kinetix-spatialize'
  | 'kinetix-pipeline'
  | 'theta-system'
  | 'asu-lab-build'
  | 'nsclc-multiomics'
  | 'dmd-network'
  | 'clean-plate-forecast'
  | 'ai-club-workshop'
  | 'dignity-volunteer'
  | 'pub-nsclc'
  | 'pub-theta'
  | 'skills-map';

export interface ArtRef {
  id: ArtId;
  /** Describes what the illustration shows, for screen readers. */
  alt: string;
  /** Visible caption, e.g. to mark concept illustrations as such. */
  caption?: string;
}

export interface Metric {
  value: string;
  label: string;
}

export interface ExternalLink {
  label: string;
  href: string;
  /** True once confirmed to resolve and belong to Akshay, or supplied by him directly. */
  verified: boolean;
}

export interface SectionMeta {
  id: SectionId;
  /** Used for the <title> and the circle hotspot's accessible name. */
  title: string;
  heading: string;
  lede: string;
  description: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  /** Short plain-language subject line shown under the title. */
  subject: string;
  period: string;
  summary: string;
  role: string;
  methods: string[];
  results: Metric[];
  /** Longer detail revealed in an expandable panel. */
  details: string[];
  /** Maturity/claims caveat rendered next to the results. */
  caveat?: string;
  links: ExternalLink[];
  art: ArtRef;
}

export interface Publication {
  id: string;
  title: string;
  authors: string;
  venue: string;
  year: string;
  award?: string;
  summary: string;
  relatedProject: string;
  link?: ExternalLink;
  art: ArtRef;
}

export interface Role {
  id: string;
  org: string;
  role: string;
  period: string;
  location: string;
  summary: string;
  highlights: string[];
  /** Notes such as how team-level totals are attributed. */
  note?: string;
  links?: ExternalLink[];
  art: ArtRef;
}

export interface TimelineItem {
  period: string;
  place: string;
  detail: string;
  notes: string[];
}

export interface SkillGroup {
  name: string;
  description: string;
  items: string[];
}
