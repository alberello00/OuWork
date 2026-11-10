import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SphereDot } from './SphereDot';

interface Props {
  sphere: { name: string; color: string; emoji: string; is_private?: boolean };
  count?: number;
  selected?: boolean;
  className?: string;
}

/** Sphere label: colour + emoji + name (+ count), e.g. "Italy · 14" (RF2.6). */
export function SphereChip({ sphere, count, selected, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[12px] font-medium',
        selected ? 'border-text bg-text text-bg' : 'border-border bg-surface-2 text-text',
        className
      )}
    >
      <SphereDot color={sphere.color} emoji={sphere.emoji} size={18} />
      <span className="truncate">{sphere.name}</span>
      {sphere.is_private ? <Lock size={11} aria-label="only me" className="shrink-0 opacity-70" /> : null}
      {count !== undefined ? <span className="shrink-0 opacity-70">· {count}</span> : null}
    </span>
  );
}
