'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { FieldError, Input, Label } from '@/components/ui/Input';
import { copy } from '@/lib/copy';
import { acceptInvite, signUpWithInvite, type InviteState } from './actions';

export function JoinForm({ token, name }: { token: string; name: string }) {
  const [state, action, pending] = useActionState<InviteState, FormData>(acceptInvite, {});
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      <p className="text-[13px] text-text-muted">{copy.invite.joinAs(name)}</p>
      <FieldError>{state.error}</FieldError>
      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        {pending ? copy.invite.joining : copy.invite.join}
      </Button>
    </form>
  );
}

export function SignUpForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<InviteState, FormData>(signUpWithInvite, {});
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      <p className="text-[13px] text-text-muted">{copy.invite.newAccount}</p>
      <div>
        <Label htmlFor="display_name">{copy.invite.displayName}</Label>
        <Input id="display_name" name="display_name" autoComplete="given-name" maxLength={40} defaultValue={state.values?.displayName} required />
      </div>
      <div>
        <Label htmlFor="username">{copy.invite.username}</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          minLength={3}
          maxLength={24}
          defaultValue={state.values?.username}
          aria-describedby="username-hint"
          required
        />
        <p id="username-hint" className="mt-1.5 text-[11.5px] text-text-muted">
          {copy.invite.usernameHint}
        </p>
      </div>
      <div>
        <Label htmlFor="password">{copy.invite.password}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          aria-describedby="password-hint"
          required
        />
        <p id="password-hint" className="mt-1.5 text-[11.5px] text-text-muted">
          {copy.invite.passwordHint}
        </p>
      </div>
      <FieldError>{state.error}</FieldError>
      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        {pending ? copy.invite.submitting : copy.invite.submit}
      </Button>
      <p className="text-center text-[13px]">
        <Link
          href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
          className="inline-flex min-h-11 items-center underline underline-offset-2"
        >
          {copy.invite.haveAccount}
        </Link>
      </p>
    </form>
  );
}
