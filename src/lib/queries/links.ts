'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db, unwrap } from './client';
import { keys } from './keys';

/** Links of a galaxy whose both ends I can see (RLS). */
export function useLinks(galaxyId: string | null | undefined, itemIds?: Set<string>) {
  return useQuery({
    queryKey: keys.links(galaxyId ?? ''),
    enabled: !!galaxyId,
    queryFn: async () => unwrap(await db().from('item_links').select('*')),
    select: (rows) => (itemIds ? rows.filter((l) => itemIds.has(l.source_id) && itemIds.has(l.target_id)) : rows),
  });
}

export function useCreateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ source_id, target_id }: { source_id: string; target_id: string }) =>
      unwrap(await db().from('item_links').insert({ source_id, target_id }).select('*').single()),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['links'] }),
  });
}

export function useDeleteLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => unwrap(await db().from('item_links').delete().eq('id', id).select('id').single()),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['links'] }),
  });
}
