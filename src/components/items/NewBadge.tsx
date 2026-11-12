import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

/** Calm accent-tinted badge for what changed since the last visit. */
export function NewBadge({ count, className }: { count?: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-[18px] shrink-0 items-center rounded-[4px] bg-new-bg px-1.5 text-[10px] font-semibold uppercase tracking-wide text-new-text',
        className
      )}
    >
      {count !== undefined ? copy.galaxies.newCount(count) : copy.common.new}
    </span>
  );
}
