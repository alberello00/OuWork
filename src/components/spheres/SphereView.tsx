'use client';

import { LayoutGrid, Shapes } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ItemCard } from '@/components/items/ItemCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { copy } from '@/lib/copy';
import { useMarkSphereSeen } from '@/lib/queries/spheres';
import { isSpherePrivate, useGalaxyData } from '@/lib/queries/useGalaxyData';
import { useOpenItem } from '@/lib/useOpenItem';
import { cn } from '@/lib/utils';
import { SphereHeader } from './SphereHeader';

const SphereCanvas = dynamic(() => import('@/components/canvas/SphereCanvas').then((m) => m.SphereCanvas), {
  ssr: false,
  loading: () => <div className="paper-sky h-full w-full" />,
});

type View = 'canvas' | 'list';

/** A board: header with sub-board filter, then its canvas or its list. */
export function SphereView({ galaxyId, sphereId }: { galaxyId: string; sphereId: string }) {
  const data = useGalaxyData(galaxyId);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const openItem = useOpenItem();
  const markSphereSeen = useMarkSphereSeen();
  const activeSub = params.get('sub');
  const viewParam = params.get('view');
  // canvas by default on larger screens, list on phones (RD8.4)
  const [defaultView, setDefaultView] = useState<View>('canvas');
  useEffect(() => {
    if (window.matchMedia('(max-width: 639px)').matches) setDefaultView('list');
  }, []);
  const view: View = viewParam === 'list' || viewParam === 'canvas' ? viewParam : defaultView;

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

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }
  const setSub = (id: string | null) => setParam('sub', id);

  const isNew = useCallback((id: string) => newOnOpen?.has(id) ?? false, [newOnOpen]);
  const scopeIds = useMemo(() => [...scope], [scope]);

  if (data.isLoading) return <main className="flex-1 p-8 text-[13px] text-text-muted">{copy.common.loading}</main>;
  if (!sphere) return <EmptyState emoji="🔍" title={copy.galaxies.emptyTitle} className="flex-1" />;

  const target = (activeSub && data.sphereById.get(activeSub)) || sphere;
  const viewSwitch = (
    <div role="group" aria-label="View" className="flex items-center rounded-pill border border-border bg-bg p-0.5">
      {(
        [
          ['canvas', copy.spheres.canvas, <Shapes key="c" size={15} aria-hidden />],
          ['list', copy.spheres.list, <LayoutGrid key="l" size={15} aria-hidden />],
        ] as const
      ).map(([v, label, icon]) => (
        <button
          key={v}
          type="button"
          aria-pressed={view === v}
          onClick={() => setParam('view', v)}
          className={cn('inline-flex h-7 items-center gap-1.5 rounded-[4px] px-2.5 text-[12px] font-medium max-sm:h-10', view === v ? 'bg-card text-text shadow-card' : 'text-text-muted hover:text-text')}
        >
          {icon}
          <span className="max-sm:sr-only">{label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <main className="flex min-h-0 flex-1 flex-col animate-fade-in">
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
      >
        {viewSwitch}
      </SphereHeader>
      {view === 'canvas' ? (
        <div className="relative min-h-[420px] flex-1">
          <div className="absolute inset-0">
            <SphereCanvas
              galaxyId={galaxyId}
              target={target}
              targetPrivate={isSpherePrivate(target, data.sphereById)}
              scopeIds={activeSub ? [activeSub] : scopeIds}
              items={shown}
              sphereById={data.sphereById}
              profileById={data.profileById}
              isNew={isNew}
              focusId={params.get('focus')}
              onOpenItem={openItem}
            />
          </div>
        </div>
      ) : (
      <div className="flex-1 px-4 pb-28 pt-4 sm:px-6">
        {sphere.is_inbox && shown.length ? <p className="mb-3 text-[12px] text-text-muted">{copy.spheres.inbox}</p> : null}
        {shown.length ? (
          <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => openItem(item.id)}
                  className="block w-full rounded-card text-left"
                  aria-label={`${copy.spheres.open}: ${item.title ?? item.url ?? item.caption ?? copy.items.untitled}`}
                >
                  <ItemCard
                    item={{ ...item, is_new: isNew(item.id) }}
                    sphere={data.sphereById.get(item.sphere_id)}
                    author={item.created_by ? data.profileById.get(item.created_by) : undefined}
                  />
                </button>
                {sphere.is_inbox ? <p className="mt-1.5 px-1 text-[11px] text-text-muted">{copy.spheres.waiting}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState emoji={sphere.emoji} title={copy.spheres.emptyTitle} body={copy.spheres.emptyBody} />
        )}
      </div>
      )}
    </main>
  );
}
