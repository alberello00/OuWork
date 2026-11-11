import { describe, expect, it } from 'vitest';
import { assignColors, buildSpheres, guessKind, INTERESTS, interestLabel, interestsFor, isValidSetupSphere, mergePreview, sphereNameFor, type InterestId } from './galaxySetup';
import { SPHERE_COLORS } from './tokens';

describe('guessKind', () => {
  it('is solo on the personal galaxy, whatever the members', () => {
    expect(guessKind(true, 1)).toBe('solo');
  });
  it('guesses from the number of members', () => {
    expect(guessKind(false, 1)).toBe('couple');
    expect(guessKind(false, 2)).toBe('couple');
    expect(guessKind(false, 4)).toBe('friends');
  });
});

describe('interestsFor', () => {
  it('puts "Date ideas" first for couples and hides it from the others', () => {
    expect(interestsFor('couple')[0]).toBe('dates');
    for (const kind of ['friends', 'family', 'solo'] as const) expect(interestsFor(kind)).not.toContain('dates');
  });
  it('offers the whole catalogue to every kind', () => {
    const all = (Object.keys(INTERESTS) as InterestId[]).filter((id) => id !== 'dates').sort();
    for (const kind of ['couple', 'friends', 'family', 'solo'] as const) {
      expect(interestsFor(kind).filter((id) => id !== 'dates').sort()).toEqual(all);
    }
  });
  it('has a label and a sphere name for every interest', () => {
    for (const id of Object.keys(INTERESTS) as InterestId[]) {
      expect(interestLabel(id)).toBeTruthy();
      expect(sphereNameFor(id, 'couple').length).toBeLessThanOrEqual(40);
    }
  });
  it('uses only palette colours', () => {
    for (const t of Object.values(INTERESTS)) expect(SPHERE_COLORS).toContain(t.color);
  });
});

describe('assignColors', () => {
  it('never repeats a colour while the palette lasts, and avoids the inbox colour', () => {
    const colors = assignColors(['rose', 'rose', 'rose', undefined, 'sage', 'amber', 'amber', undefined, undefined]);
    expect(new Set(colors).size).toBe(9);
    expect(colors).not.toContain('sage');
    expect(colors[0]).toBe('rose');
  });
  it('starts again when the palette is used up', () => {
    const colors = assignColors(Array.from({ length: 10 }, () => undefined));
    expect(new Set(colors.slice(0, 9)).size).toBe(9);
    expect(SPHERE_COLORS).toContain(colors[9]);
  });
});

describe('buildSpheres', () => {
  it('is deterministic and follows the order of the kind, not of the clicks', () => {
    const a = buildSpheres('couple', ['music', 'dates', 'places']);
    const b = buildSpheres('couple', ['places', 'music', 'dates']);
    expect(a).toEqual(b);
    expect(a.map((s) => s.name)).toEqual(['Date ideas', 'Places', 'Music']);
    expect(a.map((s) => s.color)).toEqual(['rose', 'amber', 'lavender']);
  });

  it('adapts names to the kind and drops interests the kind does not have', () => {
    expect(buildSpheres('solo', ['gifts', 'dates']).map((s) => s.name)).toEqual(['Wishlist']);
  });

  it('gives distinct colours to interests that prefer the same one', () => {
    const out = buildSpheres('couple', ['dates', 'memories', 'recipes', 'outdoor']);
    expect(new Set(out.map((s) => s.color)).size).toBe(4);
  });

  it('adds free interests, skipping blanks, duplicates and "Random"', () => {
    const out = buildSpheres('friends', ['music'], [
      { name: '  Board games ', emoji: '♟️' },
      { name: 'music', emoji: '🎸' },
      { name: 'random', emoji: '🎲' },
      { name: '   ', emoji: '❓' },
      { name: 'Plants', emoji: '' },
    ]);
    expect(out.map((s) => [s.name, s.emoji])).toEqual([['Music', '🎵'], ['Board games', '♟️'], ['Plants', '✨']]);
  });

  it('never proposes more than 10 spheres', () => {
    const everything = interestsFor('couple');
    const out = buildSpheres('couple', everything, [{ name: 'One more', emoji: '➕' }]);
    expect(out).toHaveLength(10);
    expect(out.every(isValidSetupSphere)).toBe(true);
  });
});

describe('mergePreview', () => {
  it('keeps edits for spheres that are still selected', () => {
    const first = buildSpheres('couple', ['places', 'music']);
    const edited = first.map((s) => (s.key === 'places' ? { ...s, name: 'Trips', color: 'plum' as const } : s));
    const next = mergePreview(edited, buildSpheres('couple', ['places', 'books']));
    expect(next.map((s) => s.name)).toEqual(['Trips', 'Books']);
    expect(next[0]!.color).toBe('plum');
  });
});

describe('isValidSetupSphere', () => {
  it('needs a name of 1–40 characters and a short emoji', () => {
    expect(isValidSetupSphere({ name: 'Places', emoji: '📍' })).toBe(true);
    expect(isValidSetupSphere({ name: '  ', emoji: '📍' })).toBe(false);
    expect(isValidSetupSphere({ name: 'x'.repeat(41), emoji: '📍' })).toBe(false);
    expect(isValidSetupSphere({ name: 'Places', emoji: '' })).toBe(false);
  });
});
