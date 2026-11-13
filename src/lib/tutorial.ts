// First-login tutorial (RF15): step definitions and geometry, no React.
// Steps point at real interface elements through `data-tour` attributes.

export type TutorialStepId = 'galaxies' | 'enter' | 'add' | 'canvas' | 'private' | 'news' | 'invite';

export interface TutorialContext {
  /** the viewer created this galaxy */
  isOwner: boolean;
  isPersonal: boolean;
}

export interface TutorialStep {
  id: TutorialStepId;
  /** `data-tour` values to look for, in order of preference; the first visible one gets the spotlight */
  targets: string[];
  /**
   * What to do when no target is on screen (RF15.3):
   * `center` shows the step as a plain card, `skip` drops it.
   */
  missing: 'center' | 'skip';
  when?: (ctx: TutorialContext) => boolean;
}

/** The tour runs on the overview of a workspace. Order as in RF15.3. */
export const TUTORIAL_STEPS: TutorialStep[] = [
  { id: 'galaxies', targets: ['galaxy-switcher'], missing: 'center' },
  { id: 'enter', targets: ['board', 'board-inbox'], missing: 'skip' },
  { id: 'add', targets: ['add'], missing: 'skip' },
  // cards, links and drawings live inside a sphere: explained on the board you would open
  { id: 'canvas', targets: ['board', 'board-inbox'], missing: 'center' },
  { id: 'private', targets: ['board-private'], missing: 'center' },
  { id: 'news', targets: ['search'], missing: 'center' },
  { id: 'invite', targets: ['settings'], missing: 'skip', when: (ctx) => ctx.isOwner && !ctx.isPersonal },
];

export interface ResolvedStep {
  id: TutorialStepId;
  /** `data-tour` value that is on screen, or null for a centred card */
  target: string | null;
}

/**
 * Keeps the steps that make sense here and now: never a spotlight on nothing.
 * `isVisible` says whether an element with that `data-tour` value is on screen.
 */
export function resolveSteps(ctx: TutorialContext, isVisible: (target: string) => boolean, steps: TutorialStep[] = TUTORIAL_STEPS): ResolvedStep[] {
  const out: ResolvedStep[] = [];
  for (const step of steps) {
    if (step.when && !step.when(ctx)) continue;
    const target = step.targets.find(isVisible) ?? null;
    if (!target && step.missing === 'skip') continue;
    out.push({ id: step.id, target });
  }
  return out;
}

/** First element carrying that `data-tour` value whose centre is on screen. */
export function findTourTarget(target: string): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour~="${target}"]`)) {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    if (cx >= 0 && cy >= 0 && cx <= window.innerWidth && cy <= window.innerHeight) return el;
  }
  return null;
}

export interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const SPOTLIGHT_PADDING = 8;
const MARGIN = 12;
const GAP = 14;

/** The lit area around a target, kept inside the viewport. */
export function spotlightBox(target: Box, viewport: { width: number; height: number }, padding = SPOTLIGHT_PADDING): Box {
  const left = Math.max(4, target.left - padding);
  const top = Math.max(4, target.top - padding);
  const right = Math.min(viewport.width - 4, target.left + target.width + padding);
  const bottom = Math.min(viewport.height - 4, target.top + target.height + padding);
  return { left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

/**
 * Where the coach-mark card goes: under the spotlight if there is room, else
 * above it, else beside it, else over the middle of the screen. It never
 * leaves the viewport (RF15.4), whatever the size of the screen.
 */
export function placeCard(
  spot: Box | null,
  card: { width: number; height: number },
  viewport: { width: number; height: number }
): { top: number; left: number; side: 'below' | 'above' | 'right' | 'left' | 'center' } {
  const clampX = (x: number) => Math.round(Math.min(Math.max(MARGIN, x), Math.max(MARGIN, viewport.width - card.width - MARGIN)));
  const clampY = (y: number) => Math.round(Math.min(Math.max(MARGIN, y), Math.max(MARGIN, viewport.height - card.height - MARGIN)));
  const centered = { top: clampY((viewport.height - card.height) / 2), left: clampX((viewport.width - card.width) / 2), side: 'center' as const };
  if (!spot) return centered;

  const midX = spot.left + spot.width / 2 - card.width / 2;
  const midY = spot.top + spot.height / 2 - card.height / 2;
  const below = spot.top + spot.height + GAP;
  if (below + card.height + MARGIN <= viewport.height) return { top: Math.round(below), left: clampX(midX), side: 'below' };
  const above = spot.top - GAP - card.height;
  if (above >= MARGIN) return { top: Math.round(above), left: clampX(midX), side: 'above' };
  const right = spot.left + spot.width + GAP;
  if (right + card.width + MARGIN <= viewport.width) return { top: clampY(midY), left: Math.round(right), side: 'right' };
  const left = spot.left - GAP - card.width;
  if (left >= MARGIN) return { top: clampY(midY), left: Math.round(left), side: 'left' };
  return centered;
}
