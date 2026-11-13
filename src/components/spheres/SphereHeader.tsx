'use client';

import { ArrowLeft, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { NewBadge } from '@/components/items/NewBadge';
import { PrivateBadge } from '@/components/items/PrivateBadge';
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from '@/components/ui/Dropdown';
import { ReadOnlyBadge } from '@/components/ui/ReadOnlyBadge';
import { copy } from '@/lib/copy';
import type { Sphere } from '@/lib/queries/types';
import { cn } from '@/lib/utils';
import { DeleteSphereDialog } from './DeleteSphereDialog';
import { SphereChip } from './SphereChip';
import { SphereDot } from './SphereDot';
import { SphereFormDialog } from './SphereFormDialog';

interface Props {
  galaxyId: string;
  sphere: Sphere;
  parent?: Sphere;
  spheres: Sphere[];
  subSpheres: Sphere[];
  countOf: (sphereId: string) => number;
  newCount: number;
  totalCount: number;
  isPrivate: boolean;
  activeSub: string | null;
  onSubChange: (id: string | null) => void;
  /** viewers get no edit / delete / sub-board menu (RW3) */
  canEdit: boolean;
  /** view switch (canvas / list), rendered at the right */
  children?: React.ReactNode;
}

/** Name, sub-sphere chips that filter (RF2.6), and sphere actions. */
export function SphereHeader(props: Props) {
  const { galaxyId, sphere, parent, spheres, subSpheres, countOf, newCount, totalCount, isPrivate, activeSub, onSubChange, canEdit, children } = props;
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [addingSub, setAddingSub] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const canHaveSubs = !sphere.parent_id && !sphere.is_inbox;

  return (
    <div className="border-b border-border bg-card px-3 py-2 sm:px-4">
      <div className="flex items-center gap-2">
        <Link
          href={parent ? `/w/${galaxyId}/b/${parent.id}` : `/w/${galaxyId}`}
          aria-label={copy.common.back}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-pill hover:bg-surface-2 max-sm:h-11 max-sm:w-11 lg:hidden"
        >
          <ArrowLeft size={17} aria-hidden />
        </Link>
        <SphereDot color={sphere.color} emoji={sphere.emoji} size={30} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[16px] leading-tight">
            {parent ? <span className="text-text-muted">{parent.name} / </span> : null}
            {sphere.name}
          </h1>
          <p className="mt-0.5 flex items-center gap-2 text-[12px] text-text-muted">
            {copy.spheres.items(totalCount)}
            {isPrivate ? <PrivateBadge /> : null}
            {newCount > 0 ? <NewBadge count={newCount} /> : null}
          </p>
        </div>
        {children}
        {canEdit ? <Dropdown>
          <DropdownTrigger aria-label={copy.spheres.edit} className="inline-flex h-9 w-9 items-center justify-center rounded-pill hover:bg-surface-2 max-sm:h-11 max-sm:w-11">
            <MoreHorizontal size={17} aria-hidden />
          </DropdownTrigger>
          <DropdownContent align="end">
            <DropdownItem onSelect={() => setEditing(true)}><Pencil size={15} aria-hidden />{copy.spheres.edit}</DropdownItem>
            {canHaveSubs ? (
              <DropdownItem onSelect={() => setAddingSub(true)}><Plus size={15} aria-hidden />{copy.spheres.newSubSphere}</DropdownItem>
            ) : null}
            {!sphere.is_inbox ? (
              <DropdownItem onSelect={() => setDeleting(true)} className="text-danger"><Trash2 size={15} aria-hidden />{copy.common.delete}</DropdownItem>
            ) : null}
          </DropdownContent>
        </Dropdown> : <ReadOnlyBadge className="max-sm:hidden" />}
      </div>

      {subSpheres.length ? (
        <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-0.5" role="group" aria-label="Sub-boards">
          <button type="button" aria-pressed={!activeSub} onClick={() => onSubChange(null)} className="shrink-0 rounded-pill">
            <span className={cn('inline-flex min-h-8 items-center rounded-pill border px-2.5 text-[12px] font-medium max-sm:min-h-10', !activeSub ? 'border-accent bg-accent-soft text-accent' : 'border-border bg-card text-text-muted')}>
              {copy.spheres.all} · {totalCount}
            </span>
          </button>
          {subSpheres.map((s) => (
            <button key={s.id} type="button" aria-pressed={activeSub === s.id} onClick={() => onSubChange(activeSub === s.id ? null : s.id)} className="shrink-0 rounded-pill">
              <SphereChip sphere={s} count={countOf(s.id)} selected={activeSub === s.id} />
            </button>
          ))}
        </div>
      ) : null}

      <SphereFormDialog galaxyId={galaxyId} spheres={spheres} open={editing} onOpenChange={setEditing} sphere={sphere} />
      <SphereFormDialog galaxyId={galaxyId} spheres={spheres} open={addingSub} onOpenChange={setAddingSub} defaultParentId={sphere.id} />
      <DeleteSphereDialog
        sphere={sphere}
        spheres={spheres}
        itemCount={totalCount}
        open={deleting}
        onOpenChange={setDeleting}
        onDeleted={() => router.push(`/w/${galaxyId}`)}
      />
    </div>
  );
}
