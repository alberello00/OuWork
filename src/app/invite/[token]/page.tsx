import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { AuthIllustration } from '@/components/brand/AuthIllustration';
import { createClient } from '@/lib/supabase/server';
import { copy } from '@/lib/copy';
import { JoinForm, SignUpForm } from './InviteForms';

export const metadata: Metadata = { title: `Invite · ${copy.appName}`, robots: { index: false } };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  const [{ data: preview }, { data: auth }] = await Promise.all([
    supabase.rpc('invite_preview', { _token: token }),
    supabase.auth.getUser(),
  ]);
  const invite = preview?.[0];
  const user = auth.user;

  let myName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();
    myName = profile?.display_name ?? null;
  }

  const valid = invite?.status === 'valid';
  const reason =
    invite?.status === 'used'
      ? copy.invite.used
      : invite?.status === 'expired'
        ? copy.invite.expired
        : copy.invite.notFound;

  return (
    <main className="flex min-h-dvh items-center justify-center p-4 sm:p-8">
      <div className="grid w-full max-w-[880px] overflow-hidden rounded-login border border-border bg-card md:grid-cols-2">
        <section className="order-2 p-6 sm:p-10 md:order-1">
          <Logo />
          {valid ? (
            <>
              <h1 className="mt-8 text-[24px] leading-[30px]">{copy.invite.title(invite.galaxy_name ?? '')}</h1>
              <p className="mt-3 text-[13px] leading-[19.5px] text-text-muted">
                {copy.invite.invitedBy(invite.inviter_name)}
              </p>
              {user ? <JoinForm token={token} name={myName ?? ''} /> : <SignUpForm token={token} />}
            </>
          ) : (
            <>
              <h1 className="mt-8 text-[24px] leading-[30px]">{copy.invite.invalidTitle}</h1>
              <p className="mt-3 text-[14px] leading-relaxed text-text-muted">{reason}</p>
              <Link
                href={user ? '/' : '/login'}
                className="mt-6 inline-flex h-11 items-center rounded-pill border border-border bg-card px-4 text-[13px] font-medium hover:bg-surface-2"
              >
                {user ? copy.invite.goHome : copy.invite.goToLogin}
              </Link>
            </>
          )}
          <p className="mt-6 text-[11.5px] text-text-muted">{copy.inviteOnly}</p>
        </section>
        <AuthIllustration className="order-1 h-44 md:order-2 md:h-auto md:min-h-[480px]" />
      </div>
    </main>
  );
}
