-- Private bucket for uploaded images. Path: <galaxy_id>/<item_or_annotation_id>/<file>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'items', 'items', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do nothing;

-- Read: the item/annotation the object belongs to is visible to me, or I
-- uploaded it (needed between upload and the creation of its item) and I am
-- still a member of that galaxy.
create policy items_objects_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'items'
    and (
      private.can_access_object(name)
      or (owner_id = (select auth.uid())::text and private.is_member(private.object_galaxy_id(name)))
    )
  );

-- Upload: members only, inside their galaxy's folder.
create policy items_objects_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'items'
    and private.is_member(private.object_galaxy_id(name))
  );

create policy items_objects_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'items'
    and (
      private.can_access_object(name)
      or (owner_id = (select auth.uid())::text and private.is_member(private.object_galaxy_id(name)))
    )
  );
