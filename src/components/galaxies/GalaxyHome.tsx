'use client';

import { Settings } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { Button } from '@/components/ui/Button';
import { copy } from '@/lib/copy';
import { useGalaxy } from '@/lib/queries/galaxies';
import { GalaxySettingsDialog } from './GalaxySettingsDialog';

/** Phase 2 version of a galaxy page: header + settings. Phase 5 turns it into the universe. */
export function GalaxyHome({ galaxyId }: { galaxyId: string }) {
  const { data: galaxy, isLoading } = useGalaxy(galaxyId);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (isLoading) {
    return <main className="universe-bg flex-1 p-8 text-[13px] text-text-muted">{copy.common.loading}</main>;
  }
  if (!galaxy) {
    return (
      <main className="universe-bg flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-4xl" aria-hidden>
          🌌
        </p>
        <h1 className="text-[24px]">{copy.galaxies.emptyTitle}</h1>
        <Link href="/" className="text-[13px] underline underline-offset-2">
          {copy.nav.allGalaxies}
        </Link>
      </main>
    );
  }

  return (
    <main className="universe-bg flex-1 px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <h1 className="min-w-0 flex-1 truncate text-[28px] leading-tight">{galaxy.name}</h1>
        <AvatarStack members={galaxy.members} size={26} />
        <Button size="icon" aria-label={copy.nav.settings} onClick={() => setSettingsOpen(true)}>
          <Settings size={17} aria-hidden />
        </Button>
      </div>
      <GalaxySettingsDialog galaxy={galaxy} open={settingsOpen} onOpenChange={setSettingsOpen} />
    </main>
  );
}
