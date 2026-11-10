-- items: privacy, search, counts (RF3, RF4, RF9.1)
begin;
select * from no_plan();
select tests.fixture();

-- ── visibility ─────────────────────────────────────────────────────────────
select tests.login('ann');
select results_eq(
  $$ select title from public.items where galaxy_id = '10000000-0000-4000-8000-000000000001' order by title $$,
  array['Bob idea', 'Diary page', 'Lisbon trip', 'Procida', 'Surprise gift'],
  'author sees her private item and her private sphere''s item, not bob''s private ones');

select tests.login('bob');
select results_eq(
  $$ select title from public.items where galaxy_id = '10000000-0000-4000-8000-000000000001' order by title $$,
  array['Bob hidden', 'Bob idea', 'Bob secret', 'Lisbon trip', 'Procida'],
  'other member sees neither the private item nor the item in a private sphere');
select is_empty($$ select * from public.items where id = '30000000-0000-4000-8000-000000000002' $$,
  'private item: not visible by id');
select is_empty($$ select * from public.items where id = '30000000-0000-4000-8000-000000000003' $$,
  'item of a private sphere (not flagged private itself): not visible by id');
select is_empty($$ select * from public.items_feed where id in ('30000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000003') $$,
  'private content is not in the feed view either');

select tests.login('cat');
select results_eq($$ select title from public.items $$, array['Cat note'], 'non member sees only her own galaxy');
select is_empty($$ select * from public.items_feed where galaxy_id = '10000000-0000-4000-8000-000000000001' $$, 'non member: empty feed');

-- ── search ─────────────────────────────────────────────────────────────────
select tests.login('bob');
select is_empty($$ select * from public.search_items('Surprise') $$, 'search does not find a private item by title');
select is_empty($$ select * from public.search_items('do not tell') $$, 'search does not find a private item by body');
select is_empty($$ select * from public.search_items('diary') $$, 'search does not find items of a private sphere');
select results_eq($$ select title from public.search_items('lisbon') $$, array['Lisbon trip'], 'search finds shared items (case-insensitive)');
select results_eq($$ select title from public.search_items('pasteis') $$, array['Lisbon trip'], 'search covers the body');
select is_empty($$ select * from public.search_items('%') $$, 'wildcards are escaped');
select is_empty($$ select * from public.search_items('   ') $$, 'blank query returns nothing');
select tests.login('ann');
select results_eq($$ select title from public.search_items('surprise') $$, array['Surprise gift'], 'the author finds her private item');
select is_empty(format($$ select * from public.search_items('lisbon', %L) $$, tests.personal_galaxy('ann')), 'search can be scoped to a galaxy');
select tests.login('cat');
select results_eq($$ select title from public.search_items('lisbon') $$, array['Cat note'], 'non member search never crosses into the galaxy');

-- ── counts ─────────────────────────────────────────────────────────────────
select tests.login('bob');
select is((select item_count from public.sphere_stats where sphere_id = '20000000-0000-4000-8000-000000000001'), 3,
  'counts for bob: Lisbon trip, Bob idea, Bob secret (not Surprise gift)');
select tests.login('ann');
select is((select item_count from public.sphere_stats where sphere_id = '20000000-0000-4000-8000-000000000001'), 3,
  'counts for ann: Lisbon trip, Surprise gift, Bob idea (not Bob secret)');
select is((select item_count from public.sphere_stats where sphere_id = '20000000-0000-4000-8000-000000000002'), 1,
  'ann counts her private sphere');

-- ── insert ─────────────────────────────────────────────────────────────────
select tests.login('cat');
select throws_ok(
  $$ insert into public.items (sphere_id, type, title) values ('20000000-0000-4000-8000-000000000001', 'note', 'intruder') $$,
  '42501', null, 'non member cannot add items');
select tests.login('bob');
select throws_ok(
  $$ insert into public.items (sphere_id, type, title) values ('20000000-0000-4000-8000-000000000002', 'note', 'peek') $$,
  '42501', null, 'cannot add items to someone else''s private sphere');
select lives_ok(
  $$ insert into public.items (id, sphere_id, type, title, is_private)
     values ('30000000-0000-4000-8000-0000000000c1', '20000000-0000-4000-8000-000000000001', 'note', 'Bob new', true) returning id $$,
  'member adds a private item (INSERT ... RETURNING works)');
select is((select created_by from public.items where id = '30000000-0000-4000-8000-0000000000c1'), tests.uid('bob'), 'created_by is the current user');
select is((select galaxy_id from public.items where id = '30000000-0000-4000-8000-0000000000c1'), '10000000-0000-4000-8000-000000000001'::uuid, 'galaxy_id is derived from the sphere');
select throws_ok(
  $$ insert into public.items (sphere_id, type, title, created_by) values ('20000000-0000-4000-8000-000000000001', 'note', 'forged', 'a0000000-0000-4000-8000-000000000001') $$,
  '42501', null, 'created_by cannot be forged');
select throws_ok(
  $$ insert into public.items (sphere_id, type, title, galaxy_id) values ('20000000-0000-4000-8000-000000000001', 'note', 'forged', '10000000-0000-4000-8000-000000000001') $$,
  '42501', null, 'galaxy_id cannot be set by the client');
select throws_ok(
  $$ insert into public.items (sphere_id, type, title) values ('20000000-0000-4000-8000-000000000001', 'link', 'no url') $$,
  '23514', null, 'a link needs an http(s) url');
select throws_ok(
  $$ insert into public.items (sphere_id, type, url) values ('20000000-0000-4000-8000-000000000001', 'link', 'javascript:alert(1)') $$,
  '23514', null, 'only http(s) urls');
select throws_ok(
  $$ insert into public.items (sphere_id, type, image_path) values ('20000000-0000-4000-8000-000000000001', 'image', 'somewhere/else.png') $$,
  '23514', null, 'image_path must live in the item''s own folder');
select lives_ok(
  $$ insert into public.items (id, sphere_id, type, image_path) values ('30000000-0000-4000-8000-0000000000c2', '20000000-0000-4000-8000-000000000001', 'image',
     '10000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-0000000000c2/photo.jpg') $$,
  'a well-formed image item is accepted');

-- ── update ─────────────────────────────────────────────────────────────────
select lives_ok($$ update public.items set title = 'Lisbon trip!' where id = '30000000-0000-4000-8000-000000000001' $$,
  'member edits a shared item');
select is((select updated_by from public.items where id = '30000000-0000-4000-8000-000000000001'), tests.uid('bob'), 'updated_by records the editor');
select lives_ok($$ update public.items set title = 'pwned' where id in ('30000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000003') $$,
  'editing invisible items is filtered');
select throws_ok($$ update public.items set is_private = true where id = '30000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'a non-author cannot make an item private');
select throws_ok($$ update public.items set sphere_id = '20000000-0000-4000-8000-000000000002' where id = '30000000-0000-4000-8000-000000000004' $$,
  '42501', null, 'cannot move an item into a sphere I cannot see');
select throws_ok($$ update public.items set created_by = tests.uid('bob') where id = '30000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'created_by is immutable from the client');
select throws_ok($$ update public.items set updated_at = now() - interval '1 year' where id = '30000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'updated_at cannot be forged');
select throws_ok(format($$ update public.items set sphere_id = %L where id = '30000000-0000-4000-8000-000000000004' $$, tests.inbox(tests.personal_galaxy('bob'))),
  '23514', null, 'an item cannot move to another galaxy');
select lives_ok($$ update public.items set sphere_id = '20000000-0000-4000-8000-000000000004' where id = '30000000-0000-4000-8000-000000000004' $$,
  'an item moves between spheres of the same galaxy');

select tests.login('ann');
select throws_ok($$ update public.items set sphere_id = '20000000-0000-4000-8000-000000000002' where id = '30000000-0000-4000-8000-000000000004' $$,
  '23514', null, 'cannot pull someone else''s item into my private sphere');
select lives_ok($$ update public.items set sphere_id = '20000000-0000-4000-8000-000000000002' where id = '30000000-0000-4000-8000-000000000005' $$,
  'the author moves her own item into her private sphere');
select tests.login('bob');
select is_empty($$ select * from public.items where id = '30000000-0000-4000-8000-000000000005' $$, '…and it disappears for the other member');

-- ── delete ─────────────────────────────────────────────────────────────────
select lives_ok($$ delete from public.items where id in ('30000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000003') $$,
  'deleting invisible items is filtered');
select tests.login('cat');
select lives_ok($$ delete from public.items where galaxy_id = '10000000-0000-4000-8000-000000000001' $$, 'non member delete is filtered');
select lives_ok($$ update public.items set title = 'pwned' where galaxy_id = '10000000-0000-4000-8000-000000000001' $$, 'non member update is filtered');
select tests.logout();
select is((select title from public.items where id = '30000000-0000-4000-8000-000000000002'), 'Surprise gift', 'private item intact');
select is((select title from public.items where id = '30000000-0000-4000-8000-000000000003'), 'Diary page', 'private-sphere item intact');
select is((select title from public.items where id = '30000000-0000-4000-8000-000000000001'), 'Lisbon trip!', 'shared item not touched by the non member');

select tests.login('bob');
select lives_ok($$ delete from public.items where id = '30000000-0000-4000-8000-000000000001' $$, 'member deletes a shared item');
select tests.logout();
select is((select count(*)::int from public.items where id = '30000000-0000-4000-8000-000000000001'), 0, 'it is gone');

-- ── the author flips privacy ───────────────────────────────────────────────
select tests.login('ann');
select lives_ok($$ update public.items set is_private = false where id = '30000000-0000-4000-8000-000000000002' $$, 'the author shares her private item');
select tests.login('bob');
select isnt_empty($$ select * from public.items where id = '30000000-0000-4000-8000-000000000002' $$, 'now the other member sees it');
select tests.login('ann');
select lives_ok($$ update public.items set is_private = true where id = '30000000-0000-4000-8000-000000000002' $$, 'the author makes it private again');
select tests.login('bob');
select is_empty($$ select * from public.items where id = '30000000-0000-4000-8000-000000000002' $$, 'and it is hidden again');
select is_empty($$ select * from public.search_items('surprise') $$, '…from search too');

select tests.logout();
select * from finish();
rollback;
