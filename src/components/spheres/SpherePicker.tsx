'use client';

import type { Sphere } from '@/lib/queries/types';
import { cn } from '@/lib/utils';
import { SphereChip } from './SphereChip';

interface Props {
  spheres: Sphere[];
  value: string | null;
  onChange: (id: string | null) => void;
  /** allow "nothing selected" (quick add → Random) */
  allowNone?: boolean;
  label: string;
  exclude?: (s: Sphere) => boolean;
}

/** Spheres as coloured chips with emoji (RD8.2). Sub-spheres follow their parent. */
export function SpherePicker({ spheres, value, onChange, allowNone, label, exclude }: Props) {
  const top = spheres.filter((s) => !s.parent_id);
  const ordered = top.flatMap((t) => [t, ...spheres.filter((s) => s.parent_id === t.id)]).filter((s) => !exclude?.(s));

  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {ordered.map((s) => {
        const selected = value === s.id;
        return (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected && allowNone ? null : s.id)}
            className={cn('rounded-pill', s.parent_id && 'ml-3')}
          >
            <SphereChip sphere={s} selected={selected} />
          </button>
        );
      })}
    </div>
  );
}
