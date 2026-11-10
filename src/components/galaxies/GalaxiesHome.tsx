'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { Button } from '@/components/ui/Button';
import { copy } from '@/lib/copy';
import { useGalaxies } from '@/lib/queries/galaxies';
import { NewGalaxyDialog } from './NewGalaxyDialog';

/** Phase 2 version of the home: a plain list of galaxies. Phase 5 turns it into the universe. */
export function GalaxiesHome() {
  const { data: galaxies, isLoading } = useGalaxies();
  const [creating, setCreating] = useState(false);

  return (
    <main className="universe-bg flex-1 px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[28px] leading-tight">{copy.galaxies.title}</h1>
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} aria-hidden />
            {copy.nav.newGalaxy}
          </Button>
        </div>

        {isLoading ? (
          <p className="mt-8 text-[13px] text-text-muted">{copy.common.loading}</p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galaxies?.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/g/${g.id}`}
                  className="block rounded-login border border-border bg-card/80 p-5 shadow-card backdrop-blur transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <h2 className="text-[20px] leading-tight">{g.name}</h2>
                  <div className="mt-4 flex items-center justify-between">
                    <AvatarStack members={g.members} />
                    <span className="text-[11.5px] text-text-muted">
                      {g.is_personal ? copy.galaxies.personalHint : copy.galaxies.membersCount(g.members.length)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <NewGalaxyDialog open={creating} onOpenChange={setCreating} />
    </main>
  );
}
