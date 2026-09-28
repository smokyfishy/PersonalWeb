import { describe, expect, it, vi } from 'vitest';
import { Navigator } from '../../src/app/navigator';
import { historyPolicy, parsePath, pathFor, planTransition, type View } from '../../src/app/views';

const intro0: View = { kind: 'intro', slide: 0 };
const intro1: View = { kind: 'intro', slide: 1 };
const intro2: View = { kind: 'intro', slide: 2 };
const door: View = { kind: 'door' };
const circle: View = { kind: 'circle' };
const about: View = { kind: 'section', id: 'about' };
const projects: View = { kind: 'section', id: 'projects' };

describe('routes', () => {
  it('parses section paths, home, and unknown paths', () => {
    expect(parsePath('/')).toBeNull();
    expect(parsePath('/projects')).toEqual(projects);
    expect(parsePath('/Projects/')).toEqual(projects);
    expect(parsePath('/nope')).toBe('unknown');
  });
  it('round-trips every section', () => {
    for (const id of ['about', 'projects', 'research', 'experience', 'contact'] as const) {
      expect(parsePath(pathFor({ kind: 'section', id }))).toEqual({ kind: 'section', id });
    }
    expect(pathFor(circle)).toBe('/');
  });
});

describe('planTransition', () => {
  it('maps every journey step to its transition', () => {
    expect(planTransition(intro0, intro1)).toBe('slide-forward');
    expect(planTransition(intro1, intro0)).toBe('slide-back');
    expect(planTransition(intro1, intro2)).toBe('slide-forward');
    expect(planTransition(intro2, intro1)).toBe('slide-back');
    expect(planTransition(intro2, door)).toBe('to-door');
    expect(planTransition(door, intro2)).toBe('from-door');
    expect(planTransition(door, circle)).toBe('gate');
    expect(planTransition(intro0, circle)).toBe('skip'); // Skip intro
    expect(planTransition(circle, about)).toBe('enter');
    expect(planTransition(about, circle)).toBe('leave');
    expect(planTransition(about, projects)).toBe('switch');
    expect(planTransition(circle, intro0)).toBe('replay');
    expect(planTransition(about, about)).toBe('none');
  });
  it('only gives sections and returns their own history entries', () => {
    expect(historyPolicy(intro0, intro1)).toBe('replace');
    expect(historyPolicy(intro2, door)).toBe('replace');
    expect(historyPolicy(door, circle)).toBe('replace');
    expect(historyPolicy(circle, about)).toBe('push');
    expect(historyPolicy(about, circle)).toBe('push');
  });
});

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

describe('Navigator lock and queue', () => {
  it('runs one transition at a time and keeps only the latest queued request', async () => {
    const gates: Array<ReturnType<typeof deferred>> = [];
    const performed: string[] = [];
    const hurry = vi.fn(() => gates.forEach((g) => g.resolve()));
    const commits: string[] = [];
    const nav = new Navigator(circle, {
      perform: (kind, _from, to) => {
        performed.push(`${kind}:${pathFor(to)}`);
        // The first transition blocks until released; queued ones finish at once.
        if (gates.length > 0) return Promise.resolve();
        const gate = deferred();
        gates.push(gate);
        return gate.promise;
      },
      hurry,
      commitHistory: (view) => commits.push(pathFor(view)),
    });

    const first = nav.go({ to: about, history: 'push' });
    expect(nav.isBusy).toBe(true);
    // Rapid clicks while flying toward About: only the last one survives.
    void nav.go({ to: projects, history: 'push' });
    void nav.go({ to: circle, history: 'push' });
    expect(hurry).toHaveBeenCalledTimes(2);
    gates.forEach((g) => g.resolve());
    await first;
    await Promise.resolve();

    expect(performed).toEqual(['enter:/about', 'leave:/']);
    expect(commits).toEqual(['/about', '/']);
    expect(nav.view).toEqual(circle);
    expect(nav.isBusy).toBe(false);
  });

  it('ignores requests for the view already shown', async () => {
    const perform = vi.fn(() => Promise.resolve());
    const nav = new Navigator(about, { perform, hurry: vi.fn(), commitHistory: vi.fn() });
    await nav.go({ to: about, history: 'push' });
    expect(perform).not.toHaveBeenCalled();
  });

  it('recovers when a transition throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const nav = new Navigator(circle, {
      perform: () => Promise.reject(new Error('boom')),
      hurry: vi.fn(),
      commitHistory: vi.fn(),
    });
    await nav.go({ to: about, history: 'push' });
    expect(nav.view).toEqual(about);
    expect(nav.isBusy).toBe(false);
    errorSpy.mockRestore();
  });
});
