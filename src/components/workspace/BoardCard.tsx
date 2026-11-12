'use client';

import { Lock, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { NewBadge } from '@/components/items/NewBadge';
import { SphereDot } from '@/components/spheres/SphereDot';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '@/components/ui/Dropdown';
import { copy } from '@/lib/copy';
import type { Item, Profile, Sphere } from '@/lib/queries/types';
import { sphereVar } from '@/lib/tokens';
import { cn, timeAgo } from '@/lib/utils';
import { CanvasThumbnail } from './CanvasThumbnail';

interface Props {
  galaxyId: string;
  sphere: Sphere;
  subs: Sphere[];
  /** items of the board and of its sub-boards */
  items: Item[];
  isPrivate: boolean;
  sphereById: Map<string, Sphere>;
  profileById: Map<string, Profile>;
  onEdit: (sphere: Sphere) => void;
  onDelete: (sphere: Sphere) => void;
}

/** The people who touched the board last, most recent first. */
export function lastEditors(items: Item[], max = 3): string[] {
  const out: string[] = [];
  for (const i of [...items].sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''))) {
    const who = i.updated_by ?? i.created_by;
    if (who && !out.includes(who)) out.push(who);
    if (out.length >= max) break;
  }
  return out;
}

/** One board in the workspace overview (RW2.3): thumbnail, colour, count, last editors, last change. */
export function BoardCard({ galaxyId, sphere, subs, items, isPrivate, sphereById, profileById, onEdit, onDelete }: Props) {
  const href = `/w/${galaxyId}/b/${sphere.id}`;
  const fresh = items.filter((i) => i.is_new).length;
  const latest = items.reduce<string | null>((max, i) => (i.updated_at && (!max || i.updated_at > max) ? i.updated_at : max), null);
  const editors = lastEditors(items);

  return (
    <li
      data-tour={cn(sphere.is_inbox ? 'board-inbox' : 'board', isPrivate && 'board-private')}
      className="group relative flex flex-col overflow-hidden rounded-card border border-border bg-card transition-colors duration-150 hover:border-n-6 focus-within:border-n-6"
    >
      <span aria-hidden className="absolute inset-x-0 top-0 z-10 h-[3px]" style={{ background: sphereVar(sphere.color) }} />
      <CanvasThumbnail items={items} sphereById={sphereById} height={112} className="border-b border-border" />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center gap-2">
          <SphereDot color={sphere.color} emoji={sphere.emoji} size={24} />
          <h2 className="min-w-0 flex-1 truncate text-[14px] leading-tight">
            <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
              {sphere.name}
            </Link>
          </h2>
          {isPrivate ? <Lock size={13} aria-label={copy.common.onlyMe} className="shrink-0 text-text-muted" /> : null}
          {fresh ? <NewBadge count={fresh} /> : null}
          <Dropdown>
            <DropdownTrigger aria-label={copy.spheres.actions(sphere.name)} className="relative z-10 -mr-1.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-pill text-text-muted hover:bg-surface-2 hover:text-text">
              <MoreHorizontal size={16} aria-hidden />
            </DropdownTrigger>
            <DropdownContent align="end">
              <DropdownItem onSelect={() => onEdit(sphere)}><Pencil size={15} aria-hidden />{copy.spheres.edit}</DropdownItem>
              {!sphere.is_inbox ? (
                <DropdownItem onSelect={() => onDelete(sphere)} className="text-danger"><Trash2 size={15} aria-hidden />{copy.common.delete}</DropdownItem>
              ) : null}
            </DropdownContent>
          </Dropdown>
        </div>

        {subs.length ? (
          <ul className="relative z-10 flex flex-wrap gap-1">
            {subs.map((s) => (
              <li key={s.id}>
                <Link href={`${href}?sub=${s.id}`} className="inline-flex h-6 items-center gap-1 rounded-pill border border-border px-1.5 text-[11px] text-text-muted hover:bg-surface-2 hover:text-text">
                  <span aria-hidden>{s.emoji}</span>
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex items-center gap-2 pt-1 text-[12px] text-text-muted">
          <span className="min-w-0 flex-1 truncate">
            {copy.spheres.items(items.length)}
            {latest ? ` · ${copy.items.edited(timeAgo(latest))}` : ''}
          </span>
          <span className="inline-flex shrink-0 items-center">
            {editors.map((id, i) => {
              const p = profileById.get(id);
              return p ? <Avatar key={id} name={p.display_name} color={p.color} size={20} ring className={i > 0 ? '-ml-1.5' : undefined} /> : null;
            })}
          </span>
        </div>
      </div>
    </li>
  );
}
