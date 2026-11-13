// Client-side view of the roles (RW3.1). It only decides what to SHOW: the
// database policies are what actually allow or refuse a write.

import type { GalaxyWithMembers, Role } from './queries/types';

export function roleOf(galaxy: GalaxyWithMembers | undefined, userId: string): Role | null {
  return galaxy?.members.find((m) => m.user_id === userId)?.role ?? null;
}

/** Owners and editors write; viewers only read. */
export function canEditRole(role: Role | null): boolean {
  return role === 'owner' || role === 'editor';
}
