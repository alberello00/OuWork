'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { useGalaxyData } from '@/lib/queries/useGalaxyData';
import { ItemDetail } from './ItemDetail';

/** Opens the item named by `?item=<id>` anywhere inside a galaxy. */
export function ItemDetailHost({ galaxyId }: { galaxyId: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const data = useGalaxyData(galaxyId);
  const itemId = params.get('item');

  const setItem = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (id) next.set('item', id);
      else next.delete('item');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router]
  );

  if (!itemId) return null;
  const item = data.items.find((i) => i.id === itemId);
  return (
    <ItemDetail
      item={item}
      items={data.items}
      spheres={data.spheres}
      sphereById={data.sphereById}
      profileById={data.profileById}
      onOpenItem={setItem}
      onClose={() => setItem(null)}
    />
  );
}
