'use client';

import { ArrowDownLeft, ArrowUpRight, Link2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { SphereDot } from '@/components/spheres/SphereDot';
import { Input } from '@/components/ui/Input';
import { copy } from '@/lib/copy';
import { useCreateLink, useDeleteLink, useLinks } from '@/lib/queries/links';
import type { Item, Sphere } from '@/lib/queries/types';
import { itemTitle } from './ItemCard';

interface Props {
  item: Item;
  items: Item[];
  sphereById: Map<string, Sphere>;
  onOpen: (id: string) => void;
}

/** RF7.1 / RF7.3: incoming and outgoing connections, and a picker to add one. */
export function ItemConnections({ item, items, sphereById, onOpen }: Props) {
  const { data: links = [] } = useLinks(item.galaxy_id);
  const createLink = useCreateLink();
  const deleteLink = useDeleteLink();
  const [picking, setPicking] = useState(false);
  const [q, setQ] = useState('');

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const outgoing = links.filter((l) => l.source_id === item.id && byId.has(l.target_id));
  const incoming = links.filter((l) => l.target_id === item.id && byId.has(l.source_id));
  const linked = new Set([...outgoing.map((l) => l.target_id), ...incoming.map((l) => l.source_id), item.id]);
  const candidates = items
    .filter((i) => !linked.has(i.id))
    .filter((i) => !q.trim() || `${itemTitle(i)} ${i.body_md ?? ''} ${i.url ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()))
    .slice(0, 8);

  function Row({ linkId, other, dir }: { linkId: string; other: Item; dir: 'in' | 'out' }) {
    const sphere = sphereById.get(other.sphere_id);
    return (
      <li className="flex min-h-11 items-center gap-2">
        {dir === 'out' ? (
          <ArrowUpRight size={14} aria-label={copy.items.outgoing} className="shrink-0 text-text-muted" />
        ) : (
          <ArrowDownLeft size={14} aria-label={copy.items.incoming} className="shrink-0 text-text-muted" />
        )}
        {sphere ? <SphereDot color={sphere.color} emoji={sphere.emoji} size={18} /> : null}
        <button type="button" onClick={() => onOpen(other.id)} className="min-h-11 min-w-0 flex-1 truncate text-left text-[13px] hover:underline">
          {itemTitle(other)}
        </button>
        <button
          type="button"
          aria-label={copy.items.disconnect}
          onClick={() => deleteLink.mutate(linkId)}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-text-muted hover:bg-surface-2"
        >
          <X size={14} aria-hidden />
        </button>
      </li>
    );
  }

  return (
    <section className="border-t border-border pt-4">
      <h3 className="font-body text-[11px] font-bold uppercase tracking-wider text-text-muted">{copy.items.links}</h3>
      {outgoing.length || incoming.length ? (
        <ul className="mt-1">
          {outgoing.map((l) => <Row key={l.id} linkId={l.id} other={byId.get(l.target_id)!} dir="out" />)}
          {incoming.map((l) => <Row key={l.id} linkId={l.id} other={byId.get(l.source_id)!} dir="in" />)}
        </ul>
      ) : (
        <p className="mt-2 text-[12px] text-text-muted">{copy.items.linksEmpty}</p>
      )}

      {picking ? (
        <div className="mt-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={copy.items.connectPlaceholder} autoFocus aria-label={copy.items.connect} />
          <ul className="mt-1.5 max-h-56 overflow-y-auto">
            {candidates.length ? (
              candidates.map((c) => {
                const sphere = sphereById.get(c.sphere_id);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() =>
                        createLink.mutate(
                          { source_id: item.id, target_id: c.id },
                          {
                            onSuccess: () => { toast(copy.items.connected); setPicking(false); setQ(''); },
                            onError: () => toast.error(copy.common.genericError),
                          }
                        )
                      }
                      className="flex min-h-11 w-full items-center gap-2 rounded-[9px] px-2 text-left text-[13px] hover:bg-surface-2"
                    >
                      {sphere ? <SphereDot color={sphere.color} emoji={sphere.emoji} size={18} /> : null}
                      <span className="truncate">{itemTitle(c)}</span>
                      <span className="ml-auto shrink-0 text-[11px] text-text-muted">{sphere?.name}</span>
                    </button>
                  </li>
                );
              })
            ) : (
              <li className="px-2 py-3 text-[12px] text-text-muted">{copy.items.noResults}</li>
            )}
          </ul>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-pill px-1 text-[13px] font-medium hover:underline"
        >
          <Link2 size={15} aria-hidden />
          {copy.items.connect}
        </button>
      )}
    </section>
  );
}
