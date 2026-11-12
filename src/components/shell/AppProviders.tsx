'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { pollInterval } from '@/lib/realtime/status';

/** Query cache. Live updates come from Realtime; polling every 15 s only while it is down (RW4.1). */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5_000,
            refetchInterval: () => pollInterval(),
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        position="bottom-center"
        offset={88}
        mobileOffset={{ bottom: 84 }}
        toastOptions={{
          classNames: {
            toast:
              '!rounded-card !border !border-border !bg-card !text-text !shadow-card !font-body !text-[13px]',
          },
        }}
      />
    </QueryClientProvider>
  );
}
