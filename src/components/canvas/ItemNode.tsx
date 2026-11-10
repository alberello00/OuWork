'use client';

import { type NodeProps, type Node, useStore } from '@xyflow/react';
import { memo } from 'react';
import { ItemCard } from '@/components/items/ItemCard';
import type { Item, Profile, Sphere } from '@/lib/queries/types';
import { canvas } from '@/lib/tokens';
import { cn } from '@/lib/utils';

export type ItemNodeData = {
  item: Item;
  sphere: Sphere | undefined;
  author: Profile | undefined;
  tilt: number;
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
        'transition-[transform,opacity] duration-200',
        dragging && 'rotate-[1.5deg] scale-[1.02] [&>*]:shadow-card-lifted',
        data.dimmed && 'opacity-45'
      )}
    >
      <ItemCard
        item={data.item}
        sphere={data.sphere}
        author={data.author}
        compact={compact}
        tilt={data.tilt}
        className={cn(selected && 'outline outline-2 outline-offset-2 outline-text')}
      />
    </div>
  );
});
