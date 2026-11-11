-- MVP2, RF15: first-login tutorial. Additive only.

-- ── tutorial state on profiles (RF15.1) ────────────────────────────────────
-- Not writable by clients: UPDATE on profiles is granted per column
-- (display_name, color), so this changes only through complete_tutorial().
alter table public.profiles add column tutorial_completed_at timestamptz;

-- backfill: everyone who already has an account knows the app
update public.profiles set tutorial_completed_at = now() where tutorial_completed_at is null;

-- Called when the tutorial is finished OR skipped. Idempotent: the first date
-- is kept, so "Replay tutorial" can call it again without side effects.
create function public.complete_tutorial()
returns timestamptz
language plpgsql security definer set search_path = ''
as $$
declare
  _uid uuid := auth.uid();
  _at timestamptz;
begin
  if _uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  update public.profiles
  set tutorial_completed_at = coalesce(tutorial_completed_at, now())
  where id = _uid
  returning tutorial_completed_at into _at;

  return _at;
end;
$$;

revoke all on function public.complete_tutorial() from public, anon, authenticated;
grant execute on function public.complete_tutorial() to authenticated;
