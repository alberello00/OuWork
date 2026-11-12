import { describe, expect, it } from 'vitest';
import { assignColors, buildSpheres, guessTemplate, isValidSetupSphere, MAX_SETUP_SPHERES, TEMPLATE_IDS, TEMPLATES } from './galaxySetup';
import { copy } from './copy';
import { SPHERE_COLORS } from './tokens';

describe('guessTemplate', () => {
  it('starts blank on the personal workspace and from a template on a shared one', () => {
    expect(guessTemplate(true)).toBe('blank');
    expect(guessTemplate(false)).toBe('productLaunch');
  });
});

describe('TEMPLATES', () => {
  it('has copy for every template and every board', () => {
    for (const id of TEMPLATE_IDS) {
      expect(copy.setup.templates[id].label).toBeTruthy();
      for (const b of TEMPLATES[id]) expect(copy.setup.boards[b.key]).toBeTruthy();
    }
  });
  it('uses only palette colours and stays within the RPC limit', () => {
    for (const id of TEMPLATE_IDS) {
      expect(TEMPLATES[id].length).toBeLessThanOrEqual(MAX_SETUP_SPHERES);
      for (const b of TEMPLATES[id]) expect(SPHERE_COLORS).toContain(b.color);
    }
  });
  it('never reuses the Inbox name', () => {
    for (const id of TEMPLATE_IDS) {
      expect(buildSpheres(id).map((s) => s.name.toLowerCase())).not.toContain(copy.setup.inboxName.toLowerCase());
    }
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
  it('is deterministic', () => {
    expect(buildSpheres('productLaunch')).toEqual(buildSpheres('productLaunch'));
    expect(buildSpheres('productLaunch').map((s) => s.name)).toEqual(['Roadmap', 'Research', 'Design', 'Engineering', 'Marketing']);
  });
  it('gives distinct colours and valid boards for every template', () => {
    for (const id of TEMPLATE_IDS) {
      const out = buildSpheres(id);
      expect(new Set(out.map((s) => s.color)).size).toBe(out.length);
      expect(new Set(out.map((s) => s.key)).size).toBe(out.length);
      expect(out.every(isValidSetupSphere)).toBe(true);
    }
  });
  it('creates nothing for the blank template', () => {
    expect(buildSpheres('blank')).toEqual([]);
  });
});

describe('isValidSetupSphere', () => {
  it('needs a name of 1–40 characters and a short emoji', () => {
    expect(isValidSetupSphere({ name: 'Roadmap', emoji: '🗺️' })).toBe(true);
    expect(isValidSetupSphere({ name: '  ', emoji: '📍' })).toBe(false);
    expect(isValidSetupSphere({ name: 'x'.repeat(41), emoji: '📍' })).toBe(false);
    expect(isValidSetupSphere({ name: 'Roadmap', emoji: '' })).toBe(false);
  });
});
