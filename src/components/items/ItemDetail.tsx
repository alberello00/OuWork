'use client';

import { ExternalLink, Lock, MoveRight, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/components/shell/SessionProvider';
import { SphereChip } from '@/components/spheres/SphereChip';
import { SpherePicker } from '@/components/spheres/SpherePicker';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Dialog, PanelContent } from '@/components/ui/Dialog';
import { Switch } from '@/components/ui/Switch';
import { copy } from '@/lib/copy';
import { useDeleteItem, useMarkSeen, useUpdateItem } from '@/lib/queries/items';
import { fetchLinkPreview } from '@/lib/queries/linkPreview';
import type { Item, Profile, Sphere } from '@/lib/queries/types';
import { isSpherePrivate } from '@/lib/queries/useGalaxyData';
import { domainOf, timeAgo } from '@/lib/utils';
import { ItemConnections } from './ItemConnections';
import { itemTitle } from './ItemCard';
import { emptyDraft, isDraftValid, ItemFields, type ItemDraft } from './ItemFields';
import { ItemImage } from './ItemImage';
import { Markdown } from './Markdown';
import { NewBadge } from './NewBadge';
import { PrivateBadge } from './PrivateBadge';

interface Props {
  item: Item | undefined;
  items: Item[];
  spheres: Sphere[];
  sphereById: Map<string, Sphere>;
  profileById: Map<string, Profile>;
  onOpenItem: (id: string) => void;
  onClose: () => void;
}

/** Item detail: side panel on desktop, full-screen sheet on mobile (RD5.4). */
export function ItemDetail({ item, items, spheres, sphereById, profileById, onOpenItem, onClose }: Props) {
  const { userId } = useSession();
  const update = useUpdateItem();
  const del = useDeleteItem();
  const markSeen = useMarkSeen();
  const [editing, setEditing] = useState(false);
  const [moving, setMoving] = useState(false);
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft);
  const markedRef = useRef<string | null>(null);

  // RF8.3: opening an item marks it as seen
  useEffect(() => {
    if (item && item.is_new && markedRef.current !== item.id) {
      markedRef.current = item.id;
      markSeen.mutate([item.id]);
    }
  }, [item, markSeen]);

  useEffect(() => {
    setEditing(false);
    setMoving(false);
  }, [item?.id]);

  if (!item) return null;

  const sphere = sphereById.get(item.sphere_id);
  const author = item.created_by ? profileById.get(item.created_by) : undefined;
  const editor = item.updated_by && item.updated_by !== item.created_by ? profileById.get(item.updated_by) : undefined;
  const isAuthor = item.created_by === userId;
  const spherePrivate = isSpherePrivate(sphere, sphereById);
  const title = itemTitle(item);
  const onError = () => toast.error(copy.common.genericError);

  function startEdit() {
    setDraft({ title: item!.title ?? '', body_md: item!.body_md ?? '', url: item!.url ?? '', caption: item!.caption ?? '', file: null });
    setEditing(true);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!isDraftValid(item!.type, draft, true)) return;
    const urlChanged = item!.type === 'link' && draft.url.trim() !== item!.url;
    update.mutate(
      {
        id: item!.id,
        title: draft.title.trim() || null,
        ...(item!.type === 'note' ? { body_md: draft.body_md.trim() || null } : {}),
        ...(item!.type === 'link' ? { url: draft.url.trim() } : {}),
        ...(item!.type === 'image' ? { caption: draft.caption.trim() || null } : {}),
      },
      {
        onSuccess: async () => {
          toast(copy.items.saved);
          setEditing(false);
          if (urlChanged) {
            const preview = await fetchLinkPreview(draft.url.trim());
            update.mutate({ id: item!.id, preview });
          }
        },
        onError,
      }
    );
  }

  function moveTo(sphereId: string | null) {
    if (!sphereId || sphereId === item!.sphere_id) return;
    const target = sphereById.get(sphereId);
    update.mutate(
      { id: item!.id, sphere_id: sphereId },
      { onSuccess: () => { toast(copy.items.moved(target?.name ?? '')); setMoving(false); }, onError }
    );
  }

  function remove() {
    if (!window.confirm(copy.items.deleteConfirm)) return;
    del.mutate(item!, { onSuccess: () => { toast(copy.items.deleted); onClose(); }, onError });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <PanelContent title={title} hideTitle>
        <div className="flex-1 overflow-y-auto px-5 pb-6 pt-4 sm:pt-5">
          <div className="flex flex-wrap items-center gap-2 pr-10">
            {sphere ? <SphereChip sphere={sphere} /> : null}
            {sphere?.is_inbox ? <span className="text-[11.5px] text-text-muted">{copy.spheres.waiting}</span> : null}
            {item.is_private ? <PrivateBadge /> : null}
            {item.is_new ? <NewBadge /> : null}
          </div>

          {editing ? (
            <form onSubmit={save} className="mt-5 space-y-4">
              <ItemFields type={item.type} draft={draft} onChange={setDraft} existingImage autoFocus />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditing(false)}>{copy.common.cancel}</Button>
                <Button type="submit" variant="primary" disabled={update.isPending || !isDraftValid(item.type, draft, true)}>
                  {copy.common.save}
                </Button>
              </div>
            </form>
          ) : (
            <article className="mt-4">
              {item.type === 'image' ? (
                <ItemImage path={item.image_path} alt={item.caption || copy.items.image} className="w-full rounded-card" />
              ) : null}
              {item.type === 'link' && item.preview?.image ? (
                <img src={item.preview.image} alt="" referrerPolicy="no-referrer" className="aspect-[16/9] w-full rounded-card object-cover" />
              ) : null}

              <h2 className="mt-4 text-[26px] leading-tight">{title}</h2>

              {item.type === 'link' && item.url ? (
                <>
                  {item.preview?.description ? (
                    <p className="mt-2 text-[14px] leading-relaxed text-text-muted">{item.preview.description}</p>
                  ) : null}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-pill border border-border px-4 text-[13px] font-medium hover:bg-surface-2"
                  >
                    <ExternalLink size={14} aria-hidden />
                    {domainOf(item.url) || copy.items.openLink}
                  </a>
                </>
              ) : null}
              {item.type === 'note' && item.body_md ? <div className="mt-3"><Markdown>{item.body_md}</Markdown></div> : null}
              {item.type === 'image' && item.caption && item.title ? (
                <p className="mt-2 text-[14px] text-text-muted">{item.caption}</p>
              ) : null}

              <p className="mt-5 flex flex-wrap items-center gap-2 text-[12px] text-text-muted">
                <Avatar name={author?.display_name ?? '?'} color={author?.color} size={20} />
                {copy.items.by(author?.display_name ?? '—', timeAgo(item.created_at))}
                {item.updated_at !== item.created_at ? (
                  <span>· {editor ? `${editor.display_name} ` : ''}{copy.items.edited(timeAgo(item.updated_at))}</span>
                ) : null}
              </p>
            </article>
          )}

          {!editing ? (
            <div className="mt-5 flex flex-wrap gap-2">
              <Button size="sm" onClick={startEdit}><Pencil size={14} aria-hidden />{copy.items.edit}</Button>
              <Button size="sm" onClick={() => setMoving((m) => !m)} aria-expanded={moving}>
                <MoveRight size={14} aria-hidden />{copy.items.move}
              </Button>
              <Button size="sm" onClick={remove} className="text-danger"><Trash2 size={14} aria-hidden />{copy.common.delete}</Button>
            </div>
          ) : null}

          {moving ? (
            <div className="mt-4 rounded-card border border-border p-3">
              <SpherePicker
                label={copy.items.move}
                spheres={spheres}
                value={item.sphere_id}
                onChange={moveTo}
                // only the author may put an item into their own private sphere
                exclude={(s) => isSpherePrivate(s, sphereById) && (!isAuthor || s.created_by !== userId)}
              />
            </div>
          ) : null}

          {isAuthor && !editing ? (
            <div className="mt-4">
              <Switch
                checked={item.is_private || spherePrivate}
                disabled={spherePrivate || update.isPending}
                onChange={(v) => update.mutate({ id: item.id, is_private: v }, { onError })}
                label={copy.items.private}
                icon={<Lock size={13} aria-hidden />}
                hint={spherePrivate ? copy.items.privateLocked : copy.items.privateHint}
              />
            </div>
          ) : null}

          <div className="mt-5">
            <ItemConnections item={item} items={items} sphereById={sphereById} onOpen={onOpenItem} />
          </div>
        </div>
      </PanelContent>
    </Dialog>
  );
}
