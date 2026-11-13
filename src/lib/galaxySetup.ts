// Workspace setup (RW2.9): pure logic, no React. A template maps to a fixed
// list of boards: deterministic, no guessing, no LLM. Board names live in
// copy.ts; emoji and preferred colour live here.

import { copy } from './copy';
import { SPHERE_COLORS, type SphereColor } from './tokens';

export const TEMPLATE_IDS = ['productLaunch', 'researchProject', 'clientProject', 'blank'] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const MAX_SETUP_SPHERES = 10;
/** The Inbox is already there and it is sage: start by avoiding that colour. */
const INBOX_COLOR: SphereColor = 'sage';

interface BoardTemplate {
  /** stable key, also the key of the board name in copy.setup.boards */
  key: keyof typeof copy.setup.boards;
  emoji: string;
  /** preferred palette key; another one is used if it is already taken */
  color: SphereColor;
}

export const TEMPLATES: Record<TemplateId, BoardTemplate[]> = {
  productLaunch: [
    { key: 'roadmap', emoji: '🗺️', color: 'sky' },
    { key: 'research', emoji: '🔎', color: 'lavender' },
    { key: 'design', emoji: '🎨', color: 'rose' },
    { key: 'engineering', emoji: '🛠️', color: 'teal' },
    { key: 'marketing', emoji: '📣', color: 'amber' },
  ],
  researchProject: [
    { key: 'questions', emoji: '❓', color: 'amber' },
    { key: 'sources', emoji: '📚', color: 'teal' },
    { key: 'interviews', emoji: '🎙️', color: 'lavender' },
    { key: 'findings', emoji: '💡', color: 'sky' },
    { key: 'report', emoji: '📝', color: 'plum' },
  ],
  clientProject: [
    { key: 'brief', emoji: '📋', color: 'sky' },
    { key: 'deliverables', emoji: '📦', color: 'teal' },
    { key: 'meetings', emoji: '🗓️', color: 'lavender' },
    { key: 'feedback', emoji: '💬', color: 'coral' },
    { key: 'billing', emoji: '🧾', color: 'amber' },
  ],
  blank: [],
};

/** Preselection: a personal workspace starts blank, a shared one from the first template. */
export function guessTemplate(isPersonal: boolean): TemplateId {
  return isPersonal ? 'blank' : 'productLaunch';
}

export interface SetupSphere {
  /** "<template>:<board key>" */
  key: string;
  name: string;
  emoji: string;
  color: SphereColor;
}

/**
 * Gives every board a colour so that none repeats while the palette lasts:
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

/** The boards a template creates, always the same for the same template. */
export function buildSpheres(template: TemplateId): SetupSphere[] {
  const boards = TEMPLATES[template].slice(0, MAX_SETUP_SPHERES);
  const colors = assignColors(boards.map((b) => b.color));
  return boards.map((b, i) => ({
    key: `${template}:${b.key}`,
    name: copy.setup.boards[b.key],
    emoji: b.emoji,
    color: colors[i]!,
  }));
}

export function isValidSetupSphere(s: Pick<SetupSphere, 'name' | 'emoji'>): boolean {
  const name = s.name.trim();
  const emoji = s.emoji.trim();
  return name.length >= 1 && name.length <= 40 && [...emoji].length >= 1 && emoji.length <= 16;
}
