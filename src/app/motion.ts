// Thin wrapper around the Web Animations API that tracks every running
// animation so a transition can be fast-forwarded (hurry) or cleaned up.

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

export function prefersReducedMotion(): boolean {
  return reducedQuery.matches;
}

export class Motion {
  private running = new Set<Animation>();

  play(el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions): Animation {
    const anim = el.animate(keyframes, { fill: 'both', ...options });
    this.running.add(anim);
    const forget = () => this.running.delete(anim);
    anim.finished.then(forget, forget);
    return anim;
  }

  /** Resolves when every animation has finished or been cancelled. */
  async settle(anims: Animation[]): Promise<void> {
    await Promise.allSettled(anims.map((a) => a.finished));
  }

  /** Jumps every running animation to its end state. */
  hurry(): void {
    for (const anim of [...this.running]) {
      try {
        anim.finish();
      } catch {
        anim.cancel();
      }
    }
  }

  /** Removes fill effects so the settled CSS state takes over. */
  release(anims: Animation[]): void {
    for (const anim of anims) anim.cancel();
  }

  get active(): boolean {
    return this.running.size > 0;
  }
}

/** Resolves once the image is decoded (or failed), capped by a timeout. */
export function whenDecoded(img: HTMLImageElement | null, timeout = 1500): Promise<void> {
  if (!img) return Promise.resolve();
  const decode = img.decode ? img.decode().catch(() => undefined) : Promise.resolve();
  return Promise.race([decode, new Promise<void>((r) => setTimeout(r, timeout))]).then(() => undefined);
}

export const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
