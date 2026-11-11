'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db, unwrap } from './client';
import { keys } from './keys';
import type { Json } from '@/lib/supabase/database.types';
import type { GalaxyWithMembers, Member } from './types';

const GALAXY_SELECT =
  'id, name, owner_id, is_personal, created_at, setup_completed_at, setup_answers, ' +
  'galaxy_members(user_id, role, joined_at, last_seen_at, profiles(id, username, display_name, color))';

interface RawGalaxy {
  id: string;
  name: string;
  owner_id: string;
  is_personal: boolean;
  created_at: string;
  setup_completed_at: string | null;
  setup_answers: GalaxyWithMembers['setup_answers'];
  galaxy_members: {
    user_id: string;
    role: string;
    joined_at: string;
    last_seen_at: string | null;
    profiles: Member['profile'] | null;
  }[];
}

function toGalaxy(raw: RawGalaxy): GalaxyWithMembers {
  const members: Member[] = raw.galaxy_members
    .filter((m) => m.profiles)
    .map((m): Member => ({
      user_id: m.user_id,
      role: m.role === 'owner' ? 'owner' : 'member',
      joined_at: m.joined_at,
      last_seen_at: m.last_seen_at,
      profile: m.profiles!,
    }))
    .sort((a, b) => (a.role === b.role ? a.joined_at.localeCompare(b.joined_at) : a.role === 'owner' ? -1 : 1));
  return {
    id: raw.id,
    name: raw.name,
    owner_id: raw.owner_id,
    is_personal: raw.is_personal,
    created_at: raw.created_at,
    setup_completed_at: raw.setup_completed_at,
    setup_answers: raw.setup_answers,
    members,
  };
}

/** Every galaxy I am a member of, shared ones first, "Just me" last. */
export function useGalaxies() {
  return useQuery({
    queryKey: keys.galaxies,
    queryFn: async () => {
      const rows = unwrap(await db().from('galaxies').select(GALAXY_SELECT).order('created_at')) as unknown as RawGalaxy[];
      return rows
        .map(toGalaxy)
        .sort((a, b) => Number(a.is_personal) - Number(b.is_personal) || a.created_at.localeCompare(b.created_at));
    },
  });
}

export function useGalaxy(galaxyId: string | null | undefined) {
  const query = useGalaxies();
  return { ...query, data: query.data?.find((g) => g.id === galaxyId) };
}

export function useCreateGalaxy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) =>
      unwrap(await db().from('galaxies').insert({ name: name.trim() }).select('id').single()),
    onSuccess: () => qc.invalidateQueries(),
  });
}

export interface SetupSphereInput {
  name: string;
  emoji: string;
  color: string;
  x: number;
  y: number;
}

/**
 * RF14.5: the setup survey creates its spheres and marks the galaxy as set up
 * in one transaction. Owner only, once. Returns the new spheres.
 */
export function useCompleteGalaxySetup(galaxyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ answers, spheres }: { answers: Record<string, Json>; spheres: SetupSphereInput[] }) =>
      unwrap(
        await db().rpc('complete_galaxy_setup', {
          _galaxy_id: galaxyId,
          _answers: answers,
          _spheres: spheres as unknown as Json,
        })
      ),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: keys.galaxies });
      void qc.invalidateQueries({ queryKey: ['spheres'] });
      void qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useRenameGalaxy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) =>
      unwrap(await db().from('galaxies').update({ name: name.trim() }).eq('id', id).select('id').single()),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.galaxies }),
  });
}

export function useDeleteGalaxy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap(await db().from('galaxies').delete().eq('id', id).select('id').single()),
    onSuccess: () => qc.invalidateQueries(),
  });
}

/** The owner removes someone, or a member leaves (same row delete, RLS decides). */
export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ galaxyId, userId }: { galaxyId: string; userId: string }) =>
      unwrap(
        await db()
          .from('galaxy_members')
          .delete()
          .eq('galaxy_id', galaxyId)
          .eq('user_id', userId)
          .select('user_id')
          .single()
      ),
    onSuccess: () => qc.invalidateQueries(),
  });
}
