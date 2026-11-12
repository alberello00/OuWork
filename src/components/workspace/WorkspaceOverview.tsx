'use client';

import { Eye, LayoutGrid, Network, Plus, Settings, Sparkles, StickyNote } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GalaxySettingsDialog } from '@/components/galaxies/GalaxySettingsDialog';
import { GalaxySetupDialog } from '@/components/galaxies/GalaxySetupDialog';
import { NewsBanner } from '@/components/news/NewsBanner';
import { useSession } from '@/components/shell/SessionProvider';
import { DeleteSphereDialog } from '@/components/spheres/DeleteSphereDialog';
import { SphereFormDialog } from '@/components/spheres/SphereFormDialog';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { copy } from '@/lib/copy';
import { useMoveSpheres } from '@/lib/queries/spheres';
import { useRole } from '@/lib/queries/useCanEdit';
import type { Item, Sphere } from '@/lib/queries/types';
import { isSpherePrivate, useGalaxyData } from '@/lib/queries/useGalaxyData';
import { cn } from '@/lib/utils';
import { BoardCard } from './BoardCard';
import { BoardMap } from './BoardMap';

/** "Maybe later" on the template picker: do not reopen it by itself on this device. */
const laterKey = (galaxyId: string) => `ouwork:setup-later:${galaxyId}`;
function setupPostponed(galaxyId: string) {
  try {
    return window.localStorage.getItem(laterKey(galaxyId)) === '1';
  } catch {
    return false;
  }
}
function postponeSetup(galaxyId: string) {
  try {
    window.localStorage.setItem(laterKey(galaxyId), '1');
  } catch {
    // private mode: the picker will simply open again next time
  }
}

/** Workspace overview (RW2.3): a grid of boards, and a map of how they are linked. */
export function WorkspaceOverview({ galaxyId }: { galaxyId: string }) {
  const data = useGalaxyData(galaxyId);
  const { userId } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const moveSpheres = useMoveSpheres(galaxyId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Sphere | null>(null);
  const [deleting, setDeleting] = useState<Sphere | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const { canEdit } = useRole(galaxyId);

  const view = params.get('view') === 'map' ? 'map' : 'boards';
  const galaxyRow = data.galaxy;
  const needsSetup = !!galaxyRow && !galaxyRow.setup_completed_at;
  const isOwner = galaxyRow?.owner_id === userId;

  // the template picker opens by itself once for the owner of a workspace that is not set up
  const setupOffered = useRef(false);
  useEffect(() => {
    if (setupOffered.current || !needsSetup || !isOwner) return;
    setupOffered.current = true;
    if (!setupPostponed(galaxyId)) setSetupOpen(true);
  }, [needsSetup, isOwner, galaxyId]);

  // items per top-level board (items of a sub-board count for its parent)
  const itemsByTop = useMemo(() => {
    const topOf = new Map(data.spheres.map((s) => [s.id, s.parent_id ?? s.id]));
    const map = new Map<string, Item[]>();
    for (const i of data.items) {
      const top = topOf.get(i.sphere_id);
      if (!top) continue;
      const list = map.get(top) ?? [];
      list.push(i);
      map.set(top, list);
    }
    return map;
  }, [data.spheres, data.items]);

  function setView(next: 'boards' | 'map') {
    const qs = new URLSearchParams(params.toString());
    if (next === 'map') qs.set('view', 'map');
    else qs.delete('view');
    const s = qs.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  }

  if (data.isLoading) return <main className="flex-1" />;
  if (!data.galaxy) {
    return (
      <EmptyState emoji="🔒" title={copy.galaxies.notFoundTitle} body={copy.galaxies.notFoundBody} className="flex-1">
        <Link href="/" className="text-[13px] underline underline-offset-2">{copy.nav.allGalaxies}</Link>
      </EmptyState>
    );
  }
  const galaxy = data.galaxy;
  const owner = galaxy.members.find((m) => m.user_id === galaxy.owner_id)?.profile;
  const onlyInbox = data.topLevel.length > 0 && data.topLevel.every((s) => s.is_inbox);
  // the Inbox always comes last
  const boards = [...data.topLevel].sort((a, b) => Number(a.is_inbox) - Number(b.is_inbox));

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border bg-card px-4 pt-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="min-w-0 flex-1 truncate text-[20px] leading-tight max-sm:basis-full">{galaxy.name}</h1>
          <AvatarStack members={galaxy.members} size={24} max={5} />
          <Link href={`/w/${galaxyId}/notes`} className="inline-flex h-9 items-center gap-2 rounded-pill border border-border bg-card px-3 text-[12px] font-medium hover:bg-surface-2 lg:hidden">
            <StickyNote size={14} aria-hidden />
            {copy.nav.notes}
          </Link>
          <Button size="sm" aria-label={copy.nav.settings} data-tour="settings" onClick={() => setSettingsOpen(true)}>
            <Settings size={14} aria-hidden />
            <span className="max-sm:sr-only">{copy.nav.settingsShort}</span>
          </Button>
          {canEdit ? (
            <Button size="sm" variant="primary" onClick={() => setCreating(true)}>
              <Plus size={14} aria-hidden />
              {copy.universe.newSphere}
            </Button>
          ) : (
            <span title={copy.common.readOnlyHint} className="inline-flex h-8 items-center gap-1.5 rounded-pill border border-border bg-surface-2 px-2.5 text-[12px] font-medium text-text-muted">
              <Eye size={14} aria-hidden />
              {copy.common.readOnly}
            </span>
          )}
        </div>
        <div role="tablist" aria-label={copy.nav.universe} className="mt-3 flex gap-4">
          {([['boards', copy.universe.tabBoards, LayoutGrid], ['map', copy.universe.tabMap, Network]] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              onClick={() => setView(id)}
              className={cn(
                '-mb-px inline-flex h-10 items-center gap-1.5 border-b-2 px-0.5 text-[13px] font-medium transition-colors duration-150',
                view === id ? 'border-accent text-text' : 'border-transparent text-text-muted hover:text-text'
              )}
            >
              <Icon size={14} aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'map' ? (
        <div className="paper-sky relative min-h-[420px] flex-1">
          <div className="absolute inset-0">
            <BoardMap galaxyId={galaxyId} canEdit={canEdit} topLevel={data.topLevel} spheres={data.spheres} items={data.items} itemsByTop={itemsByTop} sphereById={data.sphereById} />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4 sm:px-6">
          <NewsBanner galaxyId={galaxyId} className="mb-4 max-w-3xl" />
          {onlyInbox && canEdit ? (
            <div data-tour="empty-workspace" className="mb-4 max-w-xl rounded-card border border-border bg-card p-4">
              {needsSetup && !isOwner ? (
                <>
                  <p className="text-[14px] font-semibold">{copy.setup.waitingTitle(owner?.display_name ?? '…')}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-text-muted">{copy.setup.waitingBody}</p>
                </>
              ) : (
                <>
                  <p className="text-[14px] font-semibold">{copy.setup.emptyTitle}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-text-muted">{copy.setup.emptyBody}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {needsSetup ? (
                      <Button variant="primary" size="sm" onClick={() => setSetupOpen(true)}><Sparkles size={14} aria-hidden />{copy.setup.emptyCta}</Button>
                    ) : null}
                    <Button size="sm" onClick={() => setCreating(true)}><Plus size={14} aria-hidden />{copy.setup.emptyManual}</Button>
                  </div>
                </>
              )}
            </div>
          ) : null}
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {boards.map((s) => (
              <BoardCard
                key={s.id}
                galaxyId={galaxyId}
                sphere={s}
                subs={data.childrenOf(s.id)}
                items={itemsByTop.get(s.id) ?? []}
                isPrivate={isSpherePrivate(s, data.sphereById)}
                sphereById={data.sphereById}
                profileById={data.profileById}
                onEdit={setEditing}
                onDelete={setDeleting}
                canEdit={canEdit}
              />
            ))}
          </ul>
        </div>
      )}

      {editing ? (
        <SphereFormDialog galaxyId={galaxyId} spheres={data.spheres} open onOpenChange={(o) => !o && setEditing(null)} sphere={editing} />
      ) : null}
      {deleting ? (
        <DeleteSphereDialog
          sphere={deleting}
          spheres={data.spheres}
          itemCount={itemsByTop.get(deleting.id)?.length ?? 0}
          open
          onOpenChange={(o) => !o && setDeleting(null)}
          onDeleted={() => setDeleting(null)}
        />
      ) : null}
      <GalaxySettingsDialog galaxy={galaxy} open={settingsOpen} onOpenChange={setSettingsOpen} onSetup={() => setSetupOpen(true)} />
      {needsSetup && isOwner ? (
        <GalaxySetupDialog
          galaxy={galaxy}
          existingCount={data.topLevel.filter((s) => !s.is_inbox).length}
          open={setupOpen}
          onOpenChange={(o) => {
            setSetupOpen(o);
            if (!o) postponeSetup(galaxyId);
          }}
          onDone={() => setSetupOpen(false)}
        />
      ) : null}
      <SphereFormDialog
        galaxyId={galaxyId}
        spheres={data.spheres}
        open={creating}
        onOpenChange={setCreating}
        onCreated={(s) => {
          // on the map a new board appears to the right of everything else
          const maxX = Math.max(0, ...data.topLevel.map((t) => t.x));
          moveSpheres.mutate([{ id: s.id, x: Math.round(maxX + 280), y: 0 }]);
        }}
      />
    </main>
  );
}
