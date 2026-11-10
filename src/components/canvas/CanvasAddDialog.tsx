'use client';

import { Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { emptyDraft, isDraftValid, ItemFields, type ItemDraft } from '@/components/items/ItemFields';
import { Button } from '@/components/ui/Button';
import { Dialog, SheetContent } from '@/components/ui/Dialog';
import { FieldError } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { copy } from '@/lib/copy';
import type { ItemType, Sphere } from '@/lib/queries/types';
import { ImageTooBigError, useAddItem } from '@/lib/queries/useAddItem';

interface Props {
  type: ItemType | null;
  galaxyId: string;
  sphere: Sphere;
  spherePrivate: boolean;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onCreated: (id: string) => void;
}

const LABEL: Record<ItemType, string> = { note: copy.items.note, link: copy.items.link, image: copy.items.image };

/** Creates an item exactly where the canvas was clicked (RF5.3). */
export function CanvasAddDialog({ type, galaxyId, sphere, spherePrivate, position, onClose, onCreated }: Props) {
  const add = useAddItem();
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft);
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (type) { setDraft(emptyDraft); setIsPrivate(false); setError(null); }
  }, [type]);

  if (!type || !position) return null;
  const at = position;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isDraftValid(type!, draft)) return;
    add.mutate(
      { galaxyId, sphereId: sphere.id, type: type!, ...draft, is_private: isPrivate, position: at },
      {
        onSuccess: ({ id }) => { toast(copy.items.added(sphere.name)); onCreated(id); onClose(); },
        onError: (err) => setError(err instanceof ImageTooBigError ? copy.items.imageTooBig : copy.common.genericError),
      }
    );
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <SheetContent title={copy.canvas.addTitle(LABEL[type])}>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <ItemFields type={type} draft={draft} onChange={setDraft} autoFocus />
          <Switch
            checked={isPrivate || spherePrivate}
            disabled={spherePrivate}
            onChange={setIsPrivate}
            label={copy.items.private}
            icon={<Lock size={13} aria-hidden />}
            hint={spherePrivate ? copy.items.privateLocked : copy.items.privateHint}
          />
          <FieldError>{error}</FieldError>
          <Button type="submit" variant="primary" className="w-full" disabled={add.isPending || !isDraftValid(type, draft)}>
            {add.isPending ? copy.items.adding : copy.items.add}
          </Button>
        </form>
      </SheetContent>
    </Dialog>
  );
}
