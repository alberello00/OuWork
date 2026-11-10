import type { Sphere, SphereStat } from '@/lib/queries/types';
import { sphereDiameter } from '@/lib/tokens';
import { Planet } from './Planet';

const BOX_W = 260;
const BOX_H = 150;
const PAD = 26;

/** The spheres of a galaxy in miniature, keeping their relative layout. */
export function MiniGalaxy({ spheres, stats }: { spheres: Sphere[]; stats: Map<string, SphereStat> | undefined }) {
  const top = spheres.filter((s) => !s.parent_id);
  if (!top.length) return <div style={{ height: BOX_H }} />;
  const countOf = (id: string) =>
    (stats?.get(id)?.item_count ?? 0) +
    spheres.filter((c) => c.parent_id === id).reduce((n, c) => n + (stats?.get(c.id)?.item_count ?? 0), 0);
  const newOf = (id: string) =>
    (stats?.get(id)?.new_count ?? 0) +
    spheres.filter((c) => c.parent_id === id).reduce((n, c) => n + (stats?.get(c.id)?.new_count ?? 0), 0);

  const xs = top.map((s) => s.x);
  const ys = top.map((s) => s.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const spanX = Math.max(1, Math.max(...xs) - minX);
  const spanY = Math.max(1, Math.max(...ys) - minY);
  const scale = Math.min((BOX_W - PAD * 2) / spanX, (BOX_H - PAD * 2) / spanY, 0.25);

  return (
    <div className="relative mx-auto" style={{ width: BOX_W, height: BOX_H }} aria-hidden>
      {top.map((s) => {
        const size = Math.max(16, sphereDiameter(countOf(s.id)) * 0.26);
        const cx = BOX_W / 2 + (s.x - minX - spanX / 2) * scale;
        const cy = BOX_H / 2 + (s.y - minY - spanY / 2) * scale;
        return (
          <span key={s.id} className="absolute" style={{ left: cx - size / 2, top: cy - size / 2 }}>
            <Planet color={s.color} emoji={s.emoji} size={size} empty={countOf(s.id) === 0} hasNews={newOf(s.id) > 0} glow={size > 24} />
          </span>
        );
      })}
    </div>
  );
}
