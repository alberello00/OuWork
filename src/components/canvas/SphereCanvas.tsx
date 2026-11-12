'use client';

import '@xyflow/react/dist/base.css';
import {
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useNodesInitialized,
  useReactFlow,
  type NodeMouseHandler,
  type OnNodeDrag,
} from '@xyflow/react';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { copy } from '@/lib/copy';
import { useCreateAnnotation, useAnnotations, type NewAnnotation } from '@/lib/queries/annotations';
import { useMoveItemOnCanvas } from '@/lib/queries/items';
import { useCreateLink, useLinks } from '@/lib/queries/links';
import { isAllowedImage, MAX_UPLOAD_BYTES, uploadImage } from '@/lib/queries/storage';
import type { Item, ItemType, Profile, Sphere } from '@/lib/queries/types';
import { canvas, sphereVar } from '@/lib/tokens';
import { cn } from '@/lib/utils';
import { AnnotationLayer } from './AnnotationLayer';
import { CanvasAddDialog } from './CanvasAddDialog';
import { CanvasControls } from './CanvasControls';
import { CanvasToolbar, type CanvasTool } from './CanvasToolbar';
import { DrawingOverlay } from './DrawingOverlay';
import { ItemNode, type ItemNodeType } from './ItemNode';
import { LinkEdge, type LinkEdgeType } from './LinkEdge';

const nodeTypes = { item: ItemNode };
const edgeTypes = { link: LinkEdge };
const SAVE_DEBOUNCE_MS = 400;

interface Props {
  galaxyId: string;
  /** sphere where new things are created (the active sub-sphere, if any) */
  target: Sphere;
  targetPrivate: boolean;
  /** spheres whose items and annotations are shown */
  scopeIds: string[];
  items: Item[];
  sphereById: Map<string, Sphere>;
  profileById: Map<string, Profile>;
  isNew: (id: string) => boolean;
  focusId: string | null;
  onOpenItem: (id: string) => void;
  /** viewers pan, zoom and open cards; no tools, no dragging (RW3) */
  canEdit: boolean;
}

function CanvasInner(props: Props) {
  const { galaxyId, target, targetPrivate, scopeIds, items, sphereById, profileById, isNew, focusId, onOpenItem, canEdit } = props;
  const { resolvedTheme } = useTheme();
  const flow = useReactFlow();
  const wrapper = useRef<HTMLDivElement>(null);
  const move = useMoveItemOnCanvas(galaxyId);
  const createAnnotation = useCreateAnnotation();
  const { data: annotations = [] } = useAnnotations(scopeIds);
  const itemIds = useMemo(() => new Set(items.map((i) => i.id)), [items]);
  const { data: links = [] } = useLinks(galaxyId, itemIds);

  const createLink = useCreateLink();
  const [tool, setTool] = useState<CanvasTool>('select');
  // connector tool: the first item picked, waiting for the second
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [color, setColor] = useState('coral');
  const [size, setSize] = useState(6);
  const [emoji, setEmoji] = useState('✅');
  const [draft, setDraft] = useState<{ kind: string; data: unknown; x: number; y: number } | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [adding, setAdding] = useState<{ type: ItemType; at: { x: number; y: number } } | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  // ── nodes: server data, but positions of cards being dragged stay local ──
  const dragging = useRef(new Set<string>());
  const pending = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const [nodes, setNodes, onNodesChange] = useNodesState<ItemNodeType>([]);
  const initialized = useNodesInitialized();

  useEffect(() => {
    setNodes((current) => {
      const prev = new Map(current.map((n) => [n.id, n]));
      return items.map((item) => {
        const old = prev.get(item.id);
        const keepLocal = old && (dragging.current.has(item.id) || pending.current.has(item.id));
        return {
          id: item.id,
          type: 'item' as const,
          position: keepLocal ? old.position : { x: item.x, y: item.y },
          selected: item.id === connectFrom || old?.selected,
          width: canvas.cardWidth,
          data: {
            item: { ...item, is_new: isNew(item.id) },
            sphere: sphereById.get(item.sphere_id),
            author: item.created_by ? profileById.get(item.created_by) : undefined,
            dimmed: false,
          },
        };
      });
    });
  }, [items, sphereById, profileById, isNew, setNodes, connectFrom]);

  const edges: LinkEdgeType[] = useMemo(
    () =>
      links.map((l) => {
        const source = items.find((i) => i.id === l.source_id);
        return {
          id: l.id,
          source: l.source_id,
          target: l.target_id,
          type: 'link' as const,
          selectable: false,
          data: {
            color: `color-mix(in srgb, ${sphereVar(sphereById.get(source?.sphere_id ?? '')?.color)} 75%, var(--color-text))`,
            highlight: hovered === l.source_id || hovered === l.target_id,
          },
        };
      }),
    [links, items, sphereById, hovered]
  );

  // ── fit on first load, or centre on the item asked for (RF9.3) ──
  const didFit = useRef(false);
  useEffect(() => {
    if (didFit.current || !nodes.length || !initialized) return;
    didFit.current = true;
    requestAnimationFrame(() => {
      const focus = focusId ? nodes.find((n) => n.id === focusId) : undefined;
      if (focus) flow.setCenter(focus.position.x + canvas.cardWidth / 2, focus.position.y + 80, { zoom: 1, duration: 400 });
      else flow.fitView({ padding: 0.2, maxZoom: 1 });
    });
  }, [nodes, initialized, focusId, flow]);

  const onNodeDragStart: OnNodeDrag<ItemNodeType> = useCallback((_, node) => {
    dragging.current.add(node.id);
  }, []);

  const onNodeDragStop: OnNodeDrag<ItemNodeType> = useCallback(
    (_, node, dragged) => {
      for (const n of dragged.length ? dragged : [node]) {
        dragging.current.delete(n.id);
        clearTimeout(pending.current.get(n.id));
        pending.current.set(
          n.id,
          setTimeout(() => {
            pending.current.delete(n.id);
            move.mutate({ id: n.id, x: Math.round(n.position.x), y: Math.round(n.position.y) });
          }, SAVE_DEBOUNCE_MS)
        );
      }
    },
    [move]
  );

  const onNodeClick: NodeMouseHandler<ItemNodeType> = useCallback(
    (_, node) => {
      if (tool !== 'connector') {
        onOpenItem(node.id);
        return;
      }
      if (!connectFrom) {
        setConnectFrom(node.id);
        return;
      }
      if (connectFrom !== node.id) {
        createLink.mutate(
          { source_id: connectFrom, target_id: node.id },
          { onSuccess: () => toast(copy.items.connected), onError: () => toast.error(copy.canvas.connectFailed) }
        );
      }
      setConnectFrom(null);
      setTool('select');
    },
    [tool, connectFrom, createLink, onOpenItem]
  );

  // note / link / image tools: the next click on the board places the item there
  const onPaneClick = useCallback(
    (e: React.MouseEvent) => {
      if (tool === 'connector') setConnectFrom(null);
      if (tool !== 'note' && tool !== 'link' && tool !== 'image') return;
      const at = flow.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setAdding({ type: tool, at: { x: Math.round(at.x - canvas.cardWidth / 2), y: Math.round(at.y - 40) } });
      setTool('select');
    },
    [tool, flow]
  );

  function commit(a: NewAnnotation) {
    createAnnotation.mutate({ ...a, sphere_id: target.id }, { onError: () => toast.error(copy.common.genericError) });
  }

  async function addPhotoSticker(file: File) {
    if (file.size > MAX_UPLOAD_BYTES || !isAllowedImage(file)) {
      toast.error(copy.items.imageTooBig);
      return;
    }
    const id = crypto.randomUUID();
    try {
      const path = await uploadImage(galaxyId, id, file);
      const rect = wrapper.current!.getBoundingClientRect();
      const c = flow.screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      commit({ id, sphere_id: target.id, kind: 'sticker', data: { image_path: path, size: 96 }, x: Math.round(c.x - 54), y: Math.round(c.y - 60), rotation: Math.round((Math.random() * 12 - 6) * 10) / 10 });
      setTool('select');
    } catch {
      toast.error(copy.common.genericError);
    }
  }

  const drawing = tool === 'pen' || tool === 'arrow' || tool === 'sticker';
  const placing = tool === 'note' || tool === 'link' || tool === 'image';
  const hint = placing ? copy.canvas.placeHint : tool === 'connector' ? (connectFrom ? copy.canvas.connectSecond : copy.canvas.connectFirst) : !items.length && canEdit ? copy.canvas.empty : null;

  return (
    <div ref={wrapper} className="relative h-full w-full">
      <ReactFlow<ItemNodeType, LinkEdgeType>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onNodeMouseEnter={(_, n) => setHovered(n.id)}
        onNodeMouseLeave={() => setHovered(null)}
        onPaneClick={onPaneClick}
        nodesConnectable={false}
        nodesDraggable={canEdit && !drawing}
        panOnDrag={!drawing}
        zoomOnDoubleClick={false}
        minZoom={0.15}
        maxZoom={2}
        colorMode={resolvedTheme === 'dark' ? 'dark' : 'light'}
        proOptions={{ hideAttribution: true }}
        className={cn('!bg-bg', placing && '[&_.react-flow__pane]:!cursor-crosshair')}
      >
        <Background variant={BackgroundVariant.Dots} gap={canvas.gridGap} size={1} color="var(--color-dot-grid)" />
        <AnnotationLayer annotations={annotations} profileById={profileById} interactive={canEdit && !drawing} draft={draft} />
        {drawing ? (
          <DrawingOverlay tool={tool} color={color} size={size} emoji={emoji} sphereId={target.id} onDraft={setDraft} onCommit={commit} />
        ) : null}
        {canEdit ? <Panel position="top-left" className="!m-3">
          <CanvasToolbar
            tool={tool}
            onTool={(t) => { setTool(t); setConnectFrom(null); }}
            color={color}
            onColor={setColor}
            size={size}
            onSize={setSize}
            emoji={emoji}
            onEmoji={setEmoji}
            onPhoto={() => photoInput.current?.click()}
          />
        </Panel> : null}
        <Panel position="bottom-right" className="!m-3 flex flex-col items-end gap-2">
          <MiniMap
            pannable
            zoomable
            ariaLabel={copy.canvas.minimap}
            nodeColor="var(--color-n-5)"
            nodeStrokeWidth={0}
            nodeBorderRadius={12}
            bgColor="var(--color-card)"
            maskColor="color-mix(in srgb, var(--color-n-3) 70%, transparent)"
            className="!relative !bottom-auto !right-auto !m-0 overflow-hidden rounded-card border border-border shadow-card-lifted max-md:hidden"
            style={{ width: 168, height: 108 }}
          />
          <CanvasControls />
        </Panel>
        {hint ? (
          <Panel position="bottom-center" className="!mb-4 max-sm:hidden">
            <span role="status" className="rounded-pill border border-border bg-card px-3 py-1.5 text-[12px] text-text-muted shadow-card">{hint}</span>
          </Panel>
        ) : null}
      </ReactFlow>

      <CanvasAddDialog
        type={adding?.type ?? null}
        position={adding?.at ?? null}
        galaxyId={galaxyId}
        sphere={target}
        spherePrivate={targetPrivate}
        onClose={() => setAdding(null)}
        onCreated={() => undefined}
      />

      <input
        ref={photoInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) void addPhotoSticker(f);
        }}
      />
    </div>
  );
}

/** The board canvas (RW2.5): cards, links and annotations on a neutral dot grid. */
export function SphereCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
