'use client';

import { useReactFlow, useStore } from '@xyflow/react';
import { Maximize, Minus, Plus } from 'lucide-react';
import { copy } from '@/lib/copy';

const btn = 'inline-flex h-8 w-8 items-center justify-center rounded-pill text-text hover:bg-surface-2 max-sm:h-11 max-sm:w-11';
const zoomPercent = (s: { transform: [number, number, number] }) => Math.round(s.transform[2] * 100);

/** Zoom controls (RW2.5): out, level, in, fit. */
export function CanvasControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const zoom = useStore(zoomPercent);
  return (
    <div className="flex items-center gap-0.5 rounded-card border border-border bg-card p-1 shadow-card-lifted">
      <button type="button" aria-label={copy.canvas.zoomOut} className={btn} onClick={() => zoomOut({ duration: 150 })}><Minus size={15} aria-hidden /></button>
      <span aria-live="off" className="w-11 text-center font-mono text-[11px] tabular-nums text-text-muted max-sm:hidden">{zoom}%</span>
      <button type="button" aria-label={copy.canvas.zoomIn} className={btn} onClick={() => zoomIn({ duration: 150 })}><Plus size={15} aria-hidden /></button>
      <span aria-hidden className="mx-0.5 h-5 w-px bg-border" />
      <button type="button" aria-label={copy.canvas.fit} title={copy.canvas.fit} className={btn} onClick={() => fitView({ padding: 0.2, duration: 180, maxZoom: 1 })}><Maximize size={14} aria-hidden /></button>
    </div>
  );
}
