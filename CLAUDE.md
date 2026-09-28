# CLAUDE.md — Akshay Karthik portfolio

Operating guide for anyone (human or agent) changing this site. Read it before
editing. It describes the real project, not a generic checklist.

**Stack:** Vite + TypeScript, vanilla DOM, Web Animations API. No framework, no
backend. Node 24 (installed at `C:\Program Files\nodejs`; in Git Bash run
`export PATH="/c/Program Files/nodejs:$PATH"` first).

```
npm run dev        # http://localhost:5173 (dev art gallery: /dev/art-preview.html)
npm run build      # typecheck + production build → dist/
npm run preview    # serve dist/ on :4173 (SPA fallback on)
npm run lint       # ESLint
npm test           # Vitest unit tests (run after build to include the dist/ privacy scan)
npm run test:e2e   # Playwright: builds, serves, tests desktop/tablet/phone/landscape
npm run images     # regenerate public/img from the source artwork
```

## 1. Source discovery

All initial assets and both resumes live in the project root. Use search to
find files, then **open the images and read the full PDFs directly**. Snippets
are not enough to verify a claim or understand an image.

| Root file | Stable copy (`assets-src/`) | Role |
|---|---|---|
| `ChatGPT Image Sep 26, 2026, 03_21_20 PM-1.png` (1619×972) | `edward-hello.png` | Intro slide 1: "Hello! It is nice to meet you." |
| `ChatGPT Image Sep 26, 2026, 03_21_20 PM-2.png` (1619×972) | `edward-welcome.png` | Intro slide 2: "My name is Akshay Karthik, welcome to my website!" |
| `ChatGPT Image Sep 26, 2026, 04_57_49 PM-1.png` (1619×971) | `edward-truth.png` | Intro slide 3: "Are you ready to learn the truth?" |
| `ChatGPT Image Sep 26, 2026, 04_57_50 PM-2.png` (1672×941) | `door-of-truth.png` | Door of Truth scene (eye at px 833, 432) |
| `ChatGPT Image Sep 26, 2026, 03_25_13 PM (1).png` (1672×941) | `transmutation-circle.png` | Navigation hub |
| `IMG_0019 (3).jpg` (941×1412) | `akshay-portrait.jpg` | Akshay's photo; 4:5 crop on the About page (`.portrait`) |
| `Akshay Karthik Internship Resume Final (2).pdf` | — | Resume A (publications, GitHub link, Flask platform) |
| `Akshay Karthik Resume.docx.pdf` | — | Resume B (leadership, volunteering, interests, patent no.; **contains home address**) |

- Never edit or delete the root originals. `scripts/optimize-images.mjs` copies
  them to `assets-src/` and writes AVIF/WebP derivatives, a pre-blurred circle,
  and `og-image.jpg` into `public/`.
- `scripts/cutout.mjs` removes the white background from the three Edward
  images (flood fill from the top/right edges, then white un-premultiply on the
  edge band) and splits them into **one shared body layer plus one bubble layer
  per slide**. Edward's body is near-identical across the sources (differences are
  faint line-art noise), so the slide-1 body is shared and only the bubble
  changes between slides.
- `scripts/door.mjs` derives the door's glowing-engraving layer (dark carved
  lines on the two leaves, recoloured blue-violet) and a blurred surround plate.
- PDFs are git-ignored and must never be placed in `public/`.

## 2. Immutable design requirements

- **Opening order:** Edward slide 1 (`edward-hello`) → slide 2
  (`edward-welcome`) → slide 3 (`edward-truth`) → **Door of Truth** → Enter the
  Gate of Truth → transmutation circle. Next/Previous work in both directions,
  and the door's Previous returns to slide 3. Skip intro, on the slides or the
  door, goes to the **clear circle**. Nothing auto-advances.
- **Edward layout:** no panel or box. Edward is anchored to the screen's bottom-left
  over the full-screen blurred circle (`.intro-figure`), with his bubble beside
  him where the artwork puts it.
- **Door of Truth:** the supplied art, full screen (cover-fit; widened with a
  blurred surround on portrait phones). Keep the engravings, the opening and the
  eye visible. "Enter the Gate of Truth" is a real `<button>`, placed under
  the opening by `Director.layoutDoor()` (below the art on portrait screens, so
  it covers nothing). The controls appear after a ~3 s beat.
- **Embedded wording:** the speech-bubble text lives only in the artwork. Don't
  overlay or duplicate it visually. The `<img alt>` in `index.html` carries the
  exact sentences for screen readers.
- **Original circle:** use the supplied artwork as-is. Never regenerate, crop
  away nodes, or replace it.
- **Five-node mapping** (in `src/stage/nodes.ts`, measured in image pixels, tested):

  | Position | Section | Node centre (px) |
  |---|---|---|
  | top | About | (835, 148) |
  | upper right | Projects | (1145, 368) |
  | lower right | Research | (1025, 725) |
  | lower left | Experience | (638, 722) |
  | upper left | Contact | (520, 360) |

  Hotspots are real `<a href="/section">` elements positioned in percentages of
  the fitted image box (`.circle-frame`, sized with container-query units to
  `contain` the art). Check alignment with `/?debug=hotspots`.
- **Gate transition** (`Director.gate`, ~5 s; the only route from the intro
  into the circle, replacing the old sky descent). Any key or click skips it.
  1. The engravings pulse blue-violet (`#door-glyphs`).
  2. The eye glows; the camera pushes toward it. The door (a clip-path copy,
     `#door-front`) scales faster than the haze plate, for parallax. The door
     leaves are **not** re-drawn open, because a separated layer looked
     artificial.
  3. Through the pupil into the void: canvas `fx.tunnel()` streams fine lines,
     arcs, triangles and rune ticks toward the viewer.
  4. Rings collapse onto the circle's rim while the sigil draws the geometry. The
     circle approaches from far and small to sharp and full.
  5. Only after it settles do the hotspots fade in and activate. `#hub` stays
     `inert` until then, and the nodes ignite in turn.

  Reduced motion: a 380 ms fade from the gate to the circle. No white flash, no
  strobing, no audio.
- **Reversible circle ↔ section navigation:** the camera flies toward the
  clicked node (`Director.enter`) and pulls back from it on return
  (`Director.leave`). Browser Back/Forward drive the same transitions. Direct
  URLs and refresh render the section immediately, with no intro.
- **Narrow or short screens:** the whole circle stays visible, and an explicit
  destination list (`.hub-list`) appears.

### Architecture

- `src/app/views.ts`: pure view and route model plus the transition planner.
- `src/app/navigator.ts`: state machine with a transition lock and a one-slot
  queue (latest request wins; the running animation is hurried). Rapid clicks or
  Back mid-flight can never stack views.
- `src/app/fx/particles.ts` (canvas sparks, warp streaks, rings, lightning,
  tunnel) and `src/app/fx/sigil.ts` (energy geometry built from `NODES`):
  decorative layers. `Director.hurry()` stops both along with every animation.
- Views: `intro(slide 0|1|2)`, `door`, `circle`, `section(id)`. Intro and door
  steps replace the history entry; only circle ↔ section pushes. Browser Back
  while at the door or mid-gate lands on a consistent settled view.
- `src/app/director.ts`: all visual transitions. Pattern: animate with
  `fill: both` → commit the settled state (`body[data-view]`, `hidden`, `inert`)
  → release the animations. Final keyframes must equal the settled CSS.
- `src/main.ts`: wiring (DOM refs, history, link interception, focus, titles).
- `src/content/*`: **all editable copy**. Renderers in `src/sections/render.ts`
  hold layout only.
- `src/art/*`: one module per illustration, loaded lazily by `src/art/index.ts`.

## 3. Content accuracy

- Every number and claim must match a resume. `tests/unit/content.test.ts`
  locks the key metrics. If you change one, update the test **and**
  `CONTENT_REVIEW.md`.
- Keep these caveats:
  - KINETIX: prototype and bench findings only; not used in patients; no
    regulatory authorization.
  - Spatialize: preoperative planning; not intraoperative or real-time.
  - NSCLC: retrospective research result.
  - DMD: NFATC4 is a *candidate*.
  - Dignity Health: 180+ volunteers and 7,000+ hours are **program totals**.
- Duke degrees are **in progress** (expected 2030).
- Dates confirmed by Akshay: KINETIX from Aug 2025; ASU Aug 2024 – Sep 2025
  (internship resume). Honors list every award from both resumes,
  plus GPA and SAT. The patent number stays off the site. See `CONTENT_REVIEW.md`.
- Link rules:
  - Add links only when verified; set `verified` accordingly.
  - Do not invent DOI or IEEE Xplore URLs. The two Xplore links in
    `src/content/research.ts` and `projects.ts` were supplied by Akshay.
  - THETA repo `https://github.com/smokyfishy/THETA` was verified on 2026-09-26.
  - LinkedIn was supplied by Akshay and is unverified by automation.
- **Privacy:** never publish the street address, ZIP, or phone number. The unit
  test scans `src/`, `public/`, and `dist/`, and fails on them or on any PDF in
  `dist/`. The fragments it searches for live only in the git-ignored
  `tests/private-patterns.local.txt`; never write them into tracked files (the
  GitHub repo is published).
- **Hosting:** GitHub Pages at `/PersonalWeb/` (see README). Build internal URLs
  with `sitePath()` from `src/app/views.ts`, never a hard-coded leading `/`.

## 4. Graphic quality

- Every major resume entry has its own illustration (14 modules in
  `src/art/`). Each is hand-built SVG from shared parts (`kit.ts`, `hand.ts`,
  `parts.ts`), so the set shares one palette and line language.
- **No text inside illustrations.** Labels, numbers, and captions are HTML.
  Numbers drawn in art must be meaningful (rank 1–3, a 10×10 grid = top 100
  predictors, 40 wheel segments = 40 gestures).
- **Hands** come from the 21-landmark model in `hand.ts`: five digits, correct
  joint order. **Webcams** use `parts.webcam()` (flipped, not upside-down, when
  aimed backwards).
- **SVG gotchas found here:**
  - A gradient in bounding-box units disappears on perfectly vertical lines;
    use solid layered strokes.
  - CSS must not select `[pathLength]`, because Chromium does not re-evaluate
    that SVG attribute selector when an ancestor's class changes. Paths are
    tagged `.draw-path` at load.
  - Animated classes go on wrapper `<g>` elements without `transform`
    attributes.
- Medical imagery stays conceptual and captioned ("Concept illustration. Not a
  clinical image."). No patients, faces, clinical emblems, or product
  screenshots.
- **Before accepting art:** view it in `/dev/art-preview.html?only=<id>` and
  `&compact=1`, plus in-page at 390, 1024, and 1440 widths. Check plausibility,
  accidental text, distinctiveness, cropping, and alt text (≥ 30 chars,
  describes what is shown).

## 5. Visual QA

Inspect **actual rendered screenshots**, not code:
- all three Edward slides
- the Door of Truth, including where the Enter button sits
- gate-transition frames and the end state
- the full circle
- the `?debug=hotspots` overlay
- every section, at desktop (1440×900), tablet (1024×768), phone (390×844), and
  landscape phone (844×390)

Look for clipping, weak contrast, awkward spacing, overlapping labels, blurry
images, and misaligned hotspots.

Helpers (the output folder `qa/` is git-ignored):
- `node scripts/stages.mjs <url> qa/st 390 844 [reduced]`: every settled stage
  of the opening (slides 1–3, door, circle)
- `node scripts/scrub.mjs <url> qa/x gate 1440 900 "0,500,…"`: deterministic
  frames of `door`, `gate`, `enter:<id>` or `leave:<id>` (pauses WAAPI and scrubs
  it). `node scripts/sheet.mjs` tiles frames into a contact sheet.
- `node scripts/flight.mjs <url> qa/f projects 1440 900`: fly-in and pull-back
  frames
- `node scripts/sections.mjs <url> qa/s 1440 900`: full-page sections (scrolls
  to reveal art)
- `node scripts/shot.mjs <url> <out.png> [w] [h] [wait] [full] [reduced]` and
  `node scripts/crop.mjs <in> <out> <top> <height>`

## 6. Functional QA

Exercise all of these:
- Next and Previous on all three slides; the door's Previous; Enter the Gate
  of Truth; Skip intro from a slide and from the door
- every node, on hotspots and on the mobile list
- Return to circle; Esc returns from a section
- Back/Forward; direct URLs and refresh
- the mailto and LinkedIn links (new tab, `rel=noopener`)
- keyboard focus: after entering, the section `h1`; after returning, the node
  you came from
- repeated rapid clicks (Next never skips past the door; repeated Enter clicks
  run the gate once), Back during the gate, and Back during a fly-in

`tests/e2e/journey.spec.ts` automates these across four viewports.

## 7. Motion QA

- Check normal and `prefers-reduced-motion` behaviour. Reduced motion uses
  short fades, and illustrations show their final state.
- Transitions must end in the correct place, with no white flash, stuck
  overlay, or lost focus.
- Section content becomes usable about 0.6 s into a fly-in. Never make content
  wait on a long animation.
- Motion that runs by itself is limited to:
  - the one-time door reveal and gate transition
  - a slow haze drift behind the waiting door (disabled for reduced motion)
  - the one-time hotspot "breath" on arrival
  - tiny status-LED blinks inside illustrations
- Keep effects away from paragraphs.

## 8. Engineering QA

After meaningful changes, run `npm run lint`, `npm run build`, `npm test`, and
`npm run test:e2e`. The e2e tests fail on console errors and failed requests.

Do not report a check as passed unless you actually ran it.

## 9. Completion report

Before calling a change complete, report:
- what was visually inspected (which screens and sizes)
- what was functionally tested
- the commands run and their results
- which generated assets were reviewed
- unresolved issues
- facts still awaiting Akshay's confirmation (`CONTENT_REVIEW.md`)


## Owner decisions (2026-09-26)

- The hub shows only the name. The "Machine learning for robotics and biomedical engineering" tagline was removed at Akshay's request.
- The site has **no footer**: no copyright line and no credit or disclaimer text, at Akshay's request. Don't re-add one without asking.
