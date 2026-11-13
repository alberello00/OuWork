'use client';

import { useParams } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { copy } from '@/lib/copy';
import { useGalaxy } from '@/lib/queries/galaxies';
import { useRealtime } from './RealtimeProvider';

const MAX = 4;

/** RW4.2: who else is here right now, plus a hint when live updates are down. */
export function PresenceStack() {
  const { galaxyId, sphereId } = useParams<{ galaxyId?: string; sphereId?: string }>();
  const { live, present } = useRealtime();
  const { data: galaxy } = useGalaxy(galaxyId);
  if (!galaxyId || !galaxy) return null;

  const people = present
    .map((id) => galaxy.members.find((m) => m.user_id === id)?.profile)
    .filter((p): p is NonNullable<typeof p> => !!p);
  const shown = people.slice(0, MAX);
  const label = sphereId ? copy.presence.onBoard(people.map((p) => p.display_name)) : copy.presence.inWorkspace(people.map((p) => p.display_name));

  return (
    <div className="flex items-center gap-2">
      {!live ? (
        <span role="status" title={copy.presence.offlineHint} className="inline-flex items-center gap-1.5 text-[12px] text-text-muted max-md:sr-only">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-warning" />
          {copy.presence.offline}
        </span>
      ) : null}
      {shown.length ? (
        <span role="group" aria-label={label} title={label} className="inline-flex items-center">
          {shown.map((p, i) => (
            <Avatar key={p.id} name={p.display_name} color={p.color} size={24} ring className={i > 0 ? '-ml-1.5' : undefined} />
          ))}
          {people.length > MAX ? <span className="ml-1 text-[11px] text-text-muted">+{people.length - MAX}</span> : null}
        </span>
      ) : null}
    </div>
  );
}
