import type { Publication } from './types';

// IEEE Xplore links were supplied by Akshay on 2026-09-26. (Xplore blocks
// automated checks, so they could not be fetched here.)

export const PUBLICATIONS: Publication[] = [
  {
    id: 'pub-nsclc',
    title: 'NSCLC metastasis prediction via multi-omics deep learning',
    authors: 'A. Karthik and M. Donovan',
    venue: 'Proc. IEEE International Conference on Technology Innovation and Its Applications (ICTIIA)',
    year: '2024',
    award: 'Best Paper Award, selected from 165 submissions',
    summary:
      'Combines four molecular data types from 220 lung-cancer patients, compresses and balances them, and narrows thousands of signals to the 100 most predictive before classification. The study reports 94.3% accuracy in predicting metastasis.',
    relatedProject: 'nsclc',
    link: { label: 'Read on IEEE Xplore', href: 'https://ieeexplore.ieee.org/abstract/document/10761308/', verified: true },
    art: {
      id: 'pub-nsclc',
      alt: 'Illustration of a funnel narrowing a dense field of feature points to a small selected set, beside an abstract curve rising toward the upper-left corner and a small award star.',
    },
  },
  {
    id: 'pub-theta',
    title: 'THETA: Hand-state estimation for robotic teleoperation',
    authors: 'A. Karthik and A. Huang',
    venue: 'Proc. IEEE 11th International Conference on Engineering and Emerging Technologies (ICEET)',
    year: '2025',
    summary:
      'Shows that three low-cost webcams and two neural networks (one to segment the hand, one to classify joint angles) can drive a robotic hand in real time, at 97%+ accuracy and under 250 ms latency, for about $295.',
    relatedProject: 'theta',
    link: { label: 'Read on IEEE Xplore', href: 'https://ieeexplore.ieee.org/abstract/document/11424109', verified: true },
    art: {
      id: 'pub-theta',
      alt: 'Illustration of a three-step pipeline: a filled hand silhouette mask, then arcs marking finger joint angles, then a circular wheel of gesture classes with one segment lit.',
    },
  },
];

export const ONGOING_RESEARCH = {
  title: 'Bayesian graph learning for Duchenne muscular dystrophy',
  period: 'May – Dec 2025',
  summary:
    'Independent research that pairs a graph attention network over multi-omics gene networks with a geometric protein model. It prioritizes NFATC4 as an under-explored candidate driver of DMD and groups 188 disease mutations into seven high-impact residue clusters, at 99.5% gene-level and 98.3% residue-level accuracy.',
  caveat: 'Computational findings; NFATC4 has not been experimentally or clinically validated as a treatment target.',
  relatedProject: 'dmd',
};
