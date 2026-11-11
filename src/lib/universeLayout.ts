import { sphereDiameter } from './tokens';

export interface Placed {
  id: string;
  x: number;
  y: number;
}

/**
 * "Reorganize": biggest spheres in the middle, the others on rings around it,
 * the inbox (Random) always last. Positions are sphere centres.
 */
export function arrangeSpheres(spheres: { id: string; count: number; isInbox: boolean }[]): Placed[] {
  const sorted = [...spheres].sort((a, b) => Number(a.isInbox) - Number(b.isInbox) || b.count - a.count);
  if (!sorted.length) return [];
  return [{ id: sorted[0]!.id, x: 0, y: 0 }, ...placeOnRings(sorted.slice(1), sorted[0]!.count)];
}

/**
 * Galaxy setup (RF14.4): the new, still empty spheres go on rings around the
 * sphere in the centre (Random), with the same geometry as "Reorganize".
 * `skip` leaves the first ring slots free for spheres that are already there.
 */
export function ringAroundCenter(ids: string[], skip = 0): Placed[] {
  const slots = [...Array.from({ length: skip }, (_, i) => ({ id: `skip:${i}`, count: 0 })), ...ids.map((id) => ({ id, count: 0 }))];
  return placeOnRings(slots, 0).slice(skip);
}

/** Rings of 6, 12, 18… spheres around a centre sphere holding `centerCount` items. */
function placeOnRings(rest: { id: string; count: number }[], centerCount: number): Placed[] {
  const out: Placed[] = [];
  let ring = 1;
  let i = 0;
  while (i < rest.length) {
    const capacity = 6 * ring;
    const slice = rest.slice(i, i + capacity);
    const biggest = Math.max(...slice.map((s) => sphereDiameter(s.count)), sphereDiameter(centerCount));
    const radius = ring * (biggest + 90);
    slice.forEach((s, k) => {
      const angle = -Math.PI / 2 + (k / slice.length) * Math.PI * 2 + (ring % 2 ? 0 : Math.PI / slice.length);
      out.push({ id: s.id, x: Math.round(Math.cos(angle) * radius), y: Math.round(Math.sin(angle) * radius) });
    });
    i += capacity;
    ring += 1;
  }
  return out;
}

/** Counts links between items of different top-level spheres, keyed "a|b" with a < b. */
export function sphereLinkCounts(
  links: { source_id: string; target_id: string }[],
  topSphereOfItem: Map<string, string>
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const l of links) {
    const a = topSphereOfItem.get(l.source_id);
    const b = topSphereOfItem.get(l.target_id);
    if (!a || !b || a === b) continue;
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}
