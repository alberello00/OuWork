-- Demo data for LOCAL development only (applied by `supabase db reset`).
-- It mirrors the Figma prototype: galaxy "Lola & Alberto".
--
--   username   password        notes
--   alberto    ourworld-dev    owner of "Lola & Alberto" and of "Friends"
--   lola       ourworld-dev    member of "Lola & Alberto"
--   giulia     ourworld-dev    member of "Friends" only → use her to check that
--                              nothing of "Lola & Alberto" leaks to a non member
--
-- Private content to check by hand:
--   * alberto: private note "Anniversary surprise" (Places → Italy)
--   * lola:    private sphere "Gift ideas" with the note "For Alberto's birthday"
--
-- Profiles, "Just me" galaxies, memberships and the Random sphere are created
-- by the database triggers, exactly as in production. Since MVP2 a new galaxy
-- starts with Random only (RF13): the five demo spheres of the Figma prototype
-- are inserted here, and every demo galaxy is marked as already set up so the
-- demo users never get the setup survey.

-- ── users ──────────────────────────────────────────────────────────────────
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
  u.username || '@users.ourworld.local',
  extensions.crypt('ourworld-dev', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('username', u.username, 'display_name', u.display_name, 'color', u.color),
  now() - interval '60 days', now() - interval '60 days',
  '', '', '', '', '', '', '', ''
from (values
  ('aaaaaaaa-0000-4000-8000-000000000001'::uuid, 'alberto', 'Alberto', 'teal'),
  ('bbbbbbbb-0000-4000-8000-000000000002'::uuid, 'lola',    'Lola',    'pink'),
  ('cccccccc-0000-4000-8000-000000000003'::uuid, 'giulia',  'Giulia',  'indigo')
) as u (id, username, display_name, color);

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(), u.id, u.id::text, 'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
  now(), now(), now()
from auth.users u
where u.email like '%@users.ourworld.local';

-- ── galaxies, spheres, items ───────────────────────────────────────────────
do $$
declare
  alberto constant uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  lola    constant uuid := 'bbbbbbbb-0000-4000-8000-000000000002';
  giulia  constant uuid := 'cccccccc-0000-4000-8000-000000000003';
  g_us      constant uuid := 'eeeeeeee-0000-4000-8000-000000000001';
  g_friends constant uuid := 'eeeeeeee-0000-4000-8000-000000000002';

  s_places uuid; s_music uuid; s_movies uuid; s_ideas uuid; s_memories uuid; s_random uuid;
  s_italy  constant uuid := 'dddddddd-0000-4000-8000-000000000001';
  s_abroad constant uuid := 'dddddddd-0000-4000-8000-000000000002';
  s_gifts  constant uuid := 'dddddddd-0000-4000-8000-000000000003';
  s_friends_places uuid;

  i_lisbon   constant uuid := 'ffffffff-0000-4000-8000-000000000001';
  i_braies   constant uuid := 'ffffffff-0000-4000-8000-000000000002';
  i_procida  constant uuid := 'ffffffff-0000-4000-8000-000000000003';
  i_bolzano  constant uuid := 'ffffffff-0000-4000-8000-000000000004';
  i_faenza   constant uuid := 'ffffffff-0000-4000-8000-000000000005';
  i_surprise constant uuid := 'ffffffff-0000-4000-8000-000000000006';
  i_fado     constant uuid := 'ffffffff-0000-4000-8000-000000000007';
  i_postino  constant uuid := 'ffffffff-0000-4000-8000-000000000008';
  i_tram     constant uuid := 'ffffffff-0000-4000-8000-000000000009';
begin
  insert into public.galaxies (id, name, owner_id, created_at) values
    (g_us, 'Lola & Alberto', alberto, now() - interval '45 days'),
    (g_friends, 'Friends', alberto, now() - interval '20 days');

  insert into public.galaxy_members (galaxy_id, user_id, role, joined_at) values
    (g_us, lola, 'member', now() - interval '44 days'),
    (g_friends, giulia, 'member', now() - interval '19 days');

  update public.galaxy_members
  set joined_at = now() - interval '45 days', last_seen_at = now() - interval '3 days'
  where user_id = alberto;
  update public.galaxy_members
  set last_seen_at = now() - interval '12 hours'
  where user_id = lola;

  -- the Figma layout: five spheres around the centre, Random among them
  insert into public.spheres (galaxy_id, name, color, emoji, x, y, created_by)
  select g.id, d.name, d.color, d.emoji, d.x, d.y, g.owner_id
  from public.galaxies g
  cross join (values
    ('Places',         'amber',    '📍',    0, -260, 1),
    ('Music',          'lavender', '🎵',  225, -130, 2),
    ('Movies & Shows', 'coral',    '🎬',  225,  130, 3),
    ('Ideas',          'sky',      '💡',    0,  260, 4),
    ('Memories',       'rose',     '📸', -225,  130, 5)
  ) as d (name, color, emoji, x, y, ord)
  order by g.created_at, d.ord;
  update public.spheres set x = -225, y = -130 where is_inbox;
  update public.galaxies set setup_completed_at = created_at;

  select id into s_places   from public.spheres where galaxy_id = g_us and name = 'Places';
  select id into s_music    from public.spheres where galaxy_id = g_us and name = 'Music';
  select id into s_movies   from public.spheres where galaxy_id = g_us and name = 'Movies & Shows';
  select id into s_ideas    from public.spheres where galaxy_id = g_us and name = 'Ideas';
  select id into s_memories from public.spheres where galaxy_id = g_us and name = 'Memories';
  select id into s_random   from public.spheres where galaxy_id = g_us and is_inbox;
  select id into s_friends_places from public.spheres where galaxy_id = g_friends and name = 'Places';

  -- sub-spheres of Places, and Lola's private sphere
  insert into public.spheres (id, galaxy_id, parent_id, name, color, emoji, is_private, x, y, created_by) values
    (s_italy,  g_us, s_places, 'Italy',      'sage',  '🇮🇹', false, -120, -380, alberto),
    (s_abroad, g_us, s_places, 'Abroad',     'sky',   '✈️', false,  120, -380, lola),
    (s_gifts,  g_us, null,     'Gift ideas', 'plum',  '🎁', true,   430,    0, lola);

  -- Places
  insert into public.items (id, sphere_id, type, title, body_md, url, preview, is_private, x, y, created_by, created_at, updated_at) values
    (i_lisbon, s_abroad, 'note', 'Lisbon',
      E'Three days in **Alfama**.\n\n- pastéis de nata at Manteigaria\n- sunset at Miradouro da Senhora do Monte\n- tram 28, early in the morning',
      null, null, false, 40, 60, lola, now() - interval '30 days', now() - interval '30 days'),
    (i_tram, s_abroad, 'link', 'Tram 28 — the classic route', null,
      'https://www.lisbon.net/tram-28',
      '{"title":"Tram 28 — the classic route","domain":"lisbon.net"}'::jsonb,
      false, 340, 40, lola, now() - interval '28 days', now() - interval '28 days'),
    (i_braies, s_italy, 'note', 'Lake Braies',
      E'Go at **sunrise**, before the buses.\n\nRent the wooden boat, walk the whole loop (about 1h30).',
      null, null, false, 60, 320, alberto, now() - interval '25 days', now() - interval '25 days'),
    (i_procida, s_italy, 'note', 'Procida',
      E'Marina Corricella, the pastel houses.\n\n> "Il Postino" was filmed here.\n\nLemon salad, lingua di bue for breakfast.',
      null, null, false, 360, 300, lola, now() - interval '2 days', now() - interval '2 days'),
    (i_bolzano, s_italy, 'note', 'Bolzano',
      E'Christmas markets in December 🎄\n\n1. Piazza Walther\n2. Ötzi museum\n3. Renon cable car',
      null, null, false, 660, 80, alberto, now() - interval '20 days', now() - interval '20 days'),
    (i_faenza, s_italy, 'note', 'Faenza',
      E'Ceramics! The MIC museum and a workshop where we can paint our own plates.',
      null, null, false, 660, 340, lola, now() - interval '1 day', now() - interval '1 day'),
    (i_surprise, s_italy, 'note', 'Anniversary surprise',
      E'Book the agriturismo near Faenza for our anniversary. **Do not tell Lola.**',
      null, null, true, 960, 200, alberto, now() - interval '5 days', now() - interval '5 days');

  -- Music
  insert into public.items (id, sphere_id, type, title, body_md, url, preview, x, y, created_by, created_at, updated_at) values
    (i_fado, s_music, 'link', 'Amália Rodrigues — Barco Negro', null,
      'https://www.youtube.com/watch?v=q9S9xQ8K3wY',
      '{"title":"Amália Rodrigues — Barco Negro","domain":"youtube.com"}'::jsonb,
      40, 40, lola, now() - interval '27 days', now() - interval '27 days'),
    (gen_random_uuid(), s_music, 'note', 'Road trip playlist',
      E'- Lucio Battisti — *Il mio canto libero*\n- Fleetwood Mac — *Everywhere*\n- Calcutta — *Paracetamolo*',
      null, null, 340, 80, alberto, now() - interval '15 days', now() - interval '15 days'),
    (gen_random_uuid(), s_music, 'link', 'Khruangbin — Tiny Desk Concert', null,
      'https://www.youtube.com/watch?v=vWLJeqLPfSU',
      '{"title":"Khruangbin — Tiny Desk Concert","domain":"youtube.com"}'::jsonb,
      640, 40, lola, now() - interval '6 hours', now() - interval '6 hours');

  -- Movies & Shows
  insert into public.items (id, sphere_id, type, title, body_md, x, y, created_by, created_at, updated_at) values
    (i_postino, s_movies, 'note', 'Il Postino', E'Watch it **before** going to Procida.', 40, 40, alberto, now() - interval '18 days', now() - interval '18 days'),
    (gen_random_uuid(), s_movies, 'note', 'To watch together', E'- Past Lives\n- La chimera\n- Severance, season 2', 340, 60, lola, now() - interval '10 days', now() - interval '10 days');

  -- Ideas
  insert into public.items (sphere_id, type, title, body_md, x, y, created_by, created_at, updated_at) values
    (s_ideas, 'note', 'A shelf for the ceramics', E'Oak, three levels, next to the window.', 40, 40, alberto, now() - interval '9 days', now() - interval '9 days'),
    (s_ideas, 'note', 'Sunday pasta ritual', E'One new shape every Sunday. Start with *orecchiette*.', 340, 60, lola, now() - interval '3 hours', now() - interval '3 hours');

  -- Memories
  insert into public.items (sphere_id, type, title, body_md, x, y, created_by, created_at, updated_at) values
    (s_memories, 'note', 'First trip together', E'Lisbon, spring. It rained for two days and we did not care.', 40, 40, lola, now() - interval '40 days', now() - interval '40 days');

  -- Random (inbox): waiting for a sphere
  insert into public.items (sphere_id, type, title, url, preview, x, y, created_by, created_at, updated_at) values
    (s_random, 'link', 'How to choose a ceramic glaze', 'https://ceramicartsnetwork.org/daily/article/glaze-basics',
      '{"title":"How to choose a ceramic glaze","domain":"ceramicartsnetwork.org"}'::jsonb,
      40, 40, lola, now() - interval '4 hours', now() - interval '4 hours');
  insert into public.items (sphere_id, type, title, body_md, x, y, created_by, created_at, updated_at) values
    (s_random, 'note', 'That wine from the trattoria', E'Lagrein, the one with the black label. Ask the name next time.', 340, 60, alberto, now() - interval '8 days', now() - interval '8 days');

  -- Lola's private sphere
  insert into public.items (sphere_id, type, title, body_md, x, y, created_by, created_at, updated_at) values
    (s_gifts, 'note', 'For Alberto''s birthday', E'The film camera he keeps looking at. **Secret!**', 40, 40, lola, now() - interval '7 days', now() - interval '7 days');

  -- links, also across spheres
  insert into public.item_links (source_id, target_id, created_by) values
    (i_lisbon, i_fado, lola),
    (i_lisbon, i_tram, lola),
    (i_procida, i_postino, alberto),
    (i_bolzano, i_braies, alberto),
    (i_surprise, i_faenza, alberto);

  -- annotations on the Italy canvas
  insert into public.annotations (sphere_id, kind, data, x, y, rotation, created_by) values
    (s_italy, 'sticker', '{"emoji":"⭐","size":44}'::jsonb, 300, 250, -8, lola),
    (s_italy, 'arrow', '{"dx":180,"dy":-60,"color":"coral","size":3}'::jsonb, 420, 250, 0, alberto),
    (s_italy, 'stroke',
      '{"color":"coral","size":4,"points":[[0,0],[40,-14],[90,-18],[150,-10],[190,6],[200,30],[170,52],[110,62],[50,56],[10,38],[0,14],[8,0]]}'::jsonb,
      40, 300, 0, lola);

  -- Friends: something a non member of "Lola & Alberto" can see
  insert into public.items (sphere_id, type, title, body_md, x, y, created_by, created_at, updated_at) values
    (s_friends_places, 'note', 'Weekend in Turin', E'Giulia knows a place for *bicerin*.', 40, 40, giulia, now() - interval '1 day', now() - interval '1 day'),
    (s_friends_places, 'note', 'Hike on Monte Baldo', E'Cable car from Malcesine, then the ridge.', 340, 60, alberto, now() - interval '12 days', now() - interval '12 days');
end;
$$;

-- The demo users already know the app: no first-login tutorial for them (RF15).
update public.profiles set tutorial_completed_at = created_at;

-- Everything older than each member's last visit has already been seen, so the
-- NEW badges and the "since your last visit" banner show only recent items.
insert into public.item_views (user_id, item_id, seen_at)
select m.user_id, i.id, m.last_seen_at
from public.galaxy_members m
join public.items i on i.galaxy_id = m.galaxy_id
where m.last_seen_at is not null
  and i.updated_at <= m.last_seen_at
  and i.created_by is distinct from m.user_id;
