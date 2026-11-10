'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db, unwrap } from './client';
import { keys } from './keys';

/** Invite links of a galaxy. Only its owner gets rows back (RLS). */
export function useInvites(galaxyId: string, enabled: boolean) {
  return useQuery({
    queryKey: keys.invites(galaxyId),
    enabled,
    queryFn: async () =>
      unwrap(
        await db()
          .from('invites')
          .select('id, token, expires_at, used_at, created_at')
          .eq('galaxy_id', galaxyId)
          .order('created_at', { ascending: false })
      ),
  });
}

export function useCreateInvite(galaxyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      unwrap(await db().from('invites').insert({ galaxy_id: galaxyId }).select('id, token').single()),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.invites(galaxyId) }),
  });
}

export function useRevokeInvite(galaxyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => unwrap(await db().from('invites').delete().eq('id', id).select('id').single()),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.invites(galaxyId) }),
  });
}
