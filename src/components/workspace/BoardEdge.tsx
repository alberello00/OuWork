'use client';

import { BaseEdge, useInternalNode, type Edge, type EdgeProps } from '@xyflow/react';
import { memo } from 'react';
import { BOARD_NODE } from './BoardNode';

export type BoardEdgeData = { count: number };
export type BoardEdgeType = Edge<BoardEdgeData, 'board'>;

/** Straight line between two board centres; thicker with more links between their items. */
export const BoardEdge = memo(function BoardEdge({ id, source, target, data }: EdgeProps<BoardEdgeType>) {
  const s = useInternalNode(source);
  const t = useInternalNode(target);
  if (!s || !t || !data) return null;
  const sx = s.internals.positionAbsolute.x + BOARD_NODE.width / 2;
  const sy = s.internals.positionAbsolute.y + BOARD_NODE.height / 2;
  const tx = t.internals.positionAbsolute.x + BOARD_NODE.width / 2;
  const ty = t.internals.positionAbsolute.y + BOARD_NODE.height / 2;
  return (
    <BaseEdge
      id={id}
      path={`M ${sx} ${sy} L ${tx} ${ty}`}
      style={{ stroke: 'var(--color-n-6)', strokeWidth: Math.min(1 + (data.count - 1) * 1.25, 7), fill: 'none' }}
    />
  );
});
