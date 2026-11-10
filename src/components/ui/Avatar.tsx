import { cn, initialOf } from '@/lib/utils';
import { userVar } from '@/lib/tokens';

interface AvatarProps {
  name: string | null | undefined;
  color: string | null | undefined;
  size?: number;
  className?: string;
  /** ring colour comes from the surrounding surface */
  ring?: boolean;
}

/** Initial on the person's colour (RD1.2). The name is always exposed as text. */
export function Avatar({ name, color, size = 24, className, ring }: AvatarProps) {
  return (
    <span
      title={name ?? undefined}
      aria-label={name ?? undefined}
      role="img"
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold text-on-user',
        ring && 'ring-2 ring-card',
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.45), backgroundColor: userVar(color) }}
    >
      {initialOf(name)}
    </span>
  );
}
