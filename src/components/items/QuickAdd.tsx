'use client';

import { FileText, Image as ImageIcon, Link2, Lock, Plus } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { SpherePicker } from '@/components/spheres/SpherePicker';
import { Button } from '@/components/ui/Button';
import { Dialog, SheetContent } from '@/components/ui/Dialog';
import { FieldError } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { copy } from '@/lib/copy';
import { useGalaxies } from '@/lib/queries/galaxies';
import { useItems } from '@/lib/queries/items';
import { useSpheres } from '@/lib/queries/spheres';
import type { ItemType } from '@/lib/queries/types';
import { ImageTooBigError, useAddItem } from '@/lib/queries/useAddItem';
import { isSpherePrivate } from '@/lib/queries/useGalaxyData';
import { cn } from '@/lib/utils';
import { emptyDraft, isDraftValid, ItemFields, type ItemDraft } from './ItemFields';

const TYPES: { type: ItemType; label: string; icon: React.ReactNode }[] = [
  { type: 'note', label: copy.items.note, icon: <FileText size={15} aria-hidden /> },
  { type: 'link', label: copy.items.link, icon: <Link2 size={15} aria-hidden /> },
  { type: 'image', label: copy.items.image, icon: <ImageIcon size={15} aria-hidden /> },
];

const LAST_GALAXY_KEY = 'ourworld:last-galaxy';

/** "+" always visible + quick form as a bottom sheet (RF10.1, RD8.2). */
export function QuickAdd({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const params = useParams<{ galaxyId?: string; sphereId?: string }>();
  const router = useRouter();
  const { data: galaxies = [] } = useGalaxies();
  const [galaxyId, setGalaxyId] = useState<string | null>(null);
  const [sphereId, setSphereId] = useState<string | null>(null);
  const [type, setType] = useState<ItemType>('note');
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft);
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const add = useAddItem();

  // galaxy: the one I am in, else the last used, else the first shared one
  useEffect(() => {
    if (!open || !galaxies.length) return;
    let last: string | null = null;
    try { last = window.localStorage.getItem(LAST_GALAXY_KEY); } catch { /* storage unavailable */ }
    const pick = params.galaxyId ?? (galaxies.some((g) => g.id === last) ? last : galaxies[0]!.id);
    setGalaxyId(pick);
    setSphereId(params.galaxyId ? (params.sphereId ?? null) : null);
    setError(null);
  }, [open, galaxies, params.galaxyId, params.sphereId]);

  const { data: spheres = [] } = useSpheres(galaxyId);
  const { data: items = [] } = useItems(galaxyId);
  const sphereById = useMemo(() => new Map(spheres.map((s) => [s.id, s])), [spheres]);
  const inbox = spheres.find((s) => s.is_inbox);
  const target = sphereId ? sphereById.get(sphereId) : inbox;
  const lockedPrivate = isSpherePrivate(target, sphereById);

  function reset() {
    setDraft(emptyDraft);
    setIsPrivate(false);
    setError(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!galaxyId || !target || !isDraftValid(type, draft)) return;
    add.mutate(
      {
        galaxyId,
        sphereId: target.id,
        type,
        ...draft,
        is_private: isPrivate,
        siblings: items.filter((i) => i.sphere_id === target.id),
      },
      {
        onSuccess: ({ id }) => {
          try { window.localStorage.setItem(LAST_GALAXY_KEY, galaxyId); } catch { /* ignore */ }
          toast(copy.items.added(target.name), {
            action: { label: copy.spheres.open, onClick: () => router.push(`/g/${galaxyId}/s/${target.id}?item=${id}`) },
          });
          reset();
          onOpenChange(false);
        },
        onError: (err) => setError(err instanceof ImageTooBigError ? copy.items.imageTooBig : copy.common.genericError),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setError(null); }}>
      <SheetContent title={copy.nav.add}>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div role="tablist" aria-label={copy.nav.add} className="grid grid-cols-3 gap-1 rounded-pill bg-surface-2 p-1">
            {TYPES.map((t) => (
              <button
                key={t.type}
                type="button"
                role="tab"
                aria-selected={type === t.type}
                onClick={() => { setType(t.type); setError(null); }}
                className={cn(
                  'inline-flex h-10 items-center justify-center gap-1.5 rounded-pill text-[13px] font-medium transition-colors duration-200',
                  type === t.type ? 'bg-card shadow-card' : 'text-text-muted hover:text-text'
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          <ItemFields type={type} draft={draft} onChange={setDraft} autoFocus />

          {!params.galaxyId && galaxies.length > 1 ? (
            <div>
              <p className="mb-1.5 text-[12px] font-medium text-text-muted">{copy.items.galaxy}</p>
              <div className="flex flex-wrap gap-1.5">
                {galaxies.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    aria-pressed={g.id === galaxyId}
                    onClick={() => { setGalaxyId(g.id); setSphereId(null); }}
                    className={cn(
                      'min-h-9 rounded-pill border px-3 text-[12px] font-medium',
                      g.id === galaxyId ? 'border-text bg-text text-bg' : 'border-border bg-surface-2'
                    )}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="mb-1.5 text-[12px] font-medium text-text-muted">
              {copy.items.sphere} <span className="font-normal">— {copy.items.sphereHint}</span>
            </p>
            <SpherePicker label={copy.items.sphere} spheres={spheres.filter((s) => !s.is_inbox)} value={sphereId} onChange={setSphereId} allowNone />
          </div>

          <Switch
            checked={isPrivate || lockedPrivate}
            disabled={lockedPrivate}
            onChange={setIsPrivate}
            label={copy.items.private}
            icon={<Lock size={13} aria-hidden />}
            hint={lockedPrivate ? copy.items.privateLocked : copy.items.privateHint}
          />

          <FieldError>{error}</FieldError>
          <div className="sticky -bottom-5 -mx-5 border-t border-border bg-card px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 sm:static sm:mx-0 sm:border-0 sm:p-0">
            <Button type="submit" variant="primary" className="w-full" disabled={add.isPending || !target || !isDraftValid(type, draft)}>
              {add.isPending ? copy.items.adding : copy.items.add}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Dialog>
  );
}

/** `tour`: this is the "+" the tutorial points at (RF15.3). */
export function AddFab({ onClick, className, tour }: { onClick: () => void; className?: string; tour?: boolean }) {
  return (
    <button
      type="button"
      aria-label={copy.nav.add}
      data-tour={tour ? 'add' : undefined}
      onClick={onClick}
      className={cn(
        'inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent-strong text-on-accent shadow-accent',
        'transition-transform duration-200 hover:scale-105 active:scale-95',
        className
      )}
    >
      <Plus size={26} aria-hidden />
    </button>
  );
}
