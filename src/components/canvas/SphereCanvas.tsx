'use client';

import '@xyflow/react/dist/base.css';
import {
  Background,
  BackgroundVariant,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
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
import { useLinks } from '@/lib/queries/links';
import { isAllowedImage, MAX_UPLOAD_BYTES, uploadImage } from '@/lib/queries/storage';
import type { Item, ItemType, Profile, Sphere } from '@/lib/queries/types';
import { canvas, sphereVar } from '@/lib/tokens';
import { tiltFor } from '@/lib/utils';
import { AddMenu } from './AddMenu';
import { AnnotationLayer } from './AnnotationLayer';
import { CanvasAddDialog } from './CanvasAddDialog';
import { CanvasControls } from './CanvasControls';
import { CanvasToolbar } from './CanvasToolbar';
import { DrawingOverlay, type Tool } from './DrawingOverlay';
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
}

function CanvasInner(props: Props) {
  const { galaxyId, target, targetPrivate, scopeIds, items, sphereById, profileById, isNew, focusId, onOpenItem } = props;
  const { resolvedTheme } = useTheme();
  const flow = useReactFlow();
  const wrapper = useRef<HTMLDivElement>(null);
  const move = useMoveItemOnCanvas(galaxyId);
  const createAnnotation = useCreateAnnotation();
  const { data: annotations = [] } = useAnnotations(scopeIds);
  const itemIds = useMemo(() => new Set(items.map((i) => i.id)), [items]);
  const { data: links = [] } = useLinks(galaxyId, itemIds);

  const [tool, setTool] = useState<Tool>('select');
  const [color, setColor] = useState('coral');
  const [size, setSize] = useState(6);
  const [emoji, setEmoji] = useState('⭐');
  const [draft, setDraft] = useState<{ kind: string; data: unknown; x: number; y: number } | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ screen: { x: number; y: number }; flow: { x: number; y: number } } | null>(null);
  const [adding, setAdding] = useState<{ type: ItemType; at: { x: number; y: number } } | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  // ── nodes: server data, but positions of cards being dragged stay local ──
  const dragging = useRef(new Set<string>());
  const pending = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const [nodes, setNodes, onNodesChange] = useNodesState<ItemNodeType>([]);

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
          selected: old?.selected,
          width: canvas.cardWidth,
          data: {
            item: { ...item, is_new: isNew(item.id) },
            sphere: sphereById.get(item.sphere_id),
            author: item.created_by ? profileById.get(item.created_by) : undefined,
            tilt: item.type === 'image' ? tiltFor(item.id) : 0,
            dimmed: false,
          },
        };
      });
    });
  }, [items, sphereById, profileById, isNew, setNodes]);

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
    if (didFit.current || !nodes.length) return;
    didFit.current = true;
    requestAnimationFrame(() => {
      const focus = focusId ? nodes.find((n) => n.id === focusId) : undefined;
      if (focus) flow.setCenter(focus.position.x + canvas.cardWidth / 2, focus.position.y + 80, { zoom: 1, duration: 400 });
      else flow.fitView({ padding: 0.2, maxZoom: 1 });
    });
  }, [nodes, focusId, flow]);

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

  const onNodeClick: NodeMouseHandler<ItemNodeType> = useCallback((_, node) => onOpenItem(node.id), [onOpenItem]);

  const onPaneClick = useCallback(
    (e: React.MouseEvent) => {
      if (tool !== 'select') return;
      const rect = wrapper.current!.getBoundingClientRect();
      setMenu({
        screen: { x: e.clientX - rect.left, y: e.clientY - rect.top },
        flow: flow.screenToFlowPosition({ x: e.clientX, y: e.clientY }),
      });
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

  const drawing = tool !== 'select';

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
        nodesDraggable={!drawing}
        panOnDrag={!drawing}
        zoomOnDoubleClick={false}
        minZoom={0.15}
        maxZoom={2}
        colorMode={resolvedTheme === 'dark' ? 'dark' : 'light'}
        proOptions={{ hideAttribution: true }}
        className="!bg-bg"
      >
        <Background variant={BackgroundVariant.Dots} gap={canvas.gridGap} size={1.4} color="var(--color-dot-grid)" />
        <AnnotationLayer annotations={annotations} profileById={profileById} interactive={!drawing} draft={draft} />
        {drawing ? (
          <DrawingOverlay tool={tool} color={color} size={size} emoji={emoji} sphereId={target.id} onDraft={setDraft} onCommit={commit} />
        ) : null}
        <Panel position="top-left" className="!m-3">
          <CanvasToolbar
            tool={tool}
            onTool={(t) => { setTool(t); setMenu(null); }}
            color={color}
            onColor={setColor}
            size={size}
            onSize={setSize}
            emoji={emoji}
            onEmoji={setEmoji}
            onPhoto={() => photoInput.current?.click()}
          />
        </Panel>
        <Panel position="bottom-left" className="!mb-5 !ml-3">
          <CanvasControls />
        </Panel>
        {!drawing && !menu ? (
          <Panel position="bottom-center" className="!mb-6 max-sm:hidden">
            <span className="rounded-pill border border-border bg-card/90 px-3.5 py-2 text-[11.5px] text-text-muted shadow-card">
              {items.length ? copy.canvas.hint : copy.canvas.empty}
            </span>
          </Panel>
        ) : null}
      </ReactFlow>

      {menu ? (
        <AddMenu
          at={menu.screen}
          onClose={() => setMenu(null)}
          onPick={(type) => { setAdding({ type, at: { x: Math.round(menu.flow.x - canvas.cardWidth / 2), y: Math.round(menu.flow.y - 40) } }); setMenu(null); }}
        />
      ) : null}

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

/** The sphere canvas (RF5, RF6, RF7.2): cards, links and annotations on an infinite dotted plane. */
export function SphereCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
