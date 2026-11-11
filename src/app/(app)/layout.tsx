import { redirect } from 'next/navigation';
import { AppProviders } from '@/components/shell/AppProviders';
import { AppShell } from '@/components/shell/AppShell';
import { SessionProvider } from '@/components/shell/SessionProvider';
import { createClient } from '@/lib/supabase/server';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, color, tutorial_completed_at')
    .eq('id', user.id)
    .single();
  if (!profile) redirect('/login');

  return (
    <SessionProvider
      session={{
        userId: user.id,
        profile: { id: profile.id, username: profile.username, display_name: profile.display_name, color: profile.color },
        tutorialCompletedAt: profile.tutorial_completed_at,
      }}
    >
      <AppProviders>
        <AppShell>{children}</AppShell>
      </AppProviders>
    </SessionProvider>
  );
}
