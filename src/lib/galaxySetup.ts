// Galaxy setup survey (RF14): pure logic, no React. The mapping from an
// interest to a sphere template is deterministic: no guessing, no LLM.

import { copy } from './copy';
import { SPHERE_COLORS, type SphereColor } from './tokens';

export const GALAXY_KINDS = ['couple', 'friends', 'family', 'solo'] as const;
export type GalaxyKind = (typeof GALAXY_KINDS)[number];

export const MAX_SETUP_SPHERES = 10;
/** Random is already there and it is sage: start by avoiding that colour. */
const INBOX_COLOR: SphereColor = 'sage';

export type InterestId =
  | 'dates' | 'places' | 'music' | 'movies' | 'books' | 'food' | 'recipes' | 'ideas'
  | 'memories' | 'gifts' | 'outdoor' | 'home' | 'events' | 'games' | 'podcasts';

interface InterestTemplate {
  emoji: string;
  /** preferred palette key; another one is used if it is already taken */
  color: SphereColor;
  /** only offered to these kinds */
  only?: GalaxyKind[];
}

/** Emoji and colour of each interest; labels and sphere names are in copy.ts. */
export const INTERESTS: Record<InterestId, InterestTemplate> = {
  dates: { emoji: '💞', color: 'rose', only: ['couple'] },
  places: { emoji: '📍', color: 'amber' },
  music: { emoji: '🎵', color: 'lavender' },
  movies: { emoji: '🎬', color: 'coral' },
  books: { emoji: '📚', color: 'teal' },
  food: { emoji: '🍝', color: 'terracotta' },
  recipes: { emoji: '🥘', color: 'moss' },
  ideas: { emoji: '💡', color: 'sky' },
  memories: { emoji: '📸', color: 'rose' },
  gifts: { emoji: '🎁', color: 'plum' },
  outdoor: { emoji: '⛰️', color: 'moss' },
  home: { emoji: '🏠', color: 'terracotta' },
  events: { emoji: '🎟️', color: 'plum' },
  games: { emoji: '🎮', color: 'sky' },
  podcasts: { emoji: '🎧', color: 'lavender' },
};

/** Chip label in the survey. */
export function interestLabel(id: InterestId): string {
  return copy.setup.interests[id].label;
}

/** Name of the sphere created for an interest; a few change with the kind of galaxy. */
export function sphereNameFor(id: InterestId, kind: GalaxyKind): string {
  const names: { sphere: string; sphereSolo?: string } = copy.setup.interests[id];
  return (kind === 'solo' && names.sphereSolo) || names.sphere;
}

/** What comes first depends on who shares the galaxy. */
const ORDER: Record<GalaxyKind, InterestId[]> = {
  couple: ['dates', 'places', 'food', 'movies', 'music', 'memories', 'gifts', 'recipes', 'events', 'books', 'ideas', 'outdoor', 'home', 'games', 'podcasts'],
  friends: ['places', 'events', 'food', 'movies', 'music', 'games', 'outdoor', 'memories', 'books', 'ideas', 'podcasts', 'gifts', 'recipes', 'home'],
  family: ['memories', 'recipes', 'home', 'places', 'food', 'events', 'gifts', 'movies', 'books', 'games', 'outdoor', 'music', 'ideas', 'podcasts'],
  solo: ['ideas', 'books', 'places', 'music', 'movies', 'recipes', 'podcasts', 'outdoor', 'home', 'food', 'gifts', 'memories', 'events', 'games'],
};

/** Interests offered to a kind of galaxy, in the order they are shown. */
export function interestsFor(kind: GalaxyKind): InterestId[] {
  return ORDER[kind].filter((id) => !INTERESTS[id].only || INTERESTS[id].only.includes(kind));
}

/** Preselection of step 1: personal galaxy → solo; otherwise from the number of members. */
export function guessKind(isPersonal: boolean, memberCount: number): GalaxyKind {
  if (isPersonal) return 'solo';
  return memberCount >= 3 ? 'friends' : 'couple';
}

export interface CustomInterest {
  name: string;
  emoji: string;
}

export interface SetupSphere {
  /** interest id, or "custom:<n>" */
  key: string;
  name: string;
  emoji: string;
  color: SphereColor;
}

/**
 * Gives every sphere a colour so that none repeats while the palette lasts:
 * the preferred colour if still free, otherwise the first free one. When the
 * palette is used up it starts again.
 */
export function assignColors(preferred: (SphereColor | undefined)[], taken: SphereColor[] = [INBOX_COLOR]): SphereColor[] {
  let used = new Set<SphereColor>(taken);
  return preferred.map((wish) => {
    if (used.size >= SPHERE_COLORS.length) used = new Set();
    const color = wish && !used.has(wish) ? wish : SPHERE_COLORS.find((c) => !used.has(c))!;
    used.add(color);
    return color;
  });
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * RF14.4: the spheres proposed in the preview. Catalogue interests come first,
 * in the order of the kind, then the free ones; names are unique, the inbox
 * name is never reused, and there are at most 10.
 */
export function buildSpheres(kind: GalaxyKind, selected: InterestId[], customs: CustomInterest[] = []): SetupSphere[] {
  const picked = interestsFor(kind).filter((id) => selected.includes(id));
  const drafts: { key: string; name: string; emoji: string; wish?: SphereColor }[] = picked.map((id) => {
    const t = INTERESTS[id];
    return { key: id, name: sphereNameFor(id, kind), emoji: t.emoji, wish: t.color };
  });
  customs.forEach((c, i) => {
    const name = c.name.trim().slice(0, 40);
    if (!name || sameName(name, copy.setup.inboxName) || drafts.some((d) => sameName(d.name, name))) return;
    drafts.push({ key: `custom:${i}`, name, emoji: c.emoji.trim() || '✨' });
  });
  const kept = drafts.slice(0, MAX_SETUP_SPHERES);
  const colors = assignColors(kept.map((d) => d.wish));
  return kept.map((d, i) => ({ key: d.key, name: d.name, emoji: d.emoji, color: colors[i]! }));
}

/** Keeps what the user already edited in the preview when the selection changes. */
export function mergePreview(previous: SetupSphere[], next: SetupSphere[]): SetupSphere[] {
  const byKey = new Map(previous.map((s) => [s.key, s]));
  return next.map((s) => byKey.get(s.key) ?? s);
}

export function isValidSetupSphere(s: Pick<SetupSphere, 'name' | 'emoji'>): boolean {
  const name = s.name.trim();
  const emoji = s.emoji.trim();
  return name.length >= 1 && name.length <= 40 && [...emoji].length >= 1 && emoji.length <= 16;
}
