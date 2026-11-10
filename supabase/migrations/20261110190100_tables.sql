-- Core tables. See docs/architettura.md for the data model.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    constraint profiles_username_format check (username ~ '^[a-z0-9_.-]{3,24}$'),
  display_name text not null
    constraint profiles_display_name_length check (char_length(display_name) between 1 and 40),
  -- key of the personal colour palette in src/lib/tokens.ts
  color text not null default 'teal'
    constraint profiles_color_palette check (
      color in ('pink', 'teal', 'indigo', 'orange', 'green', 'violet', 'blue', 'red')
    ),
  avatar_path text,
  created_at timestamptz not null default now()
);

create table public.galaxies (
  id uuid primary key default gen_random_uuid(),
  name text not null
    constraint galaxies_name_length check (char_length(trim(name)) between 1 and 60),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  is_personal boolean not null default false,
  created_at timestamptz not null default now()
);

-- one personal galaxy ("Just me") per user
create unique index galaxies_one_personal_per_owner on public.galaxies (owner_id) where is_personal;

create table public.galaxy_members (
  galaxy_id uuid not null references public.galaxies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member'
    constraint galaxy_members_role check (role in ('owner', 'member')),
  last_seen_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (galaxy_id, user_id)
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  galaxy_id uuid not null references public.galaxies (id) on delete cascade,
  -- 244 random bits, unguessable
  token text not null unique
    default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  used_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.spheres (
  id uuid primary key default gen_random_uuid(),
  galaxy_id uuid not null references public.galaxies (id) on delete cascade,
  parent_id uuid references public.spheres (id) on delete cascade,
  name text not null
    constraint spheres_name_length check (char_length(trim(name)) between 1 and 40),
  -- key of the sphere palette in src/lib/tokens.ts
  color text not null default 'amber'
    constraint spheres_color_palette check (
      color in ('coral', 'amber', 'sage', 'teal', 'sky', 'lavender', 'rose', 'terracotta', 'moss', 'plum')
    ),
  emoji text not null default '✨'
    constraint spheres_emoji_length check (char_length(emoji) between 1 and 16),
  is_private boolean not null default false,
  is_inbox boolean not null default false,
  x double precision not null default 0,
  y double precision not null default 0,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint spheres_inbox_is_shared check (not (is_inbox and is_private)),
  constraint spheres_inbox_is_top_level check (not (is_inbox and parent_id is not null)),
  constraint spheres_not_own_parent check (parent_id is distinct from id)
);

-- exactly one inbox ("Random") per galaxy
create unique index spheres_one_inbox_per_galaxy on public.spheres (galaxy_id) where is_inbox;

create table public.items (
  id uuid primary key default gen_random_uuid(),
  sphere_id uuid not null references public.spheres (id) on delete cascade,
  -- denormalised from the sphere by trigger (fast RLS, same-galaxy checks)
  galaxy_id uuid not null references public.galaxies (id) on delete cascade,
  type text not null
    constraint items_type check (type in ('note', 'link', 'image')),
  title text,
  body_md text,
  url text,
  preview jsonb,
  image_path text,
  caption text,
  is_private boolean not null default false,
  x double precision not null default 0,
  y double precision not null default 0,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint items_note_has_content check (
    type <> 'note' or coalesce(trim(title), '') <> '' or coalesce(trim(body_md), '') <> ''
  ),
  constraint items_link_has_url check (type <> 'link' or (url is not null and url ~* '^https?://')),
  constraint items_url_is_http check (url is null or url ~* '^https?://'),
  constraint items_image_has_path check (type <> 'image' or image_path is not null),
  constraint items_title_length check (title is null or char_length(title) <= 200),
  constraint items_body_length check (body_md is null or char_length(body_md) <= 50000),
  constraint items_url_length check (url is null or char_length(url) <= 2000)
);

create table public.item_links (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.items (id) on delete cascade,
  target_id uuid not null references public.items (id) on delete cascade,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint item_links_unique unique (source_id, target_id),
  constraint item_links_no_self check (source_id <> target_id)
);

-- a pair of items is linked at most once, whatever the direction
create unique index item_links_unique_pair
  on public.item_links (least(source_id, target_id), greatest(source_id, target_id));

create table public.annotations (
  id uuid primary key default gen_random_uuid(),
  sphere_id uuid not null references public.spheres (id) on delete cascade,
  galaxy_id uuid not null references public.galaxies (id) on delete cascade,
  kind text not null
    constraint annotations_kind check (kind in ('stroke', 'arrow', 'sticker')),
  data jsonb not null default '{}'::jsonb,
  x double precision not null default 0,
  y double precision not null default 0,
  rotation double precision not null default 0,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint annotations_data_size check (pg_column_size(data) <= 262144)
);

create table public.item_views (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
