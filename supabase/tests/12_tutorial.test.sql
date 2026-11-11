-- first-login tutorial state (MVP2: RF15.1)
-- ann and bob share a galaxy, cat shares nothing with them.
begin;
select * from no_plan();
select tests.fixture();

select is((select count(*)::int from public.profiles where tutorial_completed_at is null
           and username in ('ann', 'bob', 'cat')), 3,
  'a new user has not done the tutorial yet');

-- ── not writable directly ──────────────────────────────────────────────────
select tests.login('ann');
select throws_ok(
  $$ update public.profiles set tutorial_completed_at = now() where id = tests.uid('ann') $$,
  '42501', null, 'a user cannot write tutorial_completed_at directly');
select throws_ok(
  $$ update public.profiles set tutorial_completed_at = null $$,
  '42501', null, '…nor clear it');

-- ── the RPC marks only the caller ──────────────────────────────────────────
select tests.login_anon();
select throws_ok($$ select public.complete_tutorial() $$, '42501', null, 'anon cannot complete a tutorial');

select tests.login('ann');
select isnt((select public.complete_tutorial()), null, 'completing (or skipping) the tutorial returns the date');
select tests.logout();
select isnt((select tutorial_completed_at from public.profiles where username = 'ann'), null,
  'the caller is marked');
select is((select count(*)::int from public.profiles where tutorial_completed_at is null
           and username in ('bob', 'cat')), 2,
  'nobody else is marked');

-- ── idempotent: replaying keeps the first date ─────────────────────────────
create temporary table first_time as
  select tutorial_completed_at as at from public.profiles where username = 'ann';
grant select on first_time to authenticated;
select tests.login('ann');
select is((select public.complete_tutorial()), (select at from first_time), 'a second call keeps the first date');

-- ── visibility follows the profile ─────────────────────────────────────────
select isnt((select tutorial_completed_at from public.profiles where username = 'ann'), null,
  'the user reads her own tutorial state');
select tests.login('cat');
select is_empty($$ select tutorial_completed_at from public.profiles where username = 'ann' $$,
  'someone who shares no galaxy with her reads nothing');
select tests.login('bob');
select lives_ok($$ select public.complete_tutorial() $$, 'another user completes his own');
select tests.logout();
select is((select tutorial_completed_at from public.profiles where username = 'ann'), (select at from first_time),
  '…without touching hers');

select * from finish();
rollback;
