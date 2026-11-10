'use client';

import '@xyflow/react/dist/base.css';
import { Background, BackgroundVariant, Panel, ReactFlow, ReactFlowProvider, useNodesInitialized, useNodesState, useReactFlow, type OnNodeDrag } from '@xyflow/react';
import { LayoutGrid, Plus, Settings, Shuffle } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CanvasControls } from '@/components/canvas/CanvasControls';
import { GalaxySettingsDialog } from '@/components/galaxies/GalaxySettingsDialog';
import { NewsBanner } from '@/components/news/NewsBanner';
import { SphereFormDialog } from '@/components/spheres/SphereFormDialog';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { copy } from '@/lib/copy';
import { useLinks } from '@/lib/queries/links';
import { useMoveSpheres } from '@/lib/queries/spheres';
import type { Item } from '@/lib/queries/types';
import { isSpherePrivate, useGalaxyData } from '@/lib/queries/useGalaxyData';
import { sphereDiameter, sphereVar } from '@/lib/tokens';
import { arrangeSpheres, sphereLinkCounts } from '@/lib/universeLayout';
import { Legend } from './Legend';
import { PlanetNode, type PlanetNodeType } from './PlanetNode';
import { SphereEdge, type SphereEdgeType } from './SphereEdge';
import { SphereIndexPanel } from './SphereIndexPanel';

const nodeTypes = { planet: PlanetNode };
const edgeTypes = { sphere: SphereEdge };
const ENTER_MS = 420;

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function UniverseInner({ galaxyId }: { galaxyId: string }) {
  const data = useGalaxyData(galaxyId);
  const flow = useReactFlow();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const moveSpheres = useMoveSpheres(galaxyId);
  const { data: links = [] } = useLinks(galaxyId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [entering, setEntering] = useState<{ color: string } | null>(null);
  const selectedId = params.get('sphere');

  const setSelected = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (id) next.set('sphere', id);
      else next.delete('sphere');
      next.delete('from');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router]
  );

  // items per top-level sphere (sub-sphere items count for their parent)
  const { topOf, itemsByTop } = useMemo(() => {
    const topOf = new Map<string, string>();
    for (const s of data.spheres) topOf.set(s.id, s.parent_id ?? s.id);
    const itemsByTop = new Map<string, Item[]>();
    for (const i of data.items) {
      const top = topOf.get(i.sphere_id);
      if (!top) continue;
      const list = itemsByTop.get(top) ?? [];
      list.push(i);
      itemsByTop.set(top, list);
    }
    return { topOf, itemsByTop };
  }, [data.spheres, data.items]);

  const sizeOf = useCallback((id: string) => sphereDiameter(itemsByTop.get(id)?.length ?? 0), [itemsByTop]);

  const enter = useCallback(
    (sphereId: string, sub?: string) => {
      const href = `/g/${galaxyId}/s/${sphereId}${sub ? `?sub=${sub}` : ''}`;
      const node = flow.getNode(sphereId);
      if (!node || prefersReducedMotion()) {
        router.push(href);
        return;
      }
      // RD7.2: zoom into the planet, which opens into its canvas
      const size = sizeOf(sphereId);
      void flow.setCenter(node.position.x + size / 2, node.position.y + size / 2, { zoom: 3.2, duration: ENTER_MS });
      setEntering({ color: sphereVar(data.sphereById.get(sphereId)?.color) });
      setTimeout(() => router.push(href), ENTER_MS - 60);
    },
    [flow, router, galaxyId, sizeOf, data.sphereById]
  );

  const { topLevel, childrenOf, sphereById, items: allItems } = data;
  const [nodes, setNodes, onNodesChange] = useNodesState<PlanetNodeType>([]);
  const initialized = useNodesInitialized();
  const dragging = useRef(new Set<string>());

  useEffect(() => {
    setNodes((current) => {
      const prev = new Map(current.map((n) => [n.id, n]));
      return topLevel.map((s) => {
        const items = itemsByTop.get(s.id) ?? [];
        const size = sphereDiameter(items.length);
        const old = prev.get(s.id);
        return {
          id: s.id,
          type: 'planet' as const,
          position: old && dragging.current.has(s.id) ? old.position : { x: s.x - size / 2, y: s.y - size / 2 },
          selected: s.id === selectedId,
          data: {
            sphere: s,
            size,
            count: items.length,
            newCount: items.filter((i) => i.is_new).length,
            isPrivate: isSpherePrivate(s, sphereById),
            moons: childrenOf(s.id).map((m) => {
              const mi = allItems.filter((i) => i.sphere_id === m.id);
              return { sphere: m, count: mi.length, newCount: mi.filter((i) => i.is_new).length };
            }),
            onMoon: (subId: string) => enter(s.id, subId),
          },
        };
      });
    });
  }, [topLevel, allItems, sphereById, childrenOf, itemsByTop, selectedId, setNodes, enter]);

  const edges: SphereEdgeType[] = useMemo(() => {
    const itemTop = new Map<string, string>();
    for (const i of data.items) itemTop.set(i.id, topOf.get(i.sphere_id) ?? i.sphere_id);
    return [...sphereLinkCounts(links, itemTop)].map(([key, count]) => {
      const [a, b] = key.split('|') as [string, string];
      return { id: key, source: a, target: b, type: 'sphere' as const, selectable: false, data: { count, sourceSize: sizeOf(a), targetSize: sizeOf(b) } };
    });
  }, [links, data.items, topOf, sizeOf]);

  // first view: fit, or zoom out of the sphere we come back from (RD7.2)
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || !nodes.length || !initialized) return;
    fitted.current = true;
    const from = params.get('from');
    const node = from ? nodes.find((n) => n.id === from) : undefined;
    requestAnimationFrame(() => {
      if (node && !prefersReducedMotion()) {
        const size = node.data.size;
        void flow.setCenter(node.position.x + size / 2, node.position.y + size / 2, { zoom: 3.2, duration: 0 });
        setTimeout(() => void flow.fitView({ padding: 0.25, maxZoom: 1.1, duration: ENTER_MS }), 30);
      } else {
        void flow.fitView({ padding: 0.25, maxZoom: 1.1 });
      }
    });
  }, [nodes, initialized, flow, params]);

  const onNodeDragStart: OnNodeDrag<PlanetNodeType> = useCallback((_, n) => void dragging.current.add(n.id), []);
  const onNodeDragStop: OnNodeDrag<PlanetNodeType> = useCallback(
    (_, n) => {
      dragging.current.delete(n.id);
      const size = n.data.size;
      moveSpheres.mutate([{ id: n.id, x: Math.round(n.position.x + size / 2), y: Math.round(n.position.y + size / 2) }]);
    },
    [moveSpheres]
  );

  function reorganize() {
    const placed = arrangeSpheres(
      data.topLevel.map((s) => ({ id: s.id, count: itemsByTop.get(s.id)?.length ?? 0, isInbox: s.is_inbox }))
    );
    moveSpheres.mutate(placed, {
      onSuccess: () => {
        toast(copy.universe.reorganized);
        setTimeout(() => void flow.fitView({ padding: 0.25, maxZoom: 1.1, duration: 400 }), 50);
      },
      onError: () => toast.error(copy.common.genericError),
    });
  }

  if (data.isLoading) return <main className="universe-bg flex-1" />;
  if (!data.galaxy) {
    return (
      <EmptyState emoji="🌌" title={copy.galaxies.emptyTitle} className="universe-bg flex-1">
        <Link href="/" className="text-[13px] underline underline-offset-2">{copy.nav.allGalaxies}</Link>
      </EmptyState>
    );
  }
  const galaxy = data.galaxy;
  const selected = selectedId ? data.sphereById.get(selectedId) : undefined;

  return (
    <main className="universe-bg relative flex min-h-0 flex-1 flex-col">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-2 px-3 pt-3 sm:px-5">
        <h1 className="pointer-events-auto min-w-0 flex-1 truncate text-[26px] leading-tight sm:text-[30px]">{galaxy.name}</h1>
        <div className="pointer-events-auto flex items-center gap-1.5">
          <AvatarStack members={galaxy.members} size={26} />
          <Button size="sm" onClick={reorganize} disabled={moveSpheres.isPending} className="h-11">
            <Shuffle size={14} aria-hidden /><span className="max-sm:sr-only">{copy.universe.reorganize}</span>
          </Button>
          <Link href={`/g/${galaxyId}/notes`} aria-label={copy.nav.notes} className="inline-flex h-11 items-center gap-2 rounded-pill border border-border bg-card px-3.5 text-[12px] font-medium hover:bg-surface-2">
            <LayoutGrid size={15} aria-hidden /><span className="max-sm:sr-only">{copy.nav.notes}</span>
          </Link>
          <Button size="icon" aria-label={copy.universe.newSphere} onClick={() => setCreating(true)}><Plus size={17} aria-hidden /></Button>
          <Button size="icon" aria-label={copy.nav.settings} onClick={() => setSettingsOpen(true)}><Settings size={17} aria-hidden /></Button>
        </div>
        <div className="pointer-events-auto w-full sm:max-w-xl">
          <NewsBanner galaxyId={galaxyId} />
        </div>
      </div>

      <div className="relative min-h-[480px] flex-1">
        <div className="absolute inset-0">
          <ReactFlow<PlanetNodeType, SphereEdgeType>
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onNodeDragStart={onNodeDragStart}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={(_, n) => setSelected(n.id)}
            onNodeDoubleClick={(_, n) => enter(n.id)}
            onPaneClick={() => selectedId && setSelected(null)}
            nodesConnectable={false}
            zoomOnDoubleClick={false}
            minZoom={0.2}
            maxZoom={3.5}
            proOptions={{ hideAttribution: true }}
            className="!bg-transparent"
          >
            <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="var(--color-dot-grid)" className="dark:opacity-0" />
            <Panel position="bottom-left" className="!mb-5 !ml-3"><CanvasControls /></Panel>
            <Panel position="bottom-center" className="!mb-5 max-md:hidden"><Legend showMoonsHint={data.spheres.some((s) => s.parent_id)} /></Panel>
          </ReactFlow>
        </div>
        {!data.topLevel.length ? <EmptyState emoji="🪐" title={copy.universe.galaxyEmpty} className="absolute inset-0" /> : null}
      </div>

      {entering ? (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-40 animate-fade-in" style={{ background: `radial-gradient(circle at 50% 55%, ${entering.color} 0%, var(--color-bg) 70%)` }} />
      ) : null}

      <SphereIndexPanel
        galaxyId={galaxyId}
        sphere={selected}
        subs={selected ? data.childrenOf(selected.id) : []}
        items={selected ? (itemsByTop.get(selected.id) ?? []) : []}
        isPrivate={isSpherePrivate(selected, data.sphereById)}
        sphereById={data.sphereById}
        profileById={data.profileById}
        onEnter={(id) => { setSelected(null); enter(id); }}
        onClose={() => setSelected(null)}
      />
      <GalaxySettingsDialog galaxy={galaxy} open={settingsOpen} onOpenChange={setSettingsOpen} />
      <SphereFormDialog
        galaxyId={galaxyId}
        spheres={data.spheres}
        open={creating}
        onOpenChange={setCreating}
        onCreated={(s) => {
          // a new planet appears to the right of everything else
          const maxX = Math.max(0, ...data.topLevel.map((t) => t.x + sizeOf(t.id) / 2));
          moveSpheres.mutate([{ id: s.id, x: Math.round(maxX + 200), y: 0 }]);
        }}
      />
    </main>
  );
}

/** Universe of a galaxy (RF2.3, frame 5:2): spheres as planets, links as arcs. */
export function GalaxyUniverse({ galaxyId }: { galaxyId: string }) {
  return (
    <ReactFlowProvider>
      <UniverseInner galaxyId={galaxyId} />
    </ReactFlowProvider>
  );
}
