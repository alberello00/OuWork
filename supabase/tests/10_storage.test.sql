-- storage objects follow the visibility of their item / annotation
begin;
select * from no_plan();
select tests.fixture();

insert into storage.objects (bucket_id, name) values
  ('items', '10000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000001/shared.jpg'),
  ('items', '10000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000002/private-item.jpg'),
  ('items', '10000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000003/private-sphere.jpg'),
  ('items', '10000000-0000-4000-8000-000000000001/40000000-0000-4000-8000-000000000001/sticker.png'),
  ('items', '10000000-0000-4000-8000-000000000001/40000000-0000-4000-8000-000000000002/private-sticker.png'),
  -- right item id, wrong galaxy folder: must match nothing
  ('items', 'c0000000-0000-4000-8000-000000000003/30000000-0000-4000-8000-000000000001/wrong-galaxy.jpg'),
  ('items', 'not-a-valid-path.jpg');

select tests.login('ann');
select is((select count(*)::int from storage.objects where bucket_id = 'items'), 5, 'author sees the objects of everything she can see');

select tests.login('bob');
select results_eq(
  $$ select split_part(name, '/', 3) from storage.objects where bucket_id = 'items' order by 1 $$,
  array['shared.jpg', 'sticker.png'],
  'other member sees only objects of visible items/annotations');

select tests.login('cat');
select is_empty($$ select * from storage.objects where bucket_id = 'items' $$, 'non member sees no object');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id) values ('items',
     '10000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-0000000000d1/x.png', tests.uid('cat')::text) $$,
  '42501', null, 'non member cannot upload into the galaxy folder');

select tests.login('bob');
select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id) values ('items',
     '10000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-0000000000d2/mine.png', tests.uid('bob')::text) $$,
  'member uploads into the galaxy folder');
select isnt_empty($$ select * from storage.objects where name like '%/mine.png' $$,
  'the uploader sees his object before its item exists');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id) values ('items', 'loose.png', tests.uid('bob')::text) $$,
  '42501', null, 'malformed paths are rejected');
select throws_ok(
  format($$ insert into storage.objects (bucket_id, name, owner_id) values ('items', %L, tests.uid('bob')::text) $$,
    tests.personal_galaxy('ann')::text || '/30000000-0000-4000-8000-0000000000d3/x.png'),
  '42501', null, 'cannot upload into a galaxy I am not a member of');

select tests.login('ann');
select is_empty($$ select * from storage.objects where name like '%/mine.png' $$,
  'an upload not yet attached to an item is visible to its uploader only');

-- removed member loses access to his own uploads
select tests.logout();
delete from public.galaxy_members where galaxy_id = '10000000-0000-4000-8000-000000000001' and user_id = tests.uid('bob');
select tests.login('bob');
select is_empty($$ select * from storage.objects where bucket_id = 'items' $$, 'a removed member sees no object, not even his uploads');

select tests.logout();
select * from finish();
rollback;
