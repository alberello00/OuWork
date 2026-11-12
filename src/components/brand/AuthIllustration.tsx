import { sphereVar } from '@/lib/tokens';

const CARDS = [
  { x: 40, y: 48, w: 150, h: 84, color: 'sky', lines: [70, 110, 90] },
  { x: 250, y: 30, w: 150, h: 70, color: 'lavender', lines: [100, 60] },
  { x: 230, y: 160, w: 170, h: 96, color: 'teal', lines: [120, 90, 130] },
  { x: 60, y: 210, w: 130, h: 70, color: 'amber', lines: [80, 50] },
  { x: 150, y: 330, w: 170, h: 78, color: 'rose', lines: [110, 130] },
] as const;

const LINKS = ['M190 90 L250 65', 'M190 100 L230 195', 'M125 210 L115 132', 'M300 256 L250 330'];

/** Decorative board for the login and invite pages: a few cards on the dot grid, linked. */
export function AuthIllustration({ className }: { className?: string }) {
  return (
    <div aria-hidden className={`paper-sky relative overflow-hidden border-border max-md:border-b md:border-l ${className ?? ''}`}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 440 440" preserveAspectRatio="xMidYMid slice">
        {LINKS.map((d) => (
          <path key={d} d={d} stroke="var(--color-n-6)" strokeWidth="1.5" fill="none" />
        ))}
        {CARDS.map((c) => (
          <g key={c.color}>
            <rect x={c.x} y={c.y} width={c.w} height={c.h} rx="8" fill="var(--color-card)" stroke="var(--color-border)" />
            <rect x={c.x} y={c.y} width={c.w} height="4" rx="2" fill={sphereVar(c.color)} />
            {c.lines.map((w, i) => (
              <rect key={i} x={c.x + 14} y={c.y + 22 + i * 16} width={w} height={i === 0 ? 8 : 6} rx="3" fill={i === 0 ? 'var(--color-n-6)' : 'var(--color-n-4)'} />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}
