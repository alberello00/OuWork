'use client';

import { useEffect } from 'react';

/** ⌘K on Mac, Ctrl+K elsewhere. */
export function useModK(onTrigger: () => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onTrigger();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onTrigger]);
}
