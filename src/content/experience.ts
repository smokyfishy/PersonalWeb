import type { Role } from './types';
import { THETA_REPO } from './projects';

// Dates confirmed by Akshay: KINETIX from Aug 2025; ASU per the internship resume.

export const ROLES: Role[] = [
  {
    id: 'kinetix-role',
    org: 'KINETIX',
    role: 'Co-Founder & CTO, Machine Learning & Systems Lead',
    period: 'Aug 2025 – present',
    location: 'Phoenix, AZ',
    summary:
      'Leads the technical side of a biomedical startup designing brain-tumor drug-delivery scaffolds with machine learning.',
    highlights: [
      'Architected the inverse-design pipeline that turns release and degradation targets into printable lattice geometry.',
      'Built a synthetic-data generator of ~8,000 simulated designs and validated models against 50+ fabricated scaffolds (R² ≈ 0.96, bench tests).',
      'Developed Kinetix Spatialize, which ranks candidate scaffold sites from preoperative MRI.',
    ],
    note: 'Prototype and bench-stage work; no clinical use.',
    art: {
      id: 'kinetix-pipeline',
      alt: 'Illustration of a closed design loop: a target release curve feeds a neural-network block, which outputs a lattice geometry, which is printed as a small scaffold and measured in a vial, with the measurement curve looping back to the start.',
    },
  },
  {
    id: 'asu-role',
    org: 'ASU Sun Robotics Lab',
    role: 'Student Researcher',
    period: 'Aug 2024 – Sep 2025',
    location: 'Tempe, AZ',
    summary:
      'Built THETA, a webcam-driven teleoperation system for a robotic prosthetic hand, from dataset to hardware.',
    highlights: [
      'Trained segmentation and joint-angle models on 48,000+ self-annotated images across 40 gestures (97%+ accuracy, < 250 ms).',
      'Modified an open-source 3D-printed DexHand with custom-routed fishing-line tendons, springs, and servos.',
      'Drove five-finger actuation through Arduino motor circuitry and a ROS2 closed-loop control stack.',
      'Filed a provisional patent application for accessible robotic prosthesis control.',
    ],
    links: [{ label: 'THETA on GitHub', href: THETA_REPO, verified: true }],
    art: {
      id: 'asu-lab-build',
      alt: 'Illustration of a robotics workbench: a partly assembled 3D-printed robotic hand with tendon lines, a row of servos, a microcontroller board, a spool of fishing line, and a webcam on a clamp, with a small node graph representing the control software.',
    },
  },
  {
    id: 'cleanplate-role',
    org: 'Clean Plate Labs LLC',
    role: 'AI Research Intern',
    period: 'Jul 2022 – Jul 2025',
    location: 'Gilbert, AZ',
    summary:
      'Built forecasting and inventory tools that small businesses actually adopted.',
    highlights: [
      'Built and deployed Python/scikit-learn microservices for demand forecasting and inventory management, adopted by 18 businesses.',
      'Secured a $5,000 innovation grant to scale the services into a Flask-based analytics platform.',
      'Engineered a responsive website architecture serving 2,000+ monthly visitors across 10 countries.',
    ],
    art: {
      id: 'clean-plate-forecast',
      alt: 'Illustration of store shelves stocked with generic products on the left, flowing into a forecast chart on the right: a historical demand line continuing into a projected line with a shaded confidence band.',
    },
  },
];

export const LEADERSHIP: Role[] = [
  {
    id: 'ai-club',
    org: 'Hamilton High School AI & Computing Club',
    role: 'Founder & President',
    period: 'Jul 2024 – May 2026',
    location: 'Chandler, AZ',
    summary: 'Founded the school’s first AI & Computing Club and grew it to 30+ students across grades.',
    highlights: [
      'Led weekly workshops on neural networks, computer vision, and data science with TensorFlow and PyTorch.',
      'Organized school-wide ML projects and hackathons, and mentored science-fair teams.',
    ],
    art: {
      id: 'ai-club-workshop',
      alt: 'Illustration of a workshop: a presenter beside a screen showing a layered neural-network diagram, and students at laptops working in pairs.',
    },
  },
  {
    id: 'dignity',
    org: 'Dignity Health St. Joseph’s Hospital & Medical Center',
    role: 'Junior Ambassador & Volunteer Mentor',
    period: 'Jul 2022 – May 2026',
    location: 'Phoenix, AZ',
    summary: 'Selected from 300+ applicants for a volunteer leadership role.',
    highlights: [
      'Helped coordinate a program of 180+ volunteers who together delivered 7,000+ hours of patient support.',
      'Completed 90+ clinical hours in the Post-Anesthesia Care Unit (PACU), assisting patients and clinical staff.',
      'Ran volunteer orientation and onboarding, and trained new ambassadors.',
    ],
    note: 'The 180+ volunteers and 7,000+ hours are program totals, not Akshay’s individual hours.',
    art: {
      id: 'dignity-volunteer',
      alt: 'Illustration of volunteer coordination: a shift board with colored schedule blocks, two hands passing a clipboard, and a small heart-and-cross care symbol. No patients are shown.',
    },
  },
];
