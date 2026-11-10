'use client';

import { BaseEdge, getBezierPath, type Edge, type EdgeProps } from '@xyflow/react';
import { memo } from 'react';

export type LinkEdgeData = { color: string; highlight: boolean };
export type LinkEdgeType = Edge<LinkEdgeData, 'link'>;

/** Soft bezier between two cards, in the colour of the source sphere (RD6.3). */
export const LinkEdge = memo(function LinkEdge(props: EdgeProps<LinkEdgeType>) {
  const [path] = getBezierPath(props);
  const highlight = props.data?.highlight;
  return (
    <BaseEdge
      id={props.id}
      path={path}
      interactionWidth={14}
      style={{
        stroke: props.data?.color ?? 'var(--color-text-muted)',
        strokeWidth: highlight ? 3 : 1.75,
        opacity: highlight ? 1 : 0.7,
        strokeDasharray: highlight ? undefined : '1 0',
        transition: 'stroke-width 200ms, opacity 200ms',
      }}
    />
  );
});
