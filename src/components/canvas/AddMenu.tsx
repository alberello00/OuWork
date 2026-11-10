'use client';

import { FileText, Image as ImageIcon, Link2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { copy } from '@/lib/copy';
import type { ItemType } from '@/lib/queries/types';

interface Props {
  at: { x: number; y: number };
  onPick: (type: ItemType) => void;
  onClose: () => void;
}

/** Small pop-up menu where you clicked, to pick what to create (RD6.5). */
export function AddMenu({ at, onPick, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.querySelector('button')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const items: { type: ItemType; label: string; icon: React.ReactNode }[] = [
    { type: 'note', label: copy.items.note, icon: <FileText size={16} aria-hidden /> },
    { type: 'link', label: copy.items.link, icon: <Link2 size={16} aria-hidden /> },
    { type: 'image', label: copy.items.image, icon: <ImageIcon size={16} aria-hidden /> },
  ];

  return (
    <>
      <div className="absolute inset-0 z-20" onPointerDown={onClose} aria-hidden />
      <div
        ref={ref}
        role="menu"
        aria-label={copy.canvas.addHere}
        className="absolute z-30 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-pill border border-border bg-card p-1 shadow-panel animate-fade-in"
        style={{ left: at.x, top: at.y }}
      >
        {items.map((i) => (
          <button
            key={i.type}
            type="button"
            role="menuitem"
            onClick={() => onPick(i.type)}
            className="inline-flex h-11 items-center gap-1.5 rounded-pill px-3.5 text-[13px] font-medium hover:bg-surface-2"
          >
            {i.icon}
            {i.label}
          </button>
        ))}
      </div>
    </>
  );
}
