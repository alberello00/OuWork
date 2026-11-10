import { Lock } from 'lucide-react';
import { copy } from '@/lib/copy';

/** Universe legend (frame 3:2 / 5:2). Every meaning is spelled out, not only shown by colour. */
export function Legend({ showMoonsHint }: { showMoonsHint?: boolean }) {
  const dot = 'inline-block h-2.5 w-2.5 rounded-full';
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-login border border-border bg-card/85 px-3.5 py-2 text-[11px] text-text-muted shadow-card backdrop-blur">
      <span className="flex items-center gap-1.5"><span className={`${dot} bg-text-muted`} />{copy.universe.legendSize}</span>
      <span className="flex items-center gap-1.5"><span className="inline-block h-px w-4 bg-text-muted" />{copy.universe.legendLines}</span>
      <span className="flex items-center gap-1.5"><span className={`${dot} border border-dashed border-text-muted`} />{copy.universe.legendEmpty}</span>
      <span className="flex items-center gap-1.5"><Lock size={11} aria-hidden />{copy.universe.legendPrivate}</span>
      <span className="flex items-center gap-1.5"><span className={`${dot} bg-new-bg`} />{copy.universe.legendNew}</span>
      {showMoonsHint ? <span className="italic">{copy.universe.closer}</span> : null}
    </div>
  );
}
