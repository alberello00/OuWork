import { getStroke } from 'perfect-freehand';

/** Outline of a freehand stroke as an SVG path (points relative to the annotation origin). */
export function strokePath(points: number[][], size: number): string {
  const outline = getStroke(points, { size, thinning: 0.5, smoothing: 0.5, streamline: 0.5, simulatePressure: points.every((p) => p.length < 3) });
  if (!outline.length) return '';
  const d = outline.reduce<(string | number)[]>(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]!;
      acc.push(round(x0!), round(y0!), round((x0! + x1!) / 2), round((y0! + y1!) / 2));
      return acc;
    },
    ['M', ...(outline[0]!.map(round) as number[]), 'Q']
  );
  return `${d.join(' ')} Z`;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Normalises absolute points: returns the origin (min x/y) and points relative to it. */
export function normaliseStroke(points: number[][]): { x: number; y: number; points: number[][] } {
  const x = Math.min(...points.map((p) => p[0]!));
  const y = Math.min(...points.map((p) => p[1]!));
  return { x, y, points: points.map(([px, py, pr]) => (pr === undefined ? [round(px! - x), round(py! - y)] : [round(px! - x), round(py! - y), pr])) };
}

/** Gently curved arrow from (0,0) to (dx,dy): body path + arrowhead polygon. */
export function arrowPaths(dx: number, dy: number, size: number): { body: string; head: string } {
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const bend = Math.min(40, len * 0.15);
  const cx = dx / 2 + nx * bend;
  const cy = dy / 2 + ny * bend;
  // tangent at the end of the quadratic curve
  const tx = dx - cx;
  const ty = dy - cy;
  const tl = Math.hypot(tx, ty) || 1;
  const ux = tx / tl;
  const uy = ty / tl;
  const h = 8 + size * 2.5;
  const w = h * 0.6;
  const bx = dx - ux * h;
  const by = dy - uy * h;
  const head = `${round(dx)},${round(dy)} ${round(bx - uy * w)},${round(by + ux * w)} ${round(bx + uy * w)},${round(by - ux * w)}`;
  return { body: `M 0 0 Q ${round(cx)} ${round(cy)} ${round(bx)} ${round(by)}`, head };
}
