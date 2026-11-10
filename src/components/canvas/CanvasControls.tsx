'use client';

import { useReactFlow } from '@xyflow/react';
import { Maximize, Minus, Plus } from 'lucide-react';
import { copy } from '@/lib/copy';

const btn = 'inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-text shadow-zoom hover:bg-surface-2';

/** Small zoom controls in a corner (RD6.4). */
export function CanvasControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  return (
    <div className="flex flex-col gap-1.5">
      <button type="button" aria-label={copy.canvas.zoomIn} className={btn} onClick={() => zoomIn({ duration: 200 })}><Plus size={16} aria-hidden /></button>
      <button type="button" aria-label={copy.canvas.zoomOut} className={btn} onClick={() => zoomOut({ duration: 200 })}><Minus size={16} aria-hidden /></button>
      <button type="button" aria-label={copy.canvas.fit} className={btn} onClick={() => fitView({ padding: 0.2, duration: 350, maxZoom: 1 })}><Maximize size={15} aria-hidden /></button>
    </div>
  );
}
