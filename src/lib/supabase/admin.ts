import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Service role client: bypasses RLS. Server only, and only for creating users
// from an invite. Never import this from a client component.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
