'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { NewBadge } from '@/components/items/NewBadge';
import { Legend } from '@/components/universe/Legend';
import { MiniGalaxy } from '@/components/universe/MiniGalaxy';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { EmptyState } from '@/components/ui/EmptyState';
import { copy } from '@/lib/copy';
import { useGalaxies } from '@/lib/queries/galaxies';
import { useAllSpheres, useSphereStats } from '@/lib/queries/spheres';
import type { Sphere } from '@/lib/queries/types';
import { NewGalaxyDialog } from './NewGalaxyDialog';

/** Universe of galaxies (RF1.5, frame 3:2): one tile per galaxy with its spheres in miniature. */
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
    <main className="universe-bg flex-1 px-3 pb-28 pt-5 sm:px-8 sm:pt-8">
      <div className="mx-auto max-w-6xl">
        {banner}
        <h1 className="text-[28px] leading-tight sm:text-[32px]">{copy.galaxies.title}</h1>

        {isLoading ? (
          <p className="mt-8 text-[13px] text-text-muted">{copy.common.loading}</p>
        ) : !galaxies?.length ? (
          <EmptyState emoji="🌌" title={copy.galaxies.emptyTitle} body={copy.galaxies.emptyBody} />
        ) : (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galaxies.map((g) => {
              const { items, fresh } = totals(g.id);
              const gs = byGalaxy.get(g.id) ?? [];
              return (
                <li key={g.id}>
                  <Link
                    href={`/g/${g.id}`}
                    className="group block h-full overflow-hidden rounded-login border border-border bg-card/75 shadow-card backdrop-blur transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <div className="flex items-start gap-2 px-5 pt-4">
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-[21px] leading-tight">{g.name}</h2>
                        <p className="mt-0.5 text-[11.5px] text-text-muted">
                          {g.is_personal ? copy.galaxies.personalHint : copy.galaxies.membersCount(g.members.length)} ·{' '}
                          {copy.galaxies.spheresCount(gs.filter((s) => !s.parent_id).length)} · {copy.galaxies.itemsCount(items)}
                        </p>
                      </div>
                      {fresh ? <NewBadge count={fresh} /> : null}
                    </div>
                    <div className="py-2 transition-transform duration-300 group-hover:scale-[1.03]">
                      <MiniGalaxy spheres={gs} stats={stats} />
                    </div>
                    <div className="flex items-center justify-between border-t border-border px-5 py-3">
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
                className="flex h-full min-h-60 w-full flex-col items-center justify-center gap-2 rounded-login border border-dashed border-border text-[13px] font-medium text-text-muted hover:text-text"
              >
                <Plus size={22} aria-hidden />
                {copy.nav.newGalaxy}
              </button>
            </li>
          </ul>
        )}
        <div className="mt-6 flex justify-center max-sm:hidden">
          <Legend />
        </div>
      </div>
      <NewGalaxyDialog open={creating} onOpenChange={setCreating} />
    </main>
  );
}
