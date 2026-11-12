'use client';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { NewBadge } from '@/components/items/NewBadge';
import { PrivateBadge } from '@/components/items/PrivateBadge';
import { itemTitle } from '@/components/items/ItemCard';
import { DeleteSphereDialog } from '@/components/spheres/DeleteSphereDialog';
import { SphereChip } from '@/components/spheres/SphereChip';
import { SphereDot } from '@/components/spheres/SphereDot';
import { SphereFormDialog } from '@/components/spheres/SphereFormDialog';
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '@/components/ui/Dropdown';
import { EmptyState } from '@/components/ui/EmptyState';
import { copy } from '@/lib/copy';
import type { Item, Sphere } from '@/lib/queries/types';
import { isSpherePrivate, useGalaxyData } from '@/lib/queries/useGalaxyData';
import { sphereVar } from '@/lib/tokens';
import { timeAgo } from '@/lib/utils';
import { useOpenItem } from '@/lib/useOpenItem';

const PER_SPHERE = 5;

/** RF9.4: one column per sphere with the latest items, sub-sphere chips and NEW badges (frame 9:2). */
export function NotesView({ galaxyId }: { galaxyId: string }) {
  const data = useGalaxyData(galaxyId);
  const openItem = useOpenItem();
  const [editing, setEditing] = useState<Sphere | null>(null);
  const [deleting, setDeleting] = useState<Sphere | null>(null);

  if (data.isLoading) return <main className="flex-1 p-8 text-[13px] text-text-muted">{copy.common.loading}</main>;
  if (!data.galaxy) return <EmptyState emoji="🌌" title={copy.galaxies.emptyTitle} className="flex-1" />;

  // inbox last, as in the prototype
  const columns = [...data.topLevel.filter((s) => !s.is_inbox), ...data.topLevel.filter((s) => s.is_inbox)];

  return (
    <main className="flex-1 bg-bg px-3 pb-28 pt-5 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-[28px] leading-tight">{copy.notes.title}</h1>
        <p className="mt-1 text-[13px] text-text-muted">{copy.notes.subtitle}</p>

        <div className="mt-5 gap-4 [column-fill:_balance] sm:columns-2 lg:columns-3">
          {columns.map((sphere) => {
            const subs = data.childrenOf(sphere.id);
            const scope = new Set([sphere.id, ...subs.map((s) => s.id)]);
            const items: Item[] = data.items.filter((i) => scope.has(i.sphere_id));
            const newCount = items.filter((i) => i.is_new).length;
            const href = `/w/${galaxyId}/b/${sphere.id}`;
            return (
              <section
                key={sphere.id}
                className="mb-4 break-inside-avoid overflow-hidden rounded-card border border-border bg-card shadow-card"
                style={{ borderTop: `5px solid ${sphereVar(sphere.color)}` }}
              >
                <header className="flex items-center gap-2.5 px-4 pt-3.5">
                  <SphereDot color={sphere.color} emoji={sphere.emoji} size={28} />
                  <Link href={href} className="min-w-0 flex-1 hover:underline">
                    <h2 className="truncate text-[20px] leading-tight">{sphere.name}</h2>
                  </Link>
                  {isSpherePrivate(sphere, data.sphereById) ? <PrivateBadge /> : null}
                  {newCount ? <NewBadge count={newCount} /> : null}
                  <span className="text-[11.5px] text-text-muted">{items.length}</span>
                  <Dropdown>
                    <DropdownTrigger aria-label={copy.spheres.actions(sphere.name)} className="-mr-2.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-text-muted hover:bg-surface-2 hover:text-text">
                      <MoreHorizontal size={18} aria-hidden />
                    </DropdownTrigger>
                    <DropdownContent align="end">
                      <DropdownItem onSelect={() => setEditing(sphere)}><Pencil size={15} aria-hidden />{copy.spheres.edit}</DropdownItem>
                      {!sphere.is_inbox ? (
                        <DropdownItem onSelect={() => setDeleting(sphere)} className="text-danger"><Trash2 size={15} aria-hidden />{copy.common.delete}</DropdownItem>
                      ) : null}
                    </DropdownContent>
                  </Dropdown>
                </header>

                {subs.length ? (
                  <div className="flex flex-wrap gap-1.5 px-4 pt-2.5">
                    {subs.map((s) => (
                      <Link key={s.id} href={`${href}?sub=${s.id}`} className="rounded-pill">
                        <SphereChip sphere={s} count={items.filter((i) => i.sphere_id === s.id).length} />
                      </Link>
                    ))}
                  </div>
                ) : null}

                {items.length ? (
                  <ul className="mt-2 divide-y divide-border">
                    {items.slice(0, PER_SPHERE).map((item) => {
                      const author = item.created_by ? data.profileById.get(item.created_by) : undefined;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => openItem(item.id)}
                            className="flex min-h-12 w-full items-center gap-2.5 px-4 py-2 text-left hover:bg-surface-2"
                          >
                            <Avatar name={author?.display_name ?? '?'} color={author?.color} size={20} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-medium">{itemTitle(item)}</span>
                              <span className="block truncate text-[11px] text-text-muted">
                                {sphere.is_inbox ? copy.spheres.waiting : timeAgo(item.updated_at)}
                              </span>
                            </span>
                            {item.is_private ? <PrivateBadge /> : null}
                            {item.is_new ? <NewBadge /> : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="px-4 pb-4 pt-3 text-[12px] text-text-muted">{copy.notes.empty}</p>
                )}
                {items.length > PER_SPHERE ? (
                  <Link href={href} className="flex min-h-11 items-center border-t border-border px-4 text-[12px] font-medium text-text-muted hover:text-text">
                    {copy.notes.more(items.length - PER_SPHERE)}
                  </Link>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>
      {editing ? (
        <SphereFormDialog galaxyId={galaxyId} spheres={data.spheres} open onOpenChange={(o) => !o && setEditing(null)} sphere={editing} />
      ) : null}
      {deleting ? (
        <DeleteSphereDialog
          sphere={deleting}
          spheres={data.spheres}
          itemCount={data.items.filter((i) => i.sphere_id === deleting.id || data.sphereById.get(i.sphere_id)?.parent_id === deleting.id).length}
          open
          onOpenChange={(o) => !o && setDeleting(null)}
          onDeleted={() => setDeleting(null)}
        />
      ) : null}
    </main>
  );
}
