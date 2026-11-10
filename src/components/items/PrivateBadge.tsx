import { Lock } from 'lucide-react';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

/** Lock + "only me" (RF4.3). */
export function PrivateBadge({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 text-[10.5px] font-medium text-text-muted', className)}>
      <Lock size={11} aria-hidden />
      {copy.common.onlyMe}
    </span>
  );
}
