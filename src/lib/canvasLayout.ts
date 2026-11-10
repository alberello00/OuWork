import { canvas } from './tokens';

const COL_GAP = canvas.cardWidth + 40;
const ROW_GAP = 260;
const COLUMNS = 4;

/** Where a new card goes when it is not dropped at a precise point: next free slot of a 4-column grid. */
export function nextFreeSpot(existing: { x: number; y: number }[]): { x: number; y: number } {
  const taken = new Set(existing.map((p) => `${Math.round(p.x / COL_GAP)}:${Math.round(p.y / ROW_GAP)}`));
  for (let i = 0; i < 10_000; i++) {
    const col = i % COLUMNS;
    const row = Math.floor(i / COLUMNS);
    if (!taken.has(`${col}:${row}`)) return { x: col * COL_GAP, y: row * ROW_GAP };
  }
  return { x: 0, y: 0 };
}
