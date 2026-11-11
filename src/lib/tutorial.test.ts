import { describe, expect, it } from 'vitest';
import { placeCard, resolveSteps, spotlightBox, TUTORIAL_STEPS } from './tutorial';

const all = () => true;
const owner = { isOwner: true, isPersonal: false };

describe('resolveSteps', () => {
  it('has at most 7 steps, in the order of the requirements', () => {
    expect(TUTORIAL_STEPS.length).toBeLessThanOrEqual(7);
    expect(resolveSteps(owner, all).map((s) => s.id)).toEqual(['galaxies', 'enter', 'add', 'canvas', 'private', 'news', 'invite']);
  });

  it('shows the invite step only to the owner of a shared galaxy', () => {
    expect(resolveSteps({ isOwner: false, isPersonal: false }, all).map((s) => s.id)).not.toContain('invite');
    expect(resolveSteps({ isOwner: true, isPersonal: true }, all).map((s) => s.id)).not.toContain('invite');
  });

  it('never points a spotlight at something that is not there', () => {
    const visible = new Set(['galaxy-switcher', 'planet-inbox', 'search']);
    const steps = resolveSteps(owner, (t) => visible.has(t));
    for (const s of steps) expect(s.target === null || visible.has(s.target)).toBe(true);
    // no "+" and no settings button on screen: those steps are dropped
    expect(steps.map((s) => s.id)).toEqual(['galaxies', 'enter', 'canvas', 'private', 'news']);
    // with only Random around, "enter" adapts to it; "only me" becomes a plain card
    expect(steps.find((s) => s.id === 'enter')!.target).toBe('planet-inbox');
    expect(steps.find((s) => s.id === 'private')!.target).toBeNull();
  });

  it('prefers a real sphere to Random', () => {
    expect(resolveSteps(owner, all).find((s) => s.id === 'enter')!.target).toBe('planet');
  });
});

describe('placeCard', () => {
  const phone = { width: 390, height: 844 };
  const desktop = { width: 1280, height: 800 };
  const card = { width: 340, height: 220 };
  const inside = (p: { top: number; left: number }, c: typeof card, v: typeof phone) =>
    p.left >= 0 && p.top >= 0 && p.left + c.width <= v.width && p.top + c.height <= v.height;

  it('goes under a target at the top of the screen', () => {
    const p = placeCard({ top: 6, left: 60, width: 150, height: 44 }, card, desktop);
    expect(p.side).toBe('below');
    expect(p.top).toBeGreaterThan(50);
  });

  it('goes above the bottom bar and the FAB on a 390 px phone, never off screen', () => {
    const fab = spotlightBox({ top: 752, left: 167, width: 56, height: 56 }, phone);
    const search = spotlightBox({ top: 790, left: 24, width: 44, height: 44 }, phone);
    for (const spot of [fab, search]) {
      const p = placeCard(spot, card, phone);
      expect(p.side).toBe('above');
      expect(inside(p, card, phone)).toBe(true);
      expect(p.top + card.height).toBeLessThanOrEqual(spot.top);
    }
  });

  it('stays inside the viewport for targets in every corner', () => {
    for (const v of [phone, desktop]) {
      for (const t of [
        { top: 0, left: 0, width: 44, height: 44 },
        { top: 0, left: v.width - 44, width: 44, height: 44 },
        { top: v.height - 44, left: 0, width: 44, height: 44 },
        { top: v.height - 44, left: v.width - 44, width: 44, height: 44 },
        { top: v.height / 2 - 100, left: v.width / 2 - 100, width: 200, height: 200 },
      ]) {
        expect(inside(placeCard(spotlightBox(t, v), card, v), card, v)).toBe(true);
      }
    }
  });

  it('centres the card when there is no target or no room around it', () => {
    expect(placeCard(null, card, phone).side).toBe('center');
    expect(placeCard({ top: 0, left: 0, width: 390, height: 844 }, card, phone).side).toBe('center');
  });
});

describe('spotlightBox', () => {
  it('adds padding but never leaves the viewport', () => {
    const b = spotlightBox({ top: 0, left: 380, width: 44, height: 44 }, { width: 390, height: 844 });
    expect(b.top).toBeGreaterThanOrEqual(0);
    expect(b.left + b.width).toBeLessThanOrEqual(390);
  });
});
