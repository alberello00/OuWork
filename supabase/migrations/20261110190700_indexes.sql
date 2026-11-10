create index galaxy_members_user_idx on public.galaxy_members (user_id);
create index invites_galaxy_idx on public.invites (galaxy_id);
create index spheres_galaxy_idx on public.spheres (galaxy_id);
create index spheres_parent_idx on public.spheres (parent_id) where parent_id is not null;
create index items_sphere_idx on public.items (sphere_id);
create index items_galaxy_updated_idx on public.items (galaxy_id, updated_at desc);
create index item_links_target_idx on public.item_links (target_id);
create index annotations_sphere_idx on public.annotations (sphere_id);
create index item_views_item_idx on public.item_views (item_id);

-- search (RF9): trigram indexes for ILIKE '%…%'
create index items_title_trgm_idx on public.items using gin (title extensions.gin_trgm_ops);
create index items_body_trgm_idx on public.items using gin (body_md extensions.gin_trgm_ops);
create index items_url_trgm_idx on public.items using gin (url extensions.gin_trgm_ops);
