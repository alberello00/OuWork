'use client';

import { Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { copy } from '@/lib/copy';
import { useTouchLastSeen } from '@/lib/queries/items';
import { useNews } from '@/lib/queries/useNews';
import { cn } from '@/lib/utils';
import { NewsDialog } from './NewsDialog';

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} ${copy.news.and} ${names.at(-1)}`;
}

/** "Since your last visit" banner. Calm, closable. */
export function NewsBanner({ galaxyId, className }: { galaxyId?: string; className?: string }) {
  const { entries, people, galaxyCount } = useNews(galaxyId);
  const touch = useTouchLastSeen();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  if (!entries.length || hidden) return null;

  function dismiss() {
    setHidden(true);
    touch.mutate(undefined, { onSuccess: () => toast(copy.news.dismissed), onError: () => setHidden(false) });
  }

  return (
    <>
      <div
        role="status"
        className={cn(
          'flex items-center gap-3 rounded-card border border-border bg-card py-1 pl-3 pr-1 animate-fade-in',
          className
        )}
      >
        <span aria-hidden className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-new-bg text-new-text">
          <Sparkles size={15} />
        </span>
        <p className="min-w-0 flex-1 text-[13px] leading-snug">
          <span className="font-semibold">{copy.news.title}</span>
          <span className="text-text-muted"> — {copy.news.summary(entries.length, joinNames(people), galaxyId ? 1 : galaxyCount)}</span>
        </p>
        <button type="button" onClick={() => setOpen(true)} className="inline-flex h-9 shrink-0 items-center rounded-pill px-2.5 text-[12.5px] font-semibold text-accent hover:bg-surface-2 max-sm:h-11">
          {copy.news.seeAll}
        </button>
        <button type="button" aria-label={copy.news.dismiss} onClick={dismiss} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-pill text-text-muted hover:bg-surface-2 max-sm:h-11 max-sm:w-11">
          <X size={16} aria-hidden />
        </button>
      </div>
      <NewsDialog entries={entries} showGalaxy={!galaxyId} open={open} onOpenChange={setOpen} onDismiss={dismiss} />
    </>
  );
}
