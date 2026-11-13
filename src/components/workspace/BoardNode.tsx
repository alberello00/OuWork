'use client';

import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Lock } from 'lucide-react';
import { memo } from 'react';
import { NewBadge } from '@/components/items/NewBadge';
import { copy } from '@/lib/copy';
import type { Sphere } from '@/lib/queries/types';
import { sphereVar } from '@/lib/tokens';
import { cn } from '@/lib/utils';

export const BOARD_NODE = { width: 208, height: 60 } as const;

export type BoardNodeData = { sphere: Sphere; count: number; newCount: number; subCount: number; isPrivate: boolean };
export type BoardNodeType = Node<BoardNodeData, 'board'>;

/** A board on the workspace map (RW2.3): a plain rectangle with the board colour as a label. */
export const BoardNode = memo(function BoardNode({ data, selected }: NodeProps<BoardNodeType>) {
  const { sphere, count, newCount, subCount, isPrivate } = data;
  return (
    <div
      className={cn(
        'flex select-none items-center gap-2.5 overflow-hidden rounded-card border bg-card pl-3 pr-2.5 shadow-card',
        selected ? 'border-accent ring-2 ring-accent/25' : 'border-border hover:border-n-6'
      )}
      style={{ width: BOARD_NODE.width, height: BOARD_NODE.height, borderLeftColor: sphereVar(sphere.color), borderLeftWidth: 4 }}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} className="!pointer-events-none !left-1/2 !top-1/2 !opacity-0" />
      <Handle type="source" position={Position.Top} isConnectable={false} className="!pointer-events-none !left-1/2 !top-1/2 !opacity-0" />
      <span aria-hidden className="text-[18px] leading-none">{sphere.emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold leading-tight">{sphere.name}</span>
          {isPrivate ? <Lock size={11} aria-label={copy.common.onlyMe} className="shrink-0 text-text-muted" /> : null}
        </span>
        <span className="block truncate text-[11px] text-text-muted">
          {copy.spheres.items(count)}
          {subCount ? ` · ${copy.universe.subBoards(subCount)}` : ''}
        </span>
      </span>
      {newCount ? <NewBadge count={newCount} /> : null}
    </div>
  );
});
