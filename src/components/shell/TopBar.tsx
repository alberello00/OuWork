'use client';

import { ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { copy } from '@/lib/copy';
import { useGalaxies } from '@/lib/queries/galaxies';
import { useSpheres } from '@/lib/queries/spheres';
import { useMounted } from '@/lib/useMounted';
import { GalaxySwitcher } from './GalaxySwitcher';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

/** Where am I: Workspaces / workspace / board. */
function Breadcrumb() {
  const params = useParams<{ galaxyId?: string; sphereId?: string }>();
  const pathname = usePathname();
  const { data: galaxies } = useGalaxies();
  const { data: spheres } = useSpheres(params.galaxyId);
  const galaxy = galaxies?.find((g) => g.id === params.galaxyId);
  const sphere = spheres?.find((s) => s.id === params.sphereId);
  const leaf = sphere ? `${sphere.emoji} ${sphere.name}` : pathname.endsWith('/notes') ? copy.nav.notes : null;
  const sep = <ChevronRight size={13} aria-hidden className="shrink-0 text-n-6" />;
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px] text-text-muted max-lg:hidden">
      <Link href="/" className="shrink-0 rounded-pill px-1 hover:text-text">{copy.galaxies.title}</Link>
      {galaxy ? (
        <>
          {sep}
          <Link href={`/w/${galaxy.id}`} aria-current={leaf ? undefined : 'page'} className={leaf ? 'truncate rounded-pill px-1 hover:text-text' : 'truncate px-1 font-medium text-text'}>
            {galaxy.name}
          </Link>
        </>
      ) : null}
      {galaxy && leaf ? (
        <>
          {sep}
          <span aria-current="page" className="truncate px-1 font-medium text-text">{leaf}</span>
        </>
      ) : null}
    </nav>
  );
}

/** Top bar (RW2.7): breadcrumb on desktop, logo and switcher on smaller screens, then search and "add". */
export function TopBar({ children, onAdd }: { children?: React.ReactNode; onAdd: () => void }) {
  // Radix menus generate ids that differ between server and client here: mount them on the client only
  const mounted = useMounted();
  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-border bg-card px-2 sm:px-4">
      <Link href="/" className="inline-flex h-9 items-center rounded-pill px-1 lg:hidden" aria-label="Home">
        <Logo showName={false} />
      </Link>
      <div className="min-w-0 lg:hidden">
        {mounted ? <GalaxySwitcher /> : <span aria-hidden className="block h-9 w-36 rounded-pill border border-border" />}
      </div>
      <Breadcrumb />
      <div className="ml-auto flex items-center gap-1.5">
        {children}
        <Button variant="primary" size="sm" data-tour="add" onClick={onAdd} className="max-sm:hidden">
          <Plus size={14} aria-hidden />
          {copy.nav.add}
        </Button>
        <span className="flex items-center lg:hidden">
          <ThemeToggle className="h-9 w-9 max-sm:hidden" />
          {mounted ? <UserMenu /> : <span aria-hidden className="h-9 w-9" />}
        </span>
      </div>
    </header>
  );
}
