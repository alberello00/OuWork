-- Realtime (RW4): what is published, and who may join a workspace channel.
begin;
select * from no_plan();
select tests.fixture();

-- ── published tables ───────────────────────────────────────────────────────
select results_eq(
  $$ select tablename::text from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' order by 1 $$,
  array['annotations', 'galaxy_members', 'item_links', 'items', 'spheres'],
  'items, boards, annotations, links and members are published');
select is_empty(
  $$ select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public'
     and tablename in ('invites', 'item_views', 'profiles') $$,
  'invite tokens, seen marks and profiles are not published');

-- ── topic parsing ──────────────────────────────────────────────────────────
select is(private.channel_galaxy_id('ws:10000000-0000-4000-8000-000000000001'), '10000000-0000-4000-8000-000000000001'::uuid, 'ws:<uuid> names a workspace');
select is(private.channel_galaxy_id('ws:not-a-uuid'), null, 'a malformed topic names nothing');
select is(private.channel_galaxy_id('board:10000000-0000-4000-8000-000000000001'), null, 'other prefixes name nothing');

-- ── who may join ───────────────────────────────────────────────────────────
select tests.login('ann');
select ok(private.can_join_channel('ws:10000000-0000-4000-8000-000000000001'), 'the owner joins the workspace channel');
select tests.login('bob');
select ok(private.can_join_channel('ws:10000000-0000-4000-8000-000000000001'), 'a member joins the workspace channel');
select tests.login('cat');
select ok(not private.can_join_channel('ws:10000000-0000-4000-8000-000000000001'), 'a non member cannot join it');
select ok(not private.can_join_channel('ws:garbage'), 'nobody joins a malformed topic');
select ok(private.can_join_channel(format('ws:%s', tests.personal_galaxy('cat'))), 'cat joins her own personal channel');

select * from finish();
rollback;
