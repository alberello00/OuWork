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
    .select('id, username, display_name, color')
    .eq('id', user.id)
    .single();
  if (!profile) redirect('/login');

  return (
    <SessionProvider session={{ userId: user.id, profile }}>
      <AppProviders>
        <AppShell>{children}</AppShell>
      </AppProviders>
    </SessionProvider>
  );
}
