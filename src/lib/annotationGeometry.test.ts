import { describe, expect, it } from 'vitest';
import { arrowPaths, normaliseStroke, strokePath } from './annotationGeometry';

describe('annotation geometry', () => {
  it('normalises stroke points to their bounding box origin', () => {
    expect(normaliseStroke([[10, 20], [30, 25], [15, 40]])).toEqual({ x: 10, y: 20, points: [[0, 0], [20, 5], [5, 20]] });
  });

  it('builds a closed svg path for a stroke', () => {
    const d = strokePath([[0, 0], [10, 10], [20, 5], [40, 0]], 4);
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
  });

  it('ends the arrowhead exactly on the target point', () => {
    const { head, body } = arrowPaths(100, 0, 3);
    expect(head.startsWith('100,0')).toBe(true);
    expect(body.startsWith('M 0 0 Q')).toBe(true);
  });
});
