-- galaxies, galaxy_members, profiles (RF1)
begin;
select * from no_plan();
select tests.fixture();

-- ── bootstrap triggers ─────────────────────────────────────────────────────
select is((select count(*)::int from public.profiles where username in ('ann', 'bob', 'cat')), 3,
  'a profile is created for every auth user');
select is((select count(*)::int from public.galaxies where is_personal and name = 'Just me'
           and owner_id in (tests.uid('ann'), tests.uid('bob'), tests.uid('cat'))), 3,
  'every user gets a personal "Just me" galaxy');
select is((select count(*)::int from public.spheres where galaxy_id = tests.personal_galaxy('cat')), 1,
  'a new galaxy starts with a single sphere (RF13.1)');
select results_eq(
  $$ select color, emoji, x, y from public.spheres where galaxy_id = tests.personal_galaxy('cat') $$,
  $$ values ('sage'::text, '🎲'::text, 0::double precision, 0::double precision) $$,
  'Random is sage, 🎲, in the centre');
select is((select setup_completed_at from public.galaxies where id = tests.personal_galaxy('cat')), null,
  'a new galaxy is not set up yet (RF13.2)');
select is((select name from public.spheres where galaxy_id = tests.personal_galaxy('cat') and is_inbox), 'Random',
  'Random is the inbox');
select is((select role from public.galaxy_members
           where galaxy_id = '10000000-0000-4000-8000-000000000001' and user_id = tests.uid('ann')), 'owner',
  'the creator becomes owner member');
select throws_ok(
  $$ insert into public.galaxy_members (galaxy_id, user_id) values (tests.personal_galaxy('cat'), tests.uid('bob')) $$,
  '23514', null, 'a personal galaxy cannot get other members');
select throws_ok(
  $$ insert into public.spheres (galaxy_id, name, is_inbox, created_by)
     values ('10000000-0000-4000-8000-000000000001', 'Second inbox', true, tests.uid('ann')) $$,
  '23505', null, 'only one inbox per galaxy');

-- ── visibility ─────────────────────────────────────────────────────────────
select tests.login('ann');
select results_eq($$ select name from public.galaxies order by name $$, array['Just me', 'Shared'],
  'owner sees her galaxies');
select tests.login('bob');
select results_eq($$ select name from public.galaxies order by name $$, array['Just me', 'Shared'],
  'member sees the shared galaxy and his personal one');
select is((select count(*)::int from public.galaxy_members where galaxy_id = '10000000-0000-4000-8000-000000000001'), 2,
  'member sees the member list');
select results_eq($$ select username from public.profiles order by username $$, array['ann', 'bob'],
  'member sees profiles of people he shares a galaxy with, nobody else');

select tests.login('cat');
select results_eq($$ select name from public.galaxies order by name $$, array['Just me'],
  'non member does not see the shared galaxy');
select is_empty($$ select * from public.galaxy_members where galaxy_id = '10000000-0000-4000-8000-000000000001' $$,
  'non member does not see the member list');
select results_eq($$ select username from public.profiles $$, array['cat'],
  'non member sees only her own profile');
select is_empty($$ select * from public.galaxies where is_personal and owner_id <> tests.uid('cat') $$,
  'nobody sees someone else''s personal galaxy');

-- ── create ─────────────────────────────────────────────────────────────────
select tests.login('bob');
select lives_ok($$ insert into public.galaxies (name) values ('Book club') returning id $$,
  'any user can create a galaxy (INSERT ... RETURNING works)');
select is((select owner_id from public.galaxies where name = 'Book club'), tests.uid('bob'),
  'the creator is the owner');
select is((select count(*)::int from public.spheres s join public.galaxies g on g.id = s.galaxy_id where g.name = 'Book club'), 1,
  'Random is visible to the creator');
select is((select setup_completed_at from public.galaxies where name = 'Book club'), null,
  'a galaxy created by a user starts not set up');
select throws_ok(
  $$ insert into public.galaxies (name, setup_completed_at) values ('Skipper', now()) $$,
  '42501', null, 'setup_completed_at cannot be set on insert');
select throws_ok(
  $$ insert into public.galaxies (name, owner_id) values ('Forged', 'a0000000-0000-4000-8000-000000000001') $$,
  '42501', null, 'owner_id cannot be forged');
select throws_ok(
  $$ insert into public.galaxies (name, is_personal) values ('Second me', true) $$,
  '42501', null, 'a user cannot create personal galaxies');

-- ── rename / delete ────────────────────────────────────────────────────────
select lives_ok($$ update public.galaxies set name = 'Hacked' where id = '10000000-0000-4000-8000-000000000001' $$,
  'rename by a non-owner member is silently filtered');
select tests.login('cat');
select lives_ok($$ delete from public.galaxies where id = '10000000-0000-4000-8000-000000000001' $$,
  'delete by a non member is silently filtered');
select tests.login('bob');
select lives_ok($$ delete from public.galaxies where id = '10000000-0000-4000-8000-000000000001' $$,
  'delete by a non-owner member is silently filtered');
select tests.logout();
select is((select name from public.galaxies where id = '10000000-0000-4000-8000-000000000001'), 'Shared',
  'the galaxy is neither renamed nor deleted by non owners');

select tests.login('ann');
select lives_ok($$ update public.galaxies set name = 'Shared!' where id = '10000000-0000-4000-8000-000000000001' $$,
  'owner renames');
select is((select name from public.galaxies where id = '10000000-0000-4000-8000-000000000001'), 'Shared!',
  'the owner''s rename is applied');
select throws_ok($$ update public.galaxies set owner_id = 'b0000000-0000-4000-8000-000000000002' $$,
  '42501', null, 'ownership cannot be transferred from the client');
select lives_ok($$ delete from public.galaxies where is_personal $$, 'deleting a personal galaxy is filtered');
select lives_ok($$ update public.galaxies set name = 'Not me' where is_personal $$, 'renaming a personal galaxy is filtered');
select is((select name from public.galaxies where id = tests.personal_galaxy('ann')), 'Just me',
  'the personal galaxy is untouched');

-- ── members ────────────────────────────────────────────────────────────────
select tests.login('bob');
select throws_ok(
  $$ insert into public.galaxy_members (galaxy_id, user_id) values ('10000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000003') $$,
  '42501', null, 'a member cannot add members directly');
select throws_ok(
  $$ update public.galaxy_members set role = 'owner' where user_id = tests.uid('bob') $$,
  '42501', null, 'a member cannot promote himself');
select lives_ok(
  $$ update public.galaxy_members set last_seen_at = now() $$,
  'updating last_seen_at only touches my rows');
select tests.logout();
select is((select last_seen_at from public.galaxy_members
           where galaxy_id = '10000000-0000-4000-8000-000000000001' and user_id = tests.uid('ann')), null,
  'someone else''s last_seen_at is untouched');
select isnt((select last_seen_at from public.galaxy_members
           where galaxy_id = '10000000-0000-4000-8000-000000000001' and user_id = tests.uid('bob')), null,
  'my last_seen_at is updated');

select tests.login('bob');
select lives_ok(
  $$ delete from public.galaxy_members where galaxy_id = '10000000-0000-4000-8000-000000000001' and user_id = tests.uid('ann') $$,
  'removing the owner is filtered');
select tests.login('ann');
select lives_ok(
  $$ delete from public.galaxy_members where galaxy_id = '10000000-0000-4000-8000-000000000001' and user_id = tests.uid('ann') $$,
  'the owner leaving is filtered');
select tests.logout();
select is((select count(*)::int from public.galaxy_members where galaxy_id = '10000000-0000-4000-8000-000000000001'), 2,
  'both members are still there');

-- a member can leave
insert into public.galaxy_members (galaxy_id, user_id) values ('10000000-0000-4000-8000-000000000001', tests.uid('cat'));
select tests.login('cat');
select is((select count(*)::int from public.items where galaxy_id = '10000000-0000-4000-8000-000000000001'), 3,
  'a new member sees the shared items only (not the private ones)');
select lives_ok(
  $$ delete from public.galaxy_members where galaxy_id = '10000000-0000-4000-8000-000000000001' and user_id = tests.uid('bob') $$,
  'a member removing another member is filtered');
select lives_ok(
  $$ delete from public.galaxy_members where galaxy_id = '10000000-0000-4000-8000-000000000001' and user_id = tests.uid('cat') $$,
  'a member can leave');
select is_empty($$ select * from public.galaxies where id = '10000000-0000-4000-8000-000000000001' $$,
  'after leaving the galaxy is gone for her');
select is_empty($$ select * from public.items where galaxy_id = '10000000-0000-4000-8000-000000000001' $$,
  'after leaving its items are gone for her');

-- the owner removes a member
select tests.login('ann');
select lives_ok(
  $$ delete from public.galaxy_members where galaxy_id = '10000000-0000-4000-8000-000000000001' and user_id = tests.uid('bob') $$,
  'the owner removes a member');
select tests.login('bob');
select is_empty($$ select * from public.galaxies where id = '10000000-0000-4000-8000-000000000001' $$,
  'a removed member no longer sees the galaxy');
select is_empty($$ select * from public.spheres where galaxy_id = '10000000-0000-4000-8000-000000000001' $$,
  'a removed member no longer sees its spheres');
select is_empty($$ select * from public.items where galaxy_id = '10000000-0000-4000-8000-000000000001' $$,
  'a removed member no longer sees its items, not even his own');
select results_eq($$ select username from public.profiles order by username $$, array['bob'],
  'a removed member no longer sees the others'' profiles');

-- ── profiles ───────────────────────────────────────────────────────────────
select lives_ok($$ update public.profiles set display_name = 'Bobby' $$, 'profile update touches only my row');
select throws_ok($$ update public.profiles set username = 'root' $$, '42501', null, 'username is immutable from the client');
select tests.logout();
select is((select display_name from public.profiles where username = 'bob'), 'Bobby', 'my display name changed');
select is((select display_name from public.profiles where username = 'ann'), 'Ann', 'other display names did not');

-- ── delete cascade ─────────────────────────────────────────────────────────
select tests.login('ann');
select lives_ok($$ delete from public.galaxies where id = '10000000-0000-4000-8000-000000000001' $$, 'the owner deletes the galaxy');
select tests.logout();
select is((select count(*)::int from public.spheres where galaxy_id = '10000000-0000-4000-8000-000000000001'), 0,
  'spheres are deleted with the galaxy (inbox included)');
select is((select count(*)::int from public.items where galaxy_id = '10000000-0000-4000-8000-000000000001'), 0,
  'items are deleted with the galaxy');

select * from finish();
rollback;
