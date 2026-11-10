import { sphereVar } from '@/lib/tokens';

/** Colours available for strokes and arrows: the ink plus a few sphere colours. */
export const INK_COLORS = ['ink', 'coral', 'teal', 'sky', 'amber', 'lavender'] as const;
export type InkColor = (typeof INK_COLORS)[number];

export function inkColor(key: string | undefined): string {
  return !key || key === 'ink' ? 'var(--color-text)' : sphereVar(key);
}

export const STICKER_EMOJIS = ['⭐', '❤️', '✨', '📌', '✅', '🔥', '😍', '🌊', '☀️', '🍕'] as const;
export const STROKE_SIZES = [3, 6, 10] as const;
