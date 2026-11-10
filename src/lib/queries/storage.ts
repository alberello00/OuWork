'use client';

import { useQuery } from '@tanstack/react-query';
import { db } from './client';
import { keys } from './keys';

const MAX_SIDE = 2000;
const RESIZE_ABOVE_BYTES = 1_500_000;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

export function isAllowedImage(file: File) {
  return ALLOWED.includes(file.type);
}

/** Large photos are scaled down in the browser to stay inside the free tier. */
async function shrink(file: File): Promise<Blob> {
  if (file.size <= RESIZE_ABOVE_BYTES || file.type === 'image/gif') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

/** Uploads into `<galaxy_id>/<owner_id>/<file>` (see storage policies). Returns the object path. */
export async function uploadImage(galaxyId: string, ownerId: string, file: File): Promise<string> {
  const blob = await shrink(file);
  const ext = blob.type === 'image/jpeg' ? 'jpg' : (blob.type.split('/')[1] ?? 'img');
  const path = `${galaxyId}/${ownerId}/${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const { error } = await db().storage.from('items').upload(path, blob, { contentType: blob.type, upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

/** Private bucket: images are served through short-lived signed URLs. */
export function useSignedUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: keys.signedUrl(path ?? ''),
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    refetchInterval: false,
    queryFn: async () => {
      const { data, error } = await db().storage.from('items').createSignedUrl(path!, 60 * 60);
      if (error) throw new Error(error.message);
      return data.signedUrl;
    },
  });
}
