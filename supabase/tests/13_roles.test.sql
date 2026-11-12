-- roles owner | editor | viewer (RW3): what each one can write. Reading is
-- the same for every member and is covered by the other files.
--   ann = owner, bob = editor, vic = viewer (added here), cat = non member
begin;
select * from no_plan();
select tests.fixture();
select tests.create_user('vic', 'e0000000-0000-4000-8000-000000000005');
insert into public.galaxy_members (galaxy_id, user_id, role)
values ('10000000-0000-4000-8000-000000000001', tests.uid('vic'), 'viewer');
insert into storage.objects (bucket_id, name) values
  ('items', '10000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000001/shared.jpg');

-- ── schema ─────────────────────────────────────────────────────────────────
select is((select role from public.galaxy_members where user_id = tests.uid('bob')), 'editor', 'the fixture member is an editor');
select throws_ok(
  $$ insert into public.galaxy_members (galaxy_id, user_id, role) values ('10000000-0000-4000-8000-000000000001', tests.uid('cat'), 'member') $$,
  '23514', null, 'the old "member" role no longer exists');
select is((select column_default from information_schema.columns
           where table_schema = 'public' and table_name = 'galaxy_members' and column_name = 'role'),
  '''editor''::text', 'new memberships default to editor');

-- ── viewer: reads everything shared, writes nothing ────────────────────────
select tests.login('vic');
select isnt_empty($$ select * from public.galaxies where id = '10000000-0000-4000-8000-000000000001' $$, 'viewer sees the workspace');
select results_eq($$ select title from public.items order by title $$,
  array['Bob idea', 'Lisbon trip', 'Procida'], 'viewer sees shared items only, never private ones');
select is((select count(*)::int from public.annotations), 1, 'viewer sees the annotations of shared boards');
select is((select count(*)::int from storage.objects where bucket_id = 'items'), 1, 'viewer sees the images of shared items');
select is((select count(*)::int from public.search_items('Lisbon')), 1, 'viewer can search');

select throws_ok(
  $$ insert into public.spheres (galaxy_id, name) values ('10000000-0000-4000-8000-000000000001', 'Viewer board') $$,
  '42501', null, 'viewer cannot create a board');
select throws_ok(
  $$ insert into public.items (sphere_id, type, title) values ('20000000-0000-4000-8000-000000000001', 'note', 'Viewer note') $$,
  '42501', null, 'viewer cannot create an item');
select throws_ok(
  format($$ insert into public.items (sphere_id, type, title) values (%L, 'note', 'Viewer note') $$,
         tests.inbox('10000000-0000-4000-8000-000000000001')),
  '42501', null, 'viewer cannot add to the Inbox either');
select throws_ok(
  $$ insert into public.item_links (source_id, target_id) values ('30000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000005') $$,
  '42501', null, 'viewer cannot link items');
select throws_ok(
  $$ insert into public.annotations (sphere_id, kind, data) values ('20000000-0000-4000-8000-000000000001', 'sticker', '{"emoji":"✅"}') $$,
  '42501', null, 'viewer cannot annotate');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id) values ('items',
     '10000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-0000000000e1/x.png', tests.uid('vic')::text) $$,
  '42501', null, 'viewer cannot upload images');
select throws_ok($$ select public.delete_sphere('20000000-0000-4000-8000-000000000004') $$,
  '42501', null, 'viewer cannot delete a board');

-- silent no-ops: RLS filters the rows out
select lives_ok($$ update public.items set title = 'Hacked' $$, 'viewer updating items is filtered');
select lives_ok($$ update public.spheres set name = 'Hacked', x = 999 $$, 'viewer updating boards is filtered');
select lives_ok($$ update public.annotations set x = 999 $$, 'viewer updating annotations is filtered');
select lives_ok($$ delete from public.items $$, 'viewer deleting items is filtered');
select lives_ok($$ delete from public.item_links $$, 'viewer deleting links is filtered');
select lives_ok($$ delete from public.annotations $$, 'viewer deleting annotations is filtered');
select lives_ok($$ delete from storage.objects where bucket_id = 'items' $$, 'viewer deleting images is filtered');

-- what a viewer may still do: their own "seen" bookkeeping, leaving
select lives_ok($$ select public.mark_seen(array['30000000-0000-4000-8000-000000000001'::uuid]) $$, 'viewer marks items as seen');
select lives_ok($$ select public.touch_last_seen() $$, 'viewer closes the "since your last visit" banner');
select throws_ok(
  $$ select public.set_member_role('10000000-0000-4000-8000-000000000001', tests.uid('bob'), 'viewer') $$,
  '42501', null, 'viewer cannot change roles');
select throws_ok(
  $$ insert into public.invites (galaxy_id) values ('10000000-0000-4000-8000-000000000001') $$,
  '42501', null, 'viewer cannot invite');

select tests.logout();
select is((select count(*)::int from public.items where title = 'Hacked'), 0, 'no item was renamed by the viewer');
select is((select count(*)::int from public.spheres where name = 'Hacked'), 0, 'no board was renamed by the viewer');
select is((select count(*)::int from public.items where galaxy_id = '10000000-0000-4000-8000-000000000001'), 7, 'no item was deleted by the viewer');
select is((select count(*)::int from public.item_links), 3, 'no link was deleted by the viewer');
select is((select count(*)::int from public.annotations where x = 999), 0, 'no annotation was moved by the viewer');
select is((select count(*)::int from storage.objects where bucket_id = 'items'), 1, 'no image was deleted by the viewer');
select isnt_empty($$ select * from public.item_views where user_id = tests.uid('vic') $$, 'the viewer''s seen mark was saved');

-- ── editor: writes, but does not manage people ─────────────────────────────
select tests.login('bob');
select lives_ok(
  $$ insert into public.spheres (galaxy_id, name) values ('10000000-0000-4000-8000-000000000001', 'Editor board') $$,
  'editor creates a board');
select lives_ok(
  $$ insert into public.items (sphere_id, type, title) values ('20000000-0000-4000-8000-000000000001', 'note', 'Editor note') $$,
  'editor creates an item');
select lives_ok(
  $$ insert into public.item_links (source_id, target_id) values ('30000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000005') $$,
  'editor links items');
select lives_ok(
  $$ insert into public.annotations (sphere_id, kind, data) values ('20000000-0000-4000-8000-000000000001', 'sticker', '{"emoji":"✅"}') $$,
  'editor annotates');
select results_eq($$ update public.items set title = 'Lisbon trip (edited)' where id = '30000000-0000-4000-8000-000000000001' returning title $$,
  array['Lisbon trip (edited)'], 'editor edits someone else''s shared item');
select throws_ok(
  $$ select public.set_member_role('10000000-0000-4000-8000-000000000001', tests.uid('vic'), 'editor') $$,
  '42501', null, 'editor cannot change roles');
select throws_ok(
  $$ insert into public.invites (galaxy_id) values ('10000000-0000-4000-8000-000000000001') $$,
  '42501', null, 'editor cannot invite');

-- ── owner manages roles ────────────────────────────────────────────────────
select tests.login('ann');
select lives_ok(
  $$ select public.set_member_role('10000000-0000-4000-8000-000000000001', tests.uid('bob'), 'viewer') $$,
  'owner turns an editor into a viewer');
select is((select role from public.galaxy_members where user_id = tests.uid('bob')), 'viewer', '…and the role is saved');
select throws_ok(
  $$ select public.set_member_role('10000000-0000-4000-8000-000000000001', tests.uid('ann'), 'viewer') $$,
  'P0002', null, 'the owner''s own role never changes');
select throws_ok(
  $$ select public.set_member_role('10000000-0000-4000-8000-000000000001', tests.uid('vic'), 'owner') $$,
  '22023', null, 'ownership cannot be handed out through roles');
select throws_ok(
  $$ select public.set_member_role('10000000-0000-4000-8000-000000000001', tests.uid('cat'), 'editor') $$,
  'P0002', null, 'a non member cannot be given a role');

select tests.login('bob');
select throws_ok(
  $$ insert into public.items (sphere_id, type, title) values ('20000000-0000-4000-8000-000000000001', 'note', 'Too late') $$,
  '42501', null, 'once a viewer, bob can no longer write');
select is((select count(*)::int from public.items where title = 'Bob secret'), 1, '…but still sees his own private item');

select tests.login('ann');
select lives_ok(
  $$ select public.set_member_role('10000000-0000-4000-8000-000000000001', tests.uid('vic'), 'editor') $$,
  'owner promotes a viewer to editor');
select tests.login('vic');
select lives_ok(
  $$ insert into public.items (sphere_id, type, title) values ('20000000-0000-4000-8000-000000000001', 'note', 'Promoted note') $$,
  'the promoted member can write');

-- ── non member ─────────────────────────────────────────────────────────────
select tests.login('cat');
select throws_ok(
  $$ select public.set_member_role('10000000-0000-4000-8000-000000000001', tests.uid('vic'), 'viewer') $$,
  '42501', null, 'a non member cannot change roles');
select throws_ok(
  $$ insert into public.items (sphere_id, type, title) values ('20000000-0000-4000-8000-000000000001', 'note', 'Intruder') $$,
  '42501', null, 'a non member cannot write');

-- ── the invite carries the role (RW3.2) ────────────────────────────────────
select tests.login('ann');
select lives_ok(
  $$ insert into public.invites (galaxy_id, role) values ('10000000-0000-4000-8000-000000000001', 'viewer') $$,
  'owner creates a viewer invite');
select is((select role from public.invites order by created_at desc limit 1), 'viewer', 'the invite stores the role');
select throws_ok(
  $$ insert into public.invites (galaxy_id, role) values ('10000000-0000-4000-8000-000000000001', 'owner') $$,
  '23514', null, 'an invite cannot make someone owner');

select tests.logout();
update public.invites set token = 'tok-viewer' where role = 'viewer';
select tests.login_anon();
select results_eq($$ select status, role from public.invite_preview('tok-viewer') $$,
  $$ values ('valid', 'viewer') $$, 'the invite page shows the role');

select tests.login('cat');
select is(public.accept_invite('tok-viewer'), '10000000-0000-4000-8000-000000000001'::uuid, 'cat accepts the viewer invite');
select is((select role from public.galaxy_members where user_id = tests.uid('cat') and galaxy_id = '10000000-0000-4000-8000-000000000001'),
  'viewer', 'cat joins as a viewer');
select throws_ok(
  $$ insert into public.items (sphere_id, type, title) values ('20000000-0000-4000-8000-000000000001', 'note', 'Cat note 2') $$,
  '42501', null, 'and cannot write');

select * from finish();
rollback;
