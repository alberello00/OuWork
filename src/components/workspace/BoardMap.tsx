'use client';

import '@xyflow/react/dist/base.css';
import { Background, BackgroundVariant, Panel, ReactFlow, ReactFlowProvider, useNodesInitialized, useNodesState, useReactFlow, type OnNodeDrag } from '@xyflow/react';
import { Shuffle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { CanvasControls } from '@/components/canvas/CanvasControls';
import { Button } from '@/components/ui/Button';
import { copy } from '@/lib/copy';
import { useLinks } from '@/lib/queries/links';
import { useMoveSpheres } from '@/lib/queries/spheres';
import type { Item, Sphere } from '@/lib/queries/types';
import { isSpherePrivate } from '@/lib/queries/useGalaxyData';
import { arrangeSpheres, sphereLinkCounts } from '@/lib/universeLayout';
import { BoardEdge, type BoardEdgeType } from './BoardEdge';
import { BOARD_NODE, BoardNode, type BoardNodeType } from './BoardNode';

const nodeTypes = { board: BoardNode };
const edgeTypes = { board: BoardEdge };

interface Props {
  galaxyId: string;
  /** viewers can look and open boards, not move them (RW3) */
  canEdit: boolean;
  topLevel: Sphere[];
  spheres: Sphere[];
  items: Item[];
  itemsByTop: Map<string, Item[]>;
  sphereById: Map<string, Sphere>;
}

function MapInner({ galaxyId, canEdit, topLevel, spheres, items, itemsByTop, sphereById }: Props) {
  const flow = useReactFlow();
  const router = useRouter();
  const moveSpheres = useMoveSpheres(galaxyId);
  const { data: links = [] } = useLinks(galaxyId);
  const [nodes, setNodes, onNodesChange] = useNodesState<BoardNodeType>([]);
  const initialized = useNodesInitialized();
  const dragging = useRef(new Set<string>());

  useEffect(() => {
    setNodes((current) => {
      const prev = new Map(current.map((n) => [n.id, n]));
      return topLevel.map((s) => {
        const own = itemsByTop.get(s.id) ?? [];
        const old = prev.get(s.id);
        return {
          id: s.id,
          type: 'board' as const,
          // spheres.x / y are the centre of the board on the map
          position: old && dragging.current.has(s.id) ? old.position : { x: s.x - BOARD_NODE.width / 2, y: s.y - BOARD_NODE.height / 2 },
          data: {
            sphere: s,
            count: own.length,
            newCount: own.filter((i) => i.is_new).length,
            subCount: spheres.filter((c) => c.parent_id === s.id).length,
            isPrivate: isSpherePrivate(s, sphereById),
          },
        };
      });
    });
  }, [topLevel, spheres, itemsByTop, sphereById, setNodes]);

  const edges: BoardEdgeType[] = useMemo(() => {
    const topOf = new Map(spheres.map((s) => [s.id, s.parent_id ?? s.id]));
    const itemTop = new Map(items.map((i) => [i.id, topOf.get(i.sphere_id) ?? i.sphere_id]));
    return [...sphereLinkCounts(links, itemTop)].map(([key, count]) => {
      const [a, b] = key.split('|') as [string, string];
      return { id: key, source: a, target: b, type: 'board' as const, selectable: false, data: { count } };
    });
  }, [links, items, spheres]);

  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || !nodes.length || !initialized) return;
    fitted.current = true;
    requestAnimationFrame(() => void flow.fitView({ padding: 0.2, maxZoom: 1 }));
  }, [nodes, initialized, flow]);

  const onNodeDragStart: OnNodeDrag<BoardNodeType> = useCallback((_, n) => void dragging.current.add(n.id), []);
  const onNodeDragStop: OnNodeDrag<BoardNodeType> = useCallback(
    (_, n) => {
      dragging.current.delete(n.id);
      moveSpheres.mutate([{ id: n.id, x: Math.round(n.position.x + BOARD_NODE.width / 2), y: Math.round(n.position.y + BOARD_NODE.height / 2) }]);
    },
    [moveSpheres]
  );

  function reorganize() {
    const placed = arrangeSpheres(topLevel.map((s) => ({ id: s.id, count: itemsByTop.get(s.id)?.length ?? 0, isInbox: s.is_inbox })));
    moveSpheres.mutate(placed, {
      onSuccess: () => {
        toast(copy.universe.reorganized);
        setTimeout(() => void flow.fitView({ padding: 0.2, maxZoom: 1, duration: 160 }), 50);
      },
      onError: () => toast.error(copy.common.genericError),
    });
  }

  return (
    <ReactFlow<BoardNodeType, BoardEdgeType>
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onNodeDragStart={onNodeDragStart}
      onNodeDragStop={onNodeDragStop}
      onNodeDoubleClick={(_, n) => router.push(`/w/${galaxyId}/b/${n.id}`)}
      nodesConnectable={false}
      nodesDraggable={canEdit}
      zoomOnDoubleClick={false}
      minZoom={0.2}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      className="!bg-transparent"
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--color-dot-grid)" />
      <Panel position="top-left" className="!m-3 flex items-center gap-2">
        {canEdit ? (
          <Button size="sm" onClick={reorganize} disabled={moveSpheres.isPending}>
            <Shuffle size={14} aria-hidden />
            {copy.universe.reorganize}
          </Button>
        ) : null}
        <span className="rounded-pill bg-card/90 px-2 py-1 text-[11px] text-text-muted max-md:hidden">{copy.universe.mapHint}</span>
      </Panel>
      <Panel position="bottom-right" className="!m-3"><CanvasControls /></Panel>
    </ReactFlow>
  );
}

/** Workspace map (RW2.3): boards as rectangles, lines for links between items of different boards. */
export function BoardMap(props: Props) {
  return (
    <ReactFlowProvider>
      <MapInner {...props} />
    </ReactFlowProvider>
  );
}
