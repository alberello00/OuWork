// Sets one password for every demo account created by supabase/seed.sql, so a
// public deployment never keeps the development password "ouwork-dev".
//
//   node --env-file=.env.production.local scripts/demo-password.mjs
//
// The new password is asked on the terminal. Needs NEXT_PUBLIC_SUPABASE_URL
// and SUPABASE_SERVICE_ROLE_KEY in the environment.

import { createClient } from '@supabase/supabase-js';
import { createInterface } from 'node:readline/promises';

// the fixed ids of the demo users in seed.sql
const DEMO_IDS = Array.from({ length: 7 }, (_, i) => `aaaaaaaa-0000-4000-8000-00000000000${i + 1}`);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
const password = await rl.question('New password for the demo accounts (8-72 characters): ');
rl.close();
if (password.length < 8 || password.length > 72 || password === 'ouwork-dev') {
  console.error('password must be 8-72 characters and not the development one');
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
let failed = 0;
for (const id of DEMO_IDS) {
  const { data, error } = await admin.auth.admin.updateUserById(id, { password });
  if (error) {
    failed++;
    console.error(`${id}: ${error.message}`);
  } else {
    console.log(`updated ${data.user.email}`);
  }
}
process.exit(failed ? 1 : 0);
