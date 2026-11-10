'use client';

import { BaseEdge, useInternalNode, type Edge, type EdgeProps } from '@xyflow/react';
import { memo } from 'react';

export type SphereEdgeData = { count: number; sourceSize: number; targetSize: number };
export type SphereEdgeType = Edge<SphereEdgeData, 'sphere'>;

/** Thin, semi-transparent arc between two planet centres; thicker with more links (RD4.4). */
export const SphereEdge = memo(function SphereEdge({ id, source, target, data }: EdgeProps<SphereEdgeType>) {
  const s = useInternalNode(source);
  const t = useInternalNode(target);
  if (!s || !t || !data) return null;
  const sx = s.internals.positionAbsolute.x + data.sourceSize / 2;
  const sy = s.internals.positionAbsolute.y + data.sourceSize / 2;
  const tx = t.internals.positionAbsolute.x + data.targetSize / 2;
  const ty = t.internals.positionAbsolute.y + data.targetSize / 2;
  const len = Math.hypot(tx - sx, ty - sy) || 1;
  const ux = (tx - sx) / len;
  const uy = (ty - sy) / len;
  // start and end on the planet rims, gently curved
  const ax = sx + ux * (data.sourceSize / 2 + 6);
  const ay = sy + uy * (data.sourceSize / 2 + 6);
  const bx = tx - ux * (data.targetSize / 2 + 6);
  const by = ty - uy * (data.targetSize / 2 + 6);
  const bend = Math.min(60, len * 0.12);
  const cx = (ax + bx) / 2 - uy * bend;
  const cy = (ay + by) / 2 + ux * bend;
  return (
    <BaseEdge
      id={id}
      path={`M ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`}
      style={{ stroke: 'var(--color-text-muted)', strokeOpacity: 0.45, strokeWidth: Math.min(1 + data.count * 0.9, 6), fill: 'none' }}
    />
  );
});
