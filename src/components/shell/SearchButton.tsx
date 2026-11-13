'use client';

import { Search } from 'lucide-react';
import { copy } from '@/lib/copy';

export function SearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-keyshortcuts="Meta+K Control+K"
      data-tour="search"
      className="inline-flex h-8 items-center gap-2 rounded-pill border border-border bg-bg px-2.5 text-[13px] text-text-muted hover:text-text max-sm:hidden sm:min-w-52"
    >
      <Search size={15} aria-hidden />
      <span className="flex-1 text-left">{copy.nav.searchHint}</span>
      <kbd className="rounded-[4px] border border-border bg-card px-1 text-[11px] font-sans">{copy.search.shortcut}</kbd>
    </button>
  );
}
