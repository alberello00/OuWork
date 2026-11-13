'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from '@/components/shell/SessionProvider';
import { useGalaxies } from '@/lib/queries/galaxies';
import { useCompleteTutorial } from '@/lib/queries/profile';
import { findTourTarget, resolveSteps, type ResolvedStep } from '@/lib/tutorial';
import { TutorialOverlay } from './TutorialOverlay';

const TutorialContext = createContext<{ start: () => void } | null>(null);

/** "Replay tutorial" (RF15.5). */
export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorial must be used inside TutorialProvider');
  return ctx;
}

const CHECK_MS = 300;
/** the universe must stay quiet this many checks in a row before the tour starts */
const QUIET_CHECKS = 3;

/**
 * Runs the first-login tutorial on the universe of a galaxy (RF15.2): it waits
 * until planets are on screen and nothing else is in the way, so the setup
 * survey (a dialog) and its arriving planets always come first.
 */
export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const { userId, tutorialCompletedAt } = useSession();
  const params = useParams<{ galaxyId?: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { data: galaxies } = useGalaxies();
  const complete = useCompleteTutorial();
  const [done, setDone] = useState(!!tutorialCompletedAt);
  const [replay, setReplay] = useState(false);
  const [steps, setSteps] = useState<ResolvedStep[] | null>(null);

  const galaxy = galaxies?.find((g) => g.id === params.galaxyId);
  const onUniverse = !!galaxy && pathname === `/w/${galaxy.id}`;
  const waiting = (!done || replay) && !steps && onUniverse;
  const isOwner = galaxy?.owner_id === userId;
  const isPersonal = !!galaxy?.is_personal;

  useEffect(() => {
    if (!waiting) return;
    let quiet = 0;
    const timer = setInterval(() => {
      const ready = !!findTourTarget('board') || !!findTourTarget('board-inbox');
      const busy = !!document.querySelector('[role="dialog"], [role="menu"]');
      quiet = ready && !busy ? quiet + 1 : 0;
      if (quiet < QUIET_CHECKS) return;
      clearInterval(timer);
      const resolved = resolveSteps({ isOwner, isPersonal }, (t) => !!findTourTarget(t));
      setReplay(false);
      if (resolved.length) setSteps(resolved);
    }, CHECK_MS);
    return () => clearInterval(timer);
  }, [waiting, isOwner, isPersonal]);

  const finish = useCallback(() => {
    setSteps(null);
    if (!done) {
      setDone(true);
      complete.mutate();
    }
  }, [done, complete]);

  const start = useCallback(() => {
    setReplay(true);
    // the tour lives on a universe: go to one if we are somewhere else
    if (!onUniverse) {
      const target = galaxy ?? galaxies?.[0];
      if (target) router.push(`/w/${target.id}`);
    }
  }, [onUniverse, galaxy, galaxies, router]);

  const value = useMemo(() => ({ start }), [start]);

  return (
    <TutorialContext.Provider value={value}>
      {children}
      {steps ? <TutorialOverlay steps={steps} onFinish={finish} /> : null}
    </TutorialContext.Provider>
  );
}
