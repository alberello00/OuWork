'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { copy } from '@/lib/copy';
import { useDeleteSphere } from '@/lib/queries/spheres';
import type { Sphere } from '@/lib/queries/types';
import { SpherePicker } from './SpherePicker';

interface Props {
  sphere: Sphere;
  spheres: Sphere[];
  itemCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

/** RF2.5: clear modal; with items inside you choose to move or delete them (RD9.3). */
export function DeleteSphereDialog({ sphere, spheres, itemCount, open, onOpenChange, onDeleted }: Props) {
  const del = useDeleteSphere();
  const inbox = spheres.find((s) => s.is_inbox);
  const [mode, setMode] = useState<'move' | 'delete'>('move');
  const [target, setTarget] = useState<string | null>(inbox?.id ?? null);

  useEffect(() => {
    if (open) { setMode('move'); setTarget(inbox?.id ?? null); }
  }, [open, inbox?.id]);

  const hasSubs = spheres.some((s) => s.parent_id === sphere.id);

  function confirm() {
    del.mutate(
      { id: sphere.id, moveTo: itemCount > 0 && mode === 'move' ? target : null },
      {
        onSuccess: () => { toast(copy.spheres.deleted); onOpenChange(false); onDeleted(); },
        onError: () => toast.error(copy.common.genericError),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={copy.spheres.deleteTitle(sphere.name)}
        description={itemCount > 0 ? copy.spheres.deleteHasItems(itemCount) : copy.spheres.deleteEmpty}
      >
        {itemCount > 0 ? (
          <div className="mt-4 space-y-3" role="radiogroup">
            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[13px] font-medium">
              <input type="radio" name="del-mode" checked={mode === 'move'} onChange={() => setMode('move')} className="h-4 w-4 accent-[var(--color-text)]" />
              {copy.spheres.deleteMove}
            </label>
            {mode === 'move' ? (
              <div className="pl-6">
                <SpherePicker
                  label={copy.spheres.deleteMove}
                  spheres={spheres}
                  value={target}
                  onChange={setTarget}
                  exclude={(s) => s.id === sphere.id || s.parent_id === sphere.id}
                />
              </div>
            ) : null}
            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[13px] font-medium text-danger">
              <input type="radio" name="del-mode" checked={mode === 'delete'} onChange={() => setMode('delete')} className="h-4 w-4 accent-[var(--color-danger)]" />
              {copy.spheres.deleteAlso}
            </label>
          </div>
        ) : null}
        {hasSubs ? <p className="mt-3 text-[12px] text-text-muted">{copy.spheres.deleteSubs}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{copy.common.cancel}</Button>
          <Button variant="danger" onClick={confirm} disabled={del.isPending || (itemCount > 0 && mode === 'move' && !target)}>
            {copy.common.delete}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
