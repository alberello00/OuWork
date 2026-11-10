import type { Item, Sphere } from '@/lib/queries/types';
import { canvas, sphereVar } from '@/lib/tokens';

/** Tiny preview of a sphere canvas: every card as a coloured rectangle. */
export function CanvasThumbnail({ items, sphereById, height = 120 }: { items: Item[]; sphereById: Map<string, Sphere>; height?: number }) {
  if (!items.length) return null;
  const xs = items.map((i) => i.x);
  const ys = items.map((i) => i.y);
  const minX = Math.min(...xs) - 40;
  const minY = Math.min(...ys) - 40;
  const w = Math.max(...xs) + canvas.cardWidth + 40 - minX;
  const h = Math.max(...ys) + 160 + 40 - minY;
  return (
    <svg viewBox={`${minX} ${minY} ${w} ${h}`} className="paper-sky w-full rounded-card border border-border" style={{ height }} aria-hidden preserveAspectRatio="xMidYMid meet">
      {items.map((i) => (
        <g key={i.id}>
          <rect x={i.x} y={i.y} width={canvas.cardWidth} height={i.type === 'image' ? 200 : 120} rx={12} fill="var(--color-card)" stroke="var(--color-border)" strokeWidth={4} />
          <rect x={i.x} y={i.y} width={canvas.cardWidth} height={14} rx={6} fill={sphereVar(sphereById.get(i.sphere_id)?.color)} />
        </g>
      ))}
    </svg>
  );
}
