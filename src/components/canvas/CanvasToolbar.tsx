'use client';

import { ArrowUpRight, FileText, Image as ImageIcon, ImagePlus, Link2, MousePointer2, Pencil, Spline, Sticker } from 'lucide-react';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';
import type { Tool } from './DrawingOverlay';
import { INK_COLORS, inkColor, STICKER_EMOJIS, STROKE_SIZES } from './inkColors';

/** Drawing tools, plus the ones that place an item or connect two items. */
export type CanvasTool = Tool | 'note' | 'link' | 'image' | 'connector';

interface Props {
  tool: CanvasTool;
  onTool: (t: CanvasTool) => void;
  color: string;
  onColor: (c: string) => void;
  size: number;
  onSize: (s: number) => void;
  emoji: string;
  onEmoji: (e: string) => void;
  onPhoto: () => void;
}

const TOOLS: { tool: CanvasTool; label: string; icon: React.ReactNode; divider?: boolean }[] = [
  { tool: 'select', label: copy.canvas.select, icon: <MousePointer2 size={17} aria-hidden /> },
  { tool: 'note', label: copy.items.note, icon: <FileText size={17} aria-hidden />, divider: true },
  { tool: 'link', label: copy.items.link, icon: <Link2 size={17} aria-hidden /> },
  { tool: 'image', label: copy.items.image, icon: <ImageIcon size={17} aria-hidden /> },
  { tool: 'connector', label: copy.canvas.connector, icon: <Spline size={17} aria-hidden />, divider: true },
  { tool: 'pen', label: copy.canvas.pen, icon: <Pencil size={17} aria-hidden /> },
  { tool: 'arrow', label: copy.canvas.arrow, icon: <ArrowUpRight size={17} aria-hidden /> },
  { tool: 'sticker', label: copy.canvas.sticker, icon: <Sticker size={17} aria-hidden /> },
];

const btn = 'inline-flex h-9 w-9 items-center justify-center rounded-pill transition-colors duration-150 max-sm:h-11 max-sm:w-11';
const tray = 'rounded-card border border-border bg-card p-1 shadow-card-lifted';

/** Floating toolbar (RW2.5): select, note, link, image, connector, pen, arrow, sticker. */
export function CanvasToolbar({ tool, onTool, color, onColor, size, onSize, emoji, onEmoji, onPhoto }: Props) {
  return (
    <div className="flex items-start gap-2">
      <div role="toolbar" aria-label={copy.canvas.tools} aria-orientation="vertical" className={cn(tray, 'flex flex-col gap-0.5')}>
        {TOOLS.map((t) => (
          <span key={t.tool} className="contents">
            {t.divider ? <span aria-hidden className="mx-1.5 my-0.5 h-px bg-border" /> : null}
            <button
              type="button"
              aria-label={t.label}
              title={t.label}
              aria-pressed={tool === t.tool}
              onClick={() => onTool(tool === t.tool ? 'select' : t.tool)}
              className={cn(btn, tool === t.tool ? 'bg-accent-soft text-accent' : 'text-text hover:bg-surface-2')}
            >
              {t.icon}
            </button>
          </span>
        ))}
      </div>

      {tool === 'pen' || tool === 'arrow' ? (
        <div className={cn(tray, 'flex flex-wrap items-center gap-0.5')}>
          {INK_COLORS.map((c) => (
            <button key={c} type="button" aria-label={`${copy.canvas.colour}: ${c}`} aria-pressed={color === c} onClick={() => onColor(c)} className={btn}>
              <span className={cn('h-4 w-4 rounded-full', color === c && 'ring-2 ring-accent ring-offset-2 ring-offset-card')} style={{ background: inkColor(c) }} />
            </button>
          ))}
          <span aria-hidden className="mx-1 h-5 w-px bg-border" />
          {STROKE_SIZES.map((s) => (
            <button key={s} type="button" aria-label={`${copy.canvas.thickness}: ${s}`} aria-pressed={size === s} onClick={() => onSize(s)} className={cn(btn, size === s && 'bg-surface-2')}>
              <span className="rounded-full bg-text" style={{ width: s + 3, height: s + 3 }} />
            </button>
          ))}
        </div>
      ) : null}

      {tool === 'sticker' ? (
        <div className={cn(tray, 'flex max-w-[calc(100vw-80px)] flex-wrap items-center gap-0.5')}>
          {STICKER_EMOJIS.map((e) => (
            <button key={e} type="button" aria-pressed={emoji === e} onClick={() => onEmoji(e)} className={cn(btn, 'text-[18px]', emoji === e && 'bg-accent-soft')}>
              {e}
            </button>
          ))}
          <button type="button" aria-label={copy.canvas.photo} title={copy.canvas.photo} onClick={onPhoto} className={cn(btn, 'hover:bg-surface-2')}>
            <ImagePlus size={17} aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
