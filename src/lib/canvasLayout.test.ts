import { describe, expect, it } from 'vitest';
import { nextFreeSpot } from './canvasLayout';

describe('nextFreeSpot', () => {
  it('starts at the origin', () => expect(nextFreeSpot([])).toEqual({ x: 0, y: 0 }));
  it('skips occupied slots', () => {
    expect(nextFreeSpot([{ x: 0, y: 0 }, { x: 280, y: 0 }])).toEqual({ x: 560, y: 0 });
  });
  it('wraps to the next row', () => {
    const row = [0, 280, 560, 840].map((x) => ({ x, y: 0 }));
    expect(nextFreeSpot(row)).toEqual({ x: 0, y: 260 });
  });
});
