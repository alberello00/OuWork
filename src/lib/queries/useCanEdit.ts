'use client';

import { useSession } from '@/components/shell/SessionProvider';
import { canEditRole, roleOf } from '@/lib/permissions';
import { useGalaxy } from './galaxies';

/** My role in a workspace, and whether the UI should offer writing actions. */
export function useRole(galaxyId: string | null | undefined) {
  const { userId } = useSession();
  const { data: galaxy } = useGalaxy(galaxyId);
  const role = roleOf(galaxy, userId);
  return { role, canEdit: canEditRole(role) };
}
