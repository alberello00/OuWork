// Design tokens as JS values, for places where a class name is not enough
// (canvas, SVG, dynamic sphere/user colours). Colour VALUES live in
// src/app/globals.css as CSS variables, one set per theme; here we only keep
// the palette keys and the helpers that point at those variables.

export const SPHERE_COLORS = [
  'coral',
  'amber',
  'sage',
  'teal',
  'sky',
  'lavender',
  'rose',
  'plum',
] as const;
export type SphereColor = (typeof SPHERE_COLORS)[number];

export const USER_COLORS = [
  'pink',
  'teal',
  'indigo',
  'orange',
  'green',
  'violet',
  'blue',
  'red',
] as const;
export type UserColor = (typeof USER_COLORS)[number];

export function isSphereColor(value: string | null | undefined): value is SphereColor {
  return !!value && (SPHERE_COLORS as readonly string[]).includes(value);
}

/** CSS colour for a sphere palette key, theme-aware. */
export function sphereVar(color: string | null | undefined): string {
  return `var(--sphere-${isSphereColor(color) ? color : 'amber'})`;
}

/** CSS colour for a personal colour key. */
export function userVar(color: string | null | undefined): string {
  const key = (USER_COLORS as readonly string[]).includes(color ?? '') ? color : 'teal';
  return `var(--user-${key})`;
}

export const SPHERE_EMOJIS = [
  '📥', '🗺️', '🔎', '🎨', '🛠️', '📣', '💡', '📋', '📦', '🗓️',
  '💬', '🧾', '📚', '📝', '❓', '🎙️', '📊', '🚀', '🐞', '✨',
] as const;

export const radius = { card: 8, pill: 6, login: 12 } as const;

/** Canvas geometry shared by cards, edges and annotations. */
export const canvas = {
  cardWidth: 240,
  semanticZoomThreshold: 0.55,
  gridGap: 22,
} as const;

/** Universe geometry (RD4.2): diameter grows with sqrt(items), clamped. */
export const universe = {
  minDiameter: 84,
  maxDiameter: 220,
  moonDiameter: 44,
} as const;

export function sphereDiameter(itemCount: number): number {
  const d = universe.minDiameter + Math.sqrt(Math.max(0, itemCount)) * 26;
  return Math.round(Math.min(universe.maxDiameter, d));
}

export const durations = { micro: 160, scene: 200 } as const;
