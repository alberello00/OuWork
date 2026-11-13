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
        'inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-pill border px-2 py-0.5 text-[12px] font-medium max-sm:min-h-10',
        selected ? 'border-accent bg-accent-soft text-accent' : 'border-border bg-card text-text',
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
