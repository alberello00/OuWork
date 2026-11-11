-- galaxy setup survey (MVP2: RF13.2, RF14.5, RF14.6)
-- ann = owner of "Shared", bob = other member, cat = non member.
begin;
select * from no_plan();
select tests.fixture();

\set g '''10000000-0000-4000-8000-000000000001'''

select is((select setup_completed_at from public.galaxies where id = :g::uuid), null,
  'the fixture galaxy is not set up yet');

-- ── who may call it ────────────────────────────────────────────────────────
select tests.login_anon();
select throws_ok(
  $$ select * from public.complete_galaxy_setup('10000000-0000-4000-8000-000000000001', '{}', '[]') $$,
  '42501', null, 'anon cannot set up a galaxy');

select tests.login('bob');
select throws_ok(
  $$ select * from public.complete_galaxy_setup('10000000-0000-4000-8000-000000000001', '{}',
       '[{"name":"Bob wins","emoji":"😈","color":"coral"}]') $$,
  '42501', 'only the owner can set up this galaxy', 'another member cannot set up the galaxy');

select tests.login('cat');
select throws_ok(
  $$ select * from public.complete_galaxy_setup('10000000-0000-4000-8000-000000000001', '{}',
       '[{"name":"Cat wins","emoji":"😼","color":"coral"}]') $$,
  '42501', 'only the owner can set up this galaxy', 'a non member gets the same error as a member');
select throws_ok(
  $$ select * from public.complete_galaxy_setup('99999999-0000-4000-8000-000000000009', '{}', '[]') $$,
  '42501', 'only the owner can set up this galaxy', '…and the same error for a galaxy that does not exist');

-- ── the columns are not writable directly (RF13.2) ─────────────────────────
select tests.login('ann');
select throws_ok(
  $$ update public.galaxies set setup_completed_at = now() where id = '10000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'the owner cannot write setup_completed_at directly');
select throws_ok(
  $$ update public.galaxies set setup_answers = '{"kind":"couple"}' where id = '10000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'the owner cannot write setup_answers directly');

-- ── validation: nothing is created when anything is wrong ──────────────────
select throws_ok(
  $$ select * from public.complete_galaxy_setup('10000000-0000-4000-8000-000000000001', '{}', '{"name":"x"}') $$,
  '22023', null, 'spheres must be an array');
select throws_ok(
  $$ select * from public.complete_galaxy_setup('10000000-0000-4000-8000-000000000001', '{}',
       '[{"name":"Ok","emoji":"📍","color":"amber"},{"name":"   ","emoji":"📍","color":"amber"}]') $$,
  '22023', null, 'an empty name is rejected');
select throws_ok(
  $$ select * from public.complete_galaxy_setup('10000000-0000-4000-8000-000000000001', '{}',
       '[{"name":"This name is far too long to fit in a sphere, sorry","emoji":"📍","color":"amber"}]') $$,
  '22023', null, 'a name over 40 characters is rejected');
select throws_ok(
  $$ select * from public.complete_galaxy_setup('10000000-0000-4000-8000-000000000001', '{}',
       '[{"name":"Ok","emoji":"","color":"amber"}]') $$,
  '22023', null, 'an empty emoji is rejected');
select throws_ok(
  $$ select * from public.complete_galaxy_setup('10000000-0000-4000-8000-000000000001', '{}',
       '[{"name":"Ok","emoji":"this is not an emoji","color":"amber"}]') $$,
  '22023', null, 'an emoji over 16 characters is rejected');
select throws_ok(
  $$ select * from public.complete_galaxy_setup('10000000-0000-4000-8000-000000000001', '{}',
       '[{"name":"Ok","emoji":"📍","color":"#ff0000"}]') $$,
  '22023', null, 'a colour outside the palette is rejected');
select throws_ok(
  $$ select * from public.complete_galaxy_setup('10000000-0000-4000-8000-000000000001', '{}',
       '[{"name":"Ok","emoji":"📍","color":"amber","x":"left"}]') $$,
  '22023', null, 'a position that is not a number is rejected');
select throws_ok(
  $$ select * from public.complete_galaxy_setup('10000000-0000-4000-8000-000000000001', '{}',
       (select jsonb_agg(jsonb_build_object('name', 'S' || i, 'emoji', '✨', 'color', 'amber'))
        from generate_series(1, 11) i)) $$,
  '22023', null, 'more than 10 spheres are rejected');
select throws_ok(
  $$ select * from public.complete_galaxy_setup('10000000-0000-4000-8000-000000000001', '[1,2]', '[]') $$,
  '22023', null, 'answers must be an object');

select tests.logout();
select is((select count(*)::int from public.spheres where galaxy_id = :g::uuid), 6,
  'failed attempts created nothing (Random + the 5 fixture spheres)');
select is((select setup_completed_at from public.galaxies where id = :g::uuid), null,
  '…and the galaxy is still not set up');

-- ── the owner completes the setup ──────────────────────────────────────────
select tests.login('ann');
select is(
  (select count(*)::int from public.complete_galaxy_setup(
     '10000000-0000-4000-8000-000000000001',
     '{"kind":"couple","interests":["places","music"]}',
     '[{"name":"  Places ","emoji":"📍","color":"amber","x":0,"y":-260},
       {"name":"Music","emoji":"🎵","color":"lavender","x":225,"y":130,"is_private":true,"is_inbox":true}]')),
  2, 'the owner creates the spheres and gets them back');
select tests.logout();

select results_eq(
  $$ select name, emoji, color, x, y, is_private, is_inbox, created_by
     from public.spheres
     where galaxy_id = '10000000-0000-4000-8000-000000000001' and name in ('Places', 'Music')
     order by name $$,
  $$ values
     ('Music'::text,  '🎵'::text, 'lavender'::text, 225::double precision, 130::double precision, false, false, 'a0000000-0000-4000-8000-000000000001'::uuid),
     ('Places'::text, '📍'::text, 'amber'::text,      0::double precision, -260::double precision, false, false, 'a0000000-0000-4000-8000-000000000001'::uuid) $$,
  'spheres are trimmed, shared, never inbox, owned by the caller');
select isnt((select setup_completed_at from public.galaxies where id = :g::uuid), null,
  'the galaxy is marked as set up');

-- ── idempotent: a second call fails without duplicates ─────────────────────
select tests.login('ann');
select throws_ok(
  $$ select * from public.complete_galaxy_setup('10000000-0000-4000-8000-000000000001', '{}',
       '[{"name":"Places","emoji":"📍","color":"amber"}]') $$,
  'P0001', 'setup_already_completed', 'a second call fails');
select is((select count(*)::int from public.spheres where galaxy_id = :g::uuid and name = 'Places'), 1,
  '…and creates no duplicates');
select is((select setup_answers ->> 'kind' from public.galaxies where id = :g::uuid), 'couple',
  '…and keeps the first answers');

-- ── answers are readable by members only (RF14.6) ──────────────────────────
select is((select setup_answers -> 'interests' from public.galaxies where id = :g::uuid), '["places","music"]'::jsonb,
  'the owner reads the saved answers');
select tests.login('bob');
select is((select setup_answers ->> 'kind' from public.galaxies where id = :g::uuid), 'couple',
  'another member reads the saved answers');
select is((select count(*)::int from public.spheres where galaxy_id = :g::uuid and name in ('Places', 'Music')), 2,
  'another member sees the new spheres');
select tests.login('cat');
select is_empty($$ select setup_answers, setup_completed_at from public.galaxies where id = '10000000-0000-4000-8000-000000000001' $$,
  'a non member reads neither the answers nor the setup state');
select tests.login_anon();
select throws_ok($$ select setup_answers from public.galaxies $$, '42501', null, 'anon reads nothing');

-- ── personal galaxy, "start from scratch" ──────────────────────────────────
select tests.login('ann');
select throws_ok(
  format($$ select * from public.complete_galaxy_setup(%L, '{}', '[]') $$, tests.personal_galaxy('cat')),
  '42501', null, 'nobody sets up someone else''s personal galaxy');
select tests.login('cat');
select is(
  (select count(*)::int from public.complete_galaxy_setup(tests.personal_galaxy('cat'), '{"kind":"solo","scratch":true}', '[]')),
  0, 'the owner of a personal galaxy can start from scratch (no spheres)');
select isnt((select setup_completed_at from public.galaxies where is_personal), null,
  '…which marks it as set up');
select is((select count(*)::int from public.spheres where galaxy_id = tests.personal_galaxy('cat')), 1,
  '…with Random only');

select * from finish();
rollback;
