import { sphereVar } from '@/lib/tokens';
import { cn } from '@/lib/utils';

/** Board label: emoji on a tint of the board colour. Never colour alone. */
export function SphereDot({ color, emoji, size = 22, className }: { color: string; emoji: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-flex shrink-0 items-center justify-center border', className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.55,
        borderRadius: Math.max(4, size * 0.22),
        borderColor: `color-mix(in srgb, ${sphereVar(color)} 55%, transparent)`,
        background: `color-mix(in srgb, ${sphereVar(color)} 16%, var(--color-card))`,
      }}
    >
      {emoji}
    </span>
  );
}
