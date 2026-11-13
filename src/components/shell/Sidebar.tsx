'use client';

import { LayoutGrid, Lock, Plus, StickyNote } from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Logo } from '@/components/brand/Logo';
import { SphereDot } from '@/components/spheres/SphereDot';
import { SphereFormDialog } from '@/components/spheres/SphereFormDialog';
import { copy } from '@/lib/copy';
import { useGalaxies } from '@/lib/queries/galaxies';
import { useRole } from '@/lib/queries/useCanEdit';
import { useSphereStats, useSpheres } from '@/lib/queries/spheres';
import { useMounted } from '@/lib/useMounted';
import { cn } from '@/lib/utils';
import { GalaxySwitcher } from './GalaxySwitcher';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

const row = 'flex h-8 items-center gap-2 rounded-pill px-2 text-[13px] text-text-muted hover:bg-surface-2 hover:text-text';
const rowOn = 'bg-surface-2 font-medium text-text';

/** Left sidebar on desktop (RW2.7): workspace switcher, navigation, boards of the current workspace. */
export function Sidebar({ className }: { className?: string }) {
  const params = useParams<{ galaxyId?: string; sphereId?: string }>();
  const pathname = usePathname();
  const search = useSearchParams();
  const mounted = useMounted();
  const galaxyId = params.galaxyId;
  const { data: galaxies } = useGalaxies();
  const { data: spheres = [] } = useSpheres(galaxyId);
  const { data: stats } = useSphereStats(galaxyId);
  const [creating, setCreating] = useState(false);
  const { canEdit } = useRole(galaxyId);
  const inWorkspace = !!galaxyId && !!galaxies?.some((g) => g.id === galaxyId);
  const top = spheres.filter((s) => !s.parent_id);
  const activeSub = search.get('sub');

  return (
    <aside className={cn('sticky top-0 flex h-dvh w-60 shrink-0 flex-col border-r border-border bg-card', className)}>
      <div className="flex h-12 items-center px-3">
        <Link href="/" aria-label="Home" className="inline-flex h-8 items-center rounded-pill px-1">
          <Logo />
        </Link>
      </div>
      <div className="px-2">
        {mounted ? <GalaxySwitcher className="w-full max-w-none justify-between" /> : <span aria-hidden className="block h-9 rounded-pill border border-border" />}
      </div>

      <nav aria-label="Main" className="mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pb-2">
        {inWorkspace ? (
          <>
            <Link href={`/w/${galaxyId}`} aria-current={pathname === `/w/${galaxyId}` ? 'page' : undefined} className={cn(row, pathname === `/w/${galaxyId}` && rowOn)}>
              <LayoutGrid size={15} aria-hidden />
              {copy.nav.universe}
            </Link>
            <Link href={`/w/${galaxyId}/notes`} aria-current={pathname.endsWith('/notes') ? 'page' : undefined} className={cn(row, pathname.endsWith('/notes') && rowOn)}>
              <StickyNote size={15} aria-hidden />
              {copy.nav.notes}
            </Link>

            <div className="mb-1 mt-4 flex items-center justify-between pl-2">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{copy.nav.boards}</h2>
              {canEdit ? (
                <button type="button" aria-label={copy.universe.newSphere} onClick={() => setCreating(true)} className="inline-flex h-7 w-7 items-center justify-center rounded-pill text-text-muted hover:bg-surface-2 hover:text-text">
                  <Plus size={15} aria-hidden />
                </button>
              ) : null}
            </div>
            <ul className="space-y-px">
              {top.map((s) => {
                const subs = spheres.filter((c) => c.parent_id === s.id);
                const count = [s, ...subs].reduce((n, x) => n + (stats?.get(x.id)?.item_count ?? 0), 0);
                const fresh = [s, ...subs].reduce((n, x) => n + (stats?.get(x.id)?.new_count ?? 0), 0);
                const here = params.sphereId === s.id;
                return (
                  <li key={s.id}>
                    <Link href={`/w/${galaxyId}/b/${s.id}`} aria-current={here && !activeSub ? 'page' : undefined} className={cn(row, here && !activeSub && rowOn, here && 'text-text')}>
                      <SphereDot color={s.color} emoji={s.emoji} size={20} />
                      <span className="min-w-0 flex-1 truncate">{s.name}</span>
                      {s.is_private ? <Lock size={11} aria-label={copy.common.onlyMe} /> : null}
                      {fresh ? <span aria-label={copy.galaxies.newCount(fresh)} className="h-1.5 w-1.5 rounded-full bg-accent" /> : null}
                      <span className="text-[11px] tabular-nums">{count}</span>
                    </Link>
                    {subs.length ? (
                      <ul className="ml-[18px] space-y-px border-l border-border pl-1.5">
                        {subs.map((c) => (
                          <li key={c.id}>
                            <Link href={`/w/${galaxyId}/b/${s.id}?sub=${c.id}`} aria-current={here && activeSub === c.id ? 'page' : undefined} className={cn(row, 'h-7 text-[12px]', here && activeSub === c.id && rowOn)}>
                              <span aria-hidden>{c.emoji}</span>
                              <span className="min-w-0 flex-1 truncate">{c.name}</span>
                              <span className="text-[11px] tabular-nums">{stats?.get(c.id)?.item_count ?? 0}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <>
            <h2 className="mb-1 pl-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">{copy.galaxies.title}</h2>
            <ul className="space-y-px">
              {galaxies?.map((g) => (
                <li key={g.id}>
                  <Link href={`/w/${g.id}`} className={row}>
                    <span className="min-w-0 flex-1 truncate">{g.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      <div className="flex items-center gap-1 border-t border-border p-2">
        {mounted ? <UserMenu showName /> : <span aria-hidden className="h-9 flex-1" />}
        <ThemeToggle className="h-9 w-9" />
      </div>
      {inWorkspace ? <SphereFormDialog galaxyId={galaxyId!} spheres={spheres} open={creating} onOpenChange={setCreating} /> : null}
    </aside>
  );
}
