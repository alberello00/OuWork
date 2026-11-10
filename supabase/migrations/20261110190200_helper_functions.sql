-- RLS helper functions. SECURITY DEFINER so policies can look across tables
-- without recursing into their own RLS; search_path pinned, names qualified.

create function private.is_member(_galaxy_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.galaxy_members m
    where m.galaxy_id = _galaxy_id and m.user_id = (select auth.uid())
  );
$$;

create function private.is_owner(_galaxy_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.galaxy_members m
    where m.galaxy_id = _galaxy_id and m.user_id = (select auth.uid()) and m.role = 'owner'
  );
$$;

-- true when the current user and _user_id are members of at least one common galaxy
create function private.shares_galaxy_with(_user_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.galaxy_members mine
    join public.galaxy_members theirs on theirs.galaxy_id = mine.galaxy_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = _user_id
  );
$$;

-- member of the galaxy AND the sphere (and its parent) is shared or mine
create function private.can_see_sphere(_sphere_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.spheres s
    left join public.spheres p on p.id = s.parent_id
    where s.id = _sphere_id
      and private.is_member(s.galaxy_id)
      and (not s.is_private or s.created_by = (select auth.uid()))
      and (p.id is null or not p.is_private or p.created_by = (select auth.uid()))
  );
$$;

-- the sphere is visible AND the item is shared or mine
create function private.can_see_item(_item_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.items i
    where i.id = _item_id
      and (not i.is_private or i.created_by = (select auth.uid()))
      and private.can_see_sphere(i.sphere_id)
  );
$$;

-- Storage paths are `<galaxy_id>/<item_or_annotation_id>/<file>`.
create function private.object_galaxy_id(_name text)
returns uuid
language plpgsql immutable set search_path = ''
as $$
declare
  _parts text[] := string_to_array(_name, '/');
  _uuid_re constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if coalesce(array_length(_parts, 1), 0) <> 3
     or _parts[1] !~ _uuid_re or _parts[2] !~ _uuid_re or _parts[3] = '' then
    return null;
  end if;
  return _parts[1]::uuid;
end;
$$;

create function private.can_access_object(_name text)
returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  _galaxy_id uuid := private.object_galaxy_id(_name);
  _owner_id uuid;
begin
  if _galaxy_id is null then
    return false;
  end if;
  _owner_id := (string_to_array(_name, '/'))[2]::uuid;
  return exists (
      select 1 from public.items i
      where i.id = _owner_id and i.galaxy_id = _galaxy_id and private.can_see_item(i.id)
    )
    or exists (
      select 1 from public.annotations a
      where a.id = _owner_id and a.galaxy_id = _galaxy_id and private.can_see_sphere(a.sphere_id)
    );
end;
$$;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;
