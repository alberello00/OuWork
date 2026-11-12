'use client';

import { useCallback, useState } from 'react';
import { QuickAdd } from '@/components/items/QuickAdd';
import { SearchPalette } from '@/components/search/SearchPalette';
import { TutorialProvider } from '@/components/tutorial/TutorialProvider';
import { useModK } from '@/lib/useHotkey';
import { MobileBar } from './MobileBar';
import { RealtimeProvider } from './RealtimeProvider';
import { SearchButton } from './SearchButton';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

/** Frame of the authenticated area (RW2.7): sidebar, top bar, page, search (⌘K) and quick add. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [adding, setAdding] = useState(false);
  const [searching, setSearching] = useState(false);
  const openSearch = useCallback(() => setSearching(true), []);
  useModK(openSearch);

  return (
    <RealtimeProvider>
    <TutorialProvider>
      <div className="flex min-h-dvh">
        <Sidebar className="max-lg:hidden" />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onAdd={() => setAdding(true)}>
            <SearchButton onClick={openSearch} />
          </TopBar>
          <div className="relative flex min-h-0 flex-1 flex-col max-sm:pb-16">{children}</div>
        </div>
        <MobileBar onSearch={openSearch} onAdd={() => setAdding(true)} />
        <QuickAdd open={adding} onOpenChange={setAdding} />
        <SearchPalette open={searching} onOpenChange={setSearching} />
      </div>
    </TutorialProvider>
    </RealtimeProvider>
  );
}
