'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

/** Paper / night switch (RF11.4). */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      aria-label={copy.nav.theme}
      aria-pressed={dark}
      title={dark ? copy.nav.themeLight : copy.nav.themeDark}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-pill text-text hover:bg-surface-2 transition-colors duration-200',
        className
      )}
    >
      {dark ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
    </button>
  );
}
