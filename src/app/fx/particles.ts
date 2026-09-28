// One full-screen canvas for the transition effects: warp streaks, spark
// bursts, lightning arcs, and shockwave rings. A single rAF loop runs only
// while something is alive; stop() clears everything instantly (used when a
// transition is skipped or interrupted).

type Rgb = [number, number, number];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: Rgb;
  drag: number;
}

interface Streak {
  angle: number;
  r: number;
  speed: number;
  accel: number;
  len: number;
  life: number;
  max: number;
  width: number;
  color: Rgb;
  inward: boolean;
}

interface Fragment {
  kind: 0 | 1 | 2 | 3; // ray, arc, triangle, rune tick
  angle: number;
  r: number; // world radius from the axis
  z: number; // depth: 1 = far, 0 = at the camera
  spin: number;
  size: number;
  color: Rgb;
}

interface Emitter {
  until: number;
  rate: number; // per second
  carry: number;
  spawn: () => void;
}

interface Ring {
  x: number;
  y: number;
  r0: number;
  r1: number;
  t: number;
  dur: number;
  width: number;
  color: Rgb;
}

interface Bolt {
  pts: Array<[number, number]>;
  life: number;
  max: number;
  color: Rgb;
}

export const GOLD: Rgb = [240, 194, 107];
export const ARC: Rgb = [127, 178, 255];
export const ICE: Rgb = [216, 230, 255];

const MAX_PARTICLES = 420;

export class Particles {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private raf = 0;
  private last = 0;
  private particles: Particle[] = [];
  private streaks: Streak[] = [];
  private emitters: Emitter[] = [];
  private rings: Ring[] = [];
  private bolts: Bolt[] = [];
  private fragments: Fragment[] = [];
  private tunnelAt = { x: 0, y: 0, speed: 0.9 };
  private origin = { x: 0, y: 0 };

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable');
    this.ctx = ctx;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
  }

  /** Star streaks flying past the camera from (or into) a point. */
  warp(opts: { x: number; y: number; duration: number; rate?: number; inward?: boolean; color?: Rgb }): void {
    this.origin = { x: opts.x, y: opts.y };
    const reach = Math.hypot(this.w, this.h);
    this.emitters.push({
      until: performance.now() + opts.duration,
      rate: opts.rate ?? 140,
      carry: 0,
      spawn: () => {
        if (this.streaks.length > MAX_PARTICLES) return;
        const inward = Boolean(opts.inward);
        const warm = Math.random() < 0.18;
        this.streaks.push({
          angle: Math.random() * Math.PI * 2,
          r: inward ? reach * (0.55 + Math.random() * 0.2) : 20 + Math.random() * 60,
          speed: inward ? -(260 + Math.random() * 260) : 120 + Math.random() * 180,
          accel: inward ? -900 : 1800 + Math.random() * 1400,
          len: 0,
          life: 0,
          max: 0.9 + Math.random() * 0.5,
          width: 0.8 + Math.random() * 1.8,
          color: opts.color ?? (warm ? GOLD : Math.random() < 0.5 ? ARC : ICE),
          inward,
        });
      },
    });
    this.start();
  }

  /** Sparks exploding from a point. */
  burst(x: number, y: number, opts: { count?: number; color?: Rgb; speed?: number; life?: number } = {}): void {
    const count = opts.count ?? 36;
    for (let i = 0; i < count && this.particles.length < MAX_PARTICLES; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = (opts.speed ?? 320) * (0.35 + Math.random() * 0.9);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0,
        max: (opts.life ?? 0.9) * (0.6 + Math.random() * 0.7),
        size: 1 + Math.random() * 2.4,
        color: opts.color ?? GOLD,
        drag: 2.6,
      });
    }
    this.start();
  }

  /** Lightning flickering between points on a circle. */
  arcs(opts: { x: number; y: number; r: number; duration: number; rate?: number }): void {
    this.emitters.push({
      until: performance.now() + opts.duration,
      rate: opts.rate ?? 16,
      carry: 0,
      spawn: () => {
        const a0 = Math.random() * Math.PI * 2;
        const a1 = a0 + (Math.random() < 0.5 ? 1 : -1) * (0.5 + Math.random() * 1.6);
        const r0 = opts.r * (0.55 + Math.random() * 0.5);
        const r1 = opts.r * (0.55 + Math.random() * 0.5);
        const p0: [number, number] = [opts.x + Math.cos(a0) * r0, opts.y + Math.sin(a0) * r0];
        const p1: [number, number] = [opts.x + Math.cos(a1) * r1, opts.y + Math.sin(a1) * r1];
        this.bolts.push({ pts: jagged(p0, p1, 7, opts.r * 0.06), life: 0, max: 0.16 + Math.random() * 0.12, color: Math.random() < 0.3 ? ICE : ARC });
      },
    });
    this.start();
  }

  /** Expanding shockwave ring. */
  ring(opts: { x: number; y: number; r0?: number; r1: number; duration: number; width?: number; color?: Rgb }): void {
    this.rings.push({ x: opts.x, y: opts.y, r0: opts.r0 ?? 0, r1: opts.r1, t: 0, dur: opts.duration / 1000, width: opts.width ?? 5, color: opts.color ?? ICE });
    this.start();
  }

  /**
   * The threshold void: fine alchemical lines, arcs, triangles and rune ticks
   * streaming toward the viewer from a point.
   */
  tunnel(opts: { x: number; y: number; duration: number; rate?: number; speed?: number }): void {
    this.tunnelAt = { x: opts.x, y: opts.y, speed: opts.speed ?? 0.95 };
    const palette: Rgb[] = [ARC, ICE, [159, 134, 214], ARC];
    this.emitters.push({
      until: performance.now() + opts.duration,
      rate: opts.rate ?? 90,
      carry: 0,
      spawn: () => {
        if (this.fragments.length > 260) return;
        this.fragments.push({
          kind: (Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3),
          angle: Math.random() * Math.PI * 2,
          r: 40 + Math.random() * 520,
          z: 1,
          spin: (Math.random() - 0.5) * 1.2,
          size: 10 + Math.random() * 40,
          color: palette[Math.floor(Math.random() * palette.length)],
        });
      },
    });
    this.start();
  }

  /** Removes every effect immediately. */
  stop(): void {
    this.particles = [];
    this.streaks = [];
    this.emitters = [];
    this.rings = [];
    this.bolts = [];
    this.fragments = [];
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private start(): void {
    if (this.raf) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  private tick = (now: number): void => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const ctx = this.ctx;

    for (const e of this.emitters) {
      e.carry += e.rate * dt;
      while (e.carry >= 1) {
        e.spawn();
        e.carry -= 1;
      }
    }
    this.emitters = this.emitters.filter((e) => now < e.until);

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    // Streaks.
    const { x: ox, y: oy } = this.origin;
    this.streaks = this.streaks.filter((s) => {
      s.life += dt;
      s.speed += s.accel * dt;
      const prev = s.r;
      s.r += s.speed * dt;
      s.len = Math.min(Math.abs(s.r - prev) * 4.5, 260);
      const fade = Math.min(1, s.life / 0.15) * Math.max(0, 1 - s.life / s.max);
      if (fade <= 0 || s.r < 0) return false;
      const cos = Math.cos(s.angle);
      const sin = Math.sin(s.angle);
      const tail = s.inward ? s.r + s.len : s.r - s.len;
      ctx.strokeStyle = rgba(s.color, 0.85 * fade);
      ctx.lineWidth = s.width * (1 + s.r / 900);
      ctx.beginPath();
      ctx.moveTo(ox + cos * Math.max(0, tail), oy + sin * Math.max(0, tail));
      ctx.lineTo(ox + cos * s.r, oy + sin * s.r);
      ctx.stroke();
      return s.r < Math.hypot(this.w, this.h) * 1.1;
    });

    // Sparks.
    this.particles = this.particles.filter((p) => {
      p.life += dt;
      if (p.life >= p.max) return false;
      p.vx *= Math.exp(-p.drag * dt);
      p.vy *= Math.exp(-p.drag * dt);
      p.vy += 60 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const a = 1 - p.life / p.max;
      ctx.fillStyle = rgba(p.color, a);
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.1, p.size * (0.6 + a * 0.6)), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba(p.color, a * 0.18);
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.1, p.size * 4), 0, Math.PI * 2);
      ctx.fill();
      return true;
    });

    // Lightning.
    this.bolts = this.bolts.filter((b) => {
      b.life += dt;
      if (b.life >= b.max) return false;
      const a = 1 - b.life / b.max;
      for (const [w, alpha] of [
        [7, 0.18],
        [2.2, 0.9],
      ]) {
        ctx.strokeStyle = rgba(b.color, alpha * a);
        ctx.lineWidth = w;
        ctx.beginPath();
        b.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      }
      return true;
    });

    // Void fragments (perspective projection toward the camera).
    const { x: tx, y: ty, speed } = this.tunnelAt;
    const focal = Math.min(this.w, this.h) * 0.9;
    this.fragments = this.fragments.filter((fr) => {
      fr.z -= speed * dt * (0.6 + (1 - fr.z));
      fr.angle += fr.spin * dt;
      if (fr.z <= 0.04) return false;
      const k = focal / (fr.z * 900);
      const cx = tx + Math.cos(fr.angle) * fr.r * k;
      const cy = ty + Math.sin(fr.angle) * fr.r * k;
      const a = Math.min(1, (1 - fr.z) * 2.2) * Math.min(1, fr.z * 6);
      const s = fr.size * k;
      ctx.strokeStyle = rgba(fr.color, 0.75 * a);
      ctx.lineWidth = Math.max(0.6, 1.4 * k);
      ctx.beginPath();
      if (fr.kind === 0) {
        const c = Math.cos(fr.angle);
        const si = Math.sin(fr.angle);
        ctx.moveTo(cx - c * s, cy - si * s);
        ctx.lineTo(cx + c * s, cy + si * s);
      } else if (fr.kind === 1) {
        ctx.arc(tx, ty, Math.max(0.1, fr.r * k), fr.angle - 0.25, fr.angle + 0.25);
      } else if (fr.kind === 2) {
        for (let v = 0; v < 3; v++) {
          const t = fr.angle * 2 + (v * Math.PI * 2) / 3;
          const px = cx + Math.cos(t) * s * 0.5;
          const py = cy + Math.sin(t) * s * 0.5;
          if (v) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        }
        ctx.closePath();
      } else {
        ctx.arc(cx, cy, Math.max(0.1, s * 0.25), 0, Math.PI * 2);
        ctx.moveTo(cx, cy - s * 0.5);
        ctx.lineTo(cx, cy + s * 0.5);
      }
      ctx.stroke();
      return true;
    });

    // Rings.
    this.rings = this.rings.filter((r) => {
      r.t += dt;
      const k = Math.min(1, r.t / r.dur);
      if (k >= 1) return false;
      const e = 1 - Math.pow(1 - k, 3);
      const radius = r.r0 + (r.r1 - r.r0) * e;
      const a = 1 - k;
      ctx.strokeStyle = rgba(r.color, 0.2 * a);
      ctx.lineWidth = r.width * 5 * (1 - k * 0.6);
      ctx.beginPath();
      ctx.arc(r.x, r.y, Math.max(0.1, radius), 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = rgba(r.color, 0.9 * a);
      ctx.lineWidth = r.width * (1 - k * 0.7);
      ctx.beginPath();
      ctx.arc(r.x, r.y, Math.max(0.1, radius), 0, Math.PI * 2);
      ctx.stroke();
      return true;
    });

    ctx.globalCompositeOperation = 'source-over';
    const alive = this.fragments.length || this.particles.length || this.streaks.length || this.emitters.length || this.rings.length || this.bolts.length;
    if (alive) this.raf = requestAnimationFrame(this.tick);
    else {
      this.raf = 0;
      ctx.clearRect(0, 0, this.w, this.h);
    }
  };
}

function rgba([r, g, b]: Rgb, a: number): string {
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
}

function jagged(a: [number, number], b: [number, number], steps: number, amp: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [a];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const off = (Math.random() - 0.5) * 2 * amp;
    pts.push([a[0] + dx * t + nx * off, a[1] + dy * t + ny * off]);
  }
  pts.push(b);
  return pts;
}
