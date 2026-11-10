'use server';

import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isValidPassword, isValidUsername, normalizeUsername, usernameToEmail } from '@/lib/auth';
import { copy } from '@/lib/copy';

export interface InviteState {
  error?: string;
  /** echoed back so the fields survive the form reset after a failed attempt */
  values?: { displayName: string; username: string };
}

function inviteError(message: string | undefined): string {
  if (message?.includes('invite_used')) return copy.invite.used;
  if (message?.includes('invite_expired')) return copy.invite.expired;
  if (message?.includes('invite_not_found')) return copy.invite.notFound;
  return copy.common.genericError;
}

/** Signed-in user joins the galaxy of the invite. */
export async function acceptInvite(_prev: InviteState, formData: FormData): Promise<InviteState> {
  const token = String(formData.get('token') ?? '');
  const supabase = await createClient();
  const { data: galaxyId, error } = await supabase.rpc('accept_invite', { _token: token });
  if (error || !galaxyId) return { error: inviteError(error?.message) };
  redirect(`/g/${galaxyId}`);
}

/**
 * New account from a valid invite (RF1.1). This is the only place where the
 * service role creates users; public sign-up is disabled in Supabase Auth.
 */
export async function signUpWithInvite(_prev: InviteState, formData: FormData): Promise<InviteState> {
  const token = String(formData.get('token') ?? '');
  const displayName = String(formData.get('display_name') ?? '').trim();
  const username = normalizeUsername(String(formData.get('username') ?? ''));
  const password = String(formData.get('password') ?? '');
  const values = { displayName, username };

  if (!displayName || displayName.length > 40) return { error: copy.invite.errName, values };
  if (!isValidUsername(username)) return { error: copy.invite.errUsername, values };
  if (!isValidPassword(password)) return { error: copy.invite.errPassword, values };

  const admin = createAdminClient();

  // 1. the invite must be valid before anything is created
  const { data: preview } = await admin.rpc('invite_preview', { _token: token });
  const status = preview?.[0]?.status;
  if (status !== 'valid') {
    return {
      error:
        status === 'used' ? copy.invite.used : status === 'expired' ? copy.invite.expired : copy.invite.notFound,
      values,
    };
  }

  // 2. username must be free
  const { data: taken } = await admin.from('profiles').select('id').eq('username', username).maybeSingle();
  if (taken) return { error: copy.invite.errUsernameTaken, values };

  // 3. create the account (profile + "Just me" galaxy come from DB triggers)
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: usernameToEmail(username),
    password,
    email_confirm: true,
    user_metadata: { username, display_name: displayName },
  });
  if (createError || !created.user) {
    return {
      error: createError?.message?.toLowerCase().includes('already')
        ? copy.invite.errUsernameTaken
        : copy.common.genericError,
      values,
    };
  }

  // 4. consume the invite; if someone else just used it, undo the account
  const { data: galaxyId, error: redeemError } = await admin.rpc('redeem_invite', {
    _token: token,
    _user_id: created.user.id,
  });
  if (redeemError || !galaxyId) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: inviteError(redeemError?.message), values };
  }

  // 5. sign in with the normal (cookie) client
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });
  if (signInError) redirect('/login');

  redirect(`/g/${galaxyId}`);
}
