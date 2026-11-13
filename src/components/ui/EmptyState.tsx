import { cn } from '@/lib/utils';

/** Empty state: one emoji, a title, a short hint. */
export function EmptyState({ emoji, title, body, className, children }: { emoji: string; title: string; body?: string; className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-6 py-14 text-center', className)}>
      <span aria-hidden className="text-[30px] leading-none">{emoji}</span>
      <p className="mt-2 text-[15px] font-semibold">{title}</p>
      {body ? <p className="max-w-xs text-[13px] leading-relaxed text-text-muted">{body}</p> : null}
      {children}
    </div>
  );
}
