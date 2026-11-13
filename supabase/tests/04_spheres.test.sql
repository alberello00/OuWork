-- spheres: privacy, sub-spheres, privatisation (RF2, RF4)
begin;
select * from no_plan();
select tests.fixture();

-- ── visibility ─────────────────────────────────────────────────────────────
select tests.login('ann');
select results_eq(
  $$ select name from public.spheres where galaxy_id = '10000000-0000-4000-8000-000000000001' and not is_inbox
     and name in ('Trips', 'Ann secret', 'Italy', 'Bob stuff', 'Hidden corner') order by name $$,
  array['Ann secret', 'Bob stuff', 'Italy', 'Trips'],
  'author sees her private sphere, not bob''s private sub-sphere');

select tests.login('bob');
select results_eq(
  $$ select name from public.spheres where galaxy_id = '10000000-0000-4000-8000-000000000001'
     and name in ('Trips', 'Ann secret', 'Italy', 'Bob stuff', 'Hidden corner') order by name $$,
  array['Bob stuff', 'Hidden corner', 'Italy', 'Trips'],
  'other member does not see the private sphere');
select is_empty($$ select * from public.spheres where id = '20000000-0000-4000-8000-000000000002' $$,
  'other member cannot fetch the private sphere by id');
select is_empty($$ select * from public.sphere_stats where sphere_id = '20000000-0000-4000-8000-000000000002' $$,
  'the private sphere has no stats row for the other member');

select tests.login('cat');
select is_empty($$ select * from public.spheres where galaxy_id = '10000000-0000-4000-8000-000000000001' $$,
  'non member sees no sphere of the galaxy');
select is_empty($$ select * from public.sphere_stats where galaxy_id = '10000000-0000-4000-8000-000000000001' $$,
  'non member sees no stats of the galaxy');

-- ── insert ─────────────────────────────────────────────────────────────────
select throws_ok(
  $$ insert into public.spheres (galaxy_id, name) values ('10000000-0000-4000-8000-000000000001', 'Intruder') $$,
  '42501', null, 'non member cannot create a sphere');

select tests.login('bob');
select lives_ok(
  $$ insert into public.spheres (id, galaxy_id, name, color, emoji)
     values ('20000000-0000-4000-8000-0000000000aa', '10000000-0000-4000-8000-000000000001', 'Food', 'coral', '🍝') returning id $$,
  'member creates a sphere');
select is((select created_by from public.spheres where id = '20000000-0000-4000-8000-0000000000aa'), tests.uid('bob'),
  'created_by defaults to the current user');
select throws_ok(
  $$ insert into public.spheres (galaxy_id, name, created_by) values ('10000000-0000-4000-8000-000000000001', 'Forged', 'a0000000-0000-4000-8000-000000000001') $$,
  '42501', null, 'created_by cannot be forged');
select throws_ok(
  $$ insert into public.spheres (galaxy_id, name, is_inbox) values ('10000000-0000-4000-8000-000000000001', 'Inbox 2', true) $$,
  '42501', null, 'a client cannot create an inbox');
select throws_ok(
  $$ insert into public.spheres (galaxy_id, name, color) values ('10000000-0000-4000-8000-000000000001', 'Neon', '#ff00ff') $$,
  '23514', null, 'colours come only from the palette');
select throws_ok(
  $$ insert into public.spheres (galaxy_id, name, color) values ('10000000-0000-4000-8000-000000000001', 'Moss', 'moss') $$,
  '23514', null, 'the two colours dropped by OuWork are no longer in the palette (RW2.1)');
select throws_ok(
  $$ insert into public.spheres (galaxy_id, parent_id, name) values ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'Peek') $$,
  '42501', null, 'cannot create a sub-sphere under someone else''s private sphere');
select lives_ok(
  $$ insert into public.spheres (galaxy_id, parent_id, name, is_private) values ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Abroad', true) returning id $$,
  'member creates a private sub-sphere (INSERT ... RETURNING works)');

-- ── structure rules ────────────────────────────────────────────────────────
select tests.login('ann');
select throws_ok(
  $$ insert into public.spheres (galaxy_id, parent_id, name) values ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 'Too deep') $$,
  '23514', null, 'sub-spheres are one level only');
select throws_ok(
  $$ update public.spheres set parent_id = '20000000-0000-4000-8000-000000000004' where id = '20000000-0000-4000-8000-000000000001' $$,
  '23514', null, 'a sphere with sub-spheres cannot become a sub-sphere');
select throws_ok(
  format($$ insert into public.spheres (galaxy_id, parent_id, name) values ('10000000-0000-4000-8000-000000000001', %L, 'Cross') $$,
    tests.inbox(tests.personal_galaxy('ann'))),
  '23514', null, 'the parent must be in the same galaxy');
select throws_ok(
  format($$ insert into public.spheres (galaxy_id, parent_id, name) values ('10000000-0000-4000-8000-000000000001', %L, 'Under inbox') $$,
    tests.inbox('10000000-0000-4000-8000-000000000001')),
  '23514', null, 'the inbox cannot have sub-spheres');
select throws_ok(
  format($$ update public.spheres set is_private = true where id = %L $$, tests.inbox('10000000-0000-4000-8000-000000000001')),
  '23514', null, 'the inbox cannot become private');

-- ── update ─────────────────────────────────────────────────────────────────
select tests.login('bob');
select lives_ok($$ update public.spheres set name = 'Journeys', x = 10 where id = '20000000-0000-4000-8000-000000000001' $$,
  'member edits a shared sphere created by someone else');
select throws_ok(
  $$ update public.spheres set is_private = true where id = '20000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'a non-author cannot make a sphere private');
select lives_ok($$ update public.spheres set name = 'Pwned' where id = '20000000-0000-4000-8000-000000000002' $$,
  'updating an invisible private sphere is filtered');
select throws_ok(
  $$ update public.spheres set parent_id = '20000000-0000-4000-8000-000000000002' where id = '20000000-0000-4000-8000-000000000004' $$,
  '42501', null, 'cannot move a sphere under a parent I cannot see');
select throws_ok($$ update public.spheres set created_by = tests.uid('bob') where id = '20000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'created_by is immutable from the client');
select throws_ok($$ update public.spheres set galaxy_id = tests.personal_galaxy('bob') where id = '20000000-0000-4000-8000-000000000004' $$,
  '42501', null, 'galaxy_id is immutable from the client');
select throws_ok($$ delete from public.spheres where id = '20000000-0000-4000-8000-000000000004' $$,
  '42501', null, 'direct delete is not allowed (use delete_sphere)');

select tests.login('cat');
select lives_ok($$ update public.spheres set name = 'Pwned' where galaxy_id = '10000000-0000-4000-8000-000000000001' $$,
  'non member update is filtered');
select tests.logout();
select is((select name from public.spheres where id = '20000000-0000-4000-8000-000000000001'), 'Journeys', 'shared sphere keeps the member''s rename');
select is((select name from public.spheres where id = '20000000-0000-4000-8000-000000000002'), 'Ann secret', 'private sphere untouched');
select is((select is_private from public.spheres where id = '20000000-0000-4000-8000-000000000001'), false, 'shared sphere is still shared');

-- ── the author makes a shared sphere private ───────────────────────────────
select tests.login('ann');
select lives_ok($$ update public.spheres set is_private = true where id = '20000000-0000-4000-8000-000000000001' $$,
  'the author makes her sphere private');
select tests.logout();
select is((select sphere_id from public.items where id = '30000000-0000-4000-8000-000000000004'),
  tests.inbox('10000000-0000-4000-8000-000000000001'), 'bob''s shared item is moved to Random, not swallowed');
select is((select sphere_id from public.items where id = '30000000-0000-4000-8000-000000000006'),
  tests.inbox('10000000-0000-4000-8000-000000000001'), 'bob''s private item is moved to Random too');
select is((select is_private from public.items where id = '30000000-0000-4000-8000-000000000006'), true, '…and stays private');
select is((select parent_id from public.spheres where id = '20000000-0000-4000-8000-000000000005'), null,
  'bob''s private sub-sphere is detached to the top level');
select is((select sphere_id from public.items where id = '30000000-0000-4000-8000-000000000007'),
  '20000000-0000-4000-8000-000000000005'::uuid, 'its content stays inside it');
select is((select parent_id from public.spheres where id = '20000000-0000-4000-8000-000000000003'),
  '20000000-0000-4000-8000-000000000001'::uuid, 'ann''s own sub-sphere stays');

select tests.login('bob');
select is_empty($$ select * from public.spheres where id in ('20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003') $$,
  'the sphere and its sub-sphere are now invisible to the other member');
select is_empty($$ select * from public.items where id in ('30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000005') $$,
  'items of a private sphere / of a sub-sphere of a private sphere are invisible');
select is((select count(*)::int from public.items where id in ('30000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000007')), 3,
  'bob still sees all of his own items');
select throws_ok(
  $$ insert into public.items (sphere_id, type, title) values ('20000000-0000-4000-8000-000000000003', 'note', 'sneak') $$,
  '42501', null, 'cannot add items to a sub-sphere of a private sphere');
select is_empty($$ select * from public.annotations where sphere_id = '20000000-0000-4000-8000-000000000001' $$,
  'annotations of the now-private sphere are invisible');

-- the author shares it again
select tests.login('ann');
select lives_ok($$ update public.spheres set is_private = false where id = '20000000-0000-4000-8000-000000000001' $$, 'the author shares it again');
select tests.login('bob');
select isnt_empty($$ select * from public.items where id = '30000000-0000-4000-8000-000000000001' $$, 'shared again: visible again');
select is_empty($$ select * from public.items where id = '30000000-0000-4000-8000-000000000002' $$, '…but the private item inside stays private');

select tests.logout();
select * from finish();
rollback;
