'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

/** Returns a function that opens an item detail panel by adding `?item=` to the URL. */
export function useOpenItem() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return useCallback(
    (id: string, href?: string) => {
      if (href && href !== pathname) {
        router.push(`${href}?item=${id}`);
        return;
      }
      const next = new URLSearchParams(params.toString());
      next.set('item', id);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [router, pathname, params]
  );
}
