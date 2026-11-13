import { describe, expect, it } from 'vitest';
import { canEditRole, roleOf } from './permissions';
import type { GalaxyWithMembers } from './queries/types';

const galaxy = {
  id: 'g',
  members: [
    { user_id: 'o', role: 'owner' },
    { user_id: 'e', role: 'editor' },
    { user_id: 'v', role: 'viewer' },
  ],
} as unknown as GalaxyWithMembers;

describe('roles', () => {
  it('finds the role of a member, null for anyone else', () => {
    expect(roleOf(galaxy, 'v')).toBe('viewer');
    expect(roleOf(galaxy, 'x')).toBeNull();
    expect(roleOf(undefined, 'o')).toBeNull();
  });
  it('lets owners and editors write, never viewers or strangers', () => {
    expect(canEditRole('owner')).toBe(true);
    expect(canEditRole('editor')).toBe(true);
    expect(canEditRole('viewer')).toBe(false);
    expect(canEditRole(null)).toBe(false);
  });
});
