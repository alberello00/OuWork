'use client';

import { ArrowRight, LayoutGrid, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { itemTitle } from '@/components/items/ItemCard';
import { NewBadge } from '@/components/items/NewBadge';
import { PrivateBadge } from '@/components/items/PrivateBadge';
import { SphereChip } from '@/components/spheres/SphereChip';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Dialog, PanelContent } from '@/components/ui/Dialog';
import { copy } from '@/lib/copy';
import type { Item, Profile, Sphere } from '@/lib/queries/types';
import { CanvasThumbnail } from './CanvasThumbnail';
import { Planet } from './Planet';

interface Props {
  galaxyId: string;
  sphere: Sphere | undefined;
  subs: Sphere[];
  items: Item[];
  isPrivate: boolean;
  sphereById: Map<string, Sphere>;
  profileById: Map<string, Profile>;
  onEnter: (sphereId: string) => void;
  onDelete: (sphere: Sphere) => void;
  onClose: () => void;
}

/** "Sphere index" (frames 7:2 / 14:2): side panel on desktop, sheet on mobile. */
export function SphereIndexPanel({ galaxyId, sphere, subs, items, isPrivate, sphereById, profileById, onEnter, onDelete, onClose }: Props) {
  if (!sphere) return null;
  const newCount = items.filter((i) => i.is_new).length;
  const href = `/w/${galaxyId}/b/${sphere.id}`;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <PanelContent title={sphere.name} hideTitle>
        <div className="flex-1 overflow-y-auto px-5 pb-6 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{copy.universe.sphereIndex}</p>
          <div className="mt-3 flex items-center gap-3.5 pr-8">
            <Planet color={sphere.color} emoji={sphere.emoji} size={64} empty={!items.length} glow={false} />
            <div className="min-w-0">
              <h2 className="truncate text-[26px] leading-tight">{sphere.name}</h2>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-text-muted">
                {copy.spheres.items(items.length)}
                {newCount ? <NewBadge count={newCount} /> : null}
                {isPrivate ? <PrivateBadge /> : null}
              </p>
            </div>
          </div>
          {sphere.is_inbox ? <p className="mt-3 text-[12px] text-text-muted">{copy.spheres.inbox}</p> : null}

          <div className="mt-5">
            <CanvasThumbnail items={items} sphereById={sphereById} />
          </div>

          {subs.length ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {subs.map((s) => (
                <Link key={s.id} href={`${href}?sub=${s.id}`} className="rounded-pill">
                  <SphereChip sphere={s} count={items.filter((i) => i.sphere_id === s.id).length} />
                </Link>
              ))}
            </div>
          ) : null}

          <h3 className="mt-6 font-body text-[11px] font-bold uppercase tracking-wider text-text-muted">{copy.universe.latest}</h3>
          {items.length ? (
            <ul className="mt-1 divide-y divide-border">
              {items.slice(0, 6).map((item) => {
                const author = item.created_by ? profileById.get(item.created_by) : undefined;
                return (
                  <li key={item.id}>
                    <Link href={`${href}?item=${item.id}&focus=${item.id}`} className="flex min-h-12 items-center gap-2.5 py-2 hover:underline">
                      <Avatar name={author?.display_name ?? '?'} color={author?.color} size={20} />
                      <span className="min-w-0 flex-1 truncate text-[13px]">{itemTitle(item)}</span>
                      {item.is_private ? <PrivateBadge /> : null}
                      {item.is_new ? <NewBadge /> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-[12px] text-text-muted">{copy.universe.empty}</p>
          )}
        </div>
        <div className="flex gap-2 border-t border-border p-4">
          <Button variant="primary" className="flex-1" onClick={() => onEnter(sphere.id)}>
            {copy.universe.openSphere}
            <ArrowRight size={15} aria-hidden />
          </Button>
          <Link href={`/w/${galaxyId}/notes`} className="inline-flex h-11 items-center gap-2 rounded-pill border border-border px-4 text-[13px] font-medium hover:bg-surface-2">
            <LayoutGrid size={15} aria-hidden />
            {copy.nav.notes}
          </Link>
          {!sphere.is_inbox ? (
            <Button size="icon" aria-label={copy.spheres.deleteSphere} title={copy.spheres.deleteSphere} onClick={() => onDelete(sphere)} className="text-danger">
              <Trash2 size={16} aria-hidden />
            </Button>
          ) : null}
        </div>
      </PanelContent>
    </Dialog>
  );
}
