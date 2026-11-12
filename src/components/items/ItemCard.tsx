'use client';

import { Globe } from 'lucide-react';
import { memo } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { copy } from '@/lib/copy';
import type { Item, Profile, Sphere } from '@/lib/queries/types';
import { sphereVar } from '@/lib/tokens';
import { cn, domainOf } from '@/lib/utils';
import { ItemImage } from './ItemImage';
import { NewBadge } from './NewBadge';
import { PrivateBadge } from './PrivateBadge';

interface Props {
  item: Item;
  sphere: Pick<Sphere, 'color' | 'emoji' | 'name' | 'is_private'> | undefined;
  author: Profile | undefined;
  /** semantic zoom (RD6.2): only title and colour */
  compact?: boolean;
  className?: string;
}

/** Plain text preview of markdown, for the card. */
function excerpt(md: string | null, max = 220): string {
  if (!md) return '';
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s*\|?[\s:|-]*-{3,}[\s:|-]*$/gm, ' ')
    .replace(/\|/g, ' ')
    .replace(/^[#>\-*+\s]+|[*_`~]/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function itemTitle(item: Pick<Item, 'type' | 'title' | 'body_md' | 'url' | 'caption' | 'preview'>): string {
  return (
    item.title?.trim() ||
    (item.type === 'link' ? item.preview?.title || domainOf(item.url) : '') ||
    (item.type === 'image' ? item.caption?.trim() : '') ||
    excerpt(item.body_md, 60) ||
    copy.items.untitled
  );
}

function Meta({ item, author }: Pick<Props, 'item' | 'author'>) {
  return (
    <div className="mt-2 flex items-center gap-1.5">
      <Avatar name={author?.display_name ?? '?'} color={author?.color} size={18} />
      {item.is_private ? <PrivateBadge /> : null}
      {item.is_new ? <NewBadge className="ml-auto" /> : null}
    </div>
  );
}

const shell = 'overflow-hidden rounded-card border border-border bg-card';

/**
 * Card for note / link / image (RW2.4): thin border, no shadow, the board
 * colour as a label on the left edge. Same component on the canvas, in lists
 * and in Notes.
 */
export const ItemCard = memo(function ItemCard({ item, sphere, author, compact, className }: Props) {
  const color = sphereVar(sphere?.color);
  const title = itemTitle(item);
  const label = { borderLeft: `3px solid ${color}` };

  if (compact) {
    return (
      <div className={cn(shell, className)} style={label}>
        <p className="line-clamp-2 px-3 py-2.5 text-[20px] font-semibold leading-tight">{title}</p>
      </div>
    );
  }

  if (item.type === 'image') {
    return (
      <figure className={cn(shell, className)} style={label}>
        <ItemImage path={item.image_path} alt={item.caption || title} className="aspect-[4/3] w-full" />
        <div className="px-3 pb-2.5 pt-2">
          {item.caption ? <figcaption className="line-clamp-2 text-[12.5px] leading-snug">{item.caption}</figcaption> : null}
          <Meta item={item} author={author} />
        </div>
      </figure>
    );
  }

  if (item.type === 'link') {
    const domain = item.preview?.domain || domainOf(item.url);
    return (
      <div className={cn(shell, className)} style={label}>
        {item.preview?.image ? (
          <img src={item.preview.image} alt="" className="aspect-[16/9] w-full border-b border-border object-cover" loading="lazy" draggable={false} referrerPolicy="no-referrer" />
        ) : null}
        <div className="px-3 pb-2.5 pt-2.5">
          <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug">{title}</p>
          <p className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-text-muted">
            {item.preview?.favicon ? (
              <img src={item.preview.favicon} alt="" width={12} height={12} className="rounded-sm" referrerPolicy="no-referrer" />
            ) : (
              <Globe size={12} aria-hidden />
            )}
            <span className="truncate">{domain}</span>
          </p>
          <Meta item={item} author={author} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(shell, className)} style={label}>
      <div className="px-3 pb-2.5 pt-2.5">
        {item.title ? <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug">{item.title}</p> : null}
        {item.body_md ? (
          <p className={cn('line-clamp-4 text-[12px] leading-[1.45] text-text-muted', item.title && 'mt-1')}>
            {excerpt(item.body_md)}
          </p>
        ) : null}
        <Meta item={item} author={author} />
      </div>
    </div>
  );
});
