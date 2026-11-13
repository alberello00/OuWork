import { describe, expect, it } from 'vitest';
import { mergeStaleKeys, presentUsers, staleKeys, WATCHED_TABLES, workspaceTopic } from './invalidation';

describe('staleKeys', () => {
  it('has keys for every watched table', () => {
    for (const t of WATCHED_TABLES) expect(staleKeys(t).length).toBeGreaterThan(0);
  });
  it('refreshes links when an item changes, since deleting it removes them', () => {
    expect(staleKeys('items')).toContainEqual(['links']);
  });
  it('merges a batch without duplicates', () => {
    const keys = mergeStaleKeys(['items', 'items', 'item_links', 'spheres']);
    const ids = keys.map((k) => k.join('/'));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(['items', 'links', 'spheres', 'stats', 'search']));
  });
});

describe('workspaceTopic', () => {
  it('matches the pattern the database policies accept', () => {
    expect(workspaceTopic('10000000-0000-4000-8000-000000000001')).toBe('ws:10000000-0000-4000-8000-000000000001');
  });
});

describe('presentUsers', () => {
  const state = {
    a: [{ user_id: 'me', board_id: 'b1' }],
    b: [{ user_id: 'jo', board_id: 'b1' }, { user_id: 'jo', board_id: 'b1' }],
    c: [{ user_id: 'pri', board_id: 'b2' }],
    d: [{ user_id: 'tom', board_id: null }],
  };
  it('on a board, shows only the others on that board, once each', () => {
    expect(presentUsers(state, 'me', 'b1')).toEqual(['jo']);
  });
  it('elsewhere, shows everyone else in the workspace', () => {
    expect(presentUsers(state, 'me', null).sort()).toEqual(['jo', 'pri', 'tom']);
  });
});
