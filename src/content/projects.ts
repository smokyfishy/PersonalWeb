import type { CaseStudy } from './types';

// Every metric below is taken from Akshay's resumes. See CONTENT_REVIEW.md before
// changing a number, a date, or a claim about clinical maturity.

export const THETA_REPO = 'https://github.com/smokyfishy/THETA';

export const PROJECTS: CaseStudy[] = [
  {
    id: 'kinetix',
    title: 'KINETIX',
    subject: 'Machine-learning inverse design of drug-releasing brain-tumor scaffolds',
    period: 'Aug 2025 – present',
    summary:
      'A biodegradable, 3D-printed scaffold intended for localized glioblastoma chemotherapy, where the lattice geometry itself sets how fast drug is released and how quickly the implant degrades. Instead of trial-and-error printing, a machine-learning model works backward from a target release profile to the geometry that should produce it.',
    role: 'Co-founder and CTO. Designed the inverse-design pipeline, the synthetic-data generator, and the predictive models.',
    methods: [
      'Parametric lattice generation',
      'Synthetic simulation data (~8,000 designs)',
      'Supervised release-profile prediction',
      'Inverse design toward target release and degradation',
      'Bench validation in body-fluid-mimicking media',
    ],
    results: [
      { value: '~8,000', label: 'simulated scaffold designs used to train the models' },
      { value: '50+', label: 'scaffolds physically fabricated and bench-tested' },
      { value: 'R² ≈ 0.96', label: 'between predicted and observed drug release' },
    ],
    details: [
      'Glioblastoma often recurs at the edge of the surgical cavity, which makes localized, sustained drug delivery attractive. KINETIX treats the scaffold’s porous geometry as the control knob: strut thickness, pore size, and lattice type change how fluid reaches the drug and how the polymer breaks down.',
      'Around 8,000 simulated designs trained models that predict a release curve from geometry. Those predictions were checked against more than 50 printed prototypes immersed in body-fluid-mimicking fluid, where predicted and observed release agreed at roughly R² = 0.96.',
    ],
    caveat:
      'These are prototype and bench-test findings. KINETIX has not been used in patients and has no regulatory authorization.',
    links: [],
    art: {
      id: 'kinetix-scaffold',
      alt: 'Concept illustration of a porous, 3D-printed lattice cube. Its top layers lift away to show the inner lattice, a magnified strut releases drug particles, and an outlined cavity shape sits beside it for context.',
      caption: 'Concept illustration. Not a clinical image.',
    },
  },
  {
    id: 'spatialize',
    title: 'Kinetix Spatialize',
    subject: 'Preoperative MRI planning for where a scaffold could be placed',
    period: '2025 – present',
    summary:
      'Planning software that segments a preoperative MRI, reconstructs the expected resection cavity, samples candidate sites along it, scores each for risk, and returns a 3D map of ranked placement locations with coordinates.',
    role: 'Built the segmentation-to-ranking pipeline as part of the KINETIX technical work.',
    methods: [
      'MRI segmentation',
      '3D cavity reconstruction',
      'Candidate-site sampling',
      'Risk scoring and ranking',
      'Coordinate-labeled 3D output',
    ],
    results: [
      { value: '3D', label: 'map of ranked candidate sites with coordinates' },
      { value: 'Pre-op', label: 'works from imaging before surgery, not during it' },
    ],
    details: [
      'Spatialize connects the scaffold to anatomy. Given a patient’s preoperative scan, it models the cavity a resection is expected to leave, then evaluates where along that surface a scaffold could sit.',
      'The output is a ranked set of candidate locations in 3D with coordinates, intended to support planning discussions.',
    ],
    caveat:
      'A research planning tool. It does not provide real-time or intraoperative guidance and is not a cleared clinical product.',
    links: [],
    art: {
      id: 'kinetix-spatialize',
      alt: 'Illustration of a planning interface: a stylized axial MRI slice on the left, and on the right a wireframe 3D brain with a highlighted cavity and three numbered candidate markers on coordinate axes.',
      caption: 'Planning-software concept, not a product screenshot.',
    },
  },
  {
    id: 'theta',
    title: 'THETA',
    subject: 'Controlling a robotic hand with three ordinary webcams',
    period: 'Aug 2024 – Sep 2025',
    summary:
      'A $295 teleoperation system: three webcams watch an operator’s hand, neural networks estimate the hand’s pose, and a tendon-driven robotic hand mirrors it in real time. Comparable sensor-glove and motion-capture rigs cost $5,000–$10,000.',
    role: 'Co-developer. Built the dataset and vision models, and modified and wired the robotic hand.',
    methods: [
      'DeepLabV3-ResNet50 hand segmentation',
      'MobileNetV2 joint-angle classification',
      'Three-camera capture',
      'Arduino servo control',
      'ROS2 closed-loop control',
    ],
    results: [
      { value: '$295', label: 'total system cost, about 95% below glove and mocap rigs' },
      { value: '48,000+', label: 'self-annotated images across 40 gestures' },
      { value: '97%+', label: 'classification accuracy' },
      { value: '< 250 ms', label: 'end-to-end real-time latency' },
    ],
    details: [
      'Each webcam sees the hand from a different angle, which reduces the ambiguity of a single view. A segmentation network isolates the hand; a lightweight classifier estimates joint angles fast enough for live control.',
      'The robot is an open-source 3D-printed DexHand, modified with custom-routed fishing-line tendons, springs, and servos, and driven through Arduino motor circuitry and a ROS2 control stack.',
    ],
    links: [
      { label: 'Source code on GitHub', href: THETA_REPO, verified: true },
      { label: 'Paper on IEEE Xplore', href: 'https://ieeexplore.ieee.org/abstract/document/11424109', verified: true },
    ],
    art: {
      id: 'theta-system',
      alt: 'Diagram-style illustration: three webcams on stands aim at a human hand overlaid with tracked joint points. Their feeds flow into a neural-network block and then a controller, which drives a tendon-actuated robotic hand holding the same pose.',
    },
  },
  {
    id: 'nsclc',
    title: 'NSCLC multi-omics',
    subject: 'Predicting lung-cancer metastasis from four kinds of molecular data',
    period: 'Aug 2023 – Mar 2024',
    summary:
      'A deep-learning pipeline that combines RNA-seq, copy-number variation, mutation, and protein (RPPA) data from 220 non-small-cell lung cancer patients to predict metastasis, packaged in the MetaOmics interface.',
    role: 'Independent researcher and first author.',
    methods: [
      'Denoising autoencoders',
      'SMOTE class balancing',
      'LASSO feature selection (top 100 predictors)',
      'Random Forest',
      'Stacking classifier',
    ],
    results: [
      { value: '220', label: 'patients across four omics modalities' },
      { value: '94.3%', label: 'metastasis-prediction accuracy' },
      { value: 'Best Paper', label: 'IEEE ICTIIA 2024, among 165 submissions' },
    ],
    details: [
      'Each modality is noisy and high-dimensional on its own. Denoising autoencoders compress each stream, SMOTE balances the classes, and LASSO narrows the combined features to the 100 most predictive.',
      'Random Forest and stacking models trained on those features reached 94.3% accuracy in the study. The work was published at IEEE ICTIIA 2024 and received the Best Paper Award.',
    ],
    caveat: 'A retrospective research result on a 220-patient dataset, not a validated clinical test.',
    links: [{ label: 'Paper on IEEE Xplore', href: 'https://ieeexplore.ieee.org/abstract/document/10761308/', verified: true }],
    art: {
      id: 'nsclc-multiomics',
      alt: 'Illustration of four distinct data streams (expression bars, a copy-number step line, mutation lollipops, and a protein heatmap) converging through an hourglass-shaped autoencoder into an abstract prediction panel.',
    },
  },
  {
    id: 'dmd',
    title: 'Duchenne muscular dystrophy graph learning',
    subject: 'Finding under-explored drivers of a muscle-wasting disease',
    period: 'May – Dec 2025',
    summary:
      'A two-stage Bayesian graph-learning pipeline. A graph attention network ranks genes in multi-omics interaction networks, then a geometric protein model maps disease mutations onto 3D structure. It highlights NFATC4 as an under-explored candidate driver of DMD.',
    role: 'Independent researcher.',
    methods: [
      'Graph attention network over multi-omics gene networks',
      'Bayesian uncertainty modeling',
      'Geometric protein-structure model',
      'Mutation-to-residue cluster mapping',
    ],
    results: [
      { value: '188', label: 'DMD-associated mutations mapped' },
      { value: '7', label: 'high-impact residue clusters identified' },
      { value: '99.5% / 98.3%', label: 'gene-level / residue-level accuracy' },
    ],
    details: [
      'Stage one learns over gene interaction networks built from multi-omics data and prioritizes genes that are central to the disease signal but under-studied; NFATC4 stood out.',
      'Stage two places 188 known DMD-associated mutations onto protein structure and groups them into seven high-impact residue clusters, keeping the prioritization interpretable.',
    ],
    caveat:
      'NFATC4 is a computational candidate. It has not been experimentally or clinically confirmed as a therapeutic target.',
    links: [],
    art: {
      id: 'dmd-network',
      alt: 'Illustration of a gene interaction network with one gold-highlighted candidate node, linked by a beam to a ribbon protein structure marked with seven colored residue clusters.',
    },
  },
];
