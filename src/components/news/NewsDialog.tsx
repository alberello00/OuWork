'use client';

import Link from 'next/link';
import { itemTitle } from '@/components/items/ItemCard';
import { SphereChip } from '@/components/spheres/SphereChip';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { copy } from '@/lib/copy';
import type { NewsEntry } from '@/lib/queries/useNews';
import { timeAgo } from '@/lib/utils';

interface Props {
  entries: NewsEntry[];
  showGalaxy: boolean;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDismiss: () => void;
}

/** "Since your last visit" modal (frame 8:2): what, where, who. */
export function NewsDialog({ entries, showGalaxy, open, onOpenChange, onDismiss }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={copy.news.title} className="sm:w-[min(92vw,560px)]">
        <ul className="mt-4 divide-y divide-border">
          {entries.map(({ item, sphere, topSphere, galaxyName, who, edited }) => (
            <li key={item.id}>
              <Link
                href={`/w/${item.galaxy_id}/b/${topSphere?.id ?? item.sphere_id}?item=${item.id}&focus=${item.id}`}
                onClick={() => onOpenChange(false)}
                className="flex min-h-14 items-center gap-3 py-2.5 hover:bg-surface-2"
              >
                <Avatar name={who?.display_name ?? '?'} color={who?.color} size={28} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium">{itemTitle(item)}</span>
                  <span className="block truncate text-[12px] text-text-muted">
                    {who?.display_name ?? '—'} {edited ? copy.news.edited : copy.news.added} · {timeAgo(item.updated_at)}
                    {showGalaxy ? ` · ${galaxyName}` : ''}
                  </span>
                </span>
                {sphere ? <SphereChip sphere={sphere} className="max-sm:hidden" /> : null}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={() => { onDismiss(); onOpenChange(false); }}>{copy.news.dismiss}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
