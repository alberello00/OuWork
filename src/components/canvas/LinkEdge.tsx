'use client';

import { BaseEdge, getBezierPath, Position, useInternalNode, type Edge, type EdgeProps, type InternalNode } from '@xyflow/react';
import { memo } from 'react';

export type LinkEdgeData = { color: string; highlight: boolean };
export type LinkEdgeType = Edge<LinkEdgeData, 'link'>;

function box(n: InternalNode) {
  const { x, y } = n.internals.positionAbsolute;
  const w = n.measured.width ?? 0;
  const h = n.measured.height ?? 0;
  return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
}

/** The side of `a` that faces `b`, and the point in the middle of it. */
function anchor(a: ReturnType<typeof box>, b: ReturnType<typeof box>) {
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  // cards are wider than tall: compare the gaps, not the raw distances
  if (Math.abs(dx) - (a.w + b.w) / 2 >= Math.abs(dy) - (a.h + b.h) / 2) {
    return dx >= 0 ? { x: a.x + a.w, y: a.cy, side: Position.Right } : { x: a.x, y: a.cy, side: Position.Left };
  }
  return dy >= 0 ? { x: a.cx, y: a.y + a.h, side: Position.Bottom } : { x: a.cx, y: a.y, side: Position.Top };
}

/** Bezier between two cards, leaving each from the side that faces the other. */
export const LinkEdge = memo(function LinkEdge({ id, source, target, data }: EdgeProps<LinkEdgeType>) {
  const s = useInternalNode(source);
  const t = useInternalNode(target);
  if (!s || !t) return null;
  const sb = box(s);
  const tb = box(t);
  const from = anchor(sb, tb);
  const to = anchor(tb, sb);
  const [path] = getBezierPath({ sourceX: from.x, sourceY: from.y, sourcePosition: from.side, targetX: to.x, targetY: to.y, targetPosition: to.side });
  const highlight = data?.highlight;
  return (
    <BaseEdge
      id={id}
      path={path}
      interactionWidth={14}
      style={{
        stroke: data?.color ?? 'var(--color-text-muted)',
        strokeWidth: highlight ? 2.5 : 1.5,
        opacity: highlight ? 1 : 0.75,
        transition: 'stroke-width 150ms, opacity 150ms',
      }}
    />
  );
});
