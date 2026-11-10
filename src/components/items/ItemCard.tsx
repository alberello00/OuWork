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
  /** stable tilt for polaroids, in degrees */
  tilt?: number;
  className?: string;
}

/** Plain text preview of markdown, for the card. */
function excerpt(md: string | null, max = 220): string {
  if (!md) return '';
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
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
    <div className="mt-2.5 flex items-center gap-1.5">
      <Avatar name={author?.display_name ?? '?'} color={author?.color} size={18} />
      {item.is_private ? <PrivateBadge /> : null}
      {item.is_new ? <NewBadge className="ml-auto" /> : null}
    </div>
  );
}

/** Card for note / link / image (RD5). Same component on the canvas, in lists and in Notes. */
export const ItemCard = memo(function ItemCard({ item, sphere, author, compact, tilt = 0, className }: Props) {
  const color = sphereVar(sphere?.color);
  const title = itemTitle(item);

  if (compact) {
    return (
      <div
        className={cn('overflow-hidden rounded-card border border-border bg-card shadow-card', className)}
        style={{ borderTop: `5px solid ${color}` }}
      >
        <p className="font-heading line-clamp-2 px-3.5 py-3 text-[22px] leading-tight">{title}</p>
      </div>
    );
  }

  if (item.type === 'image') {
    return (
      <figure
        className={cn('rounded-[4px] border border-border bg-card p-2.5 pb-3 shadow-card', className)}
        style={{ rotate: `${tilt}deg` }}
      >
        <ItemImage path={item.image_path} alt={item.caption || title} className="aspect-[4/3] w-full rounded-[2px]" />
        {item.caption ? (
          <figcaption className="font-heading mt-2.5 line-clamp-2 text-center text-[14px] leading-snug">{item.caption}</figcaption>
        ) : null}
        <Meta item={item} author={author} />
      </figure>
    );
  }

  if (item.type === 'link') {
    const domain = item.preview?.domain || domainOf(item.url);
    return (
      <div className={cn('overflow-hidden rounded-card border border-border bg-card shadow-card', className)}>
        {item.preview?.image ? (
          <img src={item.preview.image} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" draggable={false} referrerPolicy="no-referrer" />
        ) : (
          <div
            className="flex aspect-[16/9] w-full items-center justify-center px-4"
            style={{ background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 55%, var(--color-card)))` }}
          >
            <span className="font-heading truncate text-[22px] text-sphere-ink">{domain}</span>
          </div>
        )}
        <div className="px-3.5 pb-3 pt-2.5">
          <p className="font-heading line-clamp-2 text-[15px] leading-[18.75px]">{title}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-text-muted">
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
    <div
      className={cn('overflow-hidden rounded-card border border-border bg-card shadow-card', className)}
      style={{ borderTop: `5px solid ${color}` }}
    >
      <div className="px-3.5 pb-3 pt-2.5">
        {item.title ? <p className="font-heading line-clamp-2 text-[15px] leading-[18.75px]">{item.title}</p> : null}
        {item.body_md ? (
          <p className={cn('line-clamp-4 text-[11px] leading-[16.5px] text-text-muted', item.title && 'mt-1')}>
            {excerpt(item.body_md)}
          </p>
        ) : null}
        <Meta item={item} author={author} />
      </div>
    </div>
  );
});
