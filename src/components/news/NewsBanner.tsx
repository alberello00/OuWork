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

/** "Since your last visit" banner (RF8.2, frames 3:2 / 10:2). Calm, closable. */
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
          'flex items-center gap-3 rounded-login border border-new-bg/70 bg-card/90 py-2 pl-3.5 pr-1.5 shadow-card backdrop-blur animate-fade-in',
          className
        )}
      >
        <span aria-hidden className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-new-bg text-new-text">
          <Sparkles size={15} />
        </span>
        <p className="min-w-0 flex-1 text-[13px] leading-snug">
          <span className="font-heading text-[15px]">{copy.news.title}</span>
          <span className="text-text-muted"> — {copy.news.summary(entries.length, joinNames(people), galaxyId ? 1 : galaxyCount)}</span>
        </p>
        <button type="button" onClick={() => setOpen(true)} className="inline-flex h-11 shrink-0 items-center rounded-pill px-3 text-[12.5px] font-semibold hover:bg-surface-2">
          {copy.news.seeAll}
        </button>
        <button type="button" aria-label={copy.news.dismiss} onClick={dismiss} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-text-muted hover:bg-surface-2">
          <X size={16} aria-hidden />
        </button>
      </div>
      <NewsDialog entries={entries} showGalaxy={!galaxyId} open={open} onOpenChange={setOpen} onDismiss={dismiss} />
    </>
  );
}
