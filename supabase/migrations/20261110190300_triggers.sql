-- Triggers: account bootstrap, galaxy bootstrap, structural rules, updated_at.
-- All trigger functions are SECURITY DEFINER: they must work on rows the acting
-- user cannot see (e.g. other members' private content).

-- ── New auth user → profile ────────────────────────────────────────────────
create function private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  _colors constant text[] := array['pink', 'teal', 'indigo', 'orange', 'green', 'violet', 'blue', 'red'];
  _username text := lower(coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    split_part(new.email, '@', 1)
  ));
  _display_name text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    initcap(_username)
  );
  _color text := new.raw_user_meta_data ->> 'color';
  _count integer;
begin
  if _color is null or not (_color = any (_colors)) then
    select count(*) into _count from public.profiles;
    _color := _colors[(_count % array_length(_colors, 1)) + 1];
  end if;

  insert into public.profiles (id, username, display_name, color)
  values (new.id, _username, left(_display_name, 40), _color);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ── New profile → personal galaxy "Just me" ────────────────────────────────
create function private.handle_new_profile()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.galaxies (name, owner_id, is_personal)
  values ('Just me', new.id, true);
  return new;
end;
$$;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute function private.handle_new_profile();

-- ── New galaxy → owner membership + default spheres ────────────────────────
create function private.handle_new_galaxy()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.galaxy_members (galaxy_id, user_id, role)
  values (new.id, new.owner_id, 'owner');

  insert into public.spheres (galaxy_id, name, color, emoji, is_inbox, x, y, created_by)
  values
    (new.id, 'Places',         'amber',    '📍', false,    0, -260, new.owner_id),
    (new.id, 'Music',          'lavender', '🎵', false,  225, -130, new.owner_id),
    (new.id, 'Movies & Shows', 'coral',    '🎬', false,  225,  130, new.owner_id),
    (new.id, 'Ideas',          'sky',      '💡', false,    0,  260, new.owner_id),
    (new.id, 'Memories',       'rose',     '📸', false, -225,  130, new.owner_id),
    (new.id, 'Random',         'sage',     '🎲', true,  -225, -130, new.owner_id);
  return new;
end;
$$;

create trigger on_galaxy_created
  after insert on public.galaxies
  for each row execute function private.handle_new_galaxy();

-- ── Invites: never for personal galaxies ───────────────────────────────────
create function private.invites_before_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if exists (select 1 from public.galaxies g where g.id = new.galaxy_id and g.is_personal) then
    raise exception 'a personal galaxy cannot have invites' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger invites_before_insert
  before insert on public.invites
  for each row execute function private.invites_before_insert();

-- ── Members: never add people to a personal galaxy ─────────────────────────
create function private.galaxy_members_before_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if exists (
    select 1 from public.galaxies g
    where g.id = new.galaxy_id and g.is_personal and g.owner_id <> new.user_id
  ) then
    raise exception 'a personal galaxy cannot have other members' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger galaxy_members_before_insert
  before insert on public.galaxy_members
  for each row execute function private.galaxy_members_before_insert();

-- ── Spheres: structure rules (one level of sub-spheres, same galaxy) ───────
create function private.spheres_before_write()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  _parent record;
begin
  if tg_op = 'UPDATE' then
    new.updated_at := now();
    if new.galaxy_id <> old.galaxy_id then
      raise exception 'a sphere cannot move to another galaxy' using errcode = '23514';
    end if;
    if new.is_inbox <> old.is_inbox then
      raise exception 'the inbox flag cannot change' using errcode = '23514';
    end if;
  end if;

  if new.parent_id is not null
     and (tg_op = 'INSERT' or new.parent_id is distinct from old.parent_id) then
    select s.galaxy_id, s.parent_id, s.is_inbox into _parent
    from public.spheres s where s.id = new.parent_id;

    if not found or _parent.galaxy_id <> new.galaxy_id then
      raise exception 'the parent sphere must belong to the same galaxy' using errcode = '23514';
    end if;
    if _parent.parent_id is not null then
      raise exception 'sub-spheres can only be one level deep' using errcode = '23514';
    end if;
    if _parent.is_inbox then
      raise exception 'the inbox sphere cannot have sub-spheres' using errcode = '23514';
    end if;
    if exists (select 1 from public.spheres c where c.parent_id = new.id) then
      raise exception 'a sphere with sub-spheres cannot become a sub-sphere' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger spheres_before_write
  before insert or update on public.spheres
  for each row execute function private.spheres_before_write();

-- ── Spheres: when one becomes (effectively) private, other people's content
--    is moved out instead of silently disappearing for its authors.
--    Invariant kept by this trigger and by items_before_write: every item in an
--    effectively-private sphere was created by the owner of that privacy.
create function private.spheres_after_privacy_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  _parent_private boolean := false;
  _parent_owner uuid;
  _owner uuid;
  _inbox uuid;
begin
  if new.parent_id is not null then
    select s.is_private, s.created_by into _parent_private, _parent_owner
    from public.spheres s where s.id = new.parent_id;
  end if;

  if coalesce(_parent_private, false) then
    _owner := _parent_owner;
  elsif new.is_private then
    _owner := new.created_by;
  else
    return null; -- still shared: nothing to do
  end if;

  select s.id into _inbox
  from public.spheres s where s.galaxy_id = new.galaxy_id and s.is_inbox;

  -- sub-spheres created by someone else go back to the top level
  if new.is_private then
    update public.spheres c
    set parent_id = null
    where c.parent_id = new.id and c.created_by is distinct from _owner;
  end if;

  -- items created by someone else go to the inbox ("Random")
  update public.items i
  set sphere_id = _inbox
  where i.created_by is distinct from _owner
    and i.sphere_id in (
      select new.id
      union all
      select c.id from public.spheres c where c.parent_id = new.id
    );

  return null;
end;
$$;

create trigger spheres_after_privacy_change
  after update of is_private, parent_id on public.spheres
  for each row
  when (old.is_private is distinct from new.is_private or old.parent_id is distinct from new.parent_id)
  execute function private.spheres_after_privacy_change();

-- ── Items: galaxy_id, same-galaxy moves, private-sphere invariant, updated_* ─
create function private.items_before_write()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  _s record;
  _owner uuid;
  _is_private boolean;
begin
  if tg_op = 'INSERT' or new.sphere_id is distinct from old.sphere_id then
    select s.galaxy_id, s.is_private, s.created_by,
           coalesce(p.is_private, false) as parent_private, p.created_by as parent_owner
    into _s
    from public.spheres s
    left join public.spheres p on p.id = s.parent_id
    where s.id = new.sphere_id;

    -- Same answer for "does not exist" and "not visible to you", so the
    -- trigger never confirms the existence of a private sphere.
    if not found or (auth.uid() is not null and not private.can_see_sphere(new.sphere_id)) then
      raise exception 'new row violates row-level security policy for table "items"'
        using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and _s.galaxy_id <> old.galaxy_id then
      raise exception 'an item cannot move to another galaxy' using errcode = '23514';
    end if;
    new.galaxy_id := _s.galaxy_id;

    _is_private := _s.parent_private or _s.is_private;
    _owner := case when _s.parent_private then _s.parent_owner else _s.created_by end;
    if _is_private and new.created_by is distinct from _owner then
      raise exception 'only its owner can keep items in a private sphere' using errcode = '23514';
    end if;
  elsif new.galaxy_id is distinct from old.galaxy_id then
    raise exception 'an item cannot move to another galaxy' using errcode = '23514';
  end if;

  if new.image_path is not null
     and (tg_op = 'INSERT' or new.image_path is distinct from old.image_path)
     and new.image_path not like (new.galaxy_id::text || '/' || new.id::text || '/%') then
    raise exception 'image_path must be <galaxy_id>/<item_id>/<file>' using errcode = '23514';
  end if;

  if tg_op = 'INSERT' then
    new.updated_by := coalesce(new.updated_by, new.created_by);
  elsif (new.title, new.body_md, new.url, new.caption, new.image_path)
        is distinct from (old.title, old.body_md, old.url, old.caption, old.image_path) then
    -- only content edits count as "news"; moving a card on the canvas does not
    new.updated_at := now();
    new.updated_by := coalesce(auth.uid(), new.updated_by);
  end if;

  return new;
end;
$$;

create trigger items_before_write
  before insert or update on public.items
  for each row execute function private.items_before_write();

-- ── Item links: only inside one galaxy ─────────────────────────────────────
create function private.item_links_before_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  _source_galaxy uuid;
  _target_galaxy uuid;
begin
  -- visibility first: the same-galaxy error must not reveal invisible items
  if auth.uid() is not null
     and not (private.can_see_item(new.source_id) and private.can_see_item(new.target_id)) then
    raise exception 'new row violates row-level security policy for table "item_links"'
      using errcode = '42501';
  end if;
  select i.galaxy_id into _source_galaxy from public.items i where i.id = new.source_id;
  select i.galaxy_id into _target_galaxy from public.items i where i.id = new.target_id;
  if _source_galaxy is null or _target_galaxy is null or _source_galaxy <> _target_galaxy then
    raise exception 'items can only be linked inside the same galaxy' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger item_links_before_insert
  before insert on public.item_links
  for each row execute function private.item_links_before_insert();

-- ── Annotations: galaxy_id from the sphere, updated_at ─────────────────────
create function private.annotations_before_write()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    select s.galaxy_id into new.galaxy_id from public.spheres s where s.id = new.sphere_id;
    if new.galaxy_id is null then
      raise exception 'sphere not found' using errcode = '23503';
    end if;
  else
    if new.sphere_id <> old.sphere_id or new.galaxy_id <> old.galaxy_id then
      raise exception 'an annotation cannot move to another sphere' using errcode = '23514';
    end if;
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create trigger annotations_before_write
  before insert or update on public.annotations
  for each row execute function private.annotations_before_write();

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;
