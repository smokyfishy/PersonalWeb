# Akshay Karthik — portfolio

The visitor starts with a two-slide introduction, then descends from the sky to a
transmutation circle. The circle's five nodes open About, Projects, Research,
Experience, and Contact.

## Run it

Requires Node.js 20+ (Node 24 is installed on this machine).

```bash
npm install
npm run dev        # develop at http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve the build at http://localhost:4173
```

Checks:

```bash
npm run lint
npm run build && npm test     # unit tests, including the privacy scan of dist/
npm run test:e2e              # browser tests at four screen sizes
```

`npm run images` regenerates `public/img/` if the source artwork changes.

## Edit the words

All copy, metrics, dates, and links live in **`src/content/`**:

| File | What it holds |
|---|---|
| `sections.ts` | Section titles, intros, page metadata |
| `about.ts` | Bio, education, honors, skills, personal note |
| `projects.ts` | The five project case studies |
| `research.ts` | Publications and ongoing research |
| `experience.ts` | Work roles, leadership, service |
| `contact.ts` | Email and LinkedIn |

Changing these files never affects the animations. After an edit, run `npm test`,
which checks the key metrics against the resumes.

Illustrations live in `src/art/` (one file each). To preview them all, run
`npm run dev` and open `/dev/art-preview.html`.

## Deploy

Pushing to `main` on GitHub runs `.github/workflows/deploy.yml`: lint, a build
with `BASE_PATH=/PersonalWeb/`, unit tests, then a GitHub Pages deploy to
<https://smokyfishy.github.io/PersonalWeb/>. The workflow copies `index.html` to
`404.html` so deep links like `/PersonalWeb/about` work. Code builds internal
URLs with `sitePath()` (`src/app/views.ts`), never a bare `/`.

The privacy tests read the address and phone fragments from the git-ignored
`tests/private-patterns.local.txt` (one per line) and skip when it is absent.
Never commit those fragments.

`dist/` is a static site. The routes (`/about`, `/projects`, …) need an SPA
fallback to `index.html`. Netlify (`public/_redirects`) and Vercel
(`vercel.json`) are already configured. For other hosts, route unknown paths to
`index.html`.

Before publishing, read **`CONTENT_REVIEW.md`**. It lists the facts and rights
questions that still need your confirmation.

> The project folder is inside OneDrive, so `node_modules/` will sync. You can
> exclude it from OneDrive, or move the project outside OneDrive, to avoid slow
> syncing.
