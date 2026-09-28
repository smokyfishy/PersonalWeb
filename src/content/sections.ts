import type { SectionId, SectionMeta } from './types';

export const SITE = {
  name: 'Akshay Karthik',
  title: 'Akshay Karthik — machine learning, robotics & biomedical engineering',
  description:
    'Portfolio of Akshay Karthik, a Duke University ECE and Computer Science student building machine-learning systems for robotics and biomedical engineering.',
};

export const SECTIONS: Record<SectionId, SectionMeta> = {
  about: {
    id: 'about',
    title: 'About',
    heading: 'About Akshay',
    lede: 'Engineer at the meeting point of machine learning, robotics, and biology.',
    description: 'Who Akshay Karthik is, what he studies at Duke, and how his interests connect.',
  },
  projects: {
    id: 'projects',
    title: 'Projects',
    heading: 'Projects',
    lede: 'Five builds, from drug-releasing scaffolds to a $295 robotic-hand teleoperation rig.',
    description: 'Case studies: KINETIX, Kinetix Spatialize, THETA, NSCLC multi-omics, and Duchenne muscular dystrophy graph learning.',
  },
  research: {
    id: 'research',
    title: 'Research',
    heading: 'Research',
    lede: 'Two first-author IEEE conference papers and an ongoing independent study.',
    description: 'Publications at IEEE ICTIIA 2024 (Best Paper Award) and IEEE ICEET 2025, plus Duchenne muscular dystrophy research.',
  },
  experience: {
    id: 'experience',
    title: 'Experience',
    heading: 'Experience',
    lede: 'Where the work happened: a startup, a robotics lab, a small-business AI shop, and two communities.',
    description: 'Roles at KINETIX, the ASU Sun Robotics Lab and Clean Plate Labs, plus leadership and service.',
  },
  contact: {
    id: 'contact',
    title: 'Contact',
    heading: 'Get in touch',
    lede: 'Open to research collaborations, internships, and conversations about the work.',
    description: 'Email Akshay Karthik or connect on LinkedIn.',
  },
};

/** Order used by the mobile destination list and the in-section switcher. */
export const SECTION_ORDER: SectionId[] = ['about', 'projects', 'research', 'experience', 'contact'];
