'use client';

import '@xyflow/react/dist/base.css';
import { Background, BackgroundVariant, Panel, ReactFlow, ReactFlowProvider, useNodesInitialized, useNodesState, useReactFlow, type OnNodeDrag } from '@xyflow/react';
import { LayoutGrid, Plus, Settings, Shuffle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CanvasControls } from '@/components/canvas/CanvasControls';
import { GalaxySettingsDialog } from '@/components/galaxies/GalaxySettingsDialog';
import { GalaxySetupDialog } from '@/components/galaxies/GalaxySetupDialog';
import { NewsBanner } from '@/components/news/NewsBanner';
import { useSession } from '@/components/shell/SessionProvider';
import { DeleteSphereDialog } from '@/components/spheres/DeleteSphereDialog';
import { SphereFormDialog } from '@/components/spheres/SphereFormDialog';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { copy } from '@/lib/copy';
import { useLinks } from '@/lib/queries/links';
import { useMoveSpheres } from '@/lib/queries/spheres';
import type { Item, Sphere } from '@/lib/queries/types';
import { isSpherePrivate, useGalaxyData } from '@/lib/queries/useGalaxyData';
import { sphereDiameter, sphereVar } from '@/lib/tokens';
import { cn } from '@/lib/utils';
import { arrangeSpheres, sphereLinkCounts } from '@/lib/universeLayout';
import { Legend } from './Legend';
import { PlanetMenu } from './PlanetMenu';
import { ARRIVE_DELAY_MS, ARRIVE_STAGGER_MS, PlanetNode, type PlanetNodeType } from './PlanetNode';
import { SphereEdge, type SphereEdgeType } from './SphereEdge';
import { SphereIndexPanel } from './SphereIndexPanel';

const nodeTypes = { planet: PlanetNode };
const edgeTypes = { sphere: SphereEdge };
const ENTER_MS = 420;
const LEAVE_MS = 260;

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** "Maybe later" on the setup survey: do not reopen it by itself on this device (RF14.2). */
const laterKey = (galaxyId: string) => `ow:setup-later:${galaxyId}`;
function setupPostponed(galaxyId: string) {
  try {
    return window.localStorage.getItem(laterKey(galaxyId)) === '1';
  } catch {
    return false;
  }
}
function postponeSetup(galaxyId: string) {
  try {
    window.localStorage.setItem(laterKey(galaxyId), '1');
  } catch {
    // private mode: the survey will simply open again next time
  }
}

function UniverseInner({ galaxyId }: { galaxyId: string }) {
  const data = useGalaxyData(galaxyId);
  const { userId } = useSession();
  const flow = useReactFlow();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const moveSpheres = useMoveSpheres(galaxyId);
  const { data: links = [] } = useLinks(galaxyId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [entering, setEntering] = useState<{ color: string } | null>(null);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [editing, setEditing] = useState<Sphere | null>(null);
  const [deleting, setDeleting] = useState<Sphere | null>(null);
  // planets that were just deleted stay on screen while they fade out (RF12.3)
  const [leaving, setLeaving] = useState<string[]>([]);
  const longPressAt = useRef(0);
  // setup survey (RF14): opens by itself once for the owner of a galaxy that is not set up
  const [setupOpen, setSetupOpen] = useState(false);
  const [arriving, setArriving] = useState<string[]>([]);
  const refit = useRef(false);
  const galaxyRow = data.galaxy;
  const needsSetup = !!galaxyRow && !galaxyRow.setup_completed_at;
  const isOwner = galaxyRow?.owner_id === userId;
  const setupOffered = useRef(false);
  useEffect(() => {
    if (setupOffered.current || !needsSetup || !isOwner) return;
    setupOffered.current = true;
    if (!setupPostponed(galaxyId)) setSetupOpen(true);
  }, [needsSetup, isOwner, galaxyId]);
  const openMenu = useCallback((id: string, x: number, y: number, longPress?: boolean) => {
    if (longPress) longPressAt.current = Date.now();
    setMenu({ id, x, y });
  }, []);
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
      const href = `/w/${galaxyId}/b/${sphereId}${sub ? `?sub=${sub}` : ''}`;
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
      const alive = new Set(topLevel.map((s) => s.id));
      const ghosts = leaving
        .filter((id) => !alive.has(id) && prev.has(id))
        .map((id) => ({ ...prev.get(id)!, selected: false, draggable: false, data: { ...prev.get(id)!.data, leaving: true } }));
      const live = topLevel.map((s) => {
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
            onMenu: openMenu,
            leaving: leaving.includes(s.id),
            arriveIndex: arriving.includes(s.id) ? arriving.indexOf(s.id) : undefined,
          },
        };
      });
      return [...live, ...ghosts];
    });
  }, [topLevel, allItems, sphereById, childrenOf, itemsByTop, selectedId, setNodes, enter, openMenu, leaving, arriving]);

  const onSphereDeleted = useCallback(
    (id: string) => {
      setLeaving((l) => [...l, id]);
      setTimeout(() => setLeaving((l) => l.filter((x) => x !== id)), LEAVE_MS);
      if (selectedId === id) setSelected(null);
    },
    [selectedId, setSelected]
  );

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

  // after the setup survey: show the whole new galaxy while the planets come in (RF14.7)
  useEffect(() => {
    if (!refit.current || !initialized || !arriving.length || !arriving.every((id) => nodes.some((n) => n.id === id))) return;
    refit.current = false;
    void flow.fitView({ padding: 0.25, maxZoom: 1.1, duration: prefersReducedMotion() ? 0 : ARRIVE_DELAY_MS });
  }, [nodes, initialized, arriving, flow]);

  const onSetupDone = useCallback((ids: string[]) => {
    setSetupOpen(false);
    if (!ids.length) return;
    refit.current = true;
    setArriving(ids);
    setTimeout(() => setArriving([]), ARRIVE_DELAY_MS + ids.length * ARRIVE_STAGGER_MS + 900);
  }, []);

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

  const onlyInbox = data.topLevel.length > 0 && data.topLevel.every((s) => s.is_inbox);

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
  const owner = galaxy.members.find((m) => m.user_id === galaxy.owner_id)?.profile;

  return (
    <main className="universe-bg relative flex min-h-0 flex-1 flex-col">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-2 px-3 pt-3 sm:px-5">
        <h1 className="pointer-events-auto min-w-0 flex-1 truncate text-[26px] leading-tight sm:text-[30px]">{galaxy.name}</h1>
        <div className="pointer-events-auto flex items-center gap-1.5">
          <AvatarStack members={galaxy.members} size={26} />
          <Button size="sm" onClick={reorganize} disabled={moveSpheres.isPending} className="h-11">
            <Shuffle size={14} aria-hidden /><span className="max-sm:sr-only">{copy.universe.reorganize}</span>
          </Button>
          <Link href={`/w/${galaxyId}/notes`} aria-label={copy.nav.notes} className="inline-flex h-11 items-center gap-2 rounded-pill border border-border bg-card px-3.5 text-[12px] font-medium hover:bg-surface-2">
            <LayoutGrid size={15} aria-hidden /><span className="max-sm:sr-only">{copy.nav.notes}</span>
          </Link>
          <Button size="icon" aria-label={copy.universe.newSphere} onClick={() => setCreating(true)}><Plus size={17} aria-hidden /></Button>
          <Button size="icon" aria-label={copy.nav.settings} data-tour="settings" onClick={() => setSettingsOpen(true)}><Settings size={17} aria-hidden /></Button>
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
            onNodeClick={(_, n) => {
              // the tap that ends a long press must not also open the panel
              if (Date.now() - longPressAt.current > 700) setSelected(n.id);
            }}
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
            {/* with Random alone the empty-state card takes this room: nothing to zoom on a phone, nothing to explain */}
            <Panel position="bottom-left" className={cn('!mb-5 !ml-3', onlyInbox && 'max-sm:hidden')}><CanvasControls /></Panel>
            <Panel position="bottom-center" className={cn('!mb-5 max-md:hidden', onlyInbox && 'hidden')}><Legend showMoonsHint={data.spheres.some((s) => s.parent_id)} /></Panel>
          </ReactFlow>
        </div>
        {!data.topLevel.length ? <EmptyState emoji="🪐" title={copy.universe.galaxyEmpty} className="absolute inset-0" /> : null}
        {onlyInbox && !setupOpen ? (
          // RF13.3: a warm nudge under the lonely Random, never in the way of the canvas
          <div className="pointer-events-none absolute inset-x-0 top-[calc(50%+92px)] flex justify-center px-4 animate-fade-in">
            <div data-tour="empty-universe" className="pointer-events-auto w-full max-w-sm rounded-login border border-border bg-card/95 p-4 text-center shadow-card backdrop-blur">
              {needsSetup && !isOwner ? (
                <>
                  <p className="font-heading text-[20px] leading-tight">{copy.setup.waitingTitle(owner?.display_name ?? '…')}</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">{copy.setup.waitingBody}</p>
                  <Button className="mt-3" onClick={() => setCreating(true)}><Plus size={15} aria-hidden />{copy.universe.newSphere}</Button>
                </>
              ) : (
                <>
                  <p className="font-heading text-[20px] leading-tight">{copy.setup.emptyTitle}</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">{copy.setup.emptyBody}</p>
                  {needsSetup ? (
                    <div className="mt-3 flex flex-col items-center gap-1">
                      <Button variant="primary" onClick={() => setSetupOpen(true)}><Sparkles size={15} aria-hidden />{copy.setup.emptyCta}</Button>
                      <Button variant="ghost" size="sm" className="h-11 text-text-muted" onClick={() => setCreating(true)}>{copy.setup.emptyManual}</Button>
                    </div>
                  ) : (
                    <Button variant="primary" className="mt-3" onClick={() => setCreating(true)}><Plus size={15} aria-hidden />{copy.universe.newSphere}</Button>
                  )}
                </>
              )}
            </div>
          </div>
        ) : null}
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
        onDelete={setDeleting}
        onClose={() => setSelected(null)}
      />
      <PlanetMenu
        sphere={menu ? data.sphereById.get(menu.id) : undefined}
        at={menu}
        onClose={() => setMenu(null)}
        onOpen={(s) => enter(s.id)}
        onEdit={setEditing}
        onDelete={setDeleting}
      />
      {editing ? (
        <SphereFormDialog galaxyId={galaxyId} spheres={data.spheres} open onOpenChange={(o) => !o && setEditing(null)} sphere={editing} />
      ) : null}
      {deleting ? (
        <DeleteSphereDialog
          sphere={deleting}
          spheres={data.spheres}
          itemCount={itemsByTop.get(deleting.id)?.length ?? 0}
          open
          onOpenChange={(o) => !o && setDeleting(null)}
          onDeleted={() => onSphereDeleted(deleting.id)}
        />
      ) : null}
      <GalaxySettingsDialog galaxy={galaxy} open={settingsOpen} onOpenChange={setSettingsOpen} onSetup={() => setSetupOpen(true)} />
      {needsSetup && isOwner ? (
        <GalaxySetupDialog
          galaxy={galaxy}
          existingCount={data.topLevel.filter((s) => !s.is_inbox).length}
          open={setupOpen}
          onOpenChange={(o) => {
            setSetupOpen(o);
            if (!o) postponeSetup(galaxyId);
          }}
          onDone={onSetupDone}
        />
      ) : null}
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
