-- Shared helpers for the pgTAP suite. Runs first (alphabetical order) and is
-- the only file that commits: it (re)creates the `tests` schema in the LOCAL
-- database. It never ships: it is not a migration.
--
-- Fixture ("three roles"): ann = author/owner, bob = other member, cat = non member.
--
--   ann  a0000000-0000-4000-8000-000000000001
--   bob  b0000000-0000-4000-8000-000000000002
--   cat  c0000000-0000-4000-8000-000000000003
--   G    10000000-0000-4000-8000-000000000001  galaxy "Shared" (ann owner, bob member)
--
--   spheres (2000…)                              items (3000…)
--   …01 Trips          ann, shared               …01 Lisbon trip    ann  in Trips
--   …02 Ann secret     ann, PRIVATE              …02 Surprise gift  ann  in Trips, PRIVATE
--   …03 Italy          ann, child of Trips       …03 Diary page     ann  in Ann secret
--   …04 Bob stuff      bob, shared               …04 Bob idea       bob  in Trips
--   …05 Hidden corner  bob, PRIVATE child Trips  …05 Procida        ann  in Italy
--                                                …06 Bob secret     bob  in Trips, PRIVATE
--   links (5000…)                                …07 Bob hidden     bob  in Hidden corner
--   …01 Lisbon → Bob idea                        …08 Cat note       cat  in her own inbox
--   …02 Lisbon → Surprise gift (private end)
--   …03 Lisbon → Diary page (private sphere)     annotations (4000…)
--                                                …01 in Trips (ann) · …02 in Ann secret (ann)

create extension if not exists pgtap with schema extensions;

create schema if not exists tests;
grant usage on schema tests to anon, authenticated, service_role;

create or replace function tests.create_user(_username text, _id uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000', _id, 'authenticated', 'authenticated',
    _username || '@users.ouwork.local', '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('username', _username), now(), now()
  );
  return _id;
end;
$$;

create or replace function tests.uid(_username text)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select id from public.profiles where username = _username;
$$;

-- act as a logged-in user (SECURITY INVOKER: SET ROLE is not allowed in definer functions)
create or replace function tests.login(_username text)
returns void
language plpgsql set search_path = ''
as $$
declare
  _id uuid := tests.uid(_username);
begin
  if _id is null then
    raise exception 'unknown test user %', _username;
  end if;
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', _id, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

create or replace function tests.login_anon()
returns void
language plpgsql set search_path = ''
as $$
begin
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'anon', true);
end;
$$;

-- back to the superuser-ish test runner
create or replace function tests.logout()
returns void
language plpgsql set search_path = ''
as $$
begin
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', '', true);
end;
$$;

create or replace function tests.inbox(_galaxy_id uuid)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select id from public.spheres where galaxy_id = _galaxy_id and is_inbox;
$$;

create or replace function tests.personal_galaxy(_username text)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select g.id from public.galaxies g
  join public.profiles p on p.id = g.owner_id
  where p.username = _username and g.is_personal;
$$;

create or replace function tests.fixture()
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  ann constant uuid := 'a0000000-0000-4000-8000-000000000001';
  bob constant uuid := 'b0000000-0000-4000-8000-000000000002';
  cat constant uuid := 'c0000000-0000-4000-8000-000000000003';
  g   constant uuid := '10000000-0000-4000-8000-000000000001';
begin
  perform tests.create_user('ann', ann);
  perform tests.create_user('bob', bob);
  perform tests.create_user('cat', cat);

  insert into public.galaxies (id, name, owner_id) values (g, 'Shared', ann);
  update public.galaxy_members set joined_at = now() - interval '10 days' where galaxy_id = g;
  insert into public.galaxy_members (galaxy_id, user_id, role, joined_at)
  values (g, bob, 'editor', now() - interval '10 days');

  insert into public.spheres (id, galaxy_id, parent_id, name, is_private, created_by) values
    ('20000000-0000-4000-8000-000000000001', g, null, 'Trips', false, ann),
    ('20000000-0000-4000-8000-000000000002', g, null, 'Ann secret', true, ann),
    ('20000000-0000-4000-8000-000000000004', g, null, 'Bob stuff', false, bob);
  insert into public.spheres (id, galaxy_id, parent_id, name, is_private, created_by) values
    ('20000000-0000-4000-8000-000000000003', g, '20000000-0000-4000-8000-000000000001', 'Italy', false, ann),
    ('20000000-0000-4000-8000-000000000005', g, '20000000-0000-4000-8000-000000000001', 'Hidden corner', true, bob);

  insert into public.items (id, sphere_id, type, title, body_md, is_private, created_by, created_at, updated_at) values
    ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'note', 'Lisbon trip', 'pasteis de nata', false, ann, now() - interval '1 day', now() - interval '1 day'),
    ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'note', 'Surprise gift', 'do not tell bob', true, ann, now() - interval '1 day', now() - interval '1 day'),
    ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', 'note', 'Diary page', 'dear diary', false, ann, now() - interval '1 day', now() - interval '1 day'),
    ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', 'note', 'Bob idea', 'a boat', false, bob, now() - interval '1 day', now() - interval '1 day'),
    ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000003', 'note', 'Procida', 'island', false, ann, now() - interval '1 day', now() - interval '1 day'),
    ('30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000001', 'note', 'Bob secret', 'shh', true, bob, now() - interval '1 day', now() - interval '1 day'),
    ('30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000005', 'note', 'Bob hidden', 'corner', false, bob, now() - interval '1 day', now() - interval '1 day'),
    ('30000000-0000-4000-8000-000000000008', tests.inbox(tests.personal_galaxy('cat')), 'note', 'Cat note', 'meow Lisbon', false, cat, now() - interval '1 day', now() - interval '1 day');

  insert into public.item_links (id, source_id, target_id, created_by) values
    ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000004', ann),
    ('50000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002', ann),
    ('50000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', ann);

  insert into public.annotations (id, sphere_id, kind, data, created_by) values
    ('40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'sticker', '{"emoji":"⭐"}', ann),
    ('40000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'sticker', '{"emoji":"🔒"}', ann);
end;
$$;

grant execute on all functions in schema tests to anon, authenticated, service_role;

begin;
select plan(1);
select has_function('tests', 'fixture', 'test helpers are installed');
select * from finish();
rollback;
