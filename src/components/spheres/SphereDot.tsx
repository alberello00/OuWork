import { sphereVar } from '@/lib/tokens';
import { cn } from '@/lib/utils';

/** Small coloured planet with the sphere emoji: never colour alone (RD10.2). */
export function SphereDot({ color, emoji, size = 22, className }: { color: string; emoji: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full', className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.55,
        background: `radial-gradient(circle at 32% 28%, color-mix(in srgb, ${sphereVar(color)} 65%, white), ${sphereVar(color)} 70%)`,
      }}
    >
      {emoji}
    </span>
  );
}
