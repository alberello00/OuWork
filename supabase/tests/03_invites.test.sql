-- invites (RF1.1, RF1.3)
begin;
select * from no_plan();
select tests.fixture();
select tests.create_user('dan', 'd0000000-0000-4000-8000-000000000004');

insert into public.invites (id, galaxy_id, token, created_by, expires_at) values
  ('60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'tok-valid', tests.uid('ann'), now() + interval '7 days'),
  ('60000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'tok-expired', tests.uid('ann'), now() - interval '1 minute'),
  ('60000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'tok-second', tests.uid('ann'), now() + interval '7 days');

-- ── who can create / read / revoke ─────────────────────────────────────────
select tests.login('bob');
select throws_ok(
  $$ insert into public.invites (galaxy_id) values ('10000000-0000-4000-8000-000000000001') $$,
  '42501', null, 'a non-owner member cannot create invites');
select is_empty($$ select * from public.invites $$, 'a non-owner member cannot read invites (tokens)');
select lives_ok($$ delete from public.invites $$, 'a non-owner member deleting invites is filtered');

select tests.login('cat');
select throws_ok(
  $$ insert into public.invites (galaxy_id) values ('10000000-0000-4000-8000-000000000001') $$,
  '42501', null, 'a non member cannot create invites');
select is_empty($$ select * from public.invites $$, 'a non member cannot read invites');

select tests.login('ann');
select lives_ok(
  $$ insert into public.invites (galaxy_id) values ('10000000-0000-4000-8000-000000000001') returning token $$,
  'the owner creates an invite');
select is((select count(*)::int from public.invites), 4, 'the owner reads the invites of her galaxy');
select ok((select bool_and(char_length(token) >= 32 or token like 'tok-%') from public.invites), 'generated tokens are long');
select throws_ok(
  $$ insert into public.invites (galaxy_id, token) values ('10000000-0000-4000-8000-000000000001', 'chosen') $$,
  '42501', null, 'the token cannot be chosen by the client');
select throws_ok(
  $$ insert into public.invites (galaxy_id, expires_at) values ('10000000-0000-4000-8000-000000000001', now() + interval '10 years') $$,
  '42501', null, 'the expiry cannot be chosen by the client');
select throws_ok(
  format($$ insert into public.invites (galaxy_id) values (%L) $$, tests.personal_galaxy('ann')),
  '23514', null, 'a personal galaxy cannot have invites');

-- ── preview ────────────────────────────────────────────────────────────────
select tests.login_anon();
select results_eq(
  $$ select status, galaxy_name, inviter_name from public.invite_preview('tok-valid') $$,
  $$ values ('valid', 'Shared', 'Ann') $$, 'anon previews a valid invite');
select results_eq(
  $$ select status, galaxy_name from public.invite_preview('nope') $$,
  $$ values ('not_found', null::text) $$, 'unknown token reveals nothing');
select results_eq(
  $$ select status, galaxy_name from public.invite_preview('tok-expired') $$,
  $$ values ('expired', null::text) $$, 'expired invite reveals nothing');
select throws_ok($$ select public.accept_invite('tok-valid') $$, '42501', null, 'anon cannot accept an invite');

-- ── accept ─────────────────────────────────────────────────────────────────
select tests.login('cat');
select throws_ok($$ select public.redeem_invite('tok-valid', tests.uid('cat')) $$, '42501', null,
  'redeem_invite is not callable by users');
select throws_ok($$ select public.accept_invite('nope') $$, 'P0002', null, 'unknown token is rejected');
select throws_ok($$ select public.accept_invite('tok-expired') $$, 'P0001', 'invite_expired', 'expired invite is rejected');
select is_empty($$ select * from public.galaxies where name = 'Shared' $$, 'still not a member');
select is(public.accept_invite('tok-valid'), '10000000-0000-4000-8000-000000000001'::uuid, 'a logged-in user accepts a valid invite');
select isnt_empty($$ select * from public.galaxies where name = 'Shared' $$, 'the galaxy is now visible');
select is((select role from public.galaxy_members where user_id = tests.uid('cat') and galaxy_id = '10000000-0000-4000-8000-000000000001'),
  'editor', 'the invitee joins with the default role, editor (RW3.2)');
select is_empty($$ select * from public.items where is_private $$, 'the new member sees no private items');

select tests.login('dan');
select throws_ok($$ select public.accept_invite('tok-valid') $$, 'P0001', 'invite_used', 'an invite works only once');
select is_empty($$ select * from public.galaxies where name = 'Shared' $$, 'the second user did not get in');

select tests.login_anon();
select results_eq($$ select status from public.invite_preview('tok-valid') $$, array['used'], 'preview says used');

-- an existing member does not burn an invite
select tests.login('bob');
select is(public.accept_invite('tok-second'), '10000000-0000-4000-8000-000000000001'::uuid, 'an existing member can open an invite link');
select tests.logout();
select is((select used_at from public.invites where token = 'tok-second'), null, '…without consuming it');
select is((select used_by from public.invites where token = 'tok-valid'), tests.uid('cat'), 'the consumed invite records who used it');

-- service role path (new accounts)
set local role service_role;
select is(public.redeem_invite('tok-second', 'd0000000-0000-4000-8000-000000000004'), '10000000-0000-4000-8000-000000000001'::uuid,
  'service_role redeems an invite for a new account');
reset role;
select isnt((select used_at from public.invites where token = 'tok-second'), null, 'that invite is now consumed');

-- revoke
select tests.login('ann');
select lives_ok($$ delete from public.invites where token = 'tok-expired' $$, 'the owner revokes an invite');
select tests.logout();
select is((select count(*)::int from public.invites where token = 'tok-expired'), 0, 'the invite is gone');
select is((select count(*)::int from public.invites where token = 'tok-valid'), 1, 'bob''s earlier delete removed nothing');

select * from finish();
rollback;
