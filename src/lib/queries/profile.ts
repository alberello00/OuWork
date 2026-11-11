'use client';

import { useMutation } from '@tanstack/react-query';
import { db, unwrap } from './client';

/** RF15.1: remembers that the tutorial was finished or skipped. Idempotent. */
export function useCompleteTutorial() {
  return useMutation({
    mutationFn: async () => unwrap(await db().rpc('complete_tutorial')) ?? null,
  });
}
