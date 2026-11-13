// Creates an account directly, without an invite: the only way to get the
// first user on a fresh project (there is no public sign-up). The database
// triggers create the profile and the "Personal" workspace, as for invites.
//
//   node --env-file=.env.production.local scripts/create-user.mjs <username> "<Display name>"
//
// The password is asked on the terminal. Needs NEXT_PUBLIC_SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY in the environment; never run it from the browser.

import { createClient } from '@supabase/supabase-js';
import { createInterface } from 'node:readline/promises';

const DOMAIN = 'users.ouwork.local';
const [rawUsername, displayName] = process.argv.slice(2);
const username = rawUsername?.trim().toLowerCase();

if (!username || !/^[a-z0-9_.-]{3,24}$/.test(username) || !displayName?.trim()) {
  console.error('usage: create-user.mjs <username: 3-24 of a-z 0-9 _ . -> "<Display name>"');
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
const password = await rl.question(`Password for ${username} (8-72 characters): `);
rl.close();
if (password.length < 8 || password.length > 72) {
  console.error('password must be 8-72 characters');
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data, error } = await admin.auth.admin.createUser({
  email: `${username}@${DOMAIN}`,
  password,
  email_confirm: true,
  user_metadata: { username, display_name: displayName.trim() },
});
if (error) {
  console.error(`could not create ${username}: ${error.message}`);
  process.exit(1);
}
console.log(`created ${username} (${data.user.id}) on ${new URL(url).host}`);
