// Public contact channels only. The resumes also list a home address and phone
// number; those must never be added to the site (a unit test scans dist/ for them).

export const CONTACT = {
  email: 'akshay.karthik@duke.edu',
  linkedin: {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/akshay-karthik-a219a7311/',
    /** Supplied by Akshay; LinkedIn blocks automated checks, so confirm manually. */
    verified: false,
  },
  github: {
    label: 'THETA on GitHub',
    href: 'https://github.com/smokyfishy/THETA',
    verified: true,
  },
  note: 'Email is the fastest way to reach me.',
};
