// Realtime (RW4.1): which cached queries a change on a table makes stale.
// Pure, so it is unit tested; the provider only batches and applies it.

export const WATCHED_TABLES = ['items', 'spheres', 'annotations', 'item_links', 'galaxy_members'] as const;
export type WatchedTable = (typeof WATCHED_TABLES)[number];

/** Query-key prefixes (TanStack Query matches on prefix) to invalidate. */
export function staleKeys(table: WatchedTable): readonly (readonly string[])[] {
  switch (table) {
    case 'items':
      // a deleted item also takes its links with it
      return [['items'], ['stats'], ['search'], ['links']];
    case 'spheres':
      // deleting or privatising a board moves or removes items
      return [['spheres'], ['stats'], ['items'], ['search']];
    case 'annotations':
      return [['annotations']];
    case 'item_links':
      return [['links']];
    case 'galaxy_members':
      return [['galaxies']];
  }
}

/** Union of the keys for a batch of changes, without duplicates. */
export function mergeStaleKeys(tables: Iterable<WatchedTable>): string[][] {
  const seen = new Set<string>();
  const out: string[][] = [];
  for (const t of tables) {
    for (const key of staleKeys(t)) {
      const id = key.join('/');
      if (!seen.has(id)) {
        seen.add(id);
        out.push([...key]);
      }
    }
  }
  return out;
}

/** Workspace channel name; the database lets only members join it. */
export function workspaceTopic(galaxyId: string): string {
  return `ws:${galaxyId}`;
}

export interface PresenceMeta {
  user_id: string;
  /** board the person is looking at, null on the overview / notes */
  board_id: string | null;
}

/**
 * People to show in the top bar (RW4.2): on a board, the others on that board;
 * elsewhere, the others in the workspace. One entry per person.
 */
export function presentUsers(state: Record<string, PresenceMeta[]>, me: string, boardId: string | null): string[] {
  const out = new Set<string>();
  for (const metas of Object.values(state)) {
    for (const m of metas) {
      if (m.user_id === me) continue;
      if (boardId && m.board_id !== boardId) continue;
      out.add(m.user_id);
    }
  }
  return [...out];
}
