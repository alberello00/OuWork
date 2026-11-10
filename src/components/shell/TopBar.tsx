'use client';

import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { useMounted } from '@/lib/useMounted';
import { GalaxySwitcher } from './GalaxySwitcher';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

export function TopBar({ children }: { children?: React.ReactNode }) {
  // Radix menus generate ids that differ between server and client here: mount them on the client only
  const mounted = useMounted();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-surface-2/90 px-2 backdrop-blur sm:gap-3 sm:px-4">
      <Link href="/" className="inline-flex h-11 items-center rounded-pill px-1.5" aria-label="Home">
        <Logo className="max-sm:hidden" />
        <Logo className="sm:hidden" showName={false} />
      </Link>
      {mounted ? <GalaxySwitcher /> : <span aria-hidden className="h-11 w-36 rounded-pill border border-border bg-card" />}
      <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
        {children}
        <ThemeToggle className="max-sm:hidden" />
        {mounted ? <UserMenu /> : <span aria-hidden className="h-11 w-11" />}
      </div>
    </header>
  );
}
