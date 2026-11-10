'use client';

import { ArrowUpRight, Hand, ImagePlus, Pencil, Sticker } from 'lucide-react';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';
import type { Tool } from './DrawingOverlay';
import { INK_COLORS, inkColor, STICKER_EMOJIS, STROKE_SIZES } from './inkColors';

interface Props {
  tool: Tool;
  onTool: (t: Tool) => void;
  color: string;
  onColor: (c: string) => void;
  size: number;
  onSize: (s: number) => void;
  emoji: string;
  onEmoji: (e: string) => void;
  onPhoto: () => void;
}

const TOOLS: { tool: Tool; label: string; icon: React.ReactNode }[] = [
  { tool: 'select', label: copy.canvas.select, icon: <Hand size={17} aria-hidden /> },
  { tool: 'pen', label: copy.canvas.pen, icon: <Pencil size={17} aria-hidden /> },
  { tool: 'arrow', label: copy.canvas.arrow, icon: <ArrowUpRight size={17} aria-hidden /> },
  { tool: 'sticker', label: copy.canvas.sticker, icon: <Sticker size={17} aria-hidden /> },
];

const btn = 'inline-flex h-11 w-11 items-center justify-center rounded-pill transition-colors duration-200';

/** Select / pen / arrow / sticker, with colour, thickness and sticker choice. */
export function CanvasToolbar({ tool, onTool, color, onColor, size, onSize, emoji, onEmoji, onPhoto }: Props) {
  return (
    <div className="flex flex-col items-start gap-2">
      <div role="toolbar" aria-label={copy.canvas.tools} className="flex items-center gap-0.5 rounded-pill border border-border bg-card p-1 shadow-card">
        {TOOLS.map((t) => (
          <button
            key={t.tool}
            type="button"
            aria-label={t.label}
            title={t.label}
            aria-pressed={tool === t.tool}
            onClick={() => onTool(t.tool)}
            className={cn(btn, tool === t.tool ? 'bg-text text-bg' : 'hover:bg-surface-2')}
          >
            {t.icon}
          </button>
        ))}
      </div>

      {tool === 'pen' || tool === 'arrow' ? (
        <div className="flex items-center gap-0.5 rounded-pill border border-border bg-card p-1 shadow-card">
          {INK_COLORS.map((c) => (
            <button key={c} type="button" aria-label={`${copy.canvas.colour}: ${c}`} aria-pressed={color === c} onClick={() => onColor(c)} className={btn}>
              <span className={cn('h-5 w-5 rounded-full', color === c && 'ring-2 ring-text ring-offset-2 ring-offset-card')} style={{ background: inkColor(c) }} />
            </button>
          ))}
          <span aria-hidden className="mx-1 h-6 w-px bg-border" />
          {STROKE_SIZES.map((s) => (
            <button key={s} type="button" aria-label={`${copy.canvas.thickness}: ${s}`} aria-pressed={size === s} onClick={() => onSize(s)} className={cn(btn, size === s && 'bg-surface-2')}>
              <span className="rounded-full bg-text" style={{ width: s + 3, height: s + 3 }} />
            </button>
          ))}
        </div>
      ) : null}

      {tool === 'sticker' ? (
        <div className="flex max-w-[calc(100vw-24px)] flex-wrap items-center gap-0.5 rounded-login border border-border bg-card p-1 shadow-card">
          {STICKER_EMOJIS.map((e) => (
            <button key={e} type="button" aria-pressed={emoji === e} onClick={() => onEmoji(e)} className={cn(btn, 'text-[20px]', emoji === e && 'bg-surface-2 ring-2 ring-text')}>
              {e}
            </button>
          ))}
          <button type="button" aria-label={copy.canvas.photo} title={copy.canvas.photo} onClick={onPhoto} className={cn(btn, 'hover:bg-surface-2')}>
            <ImagePlus size={18} aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
