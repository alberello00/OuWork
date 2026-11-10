import { describe, expect, it } from 'vitest';
import { arrangeSpheres, sphereLinkCounts } from './universeLayout';

describe('arrangeSpheres', () => {
  it('puts the biggest sphere in the middle and the inbox last', () => {
    const out = arrangeSpheres([
      { id: 'inbox', count: 50, isInbox: true },
      { id: 'small', count: 1, isInbox: false },
      { id: 'big', count: 20, isInbox: false },
    ]);
    expect(out[0]).toEqual({ id: 'big', x: 0, y: 0 });
    expect(out.at(-1)!.id).toBe('inbox');
  });

  it('never stacks two spheres on the same point', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ id: String(i), count: i, isInbox: false }));
    const keys = new Set(arrangeSpheres(many).map((p) => `${p.x}:${p.y}`));
    expect(keys.size).toBe(15);
  });
});

describe('sphereLinkCounts', () => {
  it('counts only links across different spheres, direction-free', () => {
    const top = new Map([['i1', 'A'], ['i2', 'B'], ['i3', 'A'], ['i4', 'B']]);
    const counts = sphereLinkCounts(
      [
        { source_id: 'i1', target_id: 'i2' },
        { source_id: 'i4', target_id: 'i3' },
        { source_id: 'i1', target_id: 'i3' },
        { source_id: 'i1', target_id: 'missing' },
      ],
      top
    );
    expect([...counts]).toEqual([['A|B', 2]]);
  });
});
