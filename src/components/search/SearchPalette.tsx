'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Command } from 'cmdk';
import { Search } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { itemTitle } from '@/components/items/ItemCard';
import { NewBadge } from '@/components/items/NewBadge';
import { PrivateBadge } from '@/components/items/PrivateBadge';
import { SphereChip } from '@/components/spheres/SphereChip';
import { SphereDot } from '@/components/spheres/SphereDot';
import { copy } from '@/lib/copy';
import { useGalaxies } from '@/lib/queries/galaxies';
import { useSearch } from '@/lib/queries/items';
import { useAllSpheres } from '@/lib/queries/spheres';
import type { Item, Sphere } from '@/lib/queries/types';
import { cn, domainOf } from '@/lib/utils';

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Markdown to plain text, enough for a one-line snippet. */
function plain(md: string): string {
  return md
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^[#>\-*+\d.\s]+/gm, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function snippet(item: Item, q: string): string {
  const text = item.type === 'link' ? item.url ?? '' : plain(item.body_md ?? item.caption ?? '');
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return item.type === 'link' ? domainOf(item.url) : text.slice(0, 80);
  const start = Math.max(0, i - 30);
  return `${start > 0 ? '…' : ''}${text.slice(start, i + q.length + 50).replace(/\s+/g, ' ')}`;
}

/** ⌘K palette (RF9, RD9.1, frames 1:2 / 6:2 / 13:2): results grouped by sphere, chips to filter. */
export function SearchPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const params = useParams<{ galaxyId?: string }>();
  const { data: galaxies = [] } = useGalaxies();
  const { data: spheres = [] } = useAllSpheres();
  const [q, setQ] = useState('');
  const [galaxyFilter, setGalaxyFilter] = useState<string | null>(null);
  const [sphereFilter, setSphereFilter] = useState<string | null>(null);
  const term = useDebounced(q, 180);

  useEffect(() => {
    if (open) {
      setGalaxyFilter(params.galaxyId ?? null);
      setSphereFilter(null);
    }
  }, [open, params.galaxyId]);

  const { data: results = [], isFetching } = useSearch(term, galaxyFilter);
  const sphereById = useMemo(() => new Map(spheres.map((s) => [s.id, s])), [spheres]);
  const galaxyName = useMemo(() => new Map(galaxies.map((g) => [g.id, g.name])), [galaxies]);
  const topOf = (s: Sphere | undefined) => (s?.parent_id ? sphereById.get(s.parent_id) : s);

  // group by top-level sphere; the sub-sphere is shown on the right of the row
  const groups = useMemo(() => {
    const m = new Map<string, { sphere: Sphere; items: Item[] }>();
    for (const item of results) {
      const own = sphereById.get(item.sphere_id);
      const top = topOf(own);
      if (!top) continue;
      if (sphereFilter && top.id !== sphereFilter && own?.id !== sphereFilter) continue;
      const g = m.get(top.id) ?? { sphere: top, items: [] };
      g.items.push(item);
      m.set(top.id, g);
    }
    return [...m.values()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, sphereById, sphereFilter]);

  const sphereChips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of results) {
      const top = topOf(sphereById.get(item.sphere_id));
      if (top) counts.set(top.id, (counts.get(top.id) ?? 0) + 1);
    }
    return [...counts].map(([id, n]) => ({ sphere: sphereById.get(id)!, n }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, sphereById]);

  function go(item: Item) {
    const own = sphereById.get(item.sphere_id);
    const top = topOf(own) ?? own;
    if (!top) return;
    onOpenChange(false);
    setQ('');
    // RF9.3: open the sphere and centre the canvas on the item
    const sub = own?.parent_id ? `&sub=${own.id}` : '';
    router.push(`/g/${item.galaxy_id}/s/${top.id}?view=canvas&focus=${item.id}&item=${item.id}${sub}`);
  }

  const chip = 'shrink-0 rounded-pill';
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay animate-fade-in" />
        <DialogPrimitive.Content
          className="fixed inset-x-0 top-0 z-50 mx-auto flex max-h-[100dvh] w-full flex-col overflow-hidden border border-border bg-card text-text shadow-panel animate-fade-in sm:top-[12vh] sm:max-h-[72vh] sm:w-[min(92vw,640px)] sm:rounded-login"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">{copy.nav.search}</DialogPrimitive.Title>
          <Command shouldFilter={false} label={copy.nav.search} className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center gap-2.5 border-b border-border px-4">
              <Search size={18} aria-hidden className="shrink-0 text-text-muted" />
              <Command.Input
                value={q}
                onValueChange={setQ}
                placeholder={copy.search.placeholder}
                className="h-14 w-full bg-transparent text-[16px] outline-none placeholder:text-placeholder focus-visible:outline-none"
                autoFocus
              />
              <DialogPrimitive.Close className="rounded-[6px] border border-border px-1.5 py-0.5 text-[11px] text-text-muted max-sm:hidden">esc</DialogPrimitive.Close>
              <DialogPrimitive.Close className="inline-flex h-11 items-center px-1 text-[13px] font-medium sm:hidden">{copy.common.cancel}</DialogPrimitive.Close>
            </div>

            {galaxies.length > 1 ? (
              <div className="flex gap-1.5 overflow-x-auto border-b border-border px-4 py-2" role="group" aria-label={copy.search.filterGalaxy}>
                {[{ id: null as string | null, name: copy.search.allGalaxies }, ...galaxies.map((g) => ({ id: g.id as string | null, name: g.name }))].map((g) => (
                  <button
                    key={g.id ?? 'all'}
                    type="button"
                    aria-pressed={galaxyFilter === g.id}
                    onClick={() => { setGalaxyFilter(g.id); setSphereFilter(null); }}
                    className={cn(chip, 'min-h-9 border px-3 text-[12px] font-medium', galaxyFilter === g.id ? 'border-text bg-text text-bg' : 'border-border bg-surface-2')}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            ) : null}

            {sphereChips.length > 1 ? (
              <div className="flex gap-1.5 overflow-x-auto px-4 pt-2" role="group" aria-label={copy.search.filterSphere}>
                <button type="button" aria-pressed={!sphereFilter} onClick={() => setSphereFilter(null)} className={cn(chip, 'min-h-9 border px-3 text-[12px] font-medium', !sphereFilter ? 'border-text bg-text text-bg' : 'border-border bg-surface-2')}>
                  {copy.search.allSpheres}
                </button>
                {sphereChips.map(({ sphere, n }) => (
                  <button key={sphere.id} type="button" aria-pressed={sphereFilter === sphere.id} onClick={() => setSphereFilter(sphereFilter === sphere.id ? null : sphere.id)} className={chip}>
                    <SphereChip sphere={sphere} count={n} selected={sphereFilter === sphere.id} />
                  </button>
                ))}
              </div>
            ) : null}

            <Command.List className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-1">
              {!term.trim() ? (
                <p className="px-3 py-8 text-center text-[13px] text-text-muted">{copy.search.hint}</p>
              ) : isFetching && !results.length ? (
                <Command.Loading><p className="px-3 py-8 text-center text-[13px] text-text-muted">{copy.search.searching}</p></Command.Loading>
              ) : null}
              {term.trim() && !isFetching && !groups.length ? (
                <div className="px-3 py-10 text-center">
                  <p className="text-[32px]" aria-hidden>🔭</p>
                  <p className="mt-2 text-[13px] text-text-muted">{copy.search.empty}</p>
                </div>
              ) : null}
              {groups.map(({ sphere, items }) => (
                <Command.Group
                  key={sphere.id}
                  heading={
                    <span className="flex items-center gap-2">
                      <SphereDot color={sphere.color} emoji={sphere.emoji} size={18} />
                      {sphere.name}
                      {!galaxyFilter ? <span className="font-normal normal-case tracking-normal text-text-muted">· {galaxyName.get(sphere.galaxy_id)}</span> : null}
                    </span>
                  }
                  className="mt-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-text-muted"
                >
                  {items.map((item) => {
                    const own = sphereById.get(item.sphere_id);
                    return (
                      <Command.Item
                        key={item.id}
                        value={item.id}
                        onSelect={() => go(item)}
                        className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2 data-[selected=true]:bg-surface-2"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-medium">{itemTitle(item)}</span>
                          <span className="block truncate text-[12px] text-text-muted">{snippet(item, term.trim())}</span>
                        </span>
                        {item.is_private ? <PrivateBadge /> : null}
                        {item.is_new ? <NewBadge /> : null}
                        {own?.parent_id ? <span className="shrink-0 text-[11.5px] text-text-muted">{own.emoji} {own.name}</span> : null}
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
