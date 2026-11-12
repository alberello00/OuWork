import { cn } from '@/lib/utils';
import { copy } from '@/lib/copy';

/**
 * OuWork mark, proposal A "Linked boards" (RW2.8, chosen by Albi on 2026-11-12):
 * two boards, the one in front filled with the accent. Colours come from the
 * theme tokens, so it follows light and dark.
 * The mask id is static: every instance defines the same mask, so duplicates are harmless.
 */
export function Logo({ className, showName = true, size = 22 }: { className?: string; showName?: boolean; size?: number }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0">
        <defs>
          <mask id="ouwork-logo-gap" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
            <rect width="64" height="64" fill="#fff" />
            <rect x="21" y="21" width="42" height="42" rx="11" fill="#000" />
          </mask>
        </defs>
        <rect x="7" y="7" width="32" height="32" rx="8" fill="none" stroke="var(--color-text)" strokeWidth="6" mask="url(#ouwork-logo-gap)" />
        <rect x="25" y="25" width="34" height="34" rx="8" fill="var(--color-accent)" />
      </svg>
      {showName ? (
        <span className="text-[15px] font-semibold leading-none tracking-tight">{copy.appName}</span>
      ) : (
        <span className="sr-only">{copy.appName}</span>
      )}
    </span>
  );
}
