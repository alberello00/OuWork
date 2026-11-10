-- Structural guarantees: RLS everywhere, nothing for anon, safe functions.
begin;
select * from no_plan();

select is_empty(
  $$ select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity $$,
  'every table in public has RLS enabled'
);

select is_empty(
  $$ select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r'
       and not exists (select 1 from pg_policy p where p.polrelid = c.oid) $$,
  'every table in public has at least one policy'
);

select is_empty(
  $$ select table_name, privilege_type from information_schema.role_table_grants
     where table_schema = 'public' and grantee = 'anon' $$,
  'anon has no table or view privilege in public'
);

select is_empty(
  $$ select table_name, column_name from information_schema.role_column_grants
     where table_schema = 'public' and grantee = 'anon' $$,
  'anon has no column privilege in public'
);

select is_empty(
  $$ select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'v'
       and not coalesce(c.reloptions @> array['security_invoker=true'], false) $$,
  'every view in public is security_invoker (RLS applies to the reader)'
);

select is_empty(
  $$ select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname in ('public', 'private') and p.prosecdef
       and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%') $$,
  'every SECURITY DEFINER function pins search_path'
);

select is_empty(
  $$ select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'private' and has_function_privilege('anon', p.oid, 'execute') $$,
  'anon cannot execute private helpers'
);

select is_empty(
  $$ select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname <> 'invite_preview'
       and has_function_privilege('anon', p.oid, 'execute') $$,
  'anon can execute nothing in public except invite_preview'
);

select ok(has_function_privilege('anon', 'public.invite_preview(text)', 'execute'),
  'anon can preview an invite');
select ok(not has_function_privilege('authenticated', 'public.redeem_invite(text, uuid)', 'execute'),
  'authenticated cannot redeem an invite for an arbitrary user');
select ok(has_function_privilege('service_role', 'public.redeem_invite(text, uuid)', 'execute'),
  'service_role can redeem an invite');
select ok(not has_table_privilege('authenticated', 'public.spheres', 'delete'),
  'spheres cannot be deleted directly');
select ok(not has_table_privilege('authenticated', 'public.galaxy_members', 'insert'),
  'memberships cannot be inserted directly');

select is(
  (select public from storage.buckets where id = 'items'), false,
  'the items bucket is private'
);

select tests.fixture();
select tests.login_anon();

select throws_ok('select * from public.galaxies', '42501', null, 'anon cannot read galaxies');
select throws_ok('select * from public.spheres', '42501', null, 'anon cannot read spheres');
select throws_ok('select * from public.items', '42501', null, 'anon cannot read items');
select throws_ok('select * from public.items_feed', '42501', null, 'anon cannot read the feed');
select throws_ok('select * from public.item_links', '42501', null, 'anon cannot read links');
select throws_ok('select * from public.annotations', '42501', null, 'anon cannot read annotations');
select throws_ok('select * from public.profiles', '42501', null, 'anon cannot read profiles');
select throws_ok('select * from public.invites', '42501', null, 'anon cannot read invites');
select throws_ok($$ select * from public.search_items('Lisbon') $$, '42501', null, 'anon cannot search');
select is_empty($$ select * from storage.objects where bucket_id = 'items' $$, 'anon sees no storage object');

select tests.logout();
select * from finish();
rollback;
