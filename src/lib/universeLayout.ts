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
  const out: Placed[] = [{ id: sorted[0]!.id, x: 0, y: 0 }];
  const rest = sorted.slice(1);
  let ring = 1;
  let i = 0;
  while (i < rest.length) {
    const capacity = 6 * ring;
    const slice = rest.slice(i, i + capacity);
    const biggest = Math.max(...slice.map((s) => sphereDiameter(s.count)), sphereDiameter(sorted[0]!.count));
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
