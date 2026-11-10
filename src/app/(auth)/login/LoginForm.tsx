'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { FieldError, Input, Label } from '@/components/ui/Input';
import { copy } from '@/lib/copy';
import { signIn, type LoginState } from './actions';

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={action} className="mt-7 space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <Label htmlFor="username">{copy.login.username}</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          defaultValue={state.username}
          required
        />
      </div>
      <div>
        <Label htmlFor="password">{copy.login.password}</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <FieldError>{state.error}</FieldError>
      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        {pending ? copy.login.submitting : copy.login.submit}
      </Button>
    </form>
  );
}
