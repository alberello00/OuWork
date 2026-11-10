import type { Metadata } from 'next';
import { Logo } from '@/components/brand/Logo';
import { NightIllustration } from '@/components/brand/NightIllustration';
import { safeNextPath } from '@/lib/auth';
import { copy } from '@/lib/copy';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: `${copy.login.submit} · ${copy.appName}` };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center p-4 sm:p-8">
      <div className="grid w-full max-w-[880px] overflow-hidden rounded-login border border-border bg-card shadow-card md:grid-cols-2">
        <section className="order-2 p-6 sm:p-10 md:order-1">
          <Logo />
          <h1 className="mt-8 text-[40px] leading-[44px]">{copy.tagline}</h1>
          <p className="mt-3 text-[13px] leading-[19.5px] text-text-muted">{copy.login.intro}</p>
          <LoginForm next={safeNextPath(next)} />
          <p className="mt-6 text-[11.5px] text-text-muted">{copy.inviteOnly}</p>
        </section>
        <NightIllustration className="order-1 h-44 md:order-2 md:h-auto md:min-h-[520px]" />
      </div>
    </main>
  );
}
