-- Demo data for LOCAL development only (applied by `supabase db reset`).
-- Workspace "Product Launch": a small team shipping the public beta of
-- "Beacon 2.0", a fictional status-page product.
--
--   username   password      notes
--   maya       ouwork-dev    owner of "Product Launch" (product)
--   jonas      ouwork-dev    member (engineering); owner of "Website Redesign"
--   priya      ouwork-dev    member (design)
--   tom        ouwork-dev    member (marketing)
--   elena      ouwork-dev    member (research)
--   sam        ouwork-dev    member of "Website Redesign" only → use them to check
--                            that nothing of "Product Launch" leaks to a non member
--
-- Private content to check by hand:
--   * maya:  private note "Pricing — draft numbers" (Roadmap)
--   * priya: private board "Scratchpad" with the note "Dark mode illustrations"
--
-- Profiles, "Personal" workspaces, memberships and the Inbox board are created
-- by the database triggers, exactly as in production. A new workspace starts
-- with the Inbox only: the demo boards are inserted here and every demo
-- workspace is marked as already set up, so demo users never get the template
-- picker.

-- ── users ──────────────────────────────────────────────────────────────────
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
  u.username || '@users.ouwork.local',
  extensions.crypt('ouwork-dev', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('username', u.username, 'display_name', u.display_name, 'color', u.color),
  now() - interval '60 days', now() - interval '60 days',
  '', '', '', '', '', '', '', ''
from (values
  ('aaaaaaaa-0000-4000-8000-000000000001'::uuid, 'maya',  'Maya Chen',   'indigo'),
  ('aaaaaaaa-0000-4000-8000-000000000002'::uuid, 'jonas', 'Jonas Weber', 'teal'),
  ('aaaaaaaa-0000-4000-8000-000000000003'::uuid, 'priya', 'Priya Nair',  'pink'),
  ('aaaaaaaa-0000-4000-8000-000000000004'::uuid, 'tom',   'Tom Okafor',  'orange'),
  ('aaaaaaaa-0000-4000-8000-000000000005'::uuid, 'elena', 'Elena Rossi', 'green'),
  ('aaaaaaaa-0000-4000-8000-000000000006'::uuid, 'sam',   'Sam Rivera',  'violet')
) as u (id, username, display_name, color);

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(), u.id, u.id::text, 'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
  now(), now(), now()
from auth.users u
where u.email like '%@users.ouwork.local';

-- ── workspaces, boards, items ──────────────────────────────────────────────
do $$
declare
  maya  constant uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  jonas constant uuid := 'aaaaaaaa-0000-4000-8000-000000000002';
  priya constant uuid := 'aaaaaaaa-0000-4000-8000-000000000003';
  tom   constant uuid := 'aaaaaaaa-0000-4000-8000-000000000004';
  elena constant uuid := 'aaaaaaaa-0000-4000-8000-000000000005';
  sam   constant uuid := 'aaaaaaaa-0000-4000-8000-000000000006';

  g_launch constant uuid := 'eeeeeeee-0000-4000-8000-000000000001';
  g_web    constant uuid := 'eeeeeeee-0000-4000-8000-000000000002';

  s_roadmap     constant uuid := 'dddddddd-0000-4000-8000-000000000001';
  s_research    constant uuid := 'dddddddd-0000-4000-8000-000000000002';
  s_design      constant uuid := 'dddddddd-0000-4000-8000-000000000003';
  s_engineering constant uuid := 'dddddddd-0000-4000-8000-000000000004';
  s_marketing   constant uuid := 'dddddddd-0000-4000-8000-000000000005';
  s_interviews  constant uuid := 'dddddddd-0000-4000-8000-000000000006';
  s_competitors constant uuid := 'dddddddd-0000-4000-8000-000000000007';
  s_scratch     constant uuid := 'dddddddd-0000-4000-8000-000000000008';
  s_sitemap     constant uuid := 'dddddddd-0000-4000-8000-000000000009';
  s_inbox uuid;

  i_timeline   constant uuid := 'ffffffff-0000-4000-8000-000000000001';
  i_scope      constant uuid := 'ffffffff-0000-4000-8000-000000000002';
  i_pricing    constant uuid := 'ffffffff-0000-4000-8000-000000000003';
  i_risks      constant uuid := 'ffffffff-0000-4000-8000-000000000004';
  i_synthesis  constant uuid := 'ffffffff-0000-4000-8000-000000000005';
  i_quote      constant uuid := 'ffffffff-0000-4000-8000-000000000006';
  i_statuspage constant uuid := 'ffffffff-0000-4000-8000-000000000007';
  i_matrix     constant uuid := 'ffffffff-0000-4000-8000-000000000008';
  i_onboarding constant uuid := 'ffffffff-0000-4000-8000-000000000009';
  i_radix      constant uuid := 'ffffffff-0000-4000-8000-00000000000a';
  i_mobile     constant uuid := 'ffffffff-0000-4000-8000-00000000000b';
  i_api        constant uuid := 'ffffffff-0000-4000-8000-00000000000c';
  i_perf       constant uuid := 'ffffffff-0000-4000-8000-00000000000d';
  i_webhooks   constant uuid := 'ffffffff-0000-4000-8000-00000000000e';
  i_migration  constant uuid := 'ffffffff-0000-4000-8000-00000000000f';
  i_messaging  constant uuid := 'ffffffff-0000-4000-8000-000000000010';
  i_post       constant uuid := 'ffffffff-0000-4000-8000-000000000011';
  i_channels   constant uuid := 'ffffffff-0000-4000-8000-000000000012';
begin
  insert into public.galaxies (id, name, owner_id, created_at) values
    (g_launch, 'Product Launch', maya, now() - interval '45 days'),
    (g_web, 'Website Redesign', jonas, now() - interval '20 days');

  insert into public.galaxy_members (galaxy_id, user_id, role, joined_at) values
    (g_launch, jonas, 'member', now() - interval '44 days'),
    (g_launch, priya, 'member', now() - interval '44 days'),
    (g_launch, tom,   'member', now() - interval '40 days'),
    (g_launch, elena, 'member', now() - interval '38 days'),
    (g_web, sam, 'member', now() - interval '19 days');

  -- maya has been away for three days: she gets the "since your last visit" banner
  update public.galaxy_members set last_seen_at = now() - interval '12 hours';
  update public.galaxy_members
  set joined_at = now() - interval '45 days', last_seen_at = now() - interval '3 days'
  where user_id = maya;

  -- boards of Product Launch on a ring, the Inbox among them
  insert into public.spheres (id, galaxy_id, name, color, emoji, x, y, created_by) values
    (s_roadmap,     g_launch, 'Roadmap',     'sky',      '🗺️',    0, -260, maya),
    (s_research,    g_launch, 'Research',    'lavender', '🔎',  225, -130, elena),
    (s_design,      g_launch, 'Design',      'rose',     '🎨',  225,  130, priya),
    (s_engineering, g_launch, 'Engineering', 'teal',     '🛠️',    0,  260, jonas),
    (s_marketing,   g_launch, 'Marketing',   'amber',    '📣', -225,  130, tom),
    (s_sitemap,     g_web,    'Sitemap',     'sky',      '🧭',    0, -260, jonas);
  update public.spheres set x = -225, y = -130 where is_inbox and galaxy_id = g_launch;
  update public.galaxies set setup_completed_at = created_at;

  select id into s_inbox from public.spheres where galaxy_id = g_launch and is_inbox;

  -- sub-boards of Research, and Priya's private board
  insert into public.spheres (id, galaxy_id, parent_id, name, color, emoji, is_private, x, y, created_by) values
    (s_interviews,  g_launch, s_research, 'Interviews',  'lavender', '🎙️', false, 345, -250, elena),
    (s_competitors, g_launch, s_research, 'Competitors', 'coral',    '📊', false, 365, -110, elena),
    (s_scratch,     g_launch, null,       'Scratchpad',  'plum',     '✏️', true,  450,   20, priya);

  -- Roadmap
  insert into public.items (id, sphere_id, type, title, body_md, is_private, x, y, created_by, created_at, updated_at) values
    (i_timeline, s_roadmap, 'note', 'Launch timeline',
      E'**Public beta: 2 March**\n\n1. Feature freeze — 9 Feb\n2. Private beta (20 customers) — 16 Feb\n3. Launch post and email — 2 Mar\n4. GA decision — end of March',
      false, 40, 40, maya, now() - interval '30 days', now() - interval '2 days'),
    (i_scope, s_roadmap, 'note', 'Beta scope (must-have)',
      E'- Public API v2 with scoped tokens\n- New onboarding flow\n- Mobile incident view\n- Webhook retries\n\n> Decision: SSO moves to GA, not beta.',
      false, 340, 40, maya, now() - interval '28 days', now() - interval '6 days'),
    (i_risks, s_roadmap, 'note', 'Launch risks',
      E'- **Data migration** from v1 incidents could take longer than planned\n- Pricing page not final\n- Open question: do we need a status page for the status page?',
      false, 640, 60, jonas, now() - interval '10 days', now() - interval '20 hours'),
    (i_pricing, s_roadmap, 'note', 'Pricing — draft numbers',
      E'Not for sharing yet.\n\n- Starter: 19 €/month\n- Team: 79 €/month\n- Business: talk to us',
      true, 340, 360, maya, now() - interval '5 days', now() - interval '5 days');

  -- Research → Interviews
  insert into public.items (id, sphere_id, type, title, body_md, x, y, created_by, created_at, updated_at) values
    (i_synthesis, s_interviews, 'note', 'Interview synthesis — 8 customers',
      E'**Key findings**\n\n- 6 of 8 check incidents on their phone first\n- Setup takes too long: "I gave up at the DNS step"\n- Teams want one place for incident notes and follow-ups',
      40, 40, elena, now() - interval '21 days', now() - interval '9 days'),
    (i_quote, s_interviews, 'note', 'Quote: on-call from the phone',
      E'> "At 3 am I am not opening a laptop. If I cannot acknowledge from my phone, the tool is useless."\n\nHead of platform, 40-person team.',
      340, 60, elena, now() - interval '20 days', now() - interval '20 days');

  -- Research → Competitors
  insert into public.items (id, sphere_id, type, title, body_md, url, preview, x, y, created_by, created_at, updated_at) values
    (i_statuspage, s_competitors, 'link', 'Statuspage — pricing', null,
      'https://www.atlassian.com/software/statuspage/pricing',
      '{"title":"Statuspage — pricing","domain":"atlassian.com"}'::jsonb,
      40, 40, elena, now() - interval '18 days', now() - interval '18 days'),
    (i_matrix, s_competitors, 'note', 'Competitor matrix',
      E'| | Mobile | API | Free tier |\n|---|---|---|---|\n| Statuspage | partial | yes | yes |\n| Instatus | yes | yes | yes |\n| Beacon 1.x | no | limited | no |',
      null, null, 340, 40, tom, now() - interval '16 days', now() - interval '7 days');

  -- Design
  insert into public.items (id, sphere_id, type, title, body_md, url, preview, x, y, created_by, created_at, updated_at) values
    (i_onboarding, s_design, 'note', 'Onboarding flow v3',
      E'Three steps instead of seven:\n\n1. Name the page\n2. Add the first component\n3. Invite the team\n\nDNS setup moves **after** the first incident is published.',
      null, null, 40, 40, priya, now() - interval '14 days', now() - interval '1 day'),
    (i_radix, s_design, 'link', 'Radix Primitives', null,
      'https://www.radix-ui.com/primitives',
      '{"title":"Radix Primitives","domain":"radix-ui.com"}'::jsonb,
      340, 40, priya, now() - interval '13 days', now() - interval '13 days'),
    (i_mobile, s_design, 'note', 'Mobile incident view',
      E'One-thumb actions: **Acknowledge**, **Update**, **Resolve**.\n\nOpen question: push notifications in beta or GA?',
      null, null, 640, 60, priya, now() - interval '8 days', now() - interval '5 hours');

  -- Engineering
  insert into public.items (id, sphere_id, type, title, body_md, url, preview, x, y, created_by, created_at, updated_at) values
    (i_api, s_engineering, 'note', 'Public API v2 — design notes',
      E'- REST, JSON, cursor pagination\n- Scoped tokens (`read:incidents`, `write:incidents`)\n- Rate limit: 600 requests/min per token\n\nNext step: publish the OpenAPI draft for the private beta.',
      null, null, 40, 40, jonas, now() - interval '19 days', now() - interval '3 days'),
    (i_perf, s_engineering, 'note', 'Performance budget',
      E'- Status page LCP under 1.2 s on 4G\n- API p95 under 150 ms\n- No more than 90 kB of JS on public pages',
      null, null, 340, 40, jonas, now() - interval '12 days', now() - interval '12 days'),
    (i_webhooks, s_engineering, 'link', 'Webhooks — retries and signatures', null,
      'https://docs.stripe.com/webhooks',
      '{"title":"Webhooks — retries and signatures","domain":"docs.stripe.com"}'::jsonb,
      640, 40, jonas, now() - interval '11 days', now() - interval '11 days'),
    (i_migration, s_engineering, 'note', 'Data migration plan',
      E'1. Dual-write incidents for two weeks\n2. Backfill history in batches of 5k\n3. Read switch behind a flag\n\nRisk: customers with more than 50k incidents.',
      null, null, 340, 340, jonas, now() - interval '6 days', now() - interval '18 hours');

  -- Marketing
  insert into public.items (id, sphere_id, type, title, body_md, x, y, created_by, created_at, updated_at) values
    (i_messaging, s_marketing, 'note', 'Positioning and messaging',
      E'**Beacon 2.0: incidents handled from anywhere.**\n\n- For on-call teams of 5–50\n- Proof: setup in under five minutes\n- Avoid: "all-in-one", "AI-powered"',
      40, 40, tom, now() - interval '9 days', now() - interval '2 hours'),
    (i_post, s_marketing, 'note', 'Launch blog post — outline',
      E'1. Why we rebuilt onboarding\n2. Mobile first, literally\n3. API v2 for the builders\n4. What is next',
      340, 60, tom, now() - interval '4 days', now() - interval '4 days'),
    (i_channels, s_marketing, 'note', 'Channel plan',
      E'- Email to 4,200 existing users\n- Product Hunt (Tuesday)\n- Two customer stories from the private beta',
      640, 40, tom, now() - interval '3 hours', now() - interval '3 hours');

  -- Inbox: waiting to be sorted
  insert into public.items (sphere_id, type, title, url, preview, x, y, created_by, created_at, updated_at) values
    (s_inbox, 'link', 'Incident communication guide', 'https://www.atlassian.com/incident-management/incident-communication',
      '{"title":"Incident communication guide","domain":"atlassian.com"}'::jsonb,
      40, 40, tom, now() - interval '4 hours', now() - interval '4 hours');
  insert into public.items (sphere_id, type, title, body_md, x, y, created_by, created_at, updated_at) values
    (s_inbox, 'note', 'Idea: status badge for READMEs', E'An SVG badge teams can embed in their repo. Small effort, free distribution.', 340, 60, jonas, now() - interval '8 days', now() - interval '8 days');

  -- Priya's private board
  insert into public.items (sphere_id, type, title, body_md, x, y, created_by, created_at, updated_at) values
    (s_scratch, 'note', 'Dark mode illustrations', E'Half-baked. Try the line style from the onboarding empty states before showing anyone.', 40, 40, priya, now() - interval '7 days', now() - interval '7 days');

  -- links, mostly across boards
  insert into public.item_links (source_id, target_id, created_by) values
    (i_timeline, i_scope, maya),
    (i_scope, i_api, maya),
    (i_scope, i_onboarding, maya),
    (i_scope, i_mobile, priya),
    (i_synthesis, i_mobile, elena),
    (i_synthesis, i_messaging, tom),
    (i_quote, i_mobile, priya),
    (i_synthesis, i_onboarding, priya),
    (i_api, i_webhooks, jonas),
    (i_risks, i_migration, jonas),
    (i_onboarding, i_post, tom),
    (i_matrix, i_statuspage, tom),
    (i_pricing, i_matrix, maya);

  -- annotations on the Roadmap canvas
  insert into public.annotations (sphere_id, kind, data, x, y, rotation, created_by) values
    (s_roadmap, 'sticker', '{"emoji":"✅","size":44}'::jsonb, 560, 20, 0, maya),
    (s_roadmap, 'sticker', '{"emoji":"❗","size":44}'::jsonb, 860, 40, 0, jonas),
    (s_roadmap, 'arrow', '{"dx":160,"dy":-40,"color":"coral","size":3}'::jsonb, 600, 330, 0, jonas),
    (s_roadmap, 'stroke',
      '{"color":"coral","size":4,"points":[[0,0],[40,-14],[90,-18],[150,-10],[190,6],[200,30],[170,52],[110,62],[50,56],[10,38],[0,14],[8,0]]}'::jsonb,
      30, 250, 0, maya);

  -- Website Redesign: something a non member of "Product Launch" can see
  insert into public.items (sphere_id, type, title, body_md, x, y, created_by, created_at, updated_at) values
    (s_sitemap, 'note', 'Top-level pages', E'Home · Product · Pricing · Docs · Changelog', 40, 40, sam, now() - interval '1 day', now() - interval '1 day'),
    (s_sitemap, 'note', 'Redirects from the old site', E'Keep `/features/*` alive for six months.', 340, 60, jonas, now() - interval '12 days', now() - interval '12 days');
end;
$$;

-- The demo users already know the app: no first-login tutorial for them.
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
