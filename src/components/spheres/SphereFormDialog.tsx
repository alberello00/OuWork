'use client';

import { Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { FieldError, Input, Label } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { copy } from '@/lib/copy';
import { useCreateSphere, useUpdateSphere } from '@/lib/queries/spheres';
import type { Sphere } from '@/lib/queries/types';
import { SPHERE_COLORS, SPHERE_EMOJIS, sphereVar } from '@/lib/tokens';
import { cn } from '@/lib/utils';
import { useSession } from '@/components/shell/SessionProvider';

interface Props {
  galaxyId: string;
  spheres: Sphere[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** edit this sphere; otherwise create */
  sphere?: Sphere;
  defaultParentId?: string | null;
  onCreated?: (sphere: Sphere) => void;
}

/** Create / rename / recolour a sphere (RF2.1, RF2.6, RF4.1). */
export function SphereFormDialog({ galaxyId, spheres, open, onOpenChange, sphere, defaultParentId = null, onCreated }: Props) {
  const { userId } = useSession();
  const create = useCreateSphere(galaxyId);
  const update = useUpdateSphere();
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>('amber');
  const [emoji, setEmoji] = useState<string>('✨');
  const [isPrivate, setIsPrivate] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(sphere?.name ?? '');
    setColor(sphere?.color ?? SPHERE_COLORS[spheres.length % SPHERE_COLORS.length]!);
    setEmoji(sphere?.emoji ?? '✨');
    setIsPrivate(sphere?.is_private ?? false);
    setParentId(sphere ? sphere.parent_id : defaultParentId);
  }, [open, sphere, defaultParentId, spheres.length]);

  const hasChildren = !!sphere && spheres.some((s) => s.parent_id === sphere.id);
  const parentOptions = spheres.filter((s) => !s.parent_id && !s.is_inbox && s.id !== sphere?.id);
  const isInbox = !!sphere?.is_inbox;
  const canTogglePrivate = !isInbox && (!sphere || sphere.created_by === userId);
  const pending = create.isPending || update.isPending;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const input = { name, color, emoji, is_private: isPrivate, parent_id: isInbox ? null : parentId };
    if (sphere) {
      update.mutate(
        { id: sphere.id, ...input },
        { onSuccess: () => { toast(copy.spheres.saved); onOpenChange(false); }, onError: () => toast.error(copy.common.genericError) }
      );
    } else {
      create.mutate(input, {
        onSuccess: (created) => { toast(copy.spheres.created); onOpenChange(false); if (created) onCreated?.(created); },
        onError: () => toast.error(copy.common.genericError),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={sphere ? copy.spheres.edit : defaultParentId ? copy.spheres.newSubSphere : copy.spheres.newSphere}>
        <form onSubmit={submit} className="mt-5 space-y-5">
          <div>
            <Label htmlFor="sphere-name">{copy.spheres.name}</Label>
            <Input id="sphere-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={copy.spheres.namePlaceholder} maxLength={40} required />
          </div>

          <fieldset>
            <legend className="mb-1.5 text-[12px] font-medium text-text-muted">{copy.spheres.color}</legend>
            <div className="flex flex-wrap gap-1.5">
              {SPHERE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  aria-pressed={color === c}
                  onClick={() => setColor(c)}
                  className="flex h-11 w-11 items-center justify-center rounded-full"
                >
                  <span
                    className={cn('h-8 w-8 rounded-full transition-transform duration-200', color === c && 'scale-110 ring-2 ring-text ring-offset-2 ring-offset-card')}
                    style={{ background: sphereVar(c) }}
                  />
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1.5 text-[12px] font-medium text-text-muted">{copy.spheres.emoji}</legend>
            <div className="flex flex-wrap gap-1">
              {SPHERE_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  aria-pressed={emoji === e}
                  onClick={() => setEmoji(e)}
                  className={cn('flex h-11 w-11 items-center justify-center rounded-card text-[20px]', emoji === e ? 'bg-surface-2 ring-2 ring-text' : 'hover:bg-surface-2')}
                >
                  {e}
                </button>
              ))}
            </div>
          </fieldset>

          {!isInbox && !hasChildren && parentOptions.length ? (
            <div>
              <Label htmlFor="sphere-parent">{copy.spheres.parent}</Label>
              <select
                id="sphere-parent"
                value={parentId ?? ''}
                onChange={(e) => setParentId(e.target.value || null)}
                className="h-11 w-full rounded-card border border-border bg-card px-3 text-[16px] sm:text-[14px]"
              >
                <option value="">{copy.spheres.noParent}</option>
                {parentOptions.map((p) => (
                  <option key={p.id} value={p.id}>{`${p.emoji} ${p.name}`}</option>
                ))}
              </select>
            </div>
          ) : null}

          {canTogglePrivate ? (
            <Switch
              checked={isPrivate}
              onChange={setIsPrivate}
              label={copy.spheres.private}
              icon={<Lock size={13} aria-hidden />}
              hint={isPrivate && sphere && !sphere.is_private ? copy.spheres.privateMovesOut : copy.spheres.privateHint}
            />
          ) : isInbox ? (
            <p className="text-[12px] text-text-muted">{copy.spheres.inbox}</p>
          ) : null}

          <FieldError>{create.isError || update.isError ? copy.common.genericError : null}</FieldError>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>{copy.common.cancel}</Button>
            <Button type="submit" variant="primary" disabled={pending || !name.trim()}>
              {sphere ? copy.common.save : copy.common.create}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
