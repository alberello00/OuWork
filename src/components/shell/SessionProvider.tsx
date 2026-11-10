'use client';

import { createContext, useContext } from 'react';
import type { Profile } from '@/lib/queries/types';

interface Session {
  userId: string;
  profile: Profile;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ session, children }: { session: Session; children: React.ReactNode }) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside the authenticated area');
  return session;
}
