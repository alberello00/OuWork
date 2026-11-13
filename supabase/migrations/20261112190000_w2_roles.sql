-- OuWork W2 (RW3): membership roles owner | editor | viewer.
--   owner  : manages members, roles and workspace settings; can delete the workspace
--   editor : creates, edits and links boards, items and annotations
--   viewer : reads, searches, sees activity; writes nothing (except their own
--            "seen" bookkeeping: item_views and galaxy_members.last_seen_at)
-- The client hides what a role cannot do; these policies are the guarantee.

-- ── roles on memberships ───────────────────────────────────────────────────
alter table public.galaxy_members drop constraint galaxy_members_role;
update public.galaxy_members set role = 'editor' where role = 'member';
alter table public.galaxy_members alter column role set default 'editor';
alter table public.galaxy_members add constraint galaxy_members_role
  check (role in ('owner', 'editor', 'viewer'));

-- ── the invite carries the role chosen by whoever creates it (RW3.2) ───────
alter table public.invites
  add column role text not null default 'editor'
    constraint invites_role check (role in ('editor', 'viewer'));
grant insert (role) on public.invites to authenticated;

-- ── helpers ────────────────────────────────────────────────────────────────
-- owner or editor of the workspace
create function private.can_edit(_galaxy_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.galaxy_members m
    where m.galaxy_id = _galaxy_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner', 'editor')
  );
$$;

-- the board is visible to me AND I may write in its workspace
create function private.can_edit_sphere(_sphere_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.spheres s
    where s.id = _sphere_id
      and private.can_see_sphere(s.id)
      and private.can_edit(s.galaxy_id)
  );
$$;

-- the item is visible to me AND I may write in its workspace
create function private.can_edit_item(_item_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.items i
    where i.id = _item_id
      and private.can_see_item(i.id)
      and private.can_edit(i.galaxy_id)
  );
$$;

revoke all on function private.can_edit(uuid), private.can_edit_sphere(uuid), private.can_edit_item(uuid)
  from public, anon;
grant execute on function private.can_edit(uuid), private.can_edit_sphere(uuid), private.can_edit_item(uuid)
  to authenticated, service_role;

-- ── spheres: only owners and editors write ─────────────────────────────────
drop policy spheres_insert on public.spheres;
create policy spheres_insert on public.spheres
  for insert to authenticated
  with check (
    private.can_edit(galaxy_id)
    and created_by = (select auth.uid())
    and not is_inbox
    and (parent_id is null or private.can_see_sphere(parent_id))
  );

drop policy spheres_update on public.spheres;
create policy spheres_update on public.spheres
  for update to authenticated
  using (
    private.can_edit(galaxy_id)
    and (not is_private or created_by = (select auth.uid()))
    and (parent_id is null or private.can_see_sphere(parent_id))
  )
  with check (
    private.can_edit(galaxy_id)
    and (not is_private or created_by = (select auth.uid()))
    and (parent_id is null or private.can_see_sphere(parent_id))
  );

-- ── items ──────────────────────────────────────────────────────────────────
drop policy items_insert on public.items;
create policy items_insert on public.items
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and private.can_edit_sphere(sphere_id)
  );

drop policy items_update on public.items;
create policy items_update on public.items
  for update to authenticated
  using (
    (not is_private or created_by = (select auth.uid()))
    and private.can_edit_sphere(sphere_id)
  )
  with check (
    (not is_private or created_by = (select auth.uid()))
    and private.can_edit_sphere(sphere_id)
  );

drop policy items_delete on public.items;
create policy items_delete on public.items
  for delete to authenticated
  using (
    (not is_private or created_by = (select auth.uid()))
    and private.can_edit_sphere(sphere_id)
  );

-- ── item_links ─────────────────────────────────────────────────────────────
drop policy item_links_insert on public.item_links;
create policy item_links_insert on public.item_links
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and private.can_edit_item(source_id)
    and private.can_see_item(target_id)
  );

drop policy item_links_delete on public.item_links;
create policy item_links_delete on public.item_links
  for delete to authenticated
  using (private.can_edit_item(source_id) and private.can_see_item(target_id));

-- ── annotations ────────────────────────────────────────────────────────────
drop policy annotations_insert on public.annotations;
create policy annotations_insert on public.annotations
  for insert to authenticated
  with check (created_by = (select auth.uid()) and private.can_edit_sphere(sphere_id));

drop policy annotations_update on public.annotations;
create policy annotations_update on public.annotations
  for update to authenticated
  using (private.can_edit_sphere(sphere_id))
  with check (private.can_edit_sphere(sphere_id));

drop policy annotations_delete on public.annotations;
create policy annotations_delete on public.annotations
  for delete to authenticated
  using (private.can_edit_sphere(sphere_id));

-- ── storage: uploads and deletions need write access ───────────────────────
drop policy items_objects_insert on storage.objects;
create policy items_objects_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'items'
    and private.can_edit(private.object_galaxy_id(name))
  );

drop policy items_objects_delete on storage.objects;
create policy items_objects_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'items'
    and private.can_edit(private.object_galaxy_id(name))
    and (
      private.can_access_object(name)
      or owner_id = (select auth.uid())::text
    )
  );

-- ── invite redemption: join with the invite's role ─────────────────────────
create or replace function public.redeem_invite(_token text, _user_id uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  _inv public.invites;
begin
  if _user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select * into _inv from public.invites i where i.token = _token for update;

  if not found then
    raise exception 'invite_not_found' using errcode = 'P0002';
  end if;

  -- already in: do not burn the invite, do not change the role
  if exists (
    select 1 from public.galaxy_members m
    where m.galaxy_id = _inv.galaxy_id and m.user_id = _user_id
  ) then
    return _inv.galaxy_id;
  end if;

  if _inv.used_at is not null then
    raise exception 'invite_used' using errcode = 'P0001';
  end if;
  if _inv.expires_at <= now() then
    raise exception 'invite_expired' using errcode = 'P0001';
  end if;

  insert into public.galaxy_members (galaxy_id, user_id, role)
  values (_inv.galaxy_id, _user_id, _inv.role);

  update public.invites
  set used_at = now(), used_by = _user_id
  where id = _inv.id;

  return _inv.galaxy_id;
end;
$$;

-- the invite page tells the invitee which role they will get
drop function public.invite_preview(text);
create function public.invite_preview(_token text)
returns table (status text, galaxy_name text, inviter_name text, role text)
language plpgsql stable security definer set search_path = ''
as $$
declare
  _inv record;
begin
  select i.used_at, i.expires_at, i.role, g.name as galaxy_name, p.display_name as inviter_name
  into _inv
  from public.invites i
  join public.galaxies g on g.id = i.galaxy_id
  left join public.profiles p on p.id = i.created_by
  where i.token = _token;

  if not found then
    return query select 'not_found'::text, null::text, null::text, null::text;
  elsif _inv.used_at is not null then
    return query select 'used'::text, null::text, null::text, null::text;
  elsif _inv.expires_at <= now() then
    return query select 'expired'::text, null::text, null::text, null::text;
  else
    return query select 'valid'::text, _inv.galaxy_name::text, _inv.inviter_name::text, _inv.role::text;
  end if;
end;
$$;
revoke all on function public.invite_preview(text) from public;
grant execute on function public.invite_preview(text) to anon, authenticated, service_role;

-- ── the owner changes a member's role (RW3.1) ──────────────────────────────
-- Same error for "no such workspace", "not the owner" and "not a member", so
-- the call reveals nothing to outsiders. The owner's own role never changes.
create function public.set_member_role(_galaxy_id uuid, _user_id uuid, _role text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if not private.is_owner(_galaxy_id) then
    raise exception 'only the owner can change roles' using errcode = '42501';
  end if;
  if _role is null or _role not in ('editor', 'viewer') then
    raise exception 'invalid role' using errcode = '22023';
  end if;

  update public.galaxy_members m
  set role = _role
  where m.galaxy_id = _galaxy_id and m.user_id = _user_id and m.role <> 'owner';

  if not found then
    raise exception 'member not found' using errcode = 'P0002';
  end if;
end;
$$;
revoke all on function public.set_member_role(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.set_member_role(uuid, uuid, text) to authenticated;

-- ── deleting a board needs write access too ────────────────────────────────
create or replace function public.delete_sphere(_sphere_id uuid, _move_to uuid default null)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  _uid uuid := auth.uid();
  _s public.spheres;
  _inbox uuid;
  _target_private boolean := false;
begin
  if _uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select * into _s from public.spheres s where s.id = _sphere_id;
  if not found or not private.can_see_sphere(_sphere_id) then
    raise exception 'sphere not found' using errcode = 'P0002';
  end if;
  if not private.can_edit(_s.galaxy_id) then
    raise exception 'viewers cannot delete boards' using errcode = '42501';
  end if;
  if _s.is_inbox then
    raise exception 'the inbox sphere cannot be deleted' using errcode = '23514';
  end if;

  select s.id into _inbox
  from public.spheres s where s.galaxy_id = _s.galaxy_id and s.is_inbox;

  if _move_to is not null then
    select (t.is_private or coalesce(p.is_private, false)) into _target_private
    from public.spheres t
    left join public.spheres p on p.id = t.parent_id
    where t.id = _move_to
      and t.id <> _sphere_id
      and t.galaxy_id = _s.galaxy_id
      and t.parent_id is distinct from _sphere_id;

    if not found or not private.can_see_sphere(_move_to) then
      raise exception 'invalid target sphere' using errcode = '23514';
    end if;
  end if;

  -- sub-spheres that are private to someone else survive at the top level
  update public.spheres c
  set parent_id = null
  where c.parent_id = _sphere_id and not private.can_see_sphere(c.id);

  -- items I cannot see are rescued into the inbox
  update public.items i
  set sphere_id = _inbox
  where i.is_private and i.created_by is distinct from _uid
    and i.sphere_id in (
      select _sphere_id union all select c.id from public.spheres c where c.parent_id = _sphere_id
    );

  if _move_to is not null then
    -- only my own items may enter my private sphere
    if _target_private then
      update public.items i
      set sphere_id = _inbox
      where i.created_by is distinct from _uid
        and i.sphere_id in (
          select _sphere_id union all select c.id from public.spheres c where c.parent_id = _sphere_id
        );
    end if;

    update public.items i
    set sphere_id = _move_to
    where i.sphere_id in (
      select _sphere_id union all select c.id from public.spheres c where c.parent_id = _sphere_id
    );
  end if;

  -- cascades to remaining sub-spheres, items and annotations
  delete from public.spheres s where s.id = _sphere_id;
end;
$$;
