import { cn } from '@/lib/utils';
import { copy } from '@/lib/copy';

/** Two overlapping circles: the two of us (RD1.1). */
export function Logo({ className, showName = true }: { className?: string; showName?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg width="30" height="22" viewBox="0 0 30 22" aria-hidden>
        <circle cx="10" cy="11" r="9" fill="var(--user-pink)" opacity="0.92" />
        <circle cx="20" cy="11" r="9" fill="var(--user-teal)" opacity="0.88" />
      </svg>
      {showName ? (
        <span className="font-heading text-[19px] leading-none">{copy.appName}</span>
      ) : (
        <span className="sr-only">{copy.appName}</span>
      )}
    </span>
  );
}
