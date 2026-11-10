'use client';

import { Handle, Position, useStore, type Node, type NodeProps } from '@xyflow/react';
import { memo } from 'react';
import { NewBadge } from '@/components/items/NewBadge';
import type { Sphere } from '@/lib/queries/types';
import { universe } from '@/lib/tokens';
import { cn, hashUnit } from '@/lib/utils';
import { Planet } from './Planet';

export type PlanetNodeData = {
  sphere: Sphere;
  size: number;
  count: number;
  newCount: number;
  isPrivate: boolean;
  moons: { sphere: Sphere; count: number; newCount: number }[];
  onMoon: (sphereId: string) => void;
};
export type PlanetNodeType = Node<PlanetNodeData, 'planet'>;

const SHOW_MOONS_ZOOM = 0.9;
const zoomedIn = (s: { transform: [number, number, number] }) => s.transform[2] >= SHOW_MOONS_ZOOM;

/** Sphere-planet in the galaxy universe, with its sub-spheres as moons up close. */
export const PlanetNode = memo(function PlanetNode({ data, selected, dragging }: NodeProps<PlanetNodeType>) {
  const close = useStore(zoomedIn);
  const { sphere, size, count, newCount, isPrivate, moons } = data;
  const orbit = size / 2 + universe.moonDiameter / 2 + 10;
  const delay = `${-hashUnit(sphere.id) * 14}s`;

  return (
    <div className="group relative flex flex-col items-center" style={{ width: size }}>
      <Handle type="target" position={Position.Top} isConnectable={false} className="!pointer-events-none !left-1/2 !top-1/2 !opacity-0" />
      <Handle type="source" position={Position.Top} isConnectable={false} className="!pointer-events-none !left-1/2 !top-1/2 !opacity-0" />
      <div className={cn(!dragging && 'animate-drift')} style={{ animationDelay: delay }}>
        <div className={cn('rounded-full transition-transform duration-200 group-hover:scale-[1.04]', selected && 'ring-2 ring-offset-4 ring-offset-transparent ring-[var(--color-new-bg)]')}>
          <Planet color={sphere.color} emoji={sphere.emoji} size={size} empty={count === 0} isPrivate={isPrivate} hasNews={newCount > 0} />
        </div>
        {close
          ? moons.map((m, i) => {
              const angle = -Math.PI / 3 + (i * Math.PI * 2) / Math.max(moons.length, 5);
              return (
                <button
                  key={m.sphere.id}
                  type="button"
                  title={`${m.sphere.name} · ${m.count}`}
                  aria-label={`${m.sphere.name} · ${m.count}`}
                  onClick={(e) => { e.stopPropagation(); data.onMoon(m.sphere.id); }}
                  className="nodrag absolute flex flex-col items-center animate-fade-in"
                  style={{
                    left: size / 2 + Math.cos(angle) * orbit - universe.moonDiameter / 2,
                    top: size / 2 + Math.sin(angle) * orbit - universe.moonDiameter / 2,
                  }}
                >
                  <Planet color={m.sphere.color} emoji={m.sphere.emoji} size={universe.moonDiameter} empty={m.count === 0} hasNews={m.newCount > 0} glow={false} />
                  <span className="mt-0.5 whitespace-nowrap text-[10px] font-medium text-text-muted">{m.sphere.name} · {m.count}</span>
                </button>
              );
            })
          : null}
      </div>
      <div className="mt-2 flex flex-col items-center gap-1 text-center">
        <span className="font-heading whitespace-nowrap text-[18px] leading-tight text-text">{sphere.name}</span>
        <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
          {count}
          {newCount > 0 ? <NewBadge count={newCount} /> : null}
        </span>
      </div>
    </div>
  );
});
