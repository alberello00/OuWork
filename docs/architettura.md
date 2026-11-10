# OurWorld — Architettura tecnica

_10 novembre 2026. Da leggere con `requisiti-funzionali-mvp.md` (RF) e `requisiti-graphic-design.md` (RD)._

## Scelte di fondo

| Livello | Scelta | Motivo |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript | UI e API route (link preview, export, inviti) nella stessa codebase |
| Tela | @xyflow/react | Nodi = card, archi = collegamenti; pan/zoom/drag/touch già pronti; licenza MIT |
| Annotazioni | Livello SVG sopra React Flow + perfect-freehand | React Flow non gestisce il disegno libero |
| Stile | Tailwind v4 + shadcn/ui | Token in `@theme`, primitive accessibili |
| Backend | Supabase (Postgres, Auth, Storage) | Un solo servizio gestito; RLS per la privacy |
| Sync | TanStack Query (polling 15 s + refetch on focus) | RF11.1 non richiede tempo reale |
| Hosting | Vercel + Supabase free | Costo zero |

Conflitti di scrittura: last-write-wins su `updated_at`. Accettabile per gruppi piccoli.

## Autenticazione e inviti

Il prototipo usa **username + password** e niente registrazione pubblica (frame `2:2`).

- Supabase Auth richiede un'email: si usa un'email sintetica `<username>@users.ourworld.local`. Il form chiede solo username; la conversione avviene in `src/lib/auth.ts`.
- In Supabase: **signup disabilitato**, conferma email disabilitata.
- **Invito via link** (default MVP): il membro di una galassia genera un link `/invite/<token>` (scadenza 7 giorni, monouso).
  - Utente nuovo: sceglie username + password → una server action con service role crea l'utente (`email_confirm: true`), la sua galassia personale "Just me" e la membership.
  - Utente esistente: dopo il login viene aggiunto alla galassia.
- Alla creazione di ogni utente: profilo (`profiles`) con colore personale e galassia "Just me" (`is_personal = true`).

## Modello dati

```sql
profiles        (id uuid PK = auth.users.id, username unique, display_name, color, avatar_path, created_at)

galaxies        (id, name, owner_id → profiles, is_personal bool, created_at)
galaxy_members  (galaxy_id, user_id, role 'owner'|'member', last_seen_at, joined_at,
                 PK (galaxy_id, user_id))
invites         (id, galaxy_id, token unique, created_by, expires_at, used_at, used_by)

spheres         (id, galaxy_id, parent_id NULL → spheres,   -- un solo livello (vincolo/trigger)
                 name, color, emoji, is_private bool, is_inbox bool,
                 x, y, created_by, created_at, updated_at)

items           (id, sphere_id, type 'note'|'link'|'image',
                 title, body_md, url, preview jsonb,       -- {title, image, domain, favicon}
                 image_path, caption,
                 is_private bool, x, y,
                 created_by, created_at, updated_at)

item_links      (id, source_id → items, target_id → items, created_by, created_at,
                 unique(source_id, target_id), check(source_id <> target_id))

annotations     (id, sphere_id, kind 'stroke'|'arrow'|'sticker',
                 data jsonb,          -- stroke: punti+colore+spessore; arrow: from/to; sticker: emoji o image_path
                 x, y, rotation, created_by, created_at, updated_at)

item_views      (user_id, item_id, seen_at, PK (user_id, item_id))
```

Note:
- `galaxy_id` si ricava da `sphere_id`; per performance delle RLS valuta una colonna `galaxy_id` denormalizzata su `items` e `annotations`, mantenuta da trigger.
- Sfere predefinite create da trigger alla nascita di una galassia: Places, Music, Movies & Shows, Ideas, Memories, **Random** (`is_inbox = true`, una sola per galassia).
- Gli `item_links` sono ammessi solo tra elementi della stessa galassia (trigger di controllo).
- Ricerca (RF9): `pg_trgm` + indice GIN su `title`, `body_md`, `url`; query con `ILIKE`.
- "Novità" (RF8): un elemento è NEW per l'utente U se `created_by <> U`, `updated_at > coalesce(item_views.seen_at, galaxy_members.joined_at)`. Il banner usa `last_seen_at` della membership.
- Immagini: bucket Storage **privato** `items`, path `<galaxy_id>/<item_id>/<file>`, servite con signed URL.

## Sicurezza (RLS)

Funzioni helper `security definer` (con `search_path` fissato):
- `is_member(galaxy_id)` → l'utente corrente è membro.
- `can_see_sphere(sphere_id)` → membro della galassia **e** (`not is_private` **o** `created_by = auth.uid()`), incluso il controllo sulla sfera madre.
- `can_see_item(item_id)` → `can_see_sphere(sphere_id)` **e** (`not is_private` **o** `created_by = auth.uid()`).

Policy:
- `galaxies`, `galaxy_members`: select se `is_member`; gestione membri solo `role = 'owner'`.
- `spheres`, `items`, `annotations`: select con le funzioni sopra; insert/update/delete per i membri, ma solo l'autore può modificare la visibilità di un contenuto privato.
- `item_links`: visibile solo se entrambi gli estremi sono visibili.
- `invites`: create dai membri; lettura del token solo via server action.
- Storage: stesse regole tramite il `galaxy_id` nel path.

**Ogni policy ha un test pgTAP** in `supabase/tests/` con almeno tre utenti: autore, altro membro, non membro.

## Piano a fasi

| Fase | Contenuto | RF |
|---|---|---|
| 0 | Scaffold Next.js, Tailwind v4 con token da `figma.md`, font (Fraunces, DM Sans), tema chiaro/scuro, Supabase locale, CI di lint/typecheck | RF11.4 |
| 1 | Migrazioni schema + RLS + test pgTAP + seed demo | RF1–RF4, RF8 (dati) |
| 2 | Login username/password, inviti via link, creazione e gestione galassie, "Just me" | RF1 |
| 3 | CRUD sfere/sotto-sfere/elementi, link preview, upload immagini, aggiunta rapida (FAB + bottom sheet), Random come inbox, vista Notes | RF2, RF3, RF9.4, RF10 |
| 4 | Tela della sfera: card, drag con posizioni salvate, creazione al clic, collegamenti, annotazioni (tratti, frecce, sticker) | RF5, RF6, RF7 |
| 5 | Universo della galassia (sfere-pianeta, Reorganize, pannello Sphere index), universo delle galassie, selettore galassie, transizione "entra nella sfera" | RF1.5, RF2.3, RD4, RD7 |
| 6 | Novità (badge NEW, banner, modale), ricerca ⌘K, export JSON/markdown, PWA, rifinitura mobile | RF8, RF9, RF11.3 |
| Fase 2 prodotto | Smistamento AI della sfera Random | — |

Ogni fase si chiude con: lint, typecheck, test, test RLS verdi e verifica nel browser (desktop + mobile, chiaro + scuro).

## Variabili d'ambiente

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # solo server
```

Mai committare `.env.local`.
