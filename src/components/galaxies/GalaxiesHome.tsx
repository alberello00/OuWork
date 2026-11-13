'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { NewBadge } from '@/components/items/NewBadge';
import { SphereDot } from '@/components/spheres/SphereDot';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { EmptyState } from '@/components/ui/EmptyState';
import { copy } from '@/lib/copy';
import { useGalaxies } from '@/lib/queries/galaxies';
import { useAllSpheres, useSphereStats } from '@/lib/queries/spheres';
import type { Sphere } from '@/lib/queries/types';
import { NewGalaxyDialog } from './NewGalaxyDialog';

/** Home: one tile per workspace with its boards, members and what is new. */
export function GalaxiesHome({ banner }: { banner?: React.ReactNode }) {
  const { data: galaxies, isLoading } = useGalaxies();
  const { data: spheres = [] } = useAllSpheres();
  const { data: stats } = useSphereStats();
  const [creating, setCreating] = useState(false);

  const byGalaxy = useMemo(() => {
    const m = new Map<string, Sphere[]>();
    for (const s of spheres) m.set(s.galaxy_id, [...(m.get(s.galaxy_id) ?? []), s]);
    return m;
  }, [spheres]);

  const totals = (galaxyId: string) => {
    let items = 0;
    let fresh = 0;
    for (const st of stats?.values() ?? []) {
      if (st.galaxy_id !== galaxyId) continue;
      items += st.item_count;
      fresh += st.new_count;
    }
    return { items, fresh };
  };

  return (
    <main className="flex-1 px-4 pb-28 pt-5 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {banner}
        <h1 className="text-[20px] leading-tight">{copy.galaxies.title}</h1>

        {isLoading ? (
          <p className="mt-8 text-[13px] text-text-muted">{copy.common.loading}</p>
        ) : !galaxies?.length ? (
          <EmptyState emoji="🌌" title={copy.galaxies.emptyTitle} body={copy.galaxies.emptyBody} />
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {galaxies.map((g) => {
              const { items, fresh } = totals(g.id);
              const gs = byGalaxy.get(g.id) ?? [];
              return (
                <li key={g.id}>
                  <Link
                    href={`/w/${g.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-card border border-border bg-card transition-colors duration-150 hover:border-n-6"
                  >
                    <div className="flex items-start gap-2 px-4 pt-4">
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-[15px] leading-tight">{g.name}</h2>
                        <p className="mt-1 text-[12px] text-text-muted">
                          {g.is_personal ? copy.galaxies.personalHint : copy.galaxies.membersCount(g.members.length)} ·{' '}
                          {copy.galaxies.spheresCount(gs.filter((s) => !s.parent_id).length)} · {copy.galaxies.itemsCount(items)}
                        </p>
                      </div>
                      {fresh ? <NewBadge count={fresh} /> : null}
                    </div>
                    <ul className="flex flex-wrap gap-1.5 px-4 py-4">
                      {gs.filter((s) => !s.parent_id).slice(0, 8).map((s) => (
                        <li key={s.id} className="inline-flex h-7 items-center gap-1.5 rounded-pill border border-border bg-bg pl-1 pr-2 text-[12px]">
                          <SphereDot color={s.color} emoji={s.emoji} size={20} />
                          <span className="max-w-28 truncate">{s.name}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto flex items-center justify-between border-t border-border px-4 py-2.5">
                      <AvatarStack members={g.members} />
                      <span className="text-[12px] font-medium text-text-muted group-hover:text-text">{copy.galaxies.enter} →</span>
                    </div>
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex h-full min-h-40 w-full flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border text-[13px] font-medium text-text-muted hover:text-text"
              >
                <Plus size={22} aria-hidden />
                {copy.nav.newGalaxy}
              </button>
            </li>
          </ul>
        )}
      </div>
      <NewGalaxyDialog open={creating} onOpenChange={setCreating} />
    </main>
  );
}
