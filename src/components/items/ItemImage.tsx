'use client';

import { useSignedUrl } from '@/lib/queries/storage';
import { cn } from '@/lib/utils';

/** Image from the private bucket through a signed URL; the caption doubles as alt text (RD10.3). */
export function ItemImage({ path, alt, className }: { path: string | null; alt: string; className?: string }) {
  const { data: src } = useSignedUrl(path);
  if (!src) return <div className={cn('animate-pulse bg-surface-2', className)} aria-hidden />;
  return <img src={src} alt={alt} className={cn('object-cover', className)} loading="lazy" draggable={false} />;
}
