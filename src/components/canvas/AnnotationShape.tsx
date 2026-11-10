'use client';

import { memo } from 'react';
import { arrowPaths, strokePath } from '@/lib/annotationGeometry';
import { useSignedUrl } from '@/lib/queries/storage';
import type { ArrowData, StickerData, StrokeData } from '@/lib/queries/types';
import { inkColor } from './inkColors';

interface Props {
  kind: string;
  data: unknown;
}

function PhotoSticker({ path, size }: { path: string; size: number }) {
  const { data: src } = useSignedUrl(path);
  return (
    <div className="rounded-[3px] bg-card p-1.5 pb-4 shadow-card" style={{ width: size + 12 }}>
      {src ? (
        <img src={src} alt="" draggable={false} className="block object-cover" style={{ width: size, height: size }} />
      ) : (
        <div className="animate-pulse bg-surface-2" style={{ width: size, height: size }} />
      )}
    </div>
  );
}

/** Visual of one annotation, drawn at its local origin (0,0). */
export const AnnotationShape = memo(function AnnotationShape({ kind, data }: Props) {
  if (kind === 'stroke') {
    const d = data as StrokeData;
    const pts = d.points ?? [];
    const w = Math.max(...pts.map((p) => p[0]!), 0) + d.size * 2;
    const h = Math.max(...pts.map((p) => p[1]!), 0) + d.size * 2;
    return (
      <svg width={w} height={h} style={{ overflow: 'visible', display: 'block' }}>
        <path d={strokePath(pts, d.size)} fill={inkColor(d.color)} />
      </svg>
    );
  }
  if (kind === 'arrow') {
    const d = data as ArrowData;
    const { body, head } = arrowPaths(d.dx, d.dy, d.size);
    return (
      <svg width={1} height={1} style={{ overflow: 'visible', display: 'block' }}>
        <path d={body} fill="none" stroke={inkColor(d.color)} strokeWidth={d.size} strokeLinecap="round" />
        <polygon points={head} fill={inkColor(d.color)} />
      </svg>
    );
  }
  const d = data as StickerData;
  if (d.image_path) return <PhotoSticker path={d.image_path} size={d.size ?? 96} />;
  return (
    <span className="block select-none leading-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.25)]" style={{ fontSize: d.size ?? 44 }}>
      {d.emoji ?? '⭐'}
    </span>
  );
});
