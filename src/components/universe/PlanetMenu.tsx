'use client';

import { ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownTrigger } from '@/components/ui/Dropdown';
import { copy } from '@/lib/copy';
import type { Sphere } from '@/lib/queries/types';

interface Props {
  sphere: Sphere | undefined;
  /** viewport coordinates of the right click / long press */
  at: { x: number; y: number } | null;
  onClose: () => void;
  onOpen: (sphere: Sphere) => void;
  onEdit: (sphere: Sphere) => void;
  onDelete: (sphere: Sphere) => void;
}

/** Context menu of a planet (RF12.1): right click on desktop, long press on touch. */
export function PlanetMenu({ sphere, at, onClose, onOpen, onEdit, onDelete }: Props) {
  if (!sphere || !at) return null;
  return (
    <Dropdown open onOpenChange={(open) => !open && onClose()}>
      {/* invisible anchor at the pointer position */}
      <DropdownTrigger asChild>
        <span aria-hidden tabIndex={-1} className="pointer-events-none fixed h-px w-px" style={{ left: at.x, top: at.y }} />
      </DropdownTrigger>
      <DropdownContent align="start" sideOffset={4} aria-label={copy.spheres.actions(sphere.name)} onCloseAutoFocus={(e) => e.preventDefault()}>
        <DropdownLabel>{`${sphere.emoji} ${sphere.name}`}</DropdownLabel>
        <DropdownItem onSelect={() => onOpen(sphere)}><ArrowRight size={15} aria-hidden />{copy.universe.openSphere}</DropdownItem>
        <DropdownItem onSelect={() => onEdit(sphere)}><Pencil size={15} aria-hidden />{copy.spheres.edit}</DropdownItem>
        {!sphere.is_inbox ? (
          <DropdownItem onSelect={() => onDelete(sphere)} className="text-danger"><Trash2 size={15} aria-hidden />{copy.common.delete}</DropdownItem>
        ) : null}
      </DropdownContent>
    </Dropdown>
  );
}
