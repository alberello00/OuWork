'use client';

import { useViewport, ViewportPortal } from '@xyflow/react';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { copy } from '@/lib/copy';
import { useDeleteAnnotation, useUpdateAnnotation } from '@/lib/queries/annotations';
import type { Annotation, Profile } from '@/lib/queries/types';
import { cn } from '@/lib/utils';
import { AnnotationShape } from './AnnotationShape';

interface Props {
  annotations: Annotation[];
  profileById: Map<string, Profile>;
  /** only in "select" mode annotations can be picked, moved and deleted */
  interactive: boolean;
  /** shape being drawn right now (pen / arrow), in flow coordinates */
  draft: { kind: string; data: unknown; x: number; y: number } | null;
}

/** Strokes, arrows and stickers above the cards, in flow coordinates (RF6). */
export function AnnotationLayer({ annotations, profileById, interactive, draft }: Props) {
  const { zoom } = useViewport();
  const update = useUpdateAnnotation();
  const del = useDeleteAnnotation();
  const [selected, setSelected] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const drag = useRef<{ id: string; sx: number; sy: number; moved: boolean } | null>(null);

  useEffect(() => {
    if (!interactive) setSelected(null);
  }, [interactive]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!selected || !(e.key === 'Delete' || e.key === 'Backspace')) return;
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, [contenteditable]')) return;
      const a = annotations.find((x) => x.id === selected);
      if (a) del.mutate(a);
      setSelected(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, annotations, del]);

  function onPointerDown(e: React.PointerEvent, a: Annotation) {
    if (!interactive) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { id: a.id, sx: e.clientX, sy: e.clientY, moved: false };
    setSelected(a.id);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.sx) / zoom;
    const dy = (e.clientY - d.sy) / zoom;
    if (Math.abs(dx) + Math.abs(dy) > 2) d.moved = true;
    setOffset({ id: d.id, dx, dy });
  }

  function onPointerUp(a: Annotation) {
    const d = drag.current;
    drag.current = null;
    if (d?.moved && offset?.id === a.id) {
      update.mutate({ id: a.id, x: Math.round(a.x + offset.dx), y: Math.round(a.y + offset.dy) });
    }
    setOffset(null);
  }

  return (
    <ViewportPortal>
      <div className="pointer-events-none absolute left-0 top-0 z-[5]" onClick={() => setSelected(null)}>
        {annotations.map((a) => {
          const off = offset?.id === a.id ? offset : null;
          const author = a.created_by ? profileById.get(a.created_by) : undefined;
          const isSel = selected === a.id;
          return (
            <div
              key={a.id}
              className={cn(
                'nodrag nopan absolute',
                interactive ? 'pointer-events-auto cursor-grab touch-none active:cursor-grabbing' : 'pointer-events-none',
                isSel && 'rounded-[6px] outline outline-2 outline-offset-4 outline-text/60'
              )}
              style={{
                transform: `translate(${a.x + (off?.dx ?? 0)}px, ${a.y + (off?.dy ?? 0)}px) rotate(${a.rotation}deg)`,
                transformOrigin: '0 0',
              }}
              title={author ? copy.canvas.drawnBy(author.display_name) : undefined}
              onPointerDown={(e) => onPointerDown(e, a)}
              onPointerMove={onPointerMove}
              onPointerUp={() => onPointerUp(a)}
              onClick={(e) => e.stopPropagation()}
            >
              <AnnotationShape kind={a.kind} data={a.data} />
              {isSel && interactive ? (
                <button
                  type="button"
                  aria-label={copy.canvas.deleteAnnotation}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    del.mutate(a);
                    setSelected(null);
                  }}
                  className="absolute -left-4 -top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-danger shadow-card"
                  style={{ transform: `scale(${1 / zoom})`, transformOrigin: 'center' }}
                >
                  <X size={15} aria-hidden />
                </button>
              ) : null}
            </div>
          );
        })}
        {draft ? (
          <div className="absolute opacity-80" style={{ transform: `translate(${draft.x}px, ${draft.y}px)`, transformOrigin: '0 0' }}>
            <AnnotationShape kind={draft.kind} data={draft.data} />
          </div>
        ) : null}
      </div>
    </ViewportPortal>
  );
}
