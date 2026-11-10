'use client';

import { useMemo } from 'react';
import { useGalaxy } from './galaxies';
import { useItems } from './items';
import { useSphereStats, useSpheres } from './spheres';
import type { Item, Profile, Sphere } from './types';

/** Everything a galaxy view needs, plus lookup maps. All of it already filtered by RLS. */
export function useGalaxyData(galaxyId: string) {
  const galaxy = useGalaxy(galaxyId);
  const spheres = useSpheres(galaxyId);
  const items = useItems(galaxyId);
  const stats = useSphereStats(galaxyId);

  const maps = useMemo(() => {
    const sphereById = new Map<string, Sphere>((spheres.data ?? []).map((s) => [s.id, s]));
    const profileById = new Map<string, Profile>((galaxy.data?.members ?? []).map((m) => [m.user_id, m.profile]));
    const itemsBySphere = new Map<string, Item[]>();
    for (const item of items.data ?? []) {
      const list = itemsBySphere.get(item.sphere_id) ?? [];
      list.push(item);
      itemsBySphere.set(item.sphere_id, list);
    }
    const topLevel = (spheres.data ?? []).filter((s) => !s.parent_id);
    const childrenOf = (id: string) => (spheres.data ?? []).filter((s) => s.parent_id === id);
    const inbox = (spheres.data ?? []).find((s) => s.is_inbox);
    return { sphereById, profileById, itemsBySphere, topLevel, childrenOf, inbox };
  }, [spheres.data, galaxy.data, items.data]);

  return {
    galaxy: galaxy.data,
    spheres: spheres.data ?? [],
    items: items.data ?? [],
    stats: stats.data,
    isLoading: galaxy.isLoading || spheres.isLoading || items.isLoading,
    ...maps,
  };
}

/** Effective privacy: a sphere inside a private parent is private too (RF4.2). */
export function isSpherePrivate(sphere: Sphere | undefined, sphereById: Map<string, Sphere>): boolean {
  if (!sphere) return false;
  if (sphere.is_private) return true;
  const parent = sphere.parent_id ? sphereById.get(sphere.parent_id) : undefined;
  return !!parent?.is_private;
}
