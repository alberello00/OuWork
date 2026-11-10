-- delete_sphere(): RF2.5, without destroying content the caller cannot see
begin;
select * from no_plan();
select tests.fixture();

select tests.login('cat');
select throws_ok($$ select public.delete_sphere('20000000-0000-4000-8000-000000000004') $$, 'P0002', null,
  'non member cannot delete a sphere');
select tests.login('bob');
select throws_ok($$ select public.delete_sphere('20000000-0000-4000-8000-000000000002') $$, 'P0002', null,
  'other member cannot delete a private sphere (same error as "not found")');
select throws_ok(format($$ select public.delete_sphere(%L) $$, tests.inbox('10000000-0000-4000-8000-000000000001')), '23514', null,
  'the inbox cannot be deleted');
select throws_ok($$ select public.delete_sphere('20000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000004') $$, '23514', null,
  'cannot move items into the sphere being deleted');
select throws_ok($$ select public.delete_sphere('20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003') $$, '23514', null,
  'cannot move items into a sub-sphere of the sphere being deleted');
select throws_ok(format($$ select public.delete_sphere('20000000-0000-4000-8000-000000000004', %L) $$, tests.inbox(tests.personal_galaxy('bob'))), '23514', null,
  'cannot move items into another galaxy');
select throws_ok($$ select public.delete_sphere('20000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000002') $$, '23514', null,
  'cannot move items into a sphere I cannot see');

-- ── scenario 1: bob deletes "Bob stuff" moving items into his private sphere ─
select tests.logout();
insert into public.spheres (id, galaxy_id, name, is_private, created_by) values
  ('20000000-0000-4000-8000-0000000000b1', '10000000-0000-4000-8000-000000000001', 'Bob private', true, tests.uid('bob'));
insert into public.items (id, sphere_id, type, title, created_by) values
  ('30000000-0000-4000-8000-0000000000a1', '20000000-0000-4000-8000-000000000004', 'note', 'Ann in bob stuff', tests.uid('ann')),
  ('30000000-0000-4000-8000-0000000000b1', '20000000-0000-4000-8000-000000000004', 'note', 'Bob in bob stuff', tests.uid('bob'));

select tests.login('bob');
select lives_ok($$ select public.delete_sphere('20000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-0000000000b1') $$,
  'member deletes a sphere moving its items');
select tests.logout();
select is((select count(*)::int from public.spheres where id = '20000000-0000-4000-8000-000000000004'), 0, 'the sphere is gone');
select is((select sphere_id from public.items where id = '30000000-0000-4000-8000-0000000000b1'),
  '20000000-0000-4000-8000-0000000000b1'::uuid, 'his own item moved to the target');
select is((select sphere_id from public.items where id = '30000000-0000-4000-8000-0000000000a1'),
  tests.inbox('10000000-0000-4000-8000-000000000001'),
  'someone else''s item is not swallowed by a private target: it goes to Random');

-- ── scenario 2: ann deletes "Trips" and its items ──────────────────────────
select tests.login('ann');
select lives_ok($$ select public.delete_sphere('20000000-0000-4000-8000-000000000001') $$,
  'member deletes a sphere with its items');
select tests.logout();
select is((select count(*)::int from public.spheres where id in ('20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003')), 0,
  'the sphere and its visible sub-sphere are gone');
select is((select count(*)::int from public.items where id in (
    '30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000005')), 0,
  'the items the caller could see are deleted');
select is((select sphere_id from public.items where id = '30000000-0000-4000-8000-000000000006'),
  tests.inbox('10000000-0000-4000-8000-000000000001'),
  'another member''s private item survives in Random');
select is((select is_private from public.items where id = '30000000-0000-4000-8000-000000000006'), true, '…still private');
select is((select parent_id from public.spheres where id = '20000000-0000-4000-8000-000000000005'), null,
  'another member''s private sub-sphere survives at the top level');
select is((select count(*)::int from public.items where id = '30000000-0000-4000-8000-000000000007'), 1, '…with its content');
select is((select count(*)::int from public.annotations where id = '40000000-0000-4000-8000-000000000001'), 0,
  'annotations of the deleted sphere are gone');

select tests.login('ann');
select is_empty($$ select * from public.items where id in ('30000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000007') $$,
  'the rescued private content is still invisible to the deleter');

select tests.logout();
select * from finish();
rollback;
