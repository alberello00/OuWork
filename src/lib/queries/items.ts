'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db, unwrap } from './client';
import { keys } from './keys';
import type { Database } from '@/lib/supabase/database.types';
import type { Item, ItemType, LinkPreview } from './types';

// galaxy_id is derived from the sphere by a trigger and is not writable by clients.
type ItemInsert = Database['public']['Tables']['items']['Insert'];

type Row = Record<string, unknown>;
const toItem = (r: Row) =>
  ({ ...r, is_new: !!r.is_new, since_last_visit: !!r.since_last_visit }) as unknown as Item;

/** All items I can see in a galaxy, newest first (small groups: one query is fine). */
export function useItems(galaxyId: string | null | undefined) {
  return useQuery({
    queryKey: keys.items(galaxyId ?? ''),
    enabled: !!galaxyId,
    queryFn: async () => {
      const rows = unwrap(
        await db().from('items_feed').select('*').eq('galaxy_id', galaxyId!).order('updated_at', { ascending: false })
      );
      return rows.map((r) => toItem(r as Row));
    },
  });
}

/** Every visible item in every galaxy (news banner, galaxy badges). */
export function useAllItems() {
  return useQuery({
    queryKey: keys.allItems,
    queryFn: async () => {
      const rows = unwrap(await db().from('items_feed').select('*').order('updated_at', { ascending: false }));
      return rows.map((r) => toItem(r as Row));
    },
  });
}

export interface NewItemInput {
  id?: string;
  sphere_id: string;
  type: ItemType;
  title?: string | null;
  body_md?: string | null;
  url?: string | null;
  preview?: LinkPreview | null;
  image_path?: string | null;
  caption?: string | null;
  is_private?: boolean;
  x?: number;
  y?: number;
}

function invalidateItems(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['items'] });
  void qc.invalidateQueries({ queryKey: ['stats'] });
  void qc.invalidateQueries({ queryKey: ['links'] });
  void qc.invalidateQueries({ queryKey: ['search'] });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewItemInput) =>
      unwrap(
        await db()
          .from('items')
          .insert({ ...input, preview: input.preview ?? null } as unknown as ItemInsert)
          .select('id, galaxy_id, sphere_id')
          .single()
      ),
    onSuccess: () => invalidateItems(qc),
  });
}

export type ItemPatch = Partial<
  Pick<NewItemInput, 'sphere_id' | 'title' | 'body_md' | 'url' | 'preview' | 'caption' | 'is_private' | 'x' | 'y'>
>;

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: ItemPatch & { id: string }) =>
      unwrap(
        await db()
          .from('items')
          .update({ ...patch, preview: patch.preview as never })
          .eq('id', id)
          .select('id')
          .single()
      ),
    onSuccess: () => invalidateItems(qc),
  });
}

/** Card drag on the canvas: optimistic, no refetch storm. */
export function useMoveItemOnCanvas(galaxyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, x, y }: { id: string; x: number; y: number }) =>
      unwrap(await db().from('items').update({ x, y }).eq('id', id).select('id').single()),
    onMutate: async ({ id, x, y }) => {
      await qc.cancelQueries({ queryKey: keys.items(galaxyId) });
      qc.setQueryData<Item[]>(keys.items(galaxyId), (old) => old?.map((i) => (i.id === id ? { ...i, x, y } : i)));
    },
    onError: () => void qc.invalidateQueries({ queryKey: keys.items(galaxyId) }),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Pick<Item, 'id' | 'image_path'>) => {
      unwrap(await db().from('items').delete().eq('id', item.id).select('id').single());
      // best effort: the object is private anyway
      if (item.image_path) await db().storage.from('items').remove([item.image_path]);
    },
    onSuccess: () => invalidateItems(qc),
  });
}

export function useMarkSeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => unwrap(await db().rpc('mark_seen', { _item_ids: ids })),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['items'] });
      void qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

/** Full-text search over what I can see (RF9.1). */
export function useSearch(q: string, galaxyId: string | null) {
  const term = q.trim();
  return useQuery({
    queryKey: keys.search(term, galaxyId),
    enabled: term.length > 0,
    staleTime: 10_000,
    refetchInterval: false,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const rows = unwrap(
        await db().rpc('search_items', { _q: term, _galaxy_id: galaxyId ?? undefined, _limit: 60 })
      );
      return (rows as Row[]).map(toItem);
    },
  });
}
