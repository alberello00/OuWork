'use client';

import { useQueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useParams } from 'next/navigation';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { db } from '@/lib/queries/client';
import { mergeStaleKeys, presentUsers, WATCHED_TABLES, workspaceTopic, type PresenceMeta, type WatchedTable } from '@/lib/realtime/invalidation';
import { setRealtimeLive } from '@/lib/realtime/status';
import { useSession } from './SessionProvider';

const BATCH_MS = 250;

interface RealtimeValue {
  /** the workspace channel is connected: polling is off */
  live: boolean;
  /** other members on this board (or in this workspace, off a board) */
  present: string[];
}

const RealtimeContext = createContext<RealtimeValue>({ live: false, present: [] });

export function useRealtime() {
  return useContext(RealtimeContext);
}

/**
 * RW4: one private channel per workspace ("ws:<id>") carrying postgres
 * changes (targeted cache invalidation) and presence. When the channel is
 * down, queries fall back to polling (see status.ts and AppProviders).
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { galaxyId, sphereId } = useParams<{ galaxyId?: string; sphereId?: string }>();
  const { userId } = useSession();
  const qc = useQueryClient();
  const [live, setLive] = useState(false);
  const [presence, setPresence] = useState<Record<string, PresenceMeta[]>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const boardRef = useRef<string | null>(sphereId ?? null);
  boardRef.current = sphereId ?? null;

  useEffect(() => {
    if (!galaxyId) return;
    const supabase = db();
    let cancelled = false;
    const pending = new Set<WatchedTable>();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const flush = () => {
      timer = null;
      for (const key of mergeStaleKeys(pending)) void qc.invalidateQueries({ queryKey: key });
      pending.clear();
    };
    const onChange = (table: WatchedTable) => {
      pending.add(table);
      timer ??= setTimeout(flush, BATCH_MS);
    };
    const markLive = (value: boolean) => {
      setLive(value);
      // switching polling on or off: refetch so every query re-reads its interval
      if (setRealtimeLive(value)) void qc.invalidateQueries();
    };

    let channel = supabase.channel(workspaceTopic(galaxyId), {
      config: { private: true, presence: { key: userId } },
    });
    for (const table of WATCHED_TABLES) {
      // links have no galaxy_id column: RLS still limits them to what I can see
      const filter = table === 'item_links' ? undefined : `galaxy_id=eq.${galaxyId}`;
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table, filter }, () => onChange(table));
    }
    channel = channel.on('presence', { event: 'sync' }, () => {
      setPresence({ ...(channel.presenceState() as unknown as Record<string, PresenceMeta[]>) });
    });

    void (async () => {
      // private channels authenticate with the user's access token
      await supabase.realtime.setAuth();
      if (cancelled) return;
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          markLive(true);
          void channel.track({ user_id: userId, board_id: boardRef.current } satisfies PresenceMeta);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          markLive(false);
        }
      });
      channelRef.current = channel;
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      channelRef.current = null;
      setPresence({});
      markLive(false);
      void supabase.removeChannel(channel);
    };
  }, [galaxyId, userId, qc]);

  // moving to another board updates my presence on the same channel
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel || !live) return;
    void channel.track({ user_id: userId, board_id: sphereId ?? null } satisfies PresenceMeta);
  }, [sphereId, userId, live]);

  const value = useMemo(
    () => ({ live, present: presentUsers(presence, userId, sphereId ?? null) }),
    [live, presence, userId, sphereId]
  );
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
