import { describe, expect, it } from 'vitest';
import { CIRCLE_IMAGE, NODES, containFit, directionOf, hitBox } from '../../src/stage/nodes';

describe('node map', () => {
  it('maps the five positions from the brief to the right sections', () => {
    const byPosition = Object.fromEntries(NODES.map((n) => [n.position, n.id]));
    expect(byPosition).toEqual({
      top: 'about',
      'upper right': 'projects',
      'lower right': 'research',
      'lower left': 'experience',
      'upper left': 'contact',
    });
  });

  it('keeps every hit area inside the artwork and non-overlapping', () => {
    const boxes = NODES.map((n) => hitBox(n));
    for (const b of boxes) {
      expect(b.x1).toBeGreaterThanOrEqual(0);
      expect(b.y1).toBeGreaterThanOrEqual(0);
      expect(b.x2).toBeLessThanOrEqual(CIRCLE_IMAGE.width);
      expect(b.y2).toBeLessThanOrEqual(CIRCLE_IMAGE.height);
    }
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const overlap = a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
        expect(overlap, `${NODES[i].id} vs ${NODES[j].id}`).toBe(false);
      }
    }
  });

  it('points motion toward each node', () => {
    const about = directionOf(NODES[0]);
    expect(about.dy).toBeLessThan(-0.9);
    const projects = directionOf(NODES[1]);
    expect(projects.dx).toBeGreaterThan(0.5);
  });
});

describe('containFit', () => {
  it('letterboxes a wide image in a tall box without cropping', () => {
    const fit = containFit(390, 844);
    expect(fit.width).toBeCloseTo(390);
    expect(fit.height).toBeCloseTo((390 * 941) / 1672);
    expect(fit.y).toBeGreaterThan(0);
  });
  it('pillarboxes in a very wide box', () => {
    const fit = containFit(2000, 600);
    expect(fit.height).toBeCloseTo(600);
    expect(fit.x).toBeGreaterThan(0);
  });
});
