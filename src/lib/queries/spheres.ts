'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db, unwrap } from './client';
import { keys } from './keys';
import type { Sphere, SphereStat } from './types';

const sortSpheres = (a: Sphere, b: Sphere) =>
  Number(a.is_inbox) - Number(b.is_inbox) || a.created_at.localeCompare(b.created_at);

/** Spheres of a galaxy that I can see (RLS hides other people's private spheres). */
export function useSpheres(galaxyId: string | null | undefined) {
  return useQuery({
    queryKey: keys.spheres(galaxyId ?? ''),
    enabled: !!galaxyId,
    queryFn: async () => {
      const rows = unwrap(await db().from('spheres').select('*').eq('galaxy_id', galaxyId!));
      return rows.sort(sortSpheres);
    },
  });
}

/** All spheres of all my galaxies (universe of galaxies, quick add from home). */
export function useAllSpheres() {
  return useQuery({
    queryKey: keys.allSpheres,
    queryFn: async () => unwrap(await db().from('spheres').select('*')).sort(sortSpheres),
  });
}

/** Visible item count and NEW count per sphere. */
export function useSphereStats(galaxyId?: string | null) {
  return useQuery({
    queryKey: galaxyId ? keys.stats(galaxyId) : keys.allStats,
    queryFn: async () => {
      let q = db().from('sphere_stats').select('*');
      if (galaxyId) q = q.eq('galaxy_id', galaxyId);
      const rows = unwrap(await q);
      const map = new Map<string, SphereStat>();
      for (const r of rows) {
        if (r.sphere_id && r.galaxy_id) {
          map.set(r.sphere_id, {
            sphere_id: r.sphere_id,
            galaxy_id: r.galaxy_id,
            item_count: r.item_count ?? 0,
            new_count: r.new_count ?? 0,
          });
        }
      }
      return map;
    },
  });
}

export interface SphereInput {
  name: string;
  color: string;
  emoji: string;
  is_private: boolean;
  parent_id: string | null;
}

function invalidateContent(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['spheres'] });
  void qc.invalidateQueries({ queryKey: ['stats'] });
  void qc.invalidateQueries({ queryKey: ['items'] });
  void qc.invalidateQueries({ queryKey: ['links'] });
  void qc.invalidateQueries({ queryKey: ['search'] });
}

export function useCreateSphere(galaxyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SphereInput & { x?: number; y?: number }) =>
      unwrap(
        await db()
          .from('spheres')
          .insert({ galaxy_id: galaxyId, ...input, name: input.name.trim() })
          .select('*')
          .single()
      ),
    onSuccess: () => invalidateContent(qc),
  });
}

export function useUpdateSphere() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<SphereInput & { x: number; y: number }> & { id: string }) =>
      unwrap(await db().from('spheres').update(patch).eq('id', id).select('*').single()),
    onSuccess: () => invalidateContent(qc),
  });
}

/** RF2.5: delete a sphere, moving its items to `moveTo` or deleting them. */
export function useDeleteSphere() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, moveTo }: { id: string; moveTo: string | null }) =>
      unwrap(await db().rpc('delete_sphere', { _sphere_id: id, _move_to: moveTo ?? undefined })),
    onSuccess: () => invalidateContent(qc),
  });
}

export function useMarkSphereSeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sphereId: string) => unwrap(await db().rpc('mark_sphere_seen', { _sphere_id: sphereId })),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['items'] });
      void qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

/** Planet drag / Reorganize: optimistic, positions are sphere centres. */
export function useMoveSpheres(galaxyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (moves: { id: string; x: number; y: number }[]) => {
      for (const m of moves) unwrap(await db().from('spheres').update({ x: m.x, y: m.y }).eq('id', m.id).select('id').single());
    },
    onMutate: (moves) => {
      const byId = new Map(moves.map((m) => [m.id, m]));
      qc.setQueryData<Sphere[]>(keys.spheres(galaxyId), (old) =>
        old?.map((s) => (byId.has(s.id) ? { ...s, x: byId.get(s.id)!.x, y: byId.get(s.id)!.y } : s))
      );
    },
    onError: () => void qc.invalidateQueries({ queryKey: keys.spheres(galaxyId) }),
  });
}
