'use client';

import { LayoutGrid, Plus, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { NewBadge } from '@/components/items/NewBadge';
import { PrivateBadge } from '@/components/items/PrivateBadge';
import { SphereDot } from '@/components/spheres/SphereDot';
import { SphereFormDialog } from '@/components/spheres/SphereFormDialog';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { copy } from '@/lib/copy';
import { isSpherePrivate, useGalaxyData } from '@/lib/queries/useGalaxyData';
import { GalaxySettingsDialog } from './GalaxySettingsDialog';

/** Galaxy page before the universe view (phase 5): spheres as tiles. */
export function GalaxyHome({ galaxyId }: { galaxyId: string }) {
  const data = useGalaxyData(galaxyId);
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  if (data.isLoading) return <main className="universe-bg flex-1 p-8 text-[13px] text-text-muted">{copy.common.loading}</main>;
  if (!data.galaxy) {
    return (
      <EmptyState emoji="🌌" title={copy.galaxies.emptyTitle} className="universe-bg flex-1">
        <Link href="/" className="text-[13px] underline underline-offset-2">{copy.nav.allGalaxies}</Link>
      </EmptyState>
    );
  }
  const galaxy = data.galaxy;

  return (
    <main className="universe-bg flex-1 px-4 pb-28 pt-6 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="min-w-0 flex-1 truncate text-[28px] leading-tight">{galaxy.name}</h1>
          <AvatarStack members={galaxy.members} size={26} />
          <Link href={`/g/${galaxyId}/notes`} className="inline-flex h-11 items-center gap-2 rounded-pill border border-border bg-card px-4 text-[13px] font-medium hover:bg-surface-2">
            <LayoutGrid size={15} aria-hidden />{copy.nav.notes}
          </Link>
          <Button size="icon" aria-label={copy.nav.settings} onClick={() => setSettingsOpen(true)}><Settings size={17} aria-hidden /></Button>
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.topLevel.map((s) => {
            const stat = data.stats?.get(s.id);
            const subs = data.childrenOf(s.id);
            const count = (stat?.item_count ?? 0) + subs.reduce((n, c) => n + (data.stats?.get(c.id)?.item_count ?? 0), 0);
            const fresh = (stat?.new_count ?? 0) + subs.reduce((n, c) => n + (data.stats?.get(c.id)?.new_count ?? 0), 0);
            return (
              <li key={s.id}>
                <Link href={`/g/${galaxyId}/s/${s.id}`} className="flex h-full flex-col items-center gap-2 rounded-login border border-border bg-card/80 p-4 text-center shadow-card backdrop-blur transition-transform duration-200 hover:-translate-y-0.5">
                  <SphereDot color={s.color} emoji={s.emoji} size={56} />
                  <span className="font-heading text-[17px] leading-tight">{s.name}</span>
                  <span className="flex flex-wrap items-center justify-center gap-1.5 text-[11.5px] text-text-muted">
                    {copy.spheres.items(count)}
                    {isSpherePrivate(s, data.sphereById) ? <PrivateBadge /> : null}
                    {fresh ? <NewBadge count={fresh} /> : null}
                  </span>
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setCreating(true)} className="flex h-full min-h-36 w-full flex-col items-center justify-center gap-2 rounded-login border border-dashed border-border p-4 text-[13px] font-medium text-text-muted hover:text-text">
              <Plus size={22} aria-hidden />{copy.spheres.newSphere}
            </button>
          </li>
        </ul>
      </div>
      <GalaxySettingsDialog galaxy={galaxy} open={settingsOpen} onOpenChange={setSettingsOpen} />
      <SphereFormDialog galaxyId={galaxyId} spheres={data.spheres} open={creating} onOpenChange={setCreating} onCreated={(s) => router.push(`/g/${galaxyId}/s/${s.id}`)} />
    </main>
  );
}
