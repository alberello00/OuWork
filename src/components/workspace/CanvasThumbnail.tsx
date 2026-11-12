import type { Item, Sphere } from '@/lib/queries/types';
import { canvas, sphereVar } from '@/lib/tokens';
import { cn } from '@/lib/utils';

/** Tiny preview of a board canvas: every card as a rectangle with its board colour. */
export function CanvasThumbnail({ items, sphereById, height = 120, className }: { items: Item[]; sphereById: Map<string, Sphere>; height?: number; className?: string }) {
  if (!items.length) return <div aria-hidden className={cn('paper-sky w-full', className)} style={{ height }} />;
  const xs = items.map((i) => i.x);
  const ys = items.map((i) => i.y);
  const minX = Math.min(...xs) - 60;
  const minY = Math.min(...ys) - 60;
  const w = Math.max(...xs) + canvas.cardWidth + 60 - minX;
  const h = Math.max(...ys) + 160 + 60 - minY;
  return (
    <svg viewBox={`${minX} ${minY} ${w} ${h}`} className={cn('paper-sky w-full', className)} style={{ height }} aria-hidden preserveAspectRatio="xMidYMid meet">
      {items.map((i) => (
        <g key={i.id}>
          <rect x={i.x} y={i.y} width={canvas.cardWidth} height={i.type === 'image' ? 200 : 120} rx={10} fill="var(--color-card)" stroke="var(--color-border)" strokeWidth={4} />
          <rect x={i.x} y={i.y} width={8} height={i.type === 'image' ? 200 : 120} rx={4} fill={sphereVar(sphereById.get(i.sphere_id)?.color)} />
        </g>
      ))}
    </svg>
  );
}
