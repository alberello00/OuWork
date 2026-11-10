'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ItemCard } from '@/components/items/ItemCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { copy } from '@/lib/copy';
import { useMarkSphereSeen } from '@/lib/queries/spheres';
import { isSpherePrivate, useGalaxyData } from '@/lib/queries/useGalaxyData';
import { useOpenItem } from '@/lib/useOpenItem';
import { tiltFor } from '@/lib/utils';
import { SphereHeader } from './SphereHeader';

/** A sphere: header with sub-sphere filter + its items. Phase 4 adds the canvas next to the list. */
export function SphereView({ galaxyId, sphereId }: { galaxyId: string; sphereId: string }) {
  const data = useGalaxyData(galaxyId);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const openItem = useOpenItem();
  const markSphereSeen = useMarkSphereSeen();
  const activeSub = params.get('sub');

  const sphere = data.sphereById.get(sphereId);
  const parent = sphere?.parent_id ? data.sphereById.get(sphere.parent_id) : undefined;
  const subSpheres = useMemo(() => (sphere ? data.childrenOf(sphere.id) : []), [sphere, data]);
  const scope = useMemo(() => new Set([sphereId, ...subSpheres.map((s) => s.id)]), [sphereId, subSpheres]);
  const all = data.items.filter((i) => scope.has(i.sphere_id));
  const shown = activeSub ? all.filter((i) => i.sphere_id === activeSub) : all;

  // RF8.3: opening a sphere marks it as seen; badges stay visible for this visit
  const [newOnOpen, setNewOnOpen] = useState<Set<string> | null>(null);
  const marked = useRef(false);
  useEffect(() => {
    if (marked.current || data.isLoading || !sphere) return;
    marked.current = true;
    setNewOnOpen(new Set(all.filter((i) => i.is_new).map((i) => i.id)));
    if (all.some((i) => i.is_new)) markSphereSeen.mutate(sphere.id);
  }, [data.isLoading, sphere, all, markSphereSeen]);

  function setSub(id: string | null) {
    const next = new URLSearchParams(params.toString());
    if (id) next.set('sub', id);
    else next.delete('sub');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  if (data.isLoading) return <main className="flex-1 p-8 text-[13px] text-text-muted">{copy.common.loading}</main>;
  if (!sphere) return <EmptyState emoji="🫧" title={copy.galaxies.emptyTitle} className="flex-1" />;

  const isNew = (id: string) => newOnOpen?.has(id) ?? false;

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <SphereHeader
        galaxyId={galaxyId}
        sphere={sphere}
        parent={parent}
        spheres={data.spheres}
        subSpheres={subSpheres}
        countOf={(id) => all.filter((i) => i.sphere_id === id).length}
        newCount={newOnOpen?.size ?? 0}
        totalCount={all.length}
        isPrivate={isSpherePrivate(sphere, data.sphereById)}
        activeSub={activeSub}
        onSubChange={setSub}
      />
      <div className="paper-sky flex-1 px-3 pb-28 pt-4 sm:px-6">
        {sphere.is_inbox && shown.length ? <p className="mb-3 text-[12px] text-text-muted">{copy.spheres.inbox}</p> : null}
        {shown.length ? (
          <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => openItem(item.id)}
                  className="block w-full text-left transition-transform duration-200 hover:-translate-y-0.5"
                  aria-label={`${copy.spheres.open}: ${item.title ?? item.url ?? item.caption ?? copy.items.untitled}`}
                >
                  <ItemCard
                    item={{ ...item, is_new: isNew(item.id) }}
                    sphere={data.sphereById.get(item.sphere_id)}
                    author={item.created_by ? data.profileById.get(item.created_by) : undefined}
                    tilt={tiltFor(item.id) / 3}
                  />
                </button>
                {sphere.is_inbox ? <p className="mt-1.5 px-1 text-[11px] italic text-text-muted">{copy.spheres.waiting}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState emoji={sphere.emoji} title={copy.spheres.emptyTitle} body={copy.spheres.emptyBody} />
        )}
      </div>
    </main>
  );
}
