-- annotations follow the visibility of their sphere (RF6, RF4)
begin;
select * from no_plan();
select tests.fixture();

select tests.login('ann');
select is((select count(*)::int from public.annotations), 2, 'author sees annotations of shared and private spheres');
select tests.login('bob');
select results_eq($$ select id from public.annotations $$, array['40000000-0000-4000-8000-000000000001'::uuid],
  'other member sees only annotations of visible spheres');
select tests.login('cat');
select is_empty($$ select * from public.annotations $$, 'non member sees no annotation');

select throws_ok(
  $$ insert into public.annotations (sphere_id, kind) values ('20000000-0000-4000-8000-000000000001', 'sticker') $$,
  '42501', null, 'non member cannot annotate');
select tests.login('bob');
select throws_ok(
  $$ insert into public.annotations (sphere_id, kind) values ('20000000-0000-4000-8000-000000000002', 'sticker') $$,
  '42501', null, 'cannot annotate a private sphere of someone else');
select lives_ok(
  $$ insert into public.annotations (id, sphere_id, kind, data, x, y)
     values ('40000000-0000-4000-8000-0000000000b1', '20000000-0000-4000-8000-000000000001', 'stroke', '{"points":[[0,0],[1,1]],"color":"coral","size":4}', 5, 5) returning id $$,
  'member draws on a shared canvas');
select is((select galaxy_id from public.annotations where id = '40000000-0000-4000-8000-0000000000b1'), '10000000-0000-4000-8000-000000000001'::uuid,
  'galaxy_id is derived from the sphere');
select throws_ok(
  $$ insert into public.annotations (sphere_id, kind, created_by) values ('20000000-0000-4000-8000-000000000001', 'sticker', 'a0000000-0000-4000-8000-000000000001') $$,
  '42501', null, 'created_by cannot be forged');
select throws_ok(
  $$ insert into public.annotations (sphere_id, kind) values ('20000000-0000-4000-8000-000000000001', 'bomb') $$,
  '23514', null, 'only known kinds');

select lives_ok($$ update public.annotations set x = 42 where id = '40000000-0000-4000-8000-000000000001' $$, 'member moves a shared annotation');
select lives_ok($$ update public.annotations set x = 42 where id = '40000000-0000-4000-8000-000000000002' $$, 'moving an invisible annotation is filtered');
select throws_ok($$ update public.annotations set sphere_id = '20000000-0000-4000-8000-000000000004' where id = '40000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'an annotation cannot change sphere');
select lives_ok($$ delete from public.annotations where id = '40000000-0000-4000-8000-000000000002' $$, 'deleting an invisible annotation is filtered');
select tests.login('cat');
select lives_ok($$ delete from public.annotations $$, 'non member delete is filtered');
select lives_ok($$ update public.annotations set x = 99 $$, 'non member update is filtered');
select tests.logout();
select is((select x from public.annotations where id = '40000000-0000-4000-8000-000000000001'), 42::double precision, 'shared annotation moved by the member only');
select is((select x from public.annotations where id = '40000000-0000-4000-8000-000000000002'), 0::double precision, 'private annotation intact');

select tests.login('bob');
select lives_ok($$ delete from public.annotations where id = '40000000-0000-4000-8000-000000000001' $$, 'member deletes a shared annotation');
select tests.logout();
select is((select count(*)::int from public.annotations where id = '40000000-0000-4000-8000-000000000001'), 0, 'it is gone');

select * from finish();
rollback;
