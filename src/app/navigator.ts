// Explicit navigation state machine with a transition lock.
//
// Only one transition runs at a time. Requests that arrive mid-transition are
// held in a single slot (latest wins) and the running animation is asked to
// hurry, so rapid clicking or Back/Forward can never stack pages or strand an
// overlay. The DOM work is injected as `perform`, keeping this module testable.
import { planTransition, sameView, type TransitionKind, type View } from './views';

export interface NavRequest {
  to: View;
  /** How the browser URL should change once the transition starts. */
  history: 'push' | 'replace' | 'none';
}

export interface NavigatorDeps {
  perform(kind: TransitionKind, from: View, to: View): Promise<void>;
  /** Fast-forward whatever animation is running (e.g. WAAPI finish()). */
  hurry(): void;
  commitHistory(view: View, mode: 'push' | 'replace'): void;
  onSettled?(view: View): void;
  onBusyChange?(busy: boolean): void;
}

export class Navigator {
  private current: View;
  private busy = false;
  private pending: NavRequest | null = null;

  constructor(
    initial: View,
    private readonly deps: NavigatorDeps,
  ) {
    this.current = initial;
  }

  get view(): View {
    return this.current;
  }

  get isBusy(): boolean {
    return this.busy;
  }

  /**
   * Requests a view change. Resolves when the view (or a later queued view)
   * has settled.
   */
  async go(request: NavRequest): Promise<void> {
    if (this.busy) {
      this.pending = request;
      this.deps.hurry();
      return;
    }
    if (sameView(this.current, request.to)) return;

    this.setBusy(true);
    let next: NavRequest | null = request;
    try {
      while (next) {
        const from = this.current;
        const to = next.to;
        if (!sameView(from, to)) {
          if (next.history !== 'none') this.deps.commitHistory(to, next.history);
          const kind = planTransition(from, to);
          this.current = to;
          try {
            await this.deps.perform(kind, from, to);
          } catch (error) {
            // A failed animation must never leave the UI stuck mid-way.
            console.error('Transition failed', error);
          }
        }
        next = this.pending;
        this.pending = null;
      }
    } finally {
      this.setBusy(false);
      this.deps.onSettled?.(this.current);
    }
  }

  private setBusy(value: boolean): void {
    this.busy = value;
    this.deps.onBusyChange?.(value);
  }
}
