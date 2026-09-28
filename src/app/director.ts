// Runs the visual side of every navigation transition. The Navigator decides
// *which* transition happens; the Director decides *how it looks*.
//
// Pattern for every transition: animate with fill "both", await, commit the
// settled state (body[data-view] + hidden flags), then release the animations
// so plain CSS owns the final state. Final keyframes always equal the settled
// CSS, so releasing never causes a jump.
//
// Decorative canvas effects (sparks, warp streaks, rings, lightning) are
// scheduled with later(); hurry() cancels them along with every animation, so
// a skipped or interrupted transition always lands cleanly.
import type { SectionId } from '../content/types';
import { CIRCLE_IMAGE, NODES, directionOf, nodeFor } from '../stage/nodes';
import { ARC, GOLD, ICE, type Particles } from './fx/particles';
import { energyFor } from './fx/sigil';
import { Motion, nextFrame, prefersReducedMotion, whenDecoded } from './motion';
import { LAST_SLIDE, type IntroSlide, type TransitionKind, type View } from './views';

export interface SceneRefs {
  intro: HTMLElement;
  introBackdrop: HTMLElement;
  introFigure: HTMLElement;
  introRim: HTMLElement;
  edBody: HTMLElement;
  bubbles: HTMLElement[];
  introControls: HTMLElement;
  skip: HTMLElement;
  prev: HTMLButtonElement;
  next: HTMLButtonElement;
  step: HTMLElement;
  introLive: HTMLElement;
  hub: HTMLElement;
  hubChrome: HTMLElement[];
  hotspots: HTMLElement;
  frame: HTMLElement;
  camera: HTMLElement;
  blurImg: HTMLElement;
  sharpImg: HTMLElement;
  hubSigil: SVGSVGElement;
  fog: HTMLElement;
  fogPlanes: HTMLElement[];
  sectionView: HTMLElement;
  flare: HTMLElement;
  irisRim: SVGSVGElement;
  door: HTMLElement;
  doorSurround: HTMLElement;
  doorStage: HTMLElement;
  doorBack: HTMLElement;
  doorFront: HTMLElement;
  doorGlyphs: HTMLElement;
  doorEye: HTMLElement;
  doorShade: HTMLElement;
  doorControls: HTMLElement;
  doorEnter: HTMLButtonElement;
  doorPrev: HTMLButtonElement;
  doorSkip: HTMLElement;
  gateVoid: HTMLElement;
}

export interface DirectorHooks {
  renderSection(id: SectionId): void;
}

const SLIDE_TEXT = [
  'Slide 1 of 3. Hello! It is nice to meet you.',
  'Slide 2 of 3. My name is Akshay Karthik, welcome to my website!',
  'Slide 3 of 3. Are you ready to learn the truth?',
];

/** The eye in the Door of Truth opening, as a fraction of that artwork. */
const EYE = { x: 833 / 1672, y: 432 / 941 };

/** Tip of the speech-bubble tail, as a fraction of the intro artwork. */
const TAIL = { x: 866 / 1619, y: 452 / 972 };

const DIVE = 6;
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
const EASE_IN = 'cubic-bezier(0.55, 0, 0.85, 0.35)';
const EASE_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)';
const f = (n: number) => n.toFixed(1);

type Anims = Animation[];

export class Director {
  readonly motion = new Motion();
  /** Set by "Skip intro": the next descent uses the short version. */
  fastDescent = false;
  private timers: number[] = [];

  constructor(
    private readonly r: SceneRefs,
    private readonly hooks: DirectorHooks,
    private readonly fx: Particles,
  ) {}

  hurry(): void {
    this.timers.forEach((t) => window.clearTimeout(t));
    this.timers = [];
    this.fx.stop();
    this.motion.hurry();
  }

  /** Schedules a decorative effect; skipped entirely for reduced motion. */
  private later(ms: number, fn: () => void): void {
    if (prefersReducedMotion()) return;
    this.timers.push(window.setTimeout(fn, ms));
  }

  private play(el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions): Animation {
    return this.motion.play(el, keyframes, options);
  }

  private async finish(anims: Anims, commit: () => void): Promise<void> {
    await this.motion.settle(anims);
    commit();
    this.motion.release(anims);
  }

  /** Applies a settled view with no animation (initial load, deep links). */
  commit(view: View): void {
    const { body } = document;
    body.dataset.view = view.kind;
    body.classList.toggle('is-scene', view.kind !== 'section');
    this.r.intro.hidden = view.kind !== 'intro';
    this.r.sectionView.hidden = view.kind !== 'section';
    this.r.hub.inert = view.kind !== 'circle';
    this.r.intro.inert = view.kind !== 'intro';
    this.r.door.hidden = view.kind !== 'door';
    this.r.door.inert = view.kind !== 'door';
    this.r.door.classList.toggle('is-ready', view.kind === 'door');
    if (view.kind === 'intro') this.showSlide(view.slide);
    if (view.kind === 'door') this.layoutDoor();
    this.r.camera.style.transformOrigin = '';
  }

  async perform(kind: TransitionKind, from: View, to: View): Promise<void> {
    switch (kind) {
      case 'slide-forward':
      case 'slide-back':
        if (to.kind === 'intro') await this.slide(to.slide);
        return;
      case 'skip':
        await this.skipToCircle(this.r.intro);
        return;
      case 'to-door':
        await this.toDoor();
        return;
      case 'from-door':
        await this.fromDoor();
        return;
      case 'gate':
        await this.gate();
        return;
      case 'replay':
        await this.replay();
        return;
      case 'enter':
        if (to.kind === 'section') await this.enter(to.id);
        return;
      case 'leave':
        if (from.kind === 'section') await this.leave(from.id);
        return;
      case 'switch':
        if (to.kind === 'section') await this.switchSection(to.id);
        return;
      case 'jump':
        await this.jump(to);
        return;
      case 'none':
        return;
    }
  }

  // ------------------------------------------------------------ geometry

  private tailPoint(): { x: number; y: number } {
    const rect = this.r.introFigure.getBoundingClientRect();
    return { x: rect.left + rect.width * TAIL.x, y: rect.top + rect.height * TAIL.y };
  }

  /** Node position on screen with the camera at rest. */
  private nodeScreen(id: SectionId): { x: number; y: number } {
    const spec = nodeFor(id);
    const rect = this.r.frame.getBoundingClientRect();
    return { x: rect.left + (spec.node.x / CIRCLE_IMAGE.width) * rect.width, y: rect.top + (spec.node.y / CIRCLE_IMAGE.height) * rect.height };
  }

  /** Offset (px) of a node from the frame centre, plus the centre on screen. */
  private nodeOffset(id: SectionId) {
    const spec = nodeFor(id);
    const rect = this.r.frame.getBoundingClientRect();
    return {
      nx: (spec.node.x / CIRCLE_IMAGE.width - 0.5) * rect.width,
      ny: (spec.node.y / CIRCLE_IMAGE.height - 0.5) * rect.height,
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2,
      w: rect.width,
    };
  }

  /** Camera poses share one function list so they interpolate smoothly. */
  private pose(tx: number, ty: number, rx: number, ry: number, rz: number, s: number): string {
    return `perspective(1200px) translate(${f(tx)}px, ${f(ty)}px) rotateX(${f(rx)}deg) rotateY(${f(ry)}deg) rotateZ(${f(rz)}deg) scale(${s})`;
  }

  private divePose(id: SectionId): string {
    const { nx, ny } = this.nodeOffset(id);
    // translate(t) scale(S) about the centre maps p to t + S·p; t = −S·n puts
    // the node at the centre of the frame.
    return this.pose(-DIVE * nx, -DIVE * ny, 0, 0, 0, DIVE);
  }

  private setFlareAt(x: number, y: number): void {
    this.r.flare.style.setProperty('--fx', `${x}px`);
    this.r.flare.style.setProperty('--fy', `${y}px`);
  }

  /** Animates the glowing rim in lockstep with a clip-path iris. */
  private rim(x: number, y: number, from: number, to: number, options: KeyframeAnimationOptions): Anims {
    const svg = this.r.irisRim;
    const circles = [...svg.querySelectorAll<SVGCircleElement>('circle')];
    circles.forEach((c) => {
      c.setAttribute('cx', f(x));
      c.setAttribute('cy', f(y));
    });
    return [
      ...circles.map((c) => this.play(c, [{ r: `${f(from)}px` }, { r: `${f(to)}px` }], options)),
      this.play(svg, [{ opacity: 0 }, { offset: 0.06, opacity: 1 }, { offset: 0.85, opacity: 1 }, { opacity: 0 }], options),
    ];
  }

  private viewportRadius(x: number, y: number): number {
    return Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 24;
  }

  // -------------------------------------------------------------- sigil

  private drawSigil(svg: SVGSVGElement, selector: string, delay: number, duration: number): Anims {
    return [...svg.querySelectorAll<SVGPathElement>(`${selector} .draw-path`)].map((p) =>
      this.play(p, [{ strokeDashoffset: '1px' }, { strokeDashoffset: '0px' }], { duration, delay, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }),
    );
  }

  private popRunes(svg: SVGSVGElement, delay: number): Anims {
    return [...svg.querySelectorAll('.sg-rune')].map((g, i) =>
      this.play(g, [{ opacity: 0, transform: 'scale(0.2) rotate(-90deg)' }, { opacity: 1, transform: 'none' }], {
        duration: 600,
        delay: delay + i * 90,
        easing: EASE_OUT,
      }),
    );
  }

  // ----------------------------------------------------------- hotspots

  /** Gold flare on a node's ring plus a sweep under its label. */
  private ignite(id: SectionId, delay: number, strength = 1): Anims {
    const hs = this.r.hotspots.querySelector<HTMLElement>(`.hotspot[data-section="${id}"]`);
    if (!hs) return [];
    const ring = hs.querySelector('.hs-ring');
    const line = hs.querySelector('.hs-underline');
    const anims: Anims = [];
    const off = { borderColor: 'rgba(240, 194, 107, 0)', boxShadow: '0 0 0 0 rgba(240, 194, 107, 0)' };
    if (ring)
      anims.push(
        this.play(
          ring,
          [
            { ...off, transform: 'translate(-50%, -50%) scale(0.5)' },
            {
              offset: 0.35,
              borderColor: 'rgba(240, 194, 107, 1)',
              boxShadow: `0 0 0 ${f(6 * strength)}px rgba(240, 194, 107, 0.22), 0 0 ${f(50 * strength)}px ${f(14 * strength)}px rgba(240, 194, 107, 0.55)`,
              transform: `translate(-50%, -50%) scale(${1 + 0.3 * strength})`,
            },
            { ...off, transform: 'translate(-50%, -50%) scale(0.92)' },
          ],
          { duration: 1100, delay, easing: 'ease-out' },
        ),
      );
    if (line)
      anims.push(
        this.play(
          line,
          [
            { transform: 'scaleX(0)', opacity: 1 },
            { offset: 0.4, transform: 'scaleX(1)', opacity: 1 },
            { offset: 0.8, transform: 'scaleX(1)', opacity: 0 },
            { transform: 'scaleX(0)', opacity: 0 },
          ],
          { duration: 1100, delay: delay + 80, easing: 'ease-out' },
        ),
      );
    return anims;
  }

  // ------------------------------------------------------------- intro

  private showSlide(n: IntroSlide): void {
    this.r.bubbles.forEach((b, i) => {
      b.classList.toggle('is-active', i === n);
      if (i === n) b.removeAttribute('aria-hidden');
      else b.setAttribute('aria-hidden', 'true');
    });
    this.updateIntroControls(n);
  }

  private updateIntroControls(n: IntroSlide): void {
    const { prev, step, next } = this.r;
    if (n === 0) {
      if (document.activeElement === prev) next.focus();
      prev.setAttribute('data-hidden', '');
      prev.setAttribute('aria-hidden', 'true');
      prev.tabIndex = -1;
    } else {
      prev.removeAttribute('data-hidden');
      prev.removeAttribute('aria-hidden');
      prev.tabIndex = 0;
    }
    next.setAttribute('aria-label', n < LAST_SLIDE ? 'Next slide' : 'Next: approach the Gate of Truth');
    step.dataset.step = String(n);
  }

  private bubblePop(el: Element, delay: number): Animation {
    return this.play(
      el,
      [
        { opacity: 0, transform: 'scale(0.12) rotate(-8deg)' },
        { offset: 0.55, opacity: 1, transform: 'scale(1.07) rotate(1.2deg)' },
        { offset: 0.78, opacity: 1, transform: 'scale(0.985) rotate(-0.3deg)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 820, delay, easing: 'cubic-bezier(0.25, 0.9, 0.3, 1)' },
    );
  }

  private bubbleCollapse(el: Element, delay = 0): Animation {
    return this.play(el, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.08) rotate(10deg)' }], {
      duration: 380,
      delay,
      easing: EASE_IN,
    });
  }

  /** Edward walks in from the left edge, then his first line pops out. */
  private edwardEntrance(delay: number, slide: IntroSlide = 0): Anims {
    const r = this.r;
    return [
      this.play(
        r.introFigure,
        [
          { opacity: 0, transform: 'translateX(-26%) scale(1.04)' },
          { offset: 0.72, opacity: 1, transform: 'translateX(1.2%) scale(1)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 1300, delay, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
      ),
      this.play(r.introRim, [{ opacity: 0 }, { opacity: 1 }], { duration: 1400, delay: delay + 350 }),
      this.bubblePop(r.bubbles[slide], delay + 950),
    ];
  }

  async introEntrance(): Promise<void> {
    const r = this.r;
    r.introControls.inert = true;
    const reduced = prefersReducedMotion();
    await Promise.all([whenDecoded(r.edBody.querySelector('img')), whenDecoded(r.bubbles[0].querySelector('img'))]);
    let anims: Anims;
    if (reduced) {
      anims = [this.play(r.intro, [{ opacity: 0 }, { opacity: 1 }], { duration: 250 })];
    } else {
      anims = [
        this.play(r.introBackdrop, [{ opacity: 0, transform: 'scale(1.14)' }, { opacity: 1, transform: 'none' }], { duration: 2200, easing: EASE_OUT }),
        ...this.edwardEntrance(250),
      ];
      this.later(1250, () => {
        const t = this.tailPoint();
        this.fx.burst(t.x, t.y, { count: 28, color: ICE, speed: 260 });
      });
    }
    await this.finish(anims, () => {
      r.intro.classList.add('is-ready');
      r.introControls.inert = false;
    });
  }

  private async slide(n: IntroSlide): Promise<void> {
    const r = this.r;
    const incoming = r.bubbles[n];
    const outgoing = r.bubbles.find((b) => b.classList.contains('is-active') && b !== incoming) ?? r.bubbles[0];
    await whenDecoded(incoming.querySelector('img'));
    this.updateIntroControls(n);
    r.introLive.textContent = SLIDE_TEXT[n];
    let anims: Anims;
    if (prefersReducedMotion()) {
      anims = [this.play(incoming, [{ opacity: 0 }, { opacity: 1 }], { duration: 160 }), this.play(outgoing, [{ opacity: 1 }, { opacity: 0 }], { duration: 160 })];
    } else {
      anims = [
        this.bubbleCollapse(outgoing),
        this.bubblePop(incoming, 300),
        // Edward gives a small nod as he speaks again; his pose never changes.
        this.play(
          r.introFigure,
          [{ transform: 'none' }, { offset: 0.35, transform: 'rotate(-0.6deg) translateY(-0.6%)' }, { transform: 'none' }],
          { duration: 900, easing: EASE_IN_OUT },
        ),
      ];
      this.later(320, () => {
        const t = this.tailPoint();
        this.fx.burst(t.x, t.y, { count: 30, color: ICE, speed: 280 });
        this.fx.ring({ x: t.x, y: t.y, r0: 6, r1: 110, duration: 650, width: 3, color: ARC });
      });
    }
    await this.finish(anims, () => this.showSlide(n));
  }

  // ------------------------------------------------------------- door

  /** Eye in the door's opening, on screen (image px 833, 432). */
  private eyePoint(): { x: number; y: number } {
    const rect = this.r.doorStage.getBoundingClientRect();
    return { x: rect.left + rect.width * EYE.x, y: rect.top + rect.height * EYE.y };
  }

  /**
   * Places "Enter the Gate of Truth" under the central opening, on the lit
   * floor below the door, kept inside the viewport.
   */
  layoutDoor(): void {
    const rect = this.r.doorStage.getBoundingClientRect();
    if (!rect.width) return;
    const x = rect.left + rect.width * EYE.x;
    // Portrait screens leave room under the artwork: use it, so the button
    // covers none of the door. Otherwise sit on the lit floor below the opening.
    const below = rect.bottom + 52;
    const y = below < window.innerHeight - 110 ? below : Math.min(rect.top + rect.height * 0.905, window.innerHeight - 64);
    this.r.door.style.setProperty('--enter-x', `${f(x)}px`);
    this.r.door.style.setProperty('--enter-y', `${f(y)}px`);
  }

  private doorChrome(): HTMLElement[] {
    return [this.r.doorControls, this.r.doorPrev, this.r.doorSkip];
  }

  /** Skip intro (from Edward or the door): a short, clear fade to the circle. */
  private async skipToCircle(from: HTMLElement): Promise<void> {
    const r = this.r;
    from.inert = true;
    await whenDecoded(r.sharpImg.querySelector('img'), 2500);
    document.body.dataset.view = 'descent';
    const d = 380;
    const anims = [
      this.play(from, [{ opacity: 1 }, { opacity: 0 }], { duration: d }),
      this.play(r.blurImg, [{ opacity: 1 }, { opacity: 0 }], { duration: d }),
      this.play(r.sharpImg, [{ opacity: 0 }, { opacity: 1 }], { duration: d }),
      this.play(r.camera, [{ transform: 'scale(1.15)' }, { transform: 'none' }], { duration: d, easing: EASE_OUT }),
      ...[...r.hubChrome, r.hotspots].map((el) => this.play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: 160 })),
    ];
    await this.finish(anims, () => this.commit({ kind: 'circle' }));
  }

  /**
   * Edward's question → the Door of Truth (~3.7 s). Edward recedes into the
   * dark, the door emerges from darkness and violet haze, the eye glints, and
   * after a beat the Enter and Previous controls appear.
   */
  private async toDoor(): Promise<void> {
    const r = this.r;
    const reduced = prefersReducedMotion();
    r.intro.inert = true;
    r.door.classList.remove('is-ready');
    r.door.inert = true;
    r.door.hidden = false;
    this.layoutDoor();
    await whenDecoded(r.doorBack.querySelector('img'), 2500);

    let anims: Anims;
    if (reduced) {
      anims = [
        this.play(r.intro, [{ opacity: 1 }, { opacity: 0 }], { duration: 250 }),
        this.play(r.door, [{ opacity: 0 }, { opacity: 1 }], { duration: 250 }),
      ];
    } else {
      const active = r.bubbles.find((b) => b.classList.contains('is-active')) ?? r.bubbles[LAST_SLIDE];
      anims = [
        this.bubbleCollapse(active),
        this.play(r.introFigure, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-6%) scale(0.86)' }], { duration: 1100, delay: 150, easing: EASE_IN }),
        this.play(r.introRim, [{ opacity: 1 }, { opacity: 0 }], { duration: 600 }),
        ...[r.introControls, r.skip].map((el) => this.play(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 })),
        this.play(r.introBackdrop, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(1.08)' }], { duration: 1400, easing: EASE_IN }),
        this.play(r.door, [{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: 500 }),
        this.play(r.doorSurround, [{ opacity: 0, transform: 'scale(1.18)' }, { opacity: 0.85, transform: 'none' }], { duration: 2800, delay: 500, easing: EASE_OUT }),
        this.play(r.doorStage, [{ opacity: 0, transform: 'scale(1.07) translateY(1.5%)' }, { opacity: 1, transform: 'none' }], { duration: 2500, delay: 700, easing: EASE_OUT }),
        this.play(
          r.doorEye,
          [
            { opacity: 0, transform: 'translate(-50%, -50%) scale(0.5)' },
            { offset: 0.55, opacity: 0.85, transform: 'translate(-50%, -50%) scale(1.1)' },
            { opacity: 0, transform: 'translate(-50%, -50%) scale(1)' },
          ],
          { duration: 1700, delay: 1900, easing: 'ease-in-out' },
        ),
        // A beat to take in the door, then the controls.
        this.play(r.doorControls, [{ opacity: 0, transform: 'translate(-50%, -50%) translateY(18px)' }, { opacity: 1, transform: 'translate(-50%, -50%)' }], {
          duration: 700,
          delay: 3000,
          easing: EASE_OUT,
        }),
        ...[r.doorPrev, r.doorSkip].map((el) => this.play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 3150 })),
      ];
    }
    await this.finish(anims, () => this.commit({ kind: 'door' }));
  }

  /** Door → Edward's question: the door sinks back into the dark and Edward returns. */
  private async fromDoor(): Promise<void> {
    const r = this.r;
    const reduced = prefersReducedMotion();
    r.door.inert = true;
    this.showSlide(LAST_SLIDE);
    r.intro.classList.remove('is-ready');
    r.introControls.inert = true;
    r.intro.hidden = false;
    let anims: Anims;
    if (reduced) {
      anims = [
        this.play(r.door, [{ opacity: 1 }, { opacity: 0 }], { duration: 220 }),
        this.play(r.intro, [{ opacity: 0 }, { opacity: 1 }], { duration: 220 }),
      ];
    } else {
      anims = [
        ...this.doorChrome().map((el) => this.play(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 250 })),
        this.play(r.doorStage, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.92)' }], { duration: 900, easing: EASE_IN }),
        this.play(r.door, [{ opacity: 1 }, { opacity: 0 }], { duration: 500, delay: 650 }),
        this.play(r.introBackdrop, [{ opacity: 0, transform: 'scale(1.08)' }, { opacity: 1, transform: 'none' }], { duration: 1200, delay: 400, easing: EASE_OUT }),
        ...this.edwardEntrance(650, LAST_SLIDE),
      ];
    }
    await this.finish(anims, () => this.commit({ kind: 'intro', slide: LAST_SLIDE }));
    r.intro.classList.add('is-ready');
    r.introControls.inert = false;
  }

  /**
   * The signature transition, door → circle (~5 s). The engravings pulse, the
   * camera pushes toward the eye with the door rushing past faster than the
   * haze, passes through the pupil into a void of alchemical fragments, and
   * those lines gather into the transmutation circle, which approaches from the
   * distance and settles sharp. Hotspots only activate once it has settled.
   */
  private async gate(): Promise<void> {
    const r = this.r;
    if (prefersReducedMotion() || this.fastDescent) {
      this.fastDescent = false;
      await this.skipToCircle(r.door);
      return;
    }
    r.door.inert = true;
    r.hub.inert = true;
    await whenDecoded(r.sharpImg.querySelector('img'), 2500);
    document.body.dataset.view = 'gate';
    const W = window.innerWidth;
    const H = window.innerHeight;
    const eye = this.eyePoint();
    const T = { push: 450, void: 1900, form: 2700, settle: 4600 };
    const far = 'perspective(1400px) translateY(-2%) rotateZ(-14deg) scale(0.2)';
    const near = 'perspective(1400px) translateY(0%) rotateZ(0deg) scale(1)';

    const anims: Anims = [
      ...this.doorChrome().map((el) => this.play(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 260 })),

      // 1. The engravings answer with a restrained blue-violet pulse.
      this.play(r.doorGlyphs, [{ opacity: 0 }, { offset: 0.3, opacity: 0.85 }, { offset: 0.6, opacity: 0.4 }, { opacity: 0.7 }], { duration: 1500 }),

      // 2. The eye becomes the focal point; the camera pushes toward it with
      //    the door moving faster than the haze behind it.
      this.play(
        r.doorEye,
        [
          { opacity: 0, transform: 'translate(-50%, -50%) scale(0.6)' },
          { offset: 0.35, opacity: 0.8, transform: 'translate(-50%, -50%) scale(1)' },
          { opacity: 1, transform: 'translate(-50%, -50%) scale(2.2)' },
        ],
        { duration: 1700, delay: 250, easing: 'ease-in' },
      ),
      this.play(r.doorSurround, [{ transform: 'none' }, { transform: 'scale(1.3)' }], { duration: 2000, delay: T.push, easing: 'cubic-bezier(0.5, 0, 0.8, 0.4)' }),
      this.play(r.doorBack, [{ transform: 'none', opacity: 1 }, { offset: 0.18, opacity: 0 }, { transform: 'scale(2.6)', opacity: 0 }], { duration: 1900, delay: T.push, easing: 'cubic-bezier(0.55, 0, 0.85, 0.35)' }),
      this.play(
        r.doorFront,
        [
          { transform: 'none', opacity: 1 },
          { offset: 0.45, transform: 'scale(1.4)', opacity: 1 },
          { offset: 0.88, transform: 'scale(4.6)', opacity: 1 },
          { transform: 'scale(6)', opacity: 0 },
        ],
        { duration: 1900, delay: T.push, easing: 'cubic-bezier(0.55, 0, 0.85, 0.35)' },
      ),
      this.play(r.doorShade, [{ opacity: 1 }, { opacity: 0 }], { duration: 900, delay: T.push }),

      // 3. Through the pupil: the scene gives way to the void.
      this.play(r.gateVoid, [{ opacity: 0 }, { opacity: 1 }], { duration: 450, delay: T.void - 200 }),
      this.play(r.door, [{ opacity: 1 }, { offset: 0.5, opacity: 1 }, { opacity: 0 }], { duration: 1300, delay: T.form - 200 }),

      // 4. The lines gather into the circle, which approaches and settles.
      this.play(r.camera, [{ transform: far }, { transform: near }], { duration: 1900, delay: T.form, easing: 'cubic-bezier(0.2, 0.7, 0.15, 1)' }),
      this.play(r.blurImg, [{ opacity: 1 }, { offset: 0.35, opacity: 1 }, { opacity: 0 }], { duration: 1900, delay: T.form }),
      this.play(r.sharpImg, [{ opacity: 0 }, { offset: 0.3, opacity: 0 }, { opacity: 1 }], { duration: 1900, delay: T.form }),
      this.play(r.hubSigil, [{ opacity: 0 }, { offset: 0.15, opacity: 1 }, { offset: 0.7, opacity: 0.85 }, { opacity: 0 }], { duration: 2200, delay: T.form - 100 }),
      ...this.drawSigil(r.hubSigil, '.sg-rings', T.form - 100, 1100),
      ...this.drawSigil(r.hubSigil, '.sg-star', T.form + 200, 1000),
      ...this.popRunes(r.hubSigil, T.form + 500),

      // 5. Only after the camera settles: labels and clickable nodes.
      this.play(r.hotspots, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, delay: T.settle }),
      ...NODES.flatMap((n, i) => this.ignite(n.id, T.settle + 60 + i * 120)),
      ...r.hubChrome.map((el, i) =>
        this.play(el, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 650, delay: T.settle + 200 + i * 110, easing: EASE_OUT }),
      ),
    ];

    this.fx.ring({ x: eye.x, y: eye.y, r0: 10, r1: Math.min(W, H) * 0.28, duration: 900, width: 3, color: ARC });
    this.later(T.void - 300, () => this.fx.tunnel({ x: W / 2, y: H * 0.47, duration: 1400, rate: 110 }));
    this.later(T.form + 300, () => {
      // The void's lines collapse inward onto the circle's rim.
      const c = this.nodeOffset('about');
      const rim = (304 / CIRCLE_IMAGE.width) * c.w;
      this.fx.ring({ x: c.cx, y: c.cy, r0: Math.max(W, H) * 0.8, r1: rim * 0.7, duration: 1100, width: 3, color: ARC });
      this.fx.ring({ x: c.cx, y: c.cy, r0: Math.max(W, H), r1: rim * 0.85, duration: 1300, width: 2, color: ICE });
    });
    NODES.forEach((n, i) =>
      this.later(T.settle + 120 + i * 120, () => {
        const p = this.nodeScreen(n.id);
        this.fx.burst(p.x, p.y, { count: 14, color: GOLD, speed: 180, life: 0.6 });
      }),
    );

    // Any click or key fast-forwards to the settled circle.
    await nextFrame();
    const skip = () => this.hurry();
    window.addEventListener('pointerdown', skip, { once: true });
    window.addEventListener('keydown', skip, { once: true });
    await this.finish(anims, () => this.commit({ kind: 'circle' }));
    window.removeEventListener('pointerdown', skip);
    window.removeEventListener('keydown', skip);
  }

  /** Circle → intro: the camera lifts away and Edward returns. */
  private async replay(): Promise<void> {
    const r = this.r;
    const reduced = prefersReducedMotion();
    this.showSlide(0);
    r.intro.classList.remove('is-ready');
    r.introControls.inert = true;
    r.hub.inert = true;
    r.intro.hidden = false;
    let anims: Anims;
    if (reduced) {
      anims = [
        this.play(r.hub, [{ opacity: 1 }, { opacity: 0 }], { duration: 220 }),
        this.play(r.intro, [{ opacity: 0 }, { opacity: 1 }], { duration: 220 }),
      ];
    } else {
      const W = window.innerWidth;
      const H = window.innerHeight;
      anims = [
        ...[...r.hubChrome, r.hotspots].map((el) => this.play(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 400 })),
        this.play(r.camera, [{ transform: 'perspective(1400px) rotateX(0deg) rotateZ(0deg) scale(1)' }, { transform: 'perspective(1400px) rotateX(58deg) rotateZ(36deg) scale(0.16)' }], {
          duration: 1300,
          easing: EASE_IN,
        }),
        this.play(r.sharpImg, [{ opacity: 1 }, { opacity: 0 }], { duration: 1000 }),
        this.play(r.fog, [{ opacity: 0 }, { offset: 0.45, opacity: 1 }, { opacity: 0 }], { duration: 1900, delay: 200 }),
        this.play(r.intro, [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 900 }),
        this.play(r.introBackdrop, [{ opacity: 0, transform: 'scale(0.3) rotate(-12deg)' }, { opacity: 1, transform: 'none' }], { duration: 1300, delay: 800, easing: EASE_OUT }),
        ...this.edwardEntrance(1500),
      ];
      this.later(150, () => this.fx.warp({ x: W / 2, y: H * 0.48, duration: 1200, inward: true }));
      this.later(2500, () => {
        const t = this.tailPoint();
        this.fx.burst(t.x, t.y, { count: 28, color: ICE, speed: 260 });
      });
    }
    await this.finish(anims, () => this.commit({ kind: 'intro', slide: 0 }));
    r.intro.classList.add('is-ready');
    r.introControls.inert = false;
  }

  // ------------------------------------------------------------ sections

  /** Section header elements that stagger in after a reveal. */
  private headerStagger(delay: number): Anims {
    const sv = this.r.sectionView;
    const els = [sv.querySelector('.minimap'), sv.querySelector('#section-title'), sv.querySelector('.sec-lede'), sv.querySelector('.sec-head + *')].filter(
      (e): e is Element => Boolean(e),
    );
    return [
      ...els.map((el, i) =>
        this.play(el, [{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { duration: 750, delay: delay + i * 110, easing: EASE_OUT }),
      ),
      ...[sv.querySelector('.section-bar')].filter((e): e is Element => Boolean(e)).map((el) =>
        this.play(el, [{ opacity: 0, transform: 'translateY(-100%)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: delay + 150, easing: EASE_OUT }),
      ),
    ];
  }

  /**
   * Circle → section, ~2.4 s ("portal dive"): the node ignites and energy runs
   * to it along the sigil, the camera banks toward it, dives through it with
   * warp streaks, and the section irises open from where the node landed.
   */
  private async enter(id: SectionId): Promise<void> {
    const r = this.r;
    const reduced = prefersReducedMotion();
    r.hub.inert = true;
    const { nx, ny, cx, cy } = this.nodeOffset(id);
    const node = this.nodeScreen(id);
    this.hooks.renderSection(id);
    window.scrollTo(0, 0);
    r.sectionView.hidden = false;

    if (reduced) {
      const anims = [
        this.play(r.sectionView, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 }),
        this.play(r.hub, [{ opacity: 1 }, { opacity: 0 }], { duration: 200 }),
      ];
      await this.finish(anims, () => this.commit({ kind: 'section', id }));
      return;
    }

    const { dx, dy } = directionOf(nodeFor(id));
    const W = window.innerWidth;
    const H = window.innerHeight;
    const R = this.viewportRadius(cx, cy);
    const energy = energyFor(r.hubSigil, id);
    r.camera.style.transformOrigin = '50% 50%';
    const others = [...r.hotspots.querySelectorAll<HTMLElement>('.hotspot')].filter((h) => h.dataset.section !== id);

    const anims: Anims = [
      // Ignite + energy trace (0–0.6 s).
      ...this.ignite(id, 0, 1.4),
      ...others.map((el) => this.play(el, [{ opacity: 1 }, { opacity: 0.12 }], { duration: 350 })),
      ...r.hubChrome.map((el) => this.play(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 400 })),
      this.play(r.hubSigil, [{ opacity: 0 }, { offset: 0.15, opacity: 1 }, { offset: 0.7, opacity: 1 }, { opacity: 0 }], { duration: 1500 }),
      ...this.drawSigil(r.hubSigil, '.sg-rings', 0, 700),
      ...(energy ? [this.play(energy, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 }), ...this.drawSigil(r.hubSigil, `.sg-energy[data-node="${id}"]`, 60, 520)] : []),

      // Bank toward the node, then dive through it (0.25–1.75 s).
      this.play(
        r.camera,
        [
          { offset: 0, transform: this.pose(0, 0, 0, 0, 0, 1), easing: 'cubic-bezier(0.3, 0, 0.2, 1)' },
          { offset: 0.32, transform: this.pose(-nx * 0.3, -ny * 0.3, dy * 16, -dx * 16, dx * 5, 1.18), easing: 'cubic-bezier(0.6, 0, 0.9, 0.6)' },
          { offset: 1, transform: this.divePose(id) },
        ],
        { duration: 1500, delay: 250 },
      ),
      this.play(r.flare, [{ opacity: 0 }, { offset: 0.5, opacity: 0.85 }, { opacity: 0 }], { duration: 900, delay: 950 }),

      // Iris opens from the node's landing point (1.15–2.25 s).
      this.play(r.sectionView, [{ clipPath: `circle(0px at ${f(cx)}px ${f(cy)}px)` }, { clipPath: `circle(${f(R)}px at ${f(cx)}px ${f(cy)}px)` }], {
        duration: 1100,
        delay: 1150,
        easing: EASE_IN_OUT,
      }),
      ...this.rim(cx, cy, 0, R, { duration: 1100, delay: 1150, easing: EASE_IN_OUT }),
      ...this.headerStagger(1500),
    ];

    this.setFlareAt(cx, cy);
    this.fx.burst(node.x, node.y, { count: 54, color: GOLD, speed: 380 });
    this.fx.ring({ x: node.x, y: node.y, r0: 8, r1: 150, duration: 700, width: 4, color: GOLD });
    this.later(700, () => this.fx.warp({ x: cx, y: cy, duration: 850, rate: 240 }));
    this.later(1100, () => this.fx.ring({ x: cx, y: cy, r0: 30, r1: Math.max(W, H) * 0.9, duration: 1000, width: 8, color: GOLD }));
    this.later(1200, () => this.fx.burst(cx, cy, { count: 40, color: ICE, speed: 520 }));

    await this.finish(anims, () => this.commit({ kind: 'section', id }));
  }

  /**
   * Section → circle, ~2 s ("portal close"): the section irises shut into the
   * node, star streaks rush back in, the camera pulls out and unbanks, then the
   * node flares and the circle relights.
   */
  private async leave(id: SectionId): Promise<void> {
    const r = this.r;
    const reduced = prefersReducedMotion();
    document.body.dataset.view = 'circle';
    document.body.classList.add('is-scene');
    r.intro.hidden = true;

    if (reduced) {
      const anims = [this.play(r.sectionView, [{ opacity: 1 }, { opacity: 0 }], { duration: 200 })];
      await this.finish(anims, () => this.commit({ kind: 'circle' }));
      window.scrollTo(0, 0);
      return;
    }

    const { dx, dy } = directionOf(nodeFor(id));
    const { nx, ny, cx, cy } = this.nodeOffset(id);
    const sy = window.scrollY;
    const R = this.viewportRadius(cx, cy);
    const others = NODES.map((n) => n.id).filter((n) => n !== id);
    r.camera.style.transformOrigin = '50% 50%';

    const anims: Anims = [
      this.play(r.sectionView, [{ clipPath: `circle(${f(R)}px at ${f(cx)}px ${f(cy + sy)}px)` }, { clipPath: `circle(0px at ${f(cx)}px ${f(cy + sy)}px)` }], {
        duration: 800,
        easing: 'cubic-bezier(0.7, 0, 0.84, 0)',
      }),
      ...this.rim(cx, cy, R, 0, { duration: 800, easing: 'cubic-bezier(0.7, 0, 0.84, 0)' }),
      this.play(
        r.camera,
        [
          { offset: 0, transform: this.divePose(id), easing: 'cubic-bezier(0.2, 0.6, 0.35, 1)' },
          { offset: 0.55, transform: this.pose(nx * 0.2, ny * 0.2, -dy * 12, dx * 12, -dx * 4, 1.12), easing: 'cubic-bezier(0.3, 0, 0.2, 1)' },
          { offset: 1, transform: this.pose(0, 0, 0, 0, 0, 1) },
        ],
        { duration: 1350, delay: 600 },
      ),
      this.play(r.flare, [{ opacity: 0 }, { offset: 0.4, opacity: 0.7 }, { opacity: 0 }], { duration: 800, delay: 550 }),
      this.play(r.hotspots, [{ opacity: 0 }, { offset: 0.72, opacity: 0 }, { opacity: 1 }], { duration: 2000 }),
      ...r.hubChrome.map((el, i) =>
        this.play(el, [{ opacity: 0, transform: 'translateY(10px)' }, { offset: 0.7, opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], {
          duration: 2100 + i * 100,
          easing: EASE_OUT,
        }),
      ),
      ...this.ignite(id, 1750, 1.3),
      ...others.flatMap((o, i) => this.ignite(o, 1900 + i * 90, 0.6)),
    ];

    this.setFlareAt(cx, cy);
    this.fx.warp({ x: cx, y: cy, duration: 700, inward: true, rate: 220 });
    this.later(650, () => this.fx.ring({ x: cx, y: cy, r0: 260, r1: 10, duration: 500, width: 5, color: GOLD }));
    this.later(1780, () => {
      const p = this.nodeScreen(id);
      this.fx.burst(p.x, p.y, { count: 40, color: GOLD, speed: 300 });
      this.fx.ring({ x: p.x, y: p.y, r0: 8, r1: 120, duration: 700, width: 3, color: GOLD });
    });

    await this.finish(anims, () => this.commit({ kind: 'circle' }));
    window.scrollTo(0, 0);
  }

  /** Section → section: iris closes into the minimap's "you are here" dot and reopens from the new one. */
  private async switchSection(id: SectionId): Promise<void> {
    const r = this.r;
    const reduced = prefersReducedMotion();
    const dotCenter = () => {
      const dot = r.sectionView.querySelector('.mm-dot--on')?.getBoundingClientRect();
      return dot ? { x: dot.left + dot.width / 2, y: dot.top + dot.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 3 };
    };

    if (reduced) {
      const out = [this.play(r.sectionView, [{ opacity: 1 }, { opacity: 0 }], { duration: 120 })];
      await this.motion.settle(out);
      this.hooks.renderSection(id);
      window.scrollTo(0, 0);
      this.motion.release(out);
      const back = [this.play(r.sectionView, [{ opacity: 0 }, { opacity: 1 }], { duration: 120 })];
      await this.finish(back, () => this.commit({ kind: 'section', id }));
      return;
    }

    const a = dotCenter();
    const sy = window.scrollY;
    const Ra = this.viewportRadius(a.x, a.y);
    const close = [
      this.play(r.sectionView, [{ clipPath: `circle(${f(Ra)}px at ${f(a.x)}px ${f(a.y + sy)}px)` }, { clipPath: `circle(0px at ${f(a.x)}px ${f(a.y + sy)}px)` }], {
        duration: 650,
        easing: 'cubic-bezier(0.7, 0, 0.84, 0)',
      }),
      ...this.rim(a.x, a.y, Ra, 0, { duration: 650, easing: 'cubic-bezier(0.7, 0, 0.84, 0)' }),
    ];
    this.fx.warp({ x: a.x, y: a.y, duration: 600, inward: true, rate: 160 });
    await this.motion.settle(close);
    this.hooks.renderSection(id);
    window.scrollTo(0, 0);
    const b = dotCenter();
    const Rb = this.viewportRadius(b.x, b.y);
    this.motion.release(close);
    this.fx.burst(b.x, b.y, { count: 40, color: GOLD, speed: 340 });
    this.fx.ring({ x: b.x, y: b.y, r0: 6, r1: Math.max(window.innerWidth, window.innerHeight), duration: 900, width: 6, color: GOLD });
    const open = [
      this.play(r.sectionView, [{ clipPath: `circle(0px at ${f(b.x)}px ${f(b.y)}px)` }, { clipPath: `circle(${f(Rb)}px at ${f(b.x)}px ${f(b.y)}px)` }], {
        duration: 900,
        easing: EASE_OUT,
      }),
      ...this.rim(b.x, b.y, 0, Rb, { duration: 900, easing: EASE_OUT }),
      ...this.headerStagger(200),
    ];
    await this.finish(open, () => this.commit({ kind: 'section', id }));
  }

  private async jump(to: View): Promise<void> {
    const r = this.r;
    this.setFlareAt(window.innerWidth / 2, window.innerHeight / 2);
    const cover = [this.play(r.flare, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 })];
    await this.motion.settle(cover);
    if (to.kind === 'section') this.hooks.renderSection(to.id);
    this.commit(to);
    window.scrollTo(0, 0);
    this.motion.release(cover);
    const reveal = [this.play(r.flare, [{ opacity: 1 }, { opacity: 0 }], { duration: 260 })];
    await this.motion.settle(reveal);
    this.motion.release(reveal);
    if (to.kind === 'intro') {
      r.intro.classList.add('is-ready');
      r.introControls.inert = false;
    }
  }
}
