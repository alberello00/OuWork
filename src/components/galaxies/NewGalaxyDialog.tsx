'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { FieldError, Input, Label } from '@/components/ui/Input';
import { copy } from '@/lib/copy';
import { useCreateGalaxy } from '@/lib/queries/galaxies';

export function NewGalaxyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const create = useCreateGalaxy();
  const [name, setName] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate(name, {
      onSuccess: (galaxy) => {
        setName('');
        onOpenChange(false);
        if (galaxy) router.push(`/g/${galaxy.id}`);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={copy.galaxies.createTitle} description={copy.galaxies.createHint}>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <Label htmlFor="galaxy-name">{copy.galaxies.nameLabel}</Label>
            <Input
              id="galaxy-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={copy.galaxies.namePlaceholder}
              maxLength={60}
              autoFocus
              required
            />
          </div>
          <FieldError>{create.isError ? copy.common.genericError : null}</FieldError>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {copy.common.cancel}
            </Button>
            <Button type="submit" variant="primary" disabled={create.isPending || !name.trim()}>
              {copy.common.create}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
