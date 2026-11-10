import { sphereVar } from '@/lib/tokens';

const BUBBLES = [
  { color: 'amber', emoji: '📍', size: 112, left: '14%', top: '18%', delay: '0s' },
  { color: 'lavender', emoji: '🎵', size: 78, left: '62%', top: '12%', delay: '-4s' },
  { color: 'coral', emoji: '🎬', size: 92, left: '58%', top: '52%', delay: '-8s' },
  { color: 'sky', emoji: '💡', size: 64, left: '22%', top: '62%', delay: '-2s' },
  { color: 'rose', emoji: '📸', size: 54, left: '42%', top: '36%', delay: '-6s' },
] as const;

/** Decorative night sky with a few floating spheres (login, invite). */
export function NightIllustration({ className }: { className?: string }) {
  return (
    <div aria-hidden className={`night-sky relative overflow-hidden ${className ?? ''}`}>
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path d="M27 30 Q45 20 66 22" stroke="var(--color-night-border)" strokeWidth="0.4" fill="none" />
        <path d="M27 30 Q30 50 30 70" stroke="var(--color-night-border)" strokeWidth="0.4" fill="none" />
        <path d="M66 22 Q72 40 68 62" stroke="var(--color-night-border)" strokeWidth="0.4" fill="none" />
      </svg>
      {BUBBLES.map((b) => (
        <span
          key={b.color}
          className="absolute flex animate-drift items-center justify-center rounded-full"
          style={{
            left: b.left,
            top: b.top,
            width: b.size,
            height: b.size,
            fontSize: b.size * 0.36,
            animationDelay: b.delay,
            background: `radial-gradient(circle at 32% 28%, color-mix(in srgb, ${sphereVar(b.color)} 70%, white), ${sphereVar(b.color)} 62%, color-mix(in srgb, ${sphereVar(b.color)} 72%, black))`,
            boxShadow: `0 0 34px 4px color-mix(in srgb, ${sphereVar(b.color)} 38%, transparent)`,
          }}
        >
          {b.emoji}
        </span>
      ))}
    </div>
  );
}
