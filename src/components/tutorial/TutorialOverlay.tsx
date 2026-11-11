'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { copy } from '@/lib/copy';
import { findTourTarget, placeCard, spotlightBox, SPOTLIGHT_PADDING, type Box, type ResolvedStep } from '@/lib/tutorial';
import { cn } from '@/lib/utils';

interface Props {
  steps: ResolvedStep[];
  /** finished, skipped or closed with Esc: all of them end the tutorial (RF15.1) */
  onFinish: () => void;
}

interface Layout {
  spot: (Box & { radius: number }) | null;
  card: { top: number; left: number } | null;
}

/**
 * Coach-marks over the real interface (RF15.3, RF15.4). The card is a modal
 * dialog (focus trapped and restored, Esc closes); the spotlight is a hole in
 * the dimmed layer, drawn with a huge box-shadow around the target.
 */
export function TutorialOverlay({ steps, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [layout, setLayout] = useState<Layout>({ spot: null, card: null });
  const [touch, setTouch] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const step = steps[Math.min(index, steps.length - 1)]!;
  const last = index >= steps.length - 1;
  const text: { title: string; body: string; bodyTouch?: string } = copy.tutorial.steps[step.id];

  useEffect(() => setTouch(window.matchMedia('(pointer: coarse)').matches), []);

  const measure = useCallback(() => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const el = step.target ? findTourTarget(step.target) : null;
    let spot: Layout['spot'] = null;
    if (el) {
      const r = el.getBoundingClientRect();
      const box = spotlightBox({ top: r.top, left: r.left, width: r.width, height: r.height }, viewport);
      const own = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 12;
      spot = { ...box, radius: Math.min(own + SPOTLIGHT_PADDING, Math.min(box.width, box.height) / 2) };
    }
    const card = cardRef.current;
    const size = card ? { width: card.offsetWidth, height: card.offsetHeight } : { width: 340, height: 230 };
    const placed = placeCard(spot, size, viewport);
    setLayout((prev) =>
      prev.card?.top === placed.top && prev.card.left === placed.left && prev.spot?.top === spot?.top && prev.spot?.left === spot?.left &&
      prev.spot?.width === spot?.width && prev.spot?.height === spot?.height
        ? prev
        : { spot, card: { top: placed.top, left: placed.left } }
    );
  }, [step]);

  // follow the target: the window may resize and planets drift slowly
  useLayoutEffect(measure, [measure, touch]);
  useEffect(() => {
    const timer = setInterval(measure, 250);
    window.addEventListener('resize', measure);
    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  // "Back" disappears on the first step: keep the focus inside the card
  useEffect(() => {
    if (cardRef.current && !cardRef.current.contains(document.activeElement)) nextRef.current?.focus();
  }, [index]);

  const { spot, card } = layout;

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onFinish()}>
      <DialogPrimitive.Portal>
        {spot ? (
          <div
            aria-hidden
            data-tutorial-spotlight
            className="pointer-events-none fixed z-[70] transition-[top,left,width,height,border-radius] duration-300 ease-[var(--ease-soft)] [box-shadow:0_0_0_200vmax_var(--color-overlay),0_0_0_2px_var(--color-new-bg)]"
            style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height, borderRadius: spot.radius }}
          />
        ) : (
          <div aria-hidden className="pointer-events-none fixed inset-0 z-[70] bg-overlay" />
        )}
        <DialogPrimitive.Content
          ref={cardRef}
          aria-label={copy.tutorial.label}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            nextRef.current?.focus();
          }}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className={cn(
            'fixed z-[71] w-[min(340px,calc(100vw-24px))] rounded-login border border-border bg-card p-4 text-text shadow-panel',
            'transition-[top,left] duration-300 ease-[var(--ease-soft)]',
            card ? 'animate-fade-in' : 'invisible'
          )}
          style={{ top: card?.top ?? 0, left: card?.left ?? 0 }}
        >
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-text-muted">
            <span aria-hidden className="flex gap-1">
              {steps.map((s, i) => (
                <span key={s.id} className={cn('h-1.5 w-3.5 rounded-pill', i <= index ? 'bg-accent' : 'bg-border')} />
              ))}
            </span>
            {copy.tutorial.progress(index + 1, steps.length)}
          </p>
          <DialogPrimitive.Title className="font-heading mt-2 text-[21px] leading-tight">{text.title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1.5 text-[13.5px] leading-relaxed text-text-muted">
            {touch && text.bodyTouch ? text.bodyTouch : text.body}
          </DialogPrimitive.Description>
          <p className="sr-only" aria-live="polite">{copy.tutorial.announce(index + 1, steps.length, text.title)}</p>

          <div className="mt-4 flex items-center gap-1.5">
            {!last ? (
              <Button variant="ghost" onClick={onFinish} className="-ml-2 text-text-muted">{copy.tutorial.skip}</Button>
            ) : null}
            <span className="flex-1" />
            {index > 0 ? (
              <Button variant="ghost" size="icon" aria-label={copy.common.back} onClick={() => setIndex(index - 1)}>
                <ArrowLeft size={17} aria-hidden />
              </Button>
            ) : null}
            <Button ref={nextRef} variant="primary" onClick={() => (last ? onFinish() : setIndex(index + 1))}>
              {last ? copy.tutorial.done : copy.tutorial.next}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
