'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { nextFreeSpot } from '@/lib/canvasLayout';
import { db, unwrap } from './client';
import { fetchLinkPreview } from './linkPreview';
import { isAllowedImage, MAX_UPLOAD_BYTES, uploadImage } from './storage';
import type { Database } from '@/lib/supabase/database.types';
import type { Item, ItemType } from './types';

type ItemInsert = Database['public']['Tables']['items']['Insert'];

export interface AddItemInput {
  galaxyId: string;
  sphereId: string;
  type: ItemType;
  title?: string;
  body_md?: string;
  url?: string;
  caption?: string;
  file?: File | null;
  is_private?: boolean;
  /** canvas position; otherwise the next free slot of the sphere */
  position?: { x: number; y: number };
  /** current items of the sphere, for the free slot */
  siblings?: Pick<Item, 'x' | 'y'>[];
}

export class ImageTooBigError extends Error {}

/**
 * Creates an item of any type: uploads the picture first (path must contain
 * the item id, see storage policies), fetches the link preview afterwards so
 * that adding stays instant.
 */
export function useAddItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddItemInput) => {
      const id = crypto.randomUUID();
      const pos = input.position ?? nextFreeSpot(input.siblings ?? []);
      let image_path: string | null = null;

      if (input.type === 'image') {
        if (!input.file || input.file.size > MAX_UPLOAD_BYTES || !isAllowedImage(input.file)) throw new ImageTooBigError();
        image_path = await uploadImage(input.galaxyId, id, input.file);
      }

      const row = {
        id,
        sphere_id: input.sphereId,
        type: input.type,
        title: input.title?.trim() || null,
        body_md: input.type === 'note' ? input.body_md?.trim() || null : null,
        url: input.type === 'link' ? input.url?.trim() || null : null,
        caption: input.type === 'image' ? input.caption?.trim() || null : null,
        image_path,
        is_private: !!input.is_private,
        x: Math.round(pos.x),
        y: Math.round(pos.y),
      };
      const res = await db().from('items').insert(row as unknown as ItemInsert).select('id').single();
      if (res.error && image_path) await db().storage.from('items').remove([image_path]);
      unwrap(res);

      if (input.type === 'link' && row.url) {
        void fetchLinkPreview(row.url).then(async (preview) => {
          if (!preview) return;
          await db().from('items').update({ preview: preview as never }).eq('id', id);
          void qc.invalidateQueries({ queryKey: ['items'] });
        });
      }
      return { id, sphereId: input.sphereId };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['items'] });
      void qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
