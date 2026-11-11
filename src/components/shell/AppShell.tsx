'use client';

import { useCallback, useState } from 'react';
import { AddFab, QuickAdd } from '@/components/items/QuickAdd';
import { SearchPalette } from '@/components/search/SearchPalette';
import { TutorialProvider } from '@/components/tutorial/TutorialProvider';
import { useModK } from '@/lib/useHotkey';
import { MobileBar } from './MobileBar';
import { SearchButton } from './SearchButton';
import { TopBar } from './TopBar';

/** Frame of the authenticated area: top bar, page, search (⌘K) and the "+" that is always there (RF10.1). */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [adding, setAdding] = useState(false);
  const [searching, setSearching] = useState(false);
  const openSearch = useCallback(() => setSearching(true), []);
  useModK(openSearch);

  return (
    <TutorialProvider>
    <div className="flex min-h-dvh flex-col">
      <TopBar>
        <SearchButton onClick={openSearch} />
      </TopBar>
      <div className="relative flex min-h-0 flex-1 flex-col max-sm:pb-16">{children}</div>
      <AddFab onClick={() => setAdding(true)} tour className="fixed bottom-7 right-7 z-40 max-sm:hidden" />
      <MobileBar onSearch={openSearch} onAdd={() => setAdding(true)} />
      <QuickAdd open={adding} onOpenChange={setAdding} />
      <SearchPalette open={searching} onOpenChange={setSearching} />
    </div>
    </TutorialProvider>
  );
}
