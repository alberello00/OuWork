'use client';

import { useReactFlow } from '@xyflow/react';
import { useRef } from 'react';
import { normaliseStroke } from '@/lib/annotationGeometry';
import type { NewAnnotation } from '@/lib/queries/annotations';

export type Tool = 'select' | 'pen' | 'arrow' | 'sticker';

interface Props {
  tool: Exclude<Tool, 'select'>;
  color: string;
  size: number;
  emoji: string;
  sphereId: string;
  onDraft: (draft: { kind: string; data: unknown; x: number; y: number } | null) => void;
  onCommit: (a: NewAnnotation) => void;
}

const STICKER_SIZE = 44;

/** Captures pointer input for the pen, arrow and sticker tools, in flow coordinates. */
export function DrawingOverlay({ tool, color, size, emoji, sphereId, onDraft, onCommit }: Props) {
  const { screenToFlowPosition } = useReactFlow();
  const points = useRef<number[][]>([]);
  const start = useRef<{ x: number; y: number } | null>(null);

  const toFlow = (e: React.PointerEvent) => screenToFlowPosition({ x: e.clientX, y: e.clientY });

  function down(e: React.PointerEvent) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toFlow(e);
    if (tool === 'sticker') {
      onCommit({
        sphere_id: sphereId,
        kind: 'sticker',
        data: { emoji, size: STICKER_SIZE },
        x: Math.round(p.x - STICKER_SIZE / 2),
        y: Math.round(p.y - STICKER_SIZE / 2),
        rotation: Math.round((Math.random() * 16 - 8) * 10) / 10,
      });
      return;
    }
    start.current = p;
    points.current = [[p.x, p.y, e.pressure || 0.5]];
  }

  function move(e: React.PointerEvent) {
    if (!start.current) return;
    const p = toFlow(e);
    if (tool === 'pen') {
      points.current.push([p.x, p.y, e.pressure || 0.5]);
      const n = normaliseStroke(points.current);
      onDraft({ kind: 'stroke', data: { points: n.points, color, size }, x: n.x, y: n.y });
    } else {
      onDraft({ kind: 'arrow', data: { dx: p.x - start.current.x, dy: p.y - start.current.y, color, size }, x: start.current.x, y: start.current.y });
    }
  }

  function up(e: React.PointerEvent) {
    const s = start.current;
    start.current = null;
    onDraft(null);
    if (!s) return;
    const p = toFlow(e);
    if (tool === 'pen' && points.current.length > 1) {
      // mouse has no pressure: drop the third value so perfect-freehand simulates it
      const pts = e.pointerType === 'pen' ? points.current : points.current.map(([x, y]) => [x!, y!]);
      const n = normaliseStroke(pts);
      onCommit({ sphere_id: sphereId, kind: 'stroke', data: { points: n.points, color, size }, x: Math.round(n.x), y: Math.round(n.y) });
    } else if (tool === 'arrow' && Math.hypot(p.x - s.x, p.y - s.y) > 12) {
      onCommit({
        sphere_id: sphereId,
        kind: 'arrow',
        data: { dx: Math.round(p.x - s.x), dy: Math.round(p.y - s.y), color, size },
        x: Math.round(s.x),
        y: Math.round(s.y),
      });
    }
    points.current = [];
  }

  return (
    <div
      className="nopan nodrag absolute inset-0 z-[6] touch-none"
      style={{ cursor: tool === 'sticker' ? 'copy' : 'crosshair' }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => { start.current = null; onDraft(null); }}
    />
  );
}
