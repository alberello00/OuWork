'use client';

import { Handle, Position, type NodeProps, type Node, useStore } from '@xyflow/react';
import { memo } from 'react';
import { ItemCard } from '@/components/items/ItemCard';
import type { Item, Profile, Sphere } from '@/lib/queries/types';
import { canvas } from '@/lib/tokens';
import { cn } from '@/lib/utils';

export type ItemNodeData = {
  item: Item;
  sphere: Sphere | undefined;
  author: Profile | undefined;
  dimmed: boolean;
};
export type ItemNodeType = Node<ItemNodeData, 'item'>;

const zoomSelector = (s: { transform: [number, number, number] }) => s.transform[2] < canvas.semanticZoomThreshold;

/** A card on the canvas. Far away it only shows title and colour (RD6.2). */
export const ItemNode = memo(function ItemNode({ data, selected, dragging }: NodeProps<ItemNodeType>) {
  const compact = useStore(zoomSelector);
  return (
    <div
      style={{ width: canvas.cardWidth }}
      className={cn(
        'transition-opacity duration-150',
        dragging && '[&>*]:shadow-card-lifted',
        data.dimmed && 'opacity-45'
      )}
    >
      {/* edges need handles; links are not drawn by hand, so they stay invisible */}
      <Handle type="target" position={Position.Left} isConnectable={false} className="!pointer-events-none !opacity-0" />
      <ItemCard
        item={data.item}
        sphere={data.sphere}
        author={data.author}
        compact={compact}
        className={cn(selected && 'outline outline-2 outline-offset-1 outline-accent')}
      />
      <Handle type="source" position={Position.Right} isConnectable={false} className="!pointer-events-none !opacity-0" />
    </div>
  );
});
