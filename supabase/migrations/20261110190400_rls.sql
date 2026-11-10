-- Row Level Security. Privacy is enforced here, never in the frontend.
-- Table privileges are granted column by column so that ownership and
-- bookkeeping columns (created_by, galaxy_id, updated_*) can never be forged.

alter table public.profiles       enable row level security;
alter table public.galaxies       enable row level security;
alter table public.galaxy_members enable row level security;
alter table public.invites        enable row level security;
alter table public.spheres        enable row level security;
alter table public.items          enable row level security;
alter table public.item_links     enable row level security;
alter table public.annotations    enable row level security;
alter table public.item_views     enable row level security;

revoke all on all tables in schema public from anon, authenticated;
-- future tables start locked: grant explicitly, with policies and a pgTAP test
alter default privileges in schema public revoke all on tables from anon, authenticated;

-- ── profiles ───────────────────────────────────────────────────────────────
grant select on public.profiles to authenticated;
grant update (display_name, color) on public.profiles to authenticated;

create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.shares_galaxy_with(id));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ── galaxies ───────────────────────────────────────────────────────────────
grant select, delete on public.galaxies to authenticated;
grant insert (name) on public.galaxies to authenticated;
grant update (name) on public.galaxies to authenticated;

-- `owner_id = auth.uid()` lets INSERT ... RETURNING work before the
-- membership row (added by an AFTER trigger) is visible.
create policy galaxies_select on public.galaxies
  for select to authenticated
  using (private.is_member(id) or owner_id = (select auth.uid()));

create policy galaxies_insert on public.galaxies
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and not is_personal);

create policy galaxies_update_owner on public.galaxies
  for update to authenticated
  using (owner_id = (select auth.uid()) and not is_personal)
  with check (owner_id = (select auth.uid()) and not is_personal);

create policy galaxies_delete_owner on public.galaxies
  for delete to authenticated
  using (owner_id = (select auth.uid()) and not is_personal);

-- ── galaxy_members ─────────────────────────────────────────────────────────
-- No INSERT policy: memberships are created by triggers and by invite redemption.
grant select, delete on public.galaxy_members to authenticated;
grant update (last_seen_at) on public.galaxy_members to authenticated;

create policy galaxy_members_select on public.galaxy_members
  for select to authenticated
  using (private.is_member(galaxy_id));

create policy galaxy_members_update_own on public.galaxy_members
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- the owner removes others; a member can leave; the owner never leaves
create policy galaxy_members_delete on public.galaxy_members
  for delete to authenticated
  using (
    (private.is_owner(galaxy_id) and user_id <> (select auth.uid()))
    or (user_id = (select auth.uid()) and role <> 'owner')
  );

-- ── invites ────────────────────────────────────────────────────────────────
-- RF1.3: only the galaxy owner manages members. Invitees never read this
-- table: they go through invite_preview / accept_invite / redeem_invite.
grant select, delete on public.invites to authenticated;
grant insert (galaxy_id) on public.invites to authenticated;

create policy invites_select_owner on public.invites
  for select to authenticated
  using (private.is_owner(galaxy_id));

create policy invites_insert_owner on public.invites
  for insert to authenticated
  with check (private.is_owner(galaxy_id) and created_by = (select auth.uid()));

create policy invites_delete_owner on public.invites
  for delete to authenticated
  using (private.is_owner(galaxy_id));

-- ── spheres ────────────────────────────────────────────────────────────────
-- No DELETE privilege: deletion goes through public.delete_sphere(), which
-- protects other members' private content from being cascaded away.
grant select on public.spheres to authenticated;
grant insert (id, galaxy_id, parent_id, name, color, emoji, is_private, x, y)
  on public.spheres to authenticated;
grant update (parent_id, name, color, emoji, is_private, x, y)
  on public.spheres to authenticated;

-- Written on the row's own columns (not can_see_sphere(id)) so the check also
-- works for the row being inserted/updated.
create policy spheres_select on public.spheres
  for select to authenticated
  using (
    private.is_member(galaxy_id)
    and (not is_private or created_by = (select auth.uid()))
    and (parent_id is null or private.can_see_sphere(parent_id))
  );

create policy spheres_insert on public.spheres
  for insert to authenticated
  with check (
    private.is_member(galaxy_id)
    and created_by = (select auth.uid())
    and not is_inbox
    and (parent_id is null or private.can_see_sphere(parent_id))
  );

-- WITH CHECK = still visible to me afterwards. Consequences:
--   * a non-author cannot make someone else's sphere private;
--   * a sphere cannot be moved under a parent I cannot see.
create policy spheres_update on public.spheres
  for update to authenticated
  using (
    private.is_member(galaxy_id)
    and (not is_private or created_by = (select auth.uid()))
    and (parent_id is null or private.can_see_sphere(parent_id))
  )
  with check (
    private.is_member(galaxy_id)
    and (not is_private or created_by = (select auth.uid()))
    and (parent_id is null or private.can_see_sphere(parent_id))
  );

-- ── items ──────────────────────────────────────────────────────────────────
grant select, delete on public.items to authenticated;
grant insert (id, sphere_id, type, title, body_md, url, preview, image_path, caption, is_private, x, y)
  on public.items to authenticated;
grant update (sphere_id, title, body_md, url, preview, image_path, caption, is_private, x, y)
  on public.items to authenticated;

create policy items_select on public.items
  for select to authenticated
  using (
    (not is_private or created_by = (select auth.uid()))
    and private.can_see_sphere(sphere_id)
  );

create policy items_insert on public.items
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and private.can_see_sphere(sphere_id)
  );

-- WITH CHECK = still visible to me afterwards: a non-author cannot make an
-- item private, nor move it into a sphere they cannot see.
create policy items_update on public.items
  for update to authenticated
  using (
    (not is_private or created_by = (select auth.uid()))
    and private.can_see_sphere(sphere_id)
  )
  with check (
    (not is_private or created_by = (select auth.uid()))
    and private.can_see_sphere(sphere_id)
  );

create policy items_delete on public.items
  for delete to authenticated
  using (
    (not is_private or created_by = (select auth.uid()))
    and private.can_see_sphere(sphere_id)
  );

-- ── item_links ─────────────────────────────────────────────────────────────
grant select, delete on public.item_links to authenticated;
grant insert (id, source_id, target_id) on public.item_links to authenticated;

create policy item_links_select on public.item_links
  for select to authenticated
  using (private.can_see_item(source_id) and private.can_see_item(target_id));

create policy item_links_insert on public.item_links
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and private.can_see_item(source_id)
    and private.can_see_item(target_id)
  );

create policy item_links_delete on public.item_links
  for delete to authenticated
  using (private.can_see_item(source_id) and private.can_see_item(target_id));

-- ── annotations ────────────────────────────────────────────────────────────
grant select, delete on public.annotations to authenticated;
grant insert (id, sphere_id, kind, data, x, y, rotation) on public.annotations to authenticated;
grant update (data, x, y, rotation) on public.annotations to authenticated;

create policy annotations_select on public.annotations
  for select to authenticated
  using (private.can_see_sphere(sphere_id));

create policy annotations_insert on public.annotations
  for insert to authenticated
  with check (created_by = (select auth.uid()) and private.can_see_sphere(sphere_id));

create policy annotations_update on public.annotations
  for update to authenticated
  using (private.can_see_sphere(sphere_id))
  with check (private.can_see_sphere(sphere_id));

create policy annotations_delete on public.annotations
  for delete to authenticated
  using (private.can_see_sphere(sphere_id));

-- ── item_views ─────────────────────────────────────────────────────────────
grant select, delete on public.item_views to authenticated;
grant insert (item_id, seen_at) on public.item_views to authenticated;
grant update (seen_at) on public.item_views to authenticated;

create policy item_views_select_own on public.item_views
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy item_views_insert_own on public.item_views
  for insert to authenticated
  with check (user_id = (select auth.uid()) and private.can_see_item(item_id));

create policy item_views_update_own on public.item_views
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and private.can_see_item(item_id));

create policy item_views_delete_own on public.item_views
  for delete to authenticated
  using (user_id = (select auth.uid()));
