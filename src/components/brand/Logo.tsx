import { cn } from '@/lib/utils';
import { copy } from '@/lib/copy';

/**
 * Placeholder mark until Albi picks one of the proposals in docs/logo (RW2.8):
 * a plain accent square with the initial.
 */
export function Logo({ className, showName = true }: { className?: string; showName?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span aria-hidden className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] bg-accent-strong text-[13px] font-bold leading-none text-on-accent">O</span>
      {showName ? (
        <span className="text-[15px] font-semibold leading-none tracking-tight">{copy.appName}</span>
      ) : (
        <span className="sr-only">{copy.appName}</span>
      )}
    </span>
  );
}
