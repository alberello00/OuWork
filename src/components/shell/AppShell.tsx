'use client';

import { useState } from 'react';
import { AddFab, QuickAdd } from '@/components/items/QuickAdd';
import { TopBar } from './TopBar';

/** Frame of the authenticated area: top bar, page, and the "+" that is always there (RF10.1). */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
      <AddFab onClick={() => setAdding(true)} className="fixed bottom-5 right-5 z-40 sm:bottom-7 sm:right-7" />
      <QuickAdd open={adding} onOpenChange={setAdding} />
    </div>
  );
}
