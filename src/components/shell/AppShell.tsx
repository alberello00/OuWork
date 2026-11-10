'use client';

import { TopBar } from './TopBar';

/** Frame of the authenticated area: top bar + page. Later phases add search, the "+" and the mobile bar. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
