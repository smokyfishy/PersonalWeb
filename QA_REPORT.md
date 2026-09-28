# QA report — 2026-09-26

Every check below was actually run. Screenshots were saved to `qa/`
(git-ignored) and viewed directly.

## Commands

| Command | Result |
|---|---|
| `npm run lint` | Pass: no ESLint findings |
| `npm run build` (tsc + vite) | Pass: `dist/` is 2.2 MB; each illustration is a separate lazy chunk (2–6 KB) |
| `npm test` (Vitest, after build) | **22 / 22 passed**: routing, state machine (lock, queue, error recovery), hotspot geometry, content metrics and caveats, privacy scan of `src/`, `public/`, `dist/` |
| `npm run test:e2e` (Playwright: desktop 1440×900, tablet 1024×768, phone 390×844, landscape 844×390) | **94 passed, 6 skipped by design** (the hotspot pixel-alignment, rapid-node-click and keyboard tests are skipped on the two phone projects, where the destination list is used) |

## Visual inspection (screenshots viewed)

- **Intro slides 1 and 2** at desktop and phone.
  - Edward's position is identical across slides, and both speech bubbles are
    fully legible.
  - The blurred, dimmed circle sits behind the lit panel.
  - Next appears after the entrance; Previous only on slide 2.
- **Descent** frames at 350, 900, 1500 and 2100 ms: panel rises away → fog
  covers → tilted circle resolves → sharp full circle.
- **Circle hub** at all four sizes.
  - The full circle is visible with no cropped nodes, and the artwork edges
    blend into the sky.
  - Phone and landscape show the destination list.
- **Hotspot debug overlay** (`/?debug=hotspots`): all five rings sit on their
  nodes and the label boxes cover the printed labels.
- **Fly-in and pull-back frames:**
  - Projects at desktop, Contact at tablet, About at landscape phone.
  - The camera travels toward the chosen node, then the section rises from that
    direction.
  - Return pulls back from the same node.
- **Every section** at desktop (full page plus real-scale crops); Projects and
  Experience also at phone. No horizontal overflow at any size (also asserted in
  e2e).
- **Reduced motion:** the descent becomes a short fade and ends on the settled
  circle.

## Illustrations reviewed

All 14 were inspected in the dev gallery and in context:
- about-convergence
- kinetix-scaffold
- kinetix-spatialize
- kinetix-pipeline
- theta-system
- asu-lab-build
- nsclc-multiomics
- dmd-network
- clean-plate-forecast
- ai-club-workshop
- dignity-volunteer
- pub-nsclc
- pub-theta
- skills-map

Defects found and fixed during review:

| Illustration | Defect | Fix |
|---|---|---|
| theta-system | Thumbs too long; feed line looped across the wrist; malformed view cones; robot palm triangular | Re-proportioned landmarks; re-routed feeds; computed cones; proper palm plate |
| theta-system, asu-lab-build | Middle-finger links invisible (bounding-box gradient on a vertical line) | Layered solid strokes |
| asu-lab-build | Mask for the unattached fingers chopped the palm | Draws only the attached fingers, with empty joint pins |
| kinetix-spatialize | 3D view read as a globe | Clipped to a lateral brain silhouette with a fissure |
| about-convergence | Centre glyph malformed | Computed pentagram |
| pub-theta | Connector trailed off | Arrow into the gesture wheel |
| All line-draw art | Lines stayed undrawn on the live page | CSS no longer uses a `[pathLength]` selector, which Chromium doesn't re-evaluate when an ancestor class changes |

## Other issues found and fixed

- Hard seam around the circle artwork → feathered masks plus a matching blurred sky.
- `#fragment` dropped from the Research → Projects case-study links → hash kept
  in the history entry.
- Heading hidden below a tall illustration on landscape phones after a fragment
  jump → it is now scrolled into view.
- The body font's slashed zero ("2Ø25") → switched to Source Sans 3.

## Functional coverage (automated)

- Next and Previous both ways
- Skip intro goes to the clear circle
- rapid Next clicks
- returning visitor lands on the circle
- all five nodes open the right URL and heading, with focus on the `h1`
- Return to circle
- Back and Forward
- direct URL and refresh for every section
- Back pressed mid fly-in
- rapid multi-node clicks yield exactly one section
- keyboard Tab + Enter, then Esc returns with focus on the originating node
- the mailto, LinkedIn (new tab, `noopener`) and THETA GitHub links
- every illustration reaches `ready` with alt text
- reduced-motion journey
- zero console errors or failed requests in the journey tests

## Not verified / open

- The LinkedIn URL can't be fetched automatically. Akshay should click it once.
- Tested only in Chromium (Playwright). Safari/Firefox were not run. The CSS
  used (container queries, `mask-composite`, `inert`) is supported in current
  versions of both, but this was not exercised.
- The facts in `CONTENT_REVIEW.md` still need confirmation, including the
  **rights question about the Edward Elric fan art** before public launch.

---

# Revision 2 — 2026-09-26 (content fixes, new intro, Door of Truth, cinematic transitions)

## Commands (all run after the final change)

| Command | Result |
|---|---|
| `npm run lint` | Pass |
| `npm run build` | Pass |
| `npm test` | **24 / 24 passed**: adds the honors, GPA/SAT, KINETIX Aug 2025, no patent number, and the new view/transition plans |
| `npm run test:e2e` (desktop, tablet, phone, landscape phone) | **106 passed, 6 skipped by design** |

## Visually inspected (screenshots and scrubbed frame sheets)

- **Edward cut-outs** on a dark ground: no white halo; all three bubbles have
  intact interiors and legible text. The stray tail tip and outline ghosting
  were found and fixed.
- **Slides 1–3** at 1440×900, 390×844, 844×390 and with reduced motion. Edward
  is flush bottom-left with no box. On slide 3, Previous and Next both show and
  the third step dot is lit (it wasn't at first; fixed).
- **Edward → door:** 8 scrubbed frames. Edward recedes, the door emerges from
  the dark and haze, and the controls appear after a beat.
- **Door of Truth** at desktop, portrait phone, landscape phone and reduced
  motion. On portrait phones the Enter button first covered the lower
  engravings; it now sits under the art. The door's hard edges on portrait were
  feathered.
- **Gate transition:** 12 scrubbed frames showing the engraving pulse, the push
  toward the eye, the void of alchemical fragments, rings collapsing onto the
  rim, the sigil drawing, the circle settling sharp, and the nodes igniting. A
  doubled door edge caused by the parallax copy was found and fixed.
- **Portal dive and portal close** (Projects, Research). The first version showed
  a flat grey disc at the iris; fixed by a gold rim that tracks the iris and a
  soft-edged plate in the camera.

## Functional coverage added (automated)

- Three slides in both directions. Edward's bounding box is identical on every
  slide.
- Door: title, focus on Enter, Previous back to slide 3, Enter to the circle.
- `#hub` stays inert (no clickable moving targets) until the camera settles.
- Skip intro from the door.
- Ten rapid Next clicks stop at the door, and six rapid Enter clicks run the gate
  once.
- Browser Back mid-gate lands on a settled view.
- Reduced-motion journey through the door in under 3.5 s.

## Known / open

- Tested in Chromium only.
- The door leaves are not re-drawn open. A separated layer looked artificial, so
  depth comes from parallax, light and the camera move through the opening, as
  the brief allows.
- Rights: see `CONTENT_REVIEW.md` (the Door of Truth and Edward fan art).
