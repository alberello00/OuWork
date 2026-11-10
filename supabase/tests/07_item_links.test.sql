-- item_links: visible only when both ends are visible (RF7, RF4)
begin;
select * from no_plan();
select tests.fixture();
insert into public.items (id, sphere_id, type, title, created_by) values
  ('30000000-0000-4000-8000-0000000000a9', tests.inbox(tests.personal_galaxy('ann')), 'note', 'Ann personal', tests.uid('ann'));

select tests.login('ann');
select is((select count(*)::int from public.item_links), 3, 'author sees all her links');

select tests.login('bob');
select results_eq($$ select id from public.item_links $$, array['50000000-0000-4000-8000-000000000001'::uuid],
  'other member sees only the link whose both ends are visible');
select is_empty($$ select * from public.item_links where target_id = '30000000-0000-4000-8000-000000000002' $$,
  'a link does not reveal a private item');
select is_empty($$ select * from public.item_links where target_id = '30000000-0000-4000-8000-000000000003' $$,
  'a link does not reveal an item of a private sphere');

select tests.login('cat');
select is_empty($$ select * from public.item_links $$, 'non member sees no link');
select throws_ok(
  $$ insert into public.item_links (source_id, target_id) values ('30000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000005') $$,
  '42501', null, 'non member cannot link items');
select throws_ok(
  $$ insert into public.item_links (source_id, target_id) values ('30000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000001') $$,
  '42501', null, 'non member cannot link her item to an item of the galaxy');

select tests.login('bob');
select throws_ok(
  $$ insert into public.item_links (source_id, target_id) values ('30000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000002') $$,
  '42501', null, 'cannot link to a private item I cannot see');
select lives_ok(
  $$ insert into public.item_links (source_id, target_id) values ('30000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000005') returning id $$,
  'member links two visible items across spheres');
select throws_ok(
  $$ insert into public.item_links (source_id, target_id) values ('30000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000004') $$,
  '23505', null, 'the same pair cannot be linked twice, in either direction');
select throws_ok(
  $$ insert into public.item_links (source_id, target_id) values ('30000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000004') $$,
  '23514', null, 'no self links');
select throws_ok(
  $$ insert into public.item_links (source_id, target_id, created_by) values ('30000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000001') $$,
  '42501', null, 'created_by cannot be forged');

select tests.login('ann');
select throws_ok(
  $$ insert into public.item_links (source_id, target_id) values ('30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-0000000000a9') $$,
  '23514', null, 'links never cross galaxies');

-- delete
select tests.login('bob');
select lives_ok($$ delete from public.item_links where id in ('50000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000003') $$,
  'deleting invisible links is filtered');
select tests.logout();
select is((select count(*)::int from public.item_links where id in ('50000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000003')), 2,
  'the hidden links are intact');

-- a link disappears when one end becomes private
select tests.login('ann');
select lives_ok($$ update public.items set is_private = true where id = '30000000-0000-4000-8000-000000000001' $$, 'ann makes Lisbon trip private');
select tests.login('bob');
select is_empty($$ select * from public.item_links where id = '50000000-0000-4000-8000-000000000001' $$,
  'the link is hidden as soon as one end is private');
select tests.login('ann');
select lives_ok($$ update public.items set is_private = false where id = '30000000-0000-4000-8000-000000000001' $$, 'ann shares it again');
select tests.login('bob');
select lives_ok($$ delete from public.item_links where id = '50000000-0000-4000-8000-000000000001' $$, 'member deletes a visible link');
select tests.logout();
select is((select count(*)::int from public.item_links where id = '50000000-0000-4000-8000-000000000001'), 0, 'it is gone');

select * from finish();
rollback;
