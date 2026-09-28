import type { ArtRef, SkillGroup, TimelineItem } from './types';

export const ABOUT = {
  intro: [
    'I’m Akshay Karthik, a student at Duke University working toward B.S. degrees in Electrical & Computer Engineering and Computer Science, with a minor in Computational Biology.',
    'Most of what I build sits where three fields overlap. Machine learning is the tool; robotics and biomedical engineering are where it has to hold up against real hardware, real tissue models, and real data. That has meant a robotic hand driven by three webcams, drug-releasing scaffolds designed backward from a release curve, and graph models that search gene networks for overlooked disease drivers.',
  ],
  portrait: {
    alt: 'Akshay Karthik smiling, in a dark suit, light blue shirt and red patterned tie, standing in front of pink bougainvillea and a green tree.',
  },
  personal:
    'Away from the bench: Chelsea matches, rap and R&B concerts, the occasional poker night, and the Grand Canyon whenever I’m home in Arizona.',
  art: {
    id: 'about-convergence',
    alt: 'Illustration of four motifs joined into one form: circuit traces, a DNA double helix, a robotic joint, and a small neural-network lattice, meeting at a glowing center.',
  } satisfies ArtRef,
};

export const EDUCATION: TimelineItem[] = [
  {
    period: '2026 – 2030 (expected)',
    place: 'Duke University',
    detail: 'B.S. Electrical & Computer Engineering · B.S. Computer Science · Minor in Computational Biology. In progress.',
    notes: ['Coursework: Data Structures and Algorithms; Matrices and Vectors; Engineering Design & Communication'],
  },
  {
    period: '2022 – 2026',
    place: 'Hamilton High School, Chandler, AZ',
    detail: 'Summa Cum Laude.',
    notes: ['GPA 4.0 unweighted, 4.8 weighted', 'SAT 1570 (Math 790, Reading & Writing 780)'],
  },
];

/** Every award and distinction listed across both resumes. */
export const HONORS: string[] = [
  'Regeneron ISEF Finalist',
  'EXPLR National STEM Festival Champion',
  'IEEE ICTIIA Best Paper Award (2024), selected from 165 submissions',
  'AzSEF Best of Fair',
  'AzSEF 1st Place, Robotics & Intelligent Machines (2025)',
  'AzSEF 2nd Place, Materials Science (2026)',
  'Arizona Governor’s Future Innovator of the Year, Honorable Mention',
  'AP Capstone Diploma',
  '3× AP Scholar with Distinction',
];

export const SKILLS: SkillGroup[] = [
  {
    name: 'Machine learning',
    description: 'Model training, feature selection, and evaluation',
    items: ['PyTorch', 'TensorFlow', 'scikit-learn'],
  },
  {
    name: 'Robotics & embedded',
    description: 'Closed-loop control and actuation',
    items: ['ROS2', 'Arduino'],
  },
  {
    name: 'Software',
    description: 'Languages, services, and tooling',
    items: ['Python', 'Java', 'Flask', 'Git'],
  },
];

export const CERTIFICATIONS: string[] = [
  'PCEP — Certified Entry-Level Python Programmer',
  'Pearson IT Specialist (Java)',
];

export const SKILLS_ART: ArtRef = {
  id: 'skills-map',
  alt: 'Constellation diagram with three clusters of connected points, one per skill group, joined at the center.',
};
