-- Read models and RPC. Everything that reads content is SECURITY INVOKER, so
-- RLS decides what each user sees (search, counts, news: RF4.3).

-- ── items_feed: items + "is it new for me?" (RF8) ──────────────────────────
create view public.items_feed
with (security_invoker = true)
as
select
  i.*,
  (
    i.updated_by is distinct from auth.uid()
    and i.updated_at > coalesce(v.seen_at, m.joined_at)
  ) as is_new,
  (
    i.updated_by is distinct from auth.uid()
    and i.updated_at > coalesce(v.seen_at, m.joined_at)
    and i.updated_at > coalesce(m.last_seen_at, m.joined_at)
  ) as since_last_visit
from public.items i
join public.galaxy_members m
  on m.galaxy_id = i.galaxy_id and m.user_id = auth.uid()
left join public.item_views v
  on v.item_id = i.id and v.user_id = auth.uid();

-- ── sphere_stats: visible item count and news count per sphere ─────────────
create view public.sphere_stats
with (security_invoker = true)
as
select
  s.id as sphere_id,
  s.galaxy_id,
  count(f.id)::integer as item_count,
  (count(f.id) filter (where f.is_new))::integer as new_count
from public.spheres s
left join public.items_feed f on f.sphere_id = s.id
group by s.id, s.galaxy_id;

revoke all on public.items_feed, public.sphere_stats from anon, authenticated;
grant select on public.items_feed, public.sphere_stats to authenticated;

-- ── search (RF9.1) ─────────────────────────────────────────────────────────
create function public.search_items(_q text, _galaxy_id uuid default null, _limit integer default 60)
returns setof public.items_feed
language sql stable security invoker set search_path = ''
as $$
  with q as (
    select '%' || replace(replace(replace(trim(_q), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern
  )
  select f.*
  from public.items_feed f, q
  where char_length(trim(_q)) > 0
    and (_galaxy_id is null or f.galaxy_id = _galaxy_id)
    and (
      f.title ilike q.pattern
      or f.body_md ilike q.pattern
      or f.url ilike q.pattern
      or f.caption ilike q.pattern
    )
  order by f.updated_at desc
  limit least(greatest(_limit, 1), 200);
$$;

-- ── news bookkeeping (RF8) ─────────────────────────────────────────────────
create function public.mark_seen(_item_ids uuid[])
returns void
language sql security invoker set search_path = ''
as $$
  insert into public.item_views (item_id, seen_at)
  select i.id, now()
  from public.items i
  where i.id = any (_item_ids)
  on conflict (user_id, item_id) do update set seen_at = excluded.seen_at;
$$;

-- marks everything visible in a sphere (and its sub-spheres) as seen
create function public.mark_sphere_seen(_sphere_id uuid)
returns void
language sql security invoker set search_path = ''
as $$
  insert into public.item_views (item_id, seen_at)
  select f.id, now()
  from public.items_feed f
  where f.is_new
    and f.sphere_id in (
      select _sphere_id
      union all
      select s.id from public.spheres s where s.parent_id = _sphere_id
    )
  on conflict (user_id, item_id) do update set seen_at = excluded.seen_at;
$$;

-- closes the "since your last visit" banner
create function public.touch_last_seen()
returns void
language sql security invoker set search_path = ''
as $$
  update public.galaxy_members
  set last_seen_at = now()
  where user_id = (select auth.uid());
$$;

-- ── invites (RF1.1) ────────────────────────────────────────────────────────
-- Shown on /invite/<token> before login. The token is the secret.
create function public.invite_preview(_token text)
returns table (status text, galaxy_name text, inviter_name text)
language plpgsql stable security definer set search_path = ''
as $$
declare
  _inv record;
begin
  select i.used_at, i.expires_at, g.name as galaxy_name, p.display_name as inviter_name
  into _inv
  from public.invites i
  join public.galaxies g on g.id = i.galaxy_id
  left join public.profiles p on p.id = i.created_by
  where i.token = _token;

  if not found then
    return query select 'not_found'::text, null::text, null::text;
  elsif _inv.used_at is not null then
    return query select 'used'::text, null::text, null::text;
  elsif _inv.expires_at <= now() then
    return query select 'expired'::text, null::text, null::text;
  else
    return query select 'valid'::text, _inv.galaxy_name::text, _inv.inviter_name::text;
  end if;
end;
$$;

-- Consumes an invite for a given user. Service role only (new accounts).
create function public.redeem_invite(_token text, _user_id uuid)
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

  -- already in: do not burn the invite
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
  values (_inv.galaxy_id, _user_id, 'member');

  update public.invites
  set used_at = now(), used_by = _user_id
  where id = _inv.id;

  return _inv.galaxy_id;
end;
$$;

-- Existing user accepting an invite after login.
create function public.accept_invite(_token text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  return public.redeem_invite(_token, auth.uid());
end;
$$;

-- ── delete a sphere (RF2.5) ────────────────────────────────────────────────
-- _move_to null  → the items I can see are deleted with the sphere
-- _move_to given → they move there first
-- Content I cannot see (other members' private items / sub-spheres) is never
-- destroyed: items go to the inbox, private sub-spheres go to the top level.
create function public.delete_sphere(_sphere_id uuid, _move_to uuid default null)
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

-- ── execute privileges ─────────────────────────────────────────────────────
revoke all on function
  public.search_items(text, uuid, integer),
  public.mark_seen(uuid[]),
  public.mark_sphere_seen(uuid),
  public.touch_last_seen(),
  public.invite_preview(text),
  public.redeem_invite(text, uuid),
  public.accept_invite(text),
  public.delete_sphere(uuid, uuid)
from public, anon, authenticated;

grant execute on function
  public.search_items(text, uuid, integer),
  public.mark_seen(uuid[]),
  public.mark_sphere_seen(uuid),
  public.touch_last_seen(),
  public.accept_invite(text),
  public.delete_sphere(uuid, uuid)
to authenticated;

grant execute on function public.invite_preview(text) to anon, authenticated, service_role;
grant execute on function public.redeem_invite(text, uuid) to service_role;
