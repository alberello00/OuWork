'use client';

import { ChevronsUpDown, LayoutGrid, Plus } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { NewGalaxyDialog } from '@/components/galaxies/NewGalaxyDialog';
import { AvatarStack } from '@/components/ui/AvatarStack';
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
} from '@/components/ui/Dropdown';
import { copy } from '@/lib/copy';
import { useGalaxies } from '@/lib/queries/galaxies';
import { cn } from '@/lib/utils';

/** Workspace switcher. */
export function GalaxySwitcher({ className }: { className?: string }) {
  const params = useParams<{ galaxyId?: string }>();
  const { data: galaxies } = useGalaxies();
  const [creating, setCreating] = useState(false);
  const current = galaxies?.find((g) => g.id === params.galaxyId);

  return (
    <>
      <Dropdown>
        <DropdownTrigger data-tour="galaxy-switcher" className={cn('inline-flex h-9 min-w-0 max-w-[52vw] items-center gap-2 rounded-pill border border-border bg-card px-3 text-[13px] font-medium hover:bg-surface-2 sm:max-w-xs', className)}>
          <span className="truncate">{current?.name ?? copy.nav.allGalaxies}</span>
          <ChevronsUpDown size={14} aria-hidden className="shrink-0 text-text-muted" />
        </DropdownTrigger>
        <DropdownContent align="start" className="w-72">
          <DropdownItem asChild>
            <Link href="/">
              <LayoutGrid size={15} aria-hidden className="text-text-muted" />
              {copy.nav.allGalaxies}
            </Link>
          </DropdownItem>
          <DropdownSeparator />
          {galaxies?.map((g) => (
            <DropdownItem key={g.id} asChild>
              <Link href={`/w/${g.id}`} aria-current={g.id === current?.id ? 'page' : undefined}>
                <span className="min-w-0 flex-1 truncate font-medium">{g.name}</span>
                <AvatarStack members={g.members} size={20} />
              </Link>
            </DropdownItem>
          ))}
          <DropdownSeparator />
          <DropdownItem onSelect={() => setCreating(true)}>
            <Plus size={15} aria-hidden className="text-text-muted" />
            {copy.nav.newGalaxy}
          </DropdownItem>
        </DropdownContent>
      </Dropdown>
      <NewGalaxyDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}
