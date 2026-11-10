-- "new since last visit" bookkeeping (RF8) never leaks private content
begin;
select * from no_plan();
select tests.fixture();

select tests.login('bob');
select results_eq(
  $$ select title from public.items_feed where is_new order by title $$, array['Lisbon trip', 'Procida'],
  'new for bob: what ann added and he can see (no private content)');
select is((select is_new from public.items_feed where id = '30000000-0000-4000-8000-000000000004'), false, 'my own items are never new');
select is((select new_count from public.sphere_stats where sphere_id = '20000000-0000-4000-8000-000000000001'), 1, 'sphere badge counts visible news only');
select is((select count(*)::int from public.items_feed where since_last_visit), 2, 'banner: everything new since the last visit');

select tests.login('ann');
select results_eq($$ select title from public.items_feed where is_new order by title $$, array['Bob idea'],
  'new for ann: bob''s shared item, not his private ones');

select tests.login('cat');
select is_empty($$ select * from public.items_feed where is_new $$, 'nothing is new for a non member');
select lives_ok($$ select public.mark_seen(array['30000000-0000-4000-8000-000000000001'::uuid]) $$, 'non member marking an invisible item is a no-op');

-- ── mark seen ──────────────────────────────────────────────────────────────
select tests.login('bob');
select lives_ok($$ select public.mark_seen(array['30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002']::uuid[]) $$,
  'member marks items as seen');
select is((select is_new from public.items_feed where id = '30000000-0000-4000-8000-000000000001'), false, 'seen item is no longer new');
select throws_ok(
  $$ insert into public.item_views (user_id, item_id) values ('a0000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000004') $$,
  '42501', null, 'cannot write a view on behalf of someone else');
select throws_ok(
  $$ insert into public.item_views (item_id) values ('30000000-0000-4000-8000-000000000002') $$,
  '42501', null, 'cannot record a view of an invisible item');
select tests.logout();
select is((select count(*)::int from public.item_views where item_id = '30000000-0000-4000-8000-000000000002'), 0,
  'no view row exists for the private item');
select is((select count(*)::int from public.item_views where user_id = tests.uid('cat')), 0, 'the non member recorded nothing');

insert into public.item_views (user_id, item_id) values (tests.uid('ann'), '30000000-0000-4000-8000-000000000004');
select tests.login('bob');
select is((select count(*)::int from public.item_views), 1, 'I only read my own views');

-- ── edits ──────────────────────────────────────────────────────────────────
select tests.logout();
update public.item_views set seen_at = now() - interval '1 hour' where user_id = tests.uid('bob');
select tests.login('ann');
select lives_ok($$ update public.items set x = 300, y = 120 where id = '30000000-0000-4000-8000-000000000001' $$, 'ann drags her card');
select tests.login('bob');
select is((select is_new from public.items_feed where id = '30000000-0000-4000-8000-000000000001'), false, 'moving a card is not news');
select tests.login('ann');
select lives_ok($$ update public.items set body_md = 'pasteis de nata, twice' where id = '30000000-0000-4000-8000-000000000001' $$, 'ann edits the text');
select is((select is_new from public.items_feed where id = '30000000-0000-4000-8000-000000000001'), false, 'not new for the editor');
select tests.login('bob');
select is((select is_new from public.items_feed where id = '30000000-0000-4000-8000-000000000001'), true, 'a content edit by someone else is news again');

-- ── whole sphere / banner ──────────────────────────────────────────────────
select lives_ok($$ select public.mark_sphere_seen('20000000-0000-4000-8000-000000000001') $$, 'opening a sphere marks it (and its sub-spheres) as seen');
select is_empty($$ select * from public.items_feed where is_new $$, 'nothing new left');

select tests.logout();
delete from public.item_views where user_id = tests.uid('bob');
select tests.login('bob');
select is((select count(*)::int from public.items_feed where since_last_visit), 2, 'banner is back before dismissal');
select lives_ok($$ select public.touch_last_seen() $$, 'dismissing the banner');
select is((select count(*)::int from public.items_feed where since_last_visit), 0, 'banner cleared');
select is((select count(*)::int from public.items_feed where is_new), 2, '…but unopened items keep their NEW badge');
select tests.logout();
select is((select last_seen_at from public.galaxy_members where user_id = tests.uid('ann') and galaxy_id = '10000000-0000-4000-8000-000000000001'), null,
  'dismissing my banner does not touch other members');

select * from finish();
rollback;
