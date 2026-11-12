'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { copy } from '@/lib/copy';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

function Overlay() {
  return <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay animate-fade-in" />;
}

function CloseButton() {
  return (
    <DialogPrimitive.Close
      aria-label={copy.common.close}
      className="absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-pill text-text-muted hover:bg-surface-2"
    >
      <X size={18} aria-hidden />
    </DialogPrimitive.Close>
  );
}

interface ContentProps {
  title: string;
  description?: string;
  /** hide the title visually (still announced) */
  hideTitle?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Centered modal (RD9.3). On small screens it hugs the bottom like a sheet. */
export function DialogContent({ title, description, hideTitle, className, children }: ContentProps) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 bg-card text-text shadow-panel border border-border',
          'max-sm:inset-x-0 max-sm:bottom-0 max-sm:max-h-[92dvh] max-sm:rounded-t-login max-sm:animate-sheet-up',
          'sm:left-1/2 sm:top-1/2 sm:w-[min(92vw,460px)] sm:max-h-[88dvh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-login sm:animate-pop-in',
          'overflow-y-auto p-5 sm:p-6',
          className
        )}
      >
        <DialogPrimitive.Title
          className={cn('pr-10 text-[16px] font-semibold leading-tight', hideTitle && 'sr-only')}
        >
          {title}
        </DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description className="mt-1.5 text-[13px] leading-relaxed text-text-muted">
            {description}
          </DialogPrimitive.Description>
        ) : (
          <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
        )}
        {children}
        <CloseButton />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/** Side panel on desktop, full-height sheet on mobile (RD5.4). */
export function PanelContent({ title, hideTitle, className, children }: ContentProps) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 flex flex-col bg-card text-text shadow-panel border-border',
          'max-sm:inset-0 max-sm:animate-sheet-up',
          'sm:inset-y-0 sm:right-0 sm:w-[min(92vw,440px)] sm:border-l sm:animate-panel-in',
          className
        )}
      >
        <DialogPrimitive.Title
          className={cn('px-5 pt-5 pr-14 text-[16px] font-semibold leading-tight', hideTitle && 'sr-only')}
        >
          {title}
        </DialogPrimitive.Title>
        <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
        {children}
        <CloseButton />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/** Bottom sheet (RD8.2). Centered and narrower on desktop. */
export function SheetContent({ title, hideTitle, className, children }: ContentProps) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92dvh] w-full overflow-y-auto sm:max-w-[520px]',
          'rounded-t-login border border-border bg-card p-5 text-text shadow-panel animate-sheet-up',
          'sm:bottom-6 sm:rounded-login',
          className
        )}
      >
        <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-pill bg-border sm:hidden" />
        <DialogPrimitive.Title
          className={cn('pr-10 text-[16px] font-semibold leading-tight', hideTitle && 'sr-only')}
        >
          {title}
        </DialogPrimitive.Title>
        <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
        {children}
        <CloseButton />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
