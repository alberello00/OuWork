'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';

/** Sync without realtime (RF11.1): polling every 15 s + refetch on focus. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5_000,
            refetchInterval: 15_000,
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
