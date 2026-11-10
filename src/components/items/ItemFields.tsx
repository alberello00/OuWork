'use client';

import { ImagePlus } from 'lucide-react';
import { useId, useRef } from 'react';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { copy } from '@/lib/copy';
import type { ItemType } from '@/lib/queries/types';

export interface ItemDraft {
  title: string;
  body_md: string;
  url: string;
  caption: string;
  file: File | null;
}

export const emptyDraft: ItemDraft = { title: '', body_md: '', url: '', caption: '', file: null };

export function isDraftValid(type: ItemType, d: ItemDraft, hasImage = false): boolean {
  if (type === 'note') return !!(d.title.trim() || d.body_md.trim());
  if (type === 'link') return /^https?:\/\/\S+\.\S+/i.test(d.url.trim());
  return !!d.file || hasImage;
}

/** Content fields for one item type, shared by quick add and edit. */
export function ItemFields({
  type,
  draft,
  onChange,
  existingImage,
  autoFocus,
}: {
  type: ItemType;
  draft: ItemDraft;
  onChange: (d: ItemDraft) => void;
  existingImage?: boolean;
  autoFocus?: boolean;
}) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<ItemDraft>) => onChange({ ...draft, ...patch });
  const preview = draft.file ? URL.createObjectURL(draft.file) : null;

  return (
    <div className="space-y-3">
      {type === 'link' ? (
        <div>
          <Label htmlFor={`${id}-url`}>{copy.items.url}</Label>
          <Input
            id={`${id}-url`}
            type="url"
            inputMode="url"
            value={draft.url}
            onChange={(e) => set({ url: e.target.value })}
            placeholder={copy.items.urlPlaceholder}
            autoFocus={autoFocus}
            required
          />
        </div>
      ) : null}

      {type === 'image' ? (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="sr-only"
            id={`${id}-file`}
            onChange={(e) => set({ file: e.target.files?.[0] ?? null })}
          />
          <label
            htmlFor={`${id}-file`}
            className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-card border border-dashed border-border bg-surface-2 p-3 text-[13px] text-text-muted hover:border-text-muted"
          >
            {preview ? (
              <img src={preview} alt="" className="max-h-48 rounded-[6px] object-contain" />
            ) : (
              <ImagePlus size={22} aria-hidden />
            )}
            {draft.file || existingImage ? copy.items.changeImage : copy.items.chooseImage}
          </label>
        </div>
      ) : null}

      {type !== 'image' ? (
        <div>
          <Label htmlFor={`${id}-title`}>{copy.items.title}</Label>
          <Input
            id={`${id}-title`}
            value={draft.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder={copy.items.titlePlaceholder}
            maxLength={200}
            autoFocus={autoFocus && type === 'note'}
          />
        </div>
      ) : null}

      {type === 'note' ? (
        <div>
          <Label htmlFor={`${id}-body`}>{copy.items.body}</Label>
          <Textarea
            id={`${id}-body`}
            value={draft.body_md}
            onChange={(e) => set({ body_md: e.target.value })}
            placeholder={copy.items.bodyPlaceholder}
            maxLength={50000}
            rows={6}
          />
        </div>
      ) : null}

      {type === 'image' ? (
        <div>
          <Label htmlFor={`${id}-caption`}>{copy.items.caption}</Label>
          <Input
            id={`${id}-caption`}
            value={draft.caption}
            onChange={(e) => set({ caption: e.target.value })}
            placeholder={copy.items.captionPlaceholder}
            maxLength={200}
          />
        </div>
      ) : null}
    </div>
  );
}
