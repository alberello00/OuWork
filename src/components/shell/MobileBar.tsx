'use client';

import { Search } from 'lucide-react';
import { AddFab } from '@/components/items/QuickAdd';
import { copy } from '@/lib/copy';
import { ThemeToggle } from './ThemeToggle';

/** Bottom bar on phones (RD8.3, frame 12:2): search, theme, "+". */
export function MobileBar({ onSearch, onAdd }: { onSearch: () => void; onAdd: () => void }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-between border-t border-border bg-surface-2/95 px-6 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <button type="button" onClick={onSearch} aria-label={copy.nav.search} className="inline-flex h-11 w-11 items-center justify-center rounded-pill hover:bg-card">
        <Search size={20} aria-hidden />
      </button>
      <AddFab onClick={onAdd} className="-mt-7 border-4 border-bg" />
      <ThemeToggle />
    </nav>
  );
}
