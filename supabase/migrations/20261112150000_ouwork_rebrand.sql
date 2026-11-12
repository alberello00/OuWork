-- OuWork W0 (RW1.4 + nomenclature): the personal workspace is called
-- "Personal" and the default board of every workspace is the "Inbox".
-- Table and column names stay as they are (galaxies, spheres, is_inbox):
-- only the default names created by the triggers change. OuWork starts from
-- an empty database, so there is nothing to backfill.

-- ── new profile → personal workspace "Personal" ────────────────────────────
create or replace function private.handle_new_profile()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.galaxies (name, owner_id, is_personal)
  values ('Personal', new.id, true);
  return new;
end;
$$;

-- ── new workspace → owner membership + Inbox only ──────────────────────────
create or replace function private.handle_new_galaxy()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.galaxy_members (galaxy_id, user_id, role)
  values (new.id, new.owner_id, 'owner');

  insert into public.spheres (galaxy_id, name, color, emoji, is_inbox, x, y, created_by)
  values (new.id, 'Inbox', 'sage', '📥', true, 0, 0, new.owner_id);
  return new;
end;
$$;
