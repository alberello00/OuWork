import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';

let browserClient: SupabaseClient<Database> | undefined;

/** One browser client for all query hooks. */
export function db(): SupabaseClient<Database> {
  browserClient ??= createClient();
  return browserClient;
}

/** Turns a PostgREST/Storage error into a thrown Error so TanStack Query sees it. */
export function unwrap<T>(result: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (result.error) throw new Error(result.error.message);
  return result.data as NonNullable<T>;
}
