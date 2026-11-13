import { Eye } from 'lucide-react';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

/** "View only" pill shown to viewers (RW3). */
export function ReadOnlyBadge({ className }: { className?: string }) {
  return (
    <span
      title={copy.common.readOnlyHint}
      className={cn('inline-flex h-8 items-center gap-1.5 rounded-pill border border-border bg-surface-2 px-2.5 text-[12px] font-medium text-text-muted', className)}
    >
      <Eye size={14} aria-hidden />
      {copy.common.readOnly}
    </span>
  );
}
