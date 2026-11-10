'use client';

import { useMemo } from 'react';
import { useGalaxies } from './galaxies';
import { useAllItems } from './items';
import { useAllSpheres } from './spheres';
import type { Item, Profile, Sphere } from './types';

export interface NewsEntry {
  item: Item;
  sphere: Sphere | undefined;
  topSphere: Sphere | undefined;
  galaxyName: string;
  who: Profile | undefined;
  edited: boolean;
}

/** Everything changed by others since my last visit, across my galaxies (RF8.2). Already RLS-filtered. */
export function useNews(galaxyId?: string) {
  const { data: items = [] } = useAllItems();
  const { data: spheres = [] } = useAllSpheres();
  const { data: galaxies = [] } = useGalaxies();

  return useMemo(() => {
    const sphereById = new Map(spheres.map((s) => [s.id, s]));
    const profiles = new Map<string, Profile>();
    for (const g of galaxies) for (const m of g.members) profiles.set(m.user_id, m.profile);
    const galaxyName = new Map(galaxies.map((g) => [g.id, g.name]));

    const entries: NewsEntry[] = items
      .filter((i) => i.since_last_visit && (!galaxyId || i.galaxy_id === galaxyId))
      .map((item) => {
        const sphere = sphereById.get(item.sphere_id);
        return {
          item,
          sphere,
          topSphere: sphere?.parent_id ? sphereById.get(sphere.parent_id) : sphere,
          galaxyName: galaxyName.get(item.galaxy_id) ?? '',
          who: item.updated_by ? profiles.get(item.updated_by) : undefined,
          edited: item.updated_at !== item.created_at,
        };
      });

    const people = [...new Set(entries.map((e) => e.who?.display_name).filter(Boolean))] as string[];
    const galaxyCount = new Set(entries.map((e) => e.item.galaxy_id)).size;
    return { entries, people, galaxyCount };
  }, [items, spheres, galaxies, galaxyId]);
}
