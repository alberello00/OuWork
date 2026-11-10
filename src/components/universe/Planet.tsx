import { Lock } from 'lucide-react';
import { sphereVar } from '@/lib/tokens';
import { cn } from '@/lib/utils';

interface Props {
  color: string;
  emoji: string;
  size: number;
  empty?: boolean;
  isPrivate?: boolean;
  hasNews?: boolean;
  glow?: boolean;
  className?: string;
}

/** A sphere as a soft planet: radial gradient, halo, emoji in the middle (RD4.1, RD4.5). */
export function Planet({ color, emoji, size, empty, isPrivate, hasNews, glow = true, className }: Props) {
  const c = sphereVar(color);
  return (
    <span
      aria-hidden
      className={cn('relative inline-flex shrink-0 items-center justify-center rounded-full transition-[box-shadow,transform] duration-200', className)}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(12, size * 0.34),
        background: empty
          ? 'transparent'
          : `radial-gradient(circle at 32% 28%, color-mix(in srgb, ${c} 62%, white), ${c} 62%, color-mix(in srgb, ${c} 70%, black))`,
        border: empty ? `2px dashed ${c}` : undefined,
        boxShadow: glow && !empty ? `0 0 ${size * 0.3}px ${size * 0.04}px color-mix(in srgb, ${c} 40%, transparent)` : undefined,
      }}
    >
      <span className={cn(empty && 'opacity-70')}>{emoji}</span>
      {isPrivate ? (
        <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-text shadow-card" style={{ fontSize: 12 }}>
          <Lock size={12} />
        </span>
      ) : null}
      {hasNews ? (
        <span className="absolute right-[8%] top-[8%] h-3.5 w-3.5 rounded-full border-2 border-card bg-new-bg" />
      ) : null}
    </span>
  );
}
