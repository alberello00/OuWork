# OurWorld — Stato del progetto

_Aggiornato a fine di ogni fase. Ultimo aggiornamento: 10 novembre 2026 (fine fase 1)._

## Riepilogo

| Fase | Stato | Branch |
| ---- | ----- | ------ |
| 0 — Scaffold | ✅ fatta | `main` |
| 1 — Schema, RLS, test pgTAP, seed | ✅ fatta | `feat/fase-1-db` → `develop` |
| 2 — Login, inviti, galassie | ✅ fatta | `feat/fase-2-auth` → `develop` |
| 3 — CRUD sfere/elementi, aggiunta rapida, Notes | ✅ fatta | `feat/fase-3-content` → `develop` |
| 4 — Tela della sfera | ⏳ | |
| 5 — Universi | ⏳ | |
| 6 — Novità, ricerca, export, PWA | ⏳ | |

## Come provarlo

```bash
supabase start -x logflare,vector,edge-runtime,imgproxy,supavisor,studio,mailpit   # serve Docker
supabase db reset        # migrazioni + seed demo
supabase test db         # 310 test pgTAP
pnpm dev
```

Utenti demo (password `ourworld-dev`): `alberto`, `lola` (galassia "Lola & Alberto"), `giulia` (solo "Friends": è il "non membro" per le prove di privacy).
Contenuti privati da controllare a mano: nota "Anniversary surprise" di alberto (Places → Italy), sfera "Gift ideas" di lola.

`.env.local` si genera dalle chiavi dello stack locale (`supabase status -o env`); non è versionato.

## Fase 1 — Database e privacy

**Fatto**

- Migrazioni in `supabase/migrations/` (estensioni → tabelle → helper → trigger → RLS → viste/RPC → storage → indici).
- RLS su tutte le tabelle; privilegi per colonna; `anon` senza alcun accesso (tranne `invite_preview`).
- Regole di privacy (RF4) garantite dal database: elementi privati, sfere private, sotto-sfere di sfere private, collegamenti, annotazioni, ricerca, conteggi, novità, oggetti in storage.
- RPC: `search_items`, `mark_seen`, `mark_sphere_seen`, `touch_last_seen`, `invite_preview`, `accept_invite`, `redeem_invite` (solo service role), `delete_sphere`.
- Viste: `items_feed` (elementi + `is_new` + `since_last_visit`), `sphere_stats` (conteggi visibili).
- 11 file di test pgTAP, 310 asserzioni, sempre con tre ruoli: autore (`ann`), altro membro (`bob`), non membro (`cat`).
- Seed demo come nel Figma; tipi TypeScript generati; CI con job per i test del database.

**Mancante / rinviato**

- Il seed non contiene elementi immagine (servono file veri nello storage): si provano dalla fase 3.
- Foto profilo (`avatar_path`): colonna presente, nessuna policy di storage dedicata; l'MVP usa iniziale + colore.
- Gli oggetti in storage non vengono rimossi quando si elimina un elemento o una galassia (pulizia lato client dalla fase 3; nessun rischio di privacy, solo spazio).

**Problemi noti**

- Su questo Mac (Docker Desktop 4.36, M3) l'immagine storage di default della CLI va in segfault: lo stack locale usa `storage-api v1.60.0` tramite `supabase/.temp/storage-version` (file non versionato: va ricreato su un'altra macchina solo se si ripresenta il problema). Realtime è disattivato in `config.toml`.
- Il disco del Mac era pieno (2,4 GB liberi) e Docker si bloccava: è stata svuotata **solo la build cache di Docker** (14 GB, rigenerabile). Immagini, container e volumi di altri progetti non sono stati toccati.
- Un membro rimosso da una galassia lascia lì i propri contenuti privati, che restano invisibili a tutti.

## Fase 2 — Login, inviti, galassie

**Fatto** (branch `feat/fase-2-auth`): token e tema chiaro/scuro, login username+password, middleware di sessione, pagina `/invite/<token>` (nuovo account via service role oppure "Join" se già loggati), selettore galassie, creazione galassia, impostazioni (rinomina, membri, link d'invito, esci/elimina).
Verificato nel browser: login (desktop chiaro/scuro, 390 px), password errata, creazione invito, registrazione da invito su mobile, invito non riusabile, un non membro non vede la galassia, logout.

Impostazioni galassia verificate su desktop chiaro, 390 px chiaro e scuro.

**Problemi noti**
- **Figma MCP non disponibile**: il piano Starter ha esaurito le chiamate. La UI è costruita su `docs/figma.md`; il confronto con i frame e l'estrazione dei token del tema scuro restano da fare.
- La prova nel browser ha creato l'utente demo `marta` nel DB locale (sparisce con `supabase db reset`).


## Fase 3 — Sfere, elementi, aggiunta rapida, Notes

**Fatto**
- Sfere: creazione, modifica (nome, colore dalla palette, emoji, privata, sfera madre), sotto-sfere a un livello, eliminazione con scelta "sposta in…" / "elimina anche gli elementi" (RF2.1, RF2.5, RF2.6).
- Pagina sfera `/g/<id>/s/<id>`: chip delle sotto-sfere con conteggio che filtrano (`?sub=`), griglia di card, stati vuoti; aprirla segna come visti i suoi elementi ma i badge NEW restano visibili per quella visita.
- Card nota / link (con fallback colore sfera + dominio) / immagine-polaroid; dettaglio come pannello laterale su desktop e foglio a schermo intero su mobile, aperto da `?item=<id>`: markdown, modifica, sposta, elimina, privacy (solo l'autore), collegamenti in entrata/uscita e "Connect to…" (RF3, RF7.1, RF7.3).
- Aggiunta rapida: "+" sempre visibile, bottom sheet con tipo, contenuto, galassia (fuori da una galassia), sfera facoltativa → Random, "only me" (RF10.1).
- Anteprima link lato server `/api/link-preview` con protezione SSRF (niente host privati, redirect controllati, limiti di tempo e dimensione); viene chiesta dopo il salvataggio, così l'aggiunta resta immediata.
- Immagini: ridimensionate nel browser oltre 1,5 MB, caricate in `<galaxy_id>/<item_id>/…`, servite con signed URL.
- Vista Notes `/g/<id>/notes` (e `/notes`): una colonna per sfera con ultimi elementi, chip delle sotto-sfere, NEW, "only me", Random con "Waiting for a topic" (RF9.4).
- La pagina della galassia mostra per ora le sfere come riquadri; l'universo arriva nella fase 5.

Verificato nel browser (desktop chiaro/scuro, 390 px chiaro/scuro): aggiunta di nota, link (anteprima reale da example.com) e immagine; creazione sfera, eliminazione con spostamento; lola non vede la nota privata di alberto né nelle Notes né nella sfera.

**Problemi noti**
- Le immagini dei link vengono caricate direttamente dal sito d'origine (`referrerPolicy=no-referrer`): se il sito le blocca, resta il fallback colorato solo in assenza di immagine, altrimenti un'immagine rotta.
