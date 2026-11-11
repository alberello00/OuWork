'use client';

import { Handle, Position, useStore, type Node, type NodeProps } from '@xyflow/react';
import { memo, useEffect, useRef } from 'react';
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
  /** right click / long press: open the planet menu at these viewport coordinates */
  onMenu: (sphereId: string, x: number, y: number, longPress?: boolean) => void;
  /** just deleted: fading away (RF12.3) */
  leaving?: boolean;
  /** just created by the setup survey: appears after the ones before it (RF14.7) */
  arriveIndex?: number;
};
export type PlanetNodeType = Node<PlanetNodeData, 'planet'>;

const SHOW_MOONS_ZOOM = 0.9;
const zoomedIn = (s: { transform: [number, number, number] }) => s.transform[2] >= SHOW_MOONS_ZOOM;
export const ARRIVE_DELAY_MS = 350;
export const ARRIVE_STAGGER_MS = 110;
const LONG_PRESS_MS = 520;
const LONG_PRESS_SLOP = 10;

/** Sphere-planet in the galaxy universe, with its sub-spheres as moons up close. */
export const PlanetNode = memo(function PlanetNode({ data, selected, dragging }: NodeProps<PlanetNodeType>) {
  const close = useStore(zoomedIn);
  const { sphere, size, count, newCount, isPrivate, moons } = data;
  const orbit = size / 2 + universe.moonDiameter / 2 + 10;
  const delay = `${-hashUnit(sphere.id) * 14}s`;

  // long press on touch screens opens the same menu as a right click (iOS has no contextmenu event)
  const press = useRef<{ timer: ReturnType<typeof setTimeout>; x: number; y: number } | null>(null);
  const cancelPress = () => {
    if (press.current) clearTimeout(press.current.timer);
    press.current = null;
  };
  useEffect(() => cancelPress, []);

  return (
    <div
      className={cn('group relative flex select-none flex-col items-center [-webkit-touch-callout:none]', data.leaving && 'pointer-events-none animate-planet-out', data.arriveIndex !== undefined && !data.leaving && 'animate-planet-in')}
      style={{ width: size, animationDelay: data.arriveIndex !== undefined && !data.leaving ? `${ARRIVE_DELAY_MS + data.arriveIndex * ARRIVE_STAGGER_MS}ms` : undefined }}
      onContextMenu={(e) => {
        e.preventDefault();
        cancelPress();
        data.onMenu(sphere.id, e.clientX, e.clientY);
      }}
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse') return;
        cancelPress();
        const { clientX: x, clientY: y } = e;
        press.current = { x, y, timer: setTimeout(() => { press.current = null; data.onMenu(sphere.id, x, y, true); }, LONG_PRESS_MS) };
      }}
      onPointerMove={(e) => {
        if (press.current && Math.hypot(e.clientX - press.current.x, e.clientY - press.current.y) > LONG_PRESS_SLOP) cancelPress();
      }}
      onPointerUp={cancelPress}
      onPointerCancel={cancelPress}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} className="!pointer-events-none !left-1/2 !top-1/2 !opacity-0" />
      <Handle type="source" position={Position.Top} isConnectable={false} className="!pointer-events-none !left-1/2 !top-1/2 !opacity-0" />
      <div className={cn(!dragging && 'animate-drift')} style={{ animationDelay: delay }}>
        <div data-tour={cn(sphere.is_inbox ? 'planet-inbox' : 'planet', isPrivate && 'planet-private')} className={cn('rounded-full transition-transform duration-200 group-hover:scale-[1.04]', selected && 'ring-2 ring-offset-4 ring-offset-transparent ring-[var(--color-new-bg)]')}>
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
