-- OuWork W2 (RW4): Supabase Realtime instead of 15 s polling.
--
-- Postgres changes: the tables below are published; Realtime only delivers a
-- change to a subscriber whose SELECT policies let them see the row, so
-- private items never reach other members.
-- Presence: each workspace has a PRIVATE channel "ws:<galaxy_id>"; only its
-- members may join it (policies on realtime.messages below).

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end;
$$;

alter publication supabase_realtime add table
  public.items,
  public.spheres,
  public.annotations,
  public.item_links,
  public.galaxy_members;

-- ── private workspace channels ─────────────────────────────────────────────
-- "ws:<uuid>" → uuid, anything else → null
create function private.channel_galaxy_id(_topic text)
returns uuid
language plpgsql immutable set search_path = ''
as $$
begin
  if _topic ~ '^ws:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return substr(_topic, 4)::uuid;
  end if;
  return null;
end;
$$;

create function private.can_join_channel(_topic text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(private.is_member(private.channel_galaxy_id(_topic)), false);
$$;

revoke all on function private.channel_galaxy_id(text), private.can_join_channel(text) from public, anon;
grant execute on function private.channel_galaxy_id(text), private.can_join_channel(text) to authenticated, service_role;

-- realtime.messages is created by the Realtime service; guard so the
-- migration also applies where that schema is not there yet.
do $$
begin
  if to_regclass('realtime.messages') is null then
    raise notice 'realtime.messages not found: channel policies skipped';
    return;
  end if;

  execute $p$
    create policy ouwork_members_receive on realtime.messages
      for select to authenticated
      using (
        realtime.messages.extension in ('presence', 'broadcast')
        and private.can_join_channel((select realtime.topic()))
      )
  $p$;

  execute $p$
    create policy ouwork_members_send on realtime.messages
      for insert to authenticated
      with check (
        realtime.messages.extension in ('presence', 'broadcast')
        and private.can_join_channel((select realtime.topic()))
      )
  $p$;
end;
$$;
