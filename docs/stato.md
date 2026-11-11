# OurWorld — Stato del progetto

_Aggiornato a fine di ogni fase. Ultimo aggiornamento: 11 novembre 2026 (MVP2, fine fase 7)._

## Riepilogo

| Fase | Stato | Branch |
| ---- | ----- | ------ |
| 0 — Scaffold | ✅ fatta | `main` |
| 1 — Schema, RLS, test pgTAP, seed | ✅ fatta | `feat/fase-1-db` → `develop` |
| 2 — Login, inviti, galassie | ✅ fatta | `feat/fase-2-auth` → `develop` |
| 3 — CRUD sfere/elementi, aggiunta rapida, Notes | ✅ fatta | `feat/fase-3-content` → `develop` |
| 4 — Tela della sfera | ✅ fatta | `feat/fase-4-canvas` → `develop` |
| 5 — Universi | ✅ fatta | `feat/fase-5-universe` → `develop` |
| 6 — Novità, ricerca, export, PWA | ✅ fatta | `feat/fase-6-news-search` → `develop` |
| **MVP2** (`docs/requisiti-mvp2.md`) | | |
| 7 — Eliminare una sfera da ovunque (RF12) | ✅ fatta | `feat/fase-7-delete-anywhere` → `develop` |
| 8 — Galassie vuote + sondaggio iniziale (RF13, RF14) | ⏳ | `feat/fase-8-onboarding-survey` |
| 9 — Tutorial (RF15) | ⏳ | `feat/fase-9-tutorial` |
| 10 — Nuovo logo (RF16) | ⏳ | `feat/fase-10-logo` |

> Le fasi dell'MVP2 sono su `develop`: **non** sono ancora su `main` né sul database remoto (servono l'ok di Albi).

## Online (11 novembre 2026)

| Cosa | Dove |
| ---- | ---- |
| Sito | https://ouniverse-albertotrashaj31-1532s-projects.vercel.app (Vercel, progetto `ouniverse`, produzione da `main`, funzioni a Francoforte `fra1`) |
| Database | Supabase, organizzazione "OurWorld", progetto `ouniverse` (ref `uchewllvnkxdigrcalys`, eu-central-1, piano free) |

- Migrazioni applicate con `supabase db push --remote` (nessun seed demo online).
- Auth remota: registrazione pubblica **disattivata**, conferma email disattivata (solo queste due voci portate da `config.toml`).
- Vercel: variabili `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`; protezione Vercel solo sulle preview, la produzione è pubblica (l'accesso lo regola il login dell'app). Node 22.
- La password del database remoto sta solo in `.env.local` (`SUPABASE_DB_PASSWORD`), non versionata.
- I test pgTAP **non** si lanciano sul database remoto: `00_setup.test.sql` installa funzioni di test (anche una che crea utenti) e lo fa con commit.

**Da fare a mano**
- `SUPABASE_SERVICE_ROLE_KEY` su Vercel (tipo *Sensitive*, solo Production e Preview): serve per creare account dagli inviti. Non è passata dalla conversazione con Claude.
- Ogni push su `main` ripubblica il sito; `develop` produce preview protette.

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

## Fase 4 — Tela della sfera

**Fatto**
- Tela React Flow nella pagina sfera, con interruttore Tela / Elenco (`?view=`); predefinita la tela su desktop, l'elenco sotto i 640 px (RD8.4).
- Card trascinabili, posizione salvata dopo 400 ms con aggiornamento ottimistico; il polling non riporta indietro una card mentre la si sposta (RF5.2).
- Clic su un punto vuoto → menu Nota / Link / Immagine → elemento creato in quel punto (RF5.3, RD6.5). Suggerimento "Click anywhere to add" come nel frame `15:2`.
- Collegamenti come curve bezier nel colore della sfera d'origine, evidenziati al passaggio sulla card (RF7.2, RD6.3).
- Annotazioni (RF6): penna a mano libera (perfect-freehand, 6 colori, 3 spessori), frecce curve, sticker emoji e sticker foto; si spostano trascinandole e si eliminano con × o Canc; autore nel tooltip.
- Zoom semantico sotto il 55 %: le card mostrano solo titolo e colore (RD6.2). Controlli zoom / "mostra tutto" in basso a sinistra (RD6.4).
- `?focus=<item>` centra la tela su un elemento (servirà alla ricerca, RF9.3). Il filtro per sotto-sfera vale anche sulla tela.

Verificato nel browser: trascinamento salvato, creazione al clic, tratto + freccia + sticker salvati, sticker spostato ed eliminato, zoom semantico, filtro Italy, lola vede 2 collegamenti su 3 (quello verso la nota privata di alberto resta nascosto), tela navigabile a 390 px, tema scuro.

**Problemi noti**
- Su mobile la tela è navigabile (pinch, trascinamento) ma il disegno con un dito disattiva il pan finché non si torna allo strumento "sposta".
- Le card non si raggiungono da tastiera sulla tela; da tastiera si usa la vista Elenco.

## Fase 5 — Universi

**Fatto**
- Universo della galassia `/g/<id>` (frame `5:2`): sfere-pianeta con gradiente radiale e alone, diametro ∝ radice del numero di elementi (84–220 px), contorno tratteggiato se vuote, lucchetto se private, puntino giallo se hanno novità, fluttuazione lenta (disattivata da `prefers-reduced-motion`) (RF2.3, RD4).
- Sotto-sfere come lune che compaiono avvicinandosi (zoom ≥ 0,9) e aprono la sfera madre filtrata.
- Archi tra sfere quando ci sono collegamenti tra elementi di sfere diverse, spessore ∝ numero di collegamenti (RF7.2, RD4.4).
- Pianeti trascinabili (posizione salvata); "Reorganize" li dispone ad anelli, il più grande al centro e Random in fondo.
- Pannello "Sphere index" al clic (frame `7:2` / `14:2`): anteprima della tela, sotto-sfere, ultimi elementi, "Open sphere".
- Transizione firma (RD7.2): doppio clic o "Open sphere" zooma dentro il pianeta con una dissolvenza nel suo colore; tornando indietro (`?from=`) l'universo parte zoomato sul pianeta e si allontana. Con `prefers-reduced-motion` solo dissolvenza.
- Universo delle galassie `/` (frame `3:2`): un riquadro per galassia con le sfere in miniatura nella loro disposizione, membri, conteggi e badge novità; legenda.
- Il selettore "All galaxies" (frame `4:2`) c'era già dalla fase 2.

Verificato nel browser (desktop chiaro/scuro, 390 px): 6 pianeti e 2 archi, pannello, lune avvicinandosi, Reorganize salvato, ingresso e ritorno, lola vede la propria sfera privata "Gift ideas" e alberto no.

**Problemi noti**
- La fluttuazione dei pianeti si può spegnere solo con l'impostazione di sistema "riduci movimento" (nessun interruttore nell'app).

## Fase 6 — Novità, ricerca, export, PWA, mobile

**Fatto**
- Banner "Since your last visit" sulla home (tutte le galassie) e nell'universo della galassia (solo quella): quante novità, da chi, in quante galassie; "See what's new" apre la modale (frame `8:2`) con elemento, autore, sfera e galassia; "Got it" / × chiude e aggiorna `last_seen_at` (RF8.2). Badge NEW su card, sfere, pianeti e galassie già dalle fasi precedenti (RF8.1, RF8.3).
- Ricerca ⌘K / Ctrl+K e pulsante nella barra (RF9, RD9.1): risultati dal database (`search_items`, solo contenuti visibili), raggruppati per sfera con la sotto-sfera a destra, chip per filtrare per galassia e per sfera, snippet del testo. Invio apre la sfera sulla tela centrata sull'elemento con il dettaglio aperto (RF9.3).
- Export della galassia in JSON o Markdown dalle impostazioni (`/api/export`), con la sessione dell'utente: contiene solo ciò che lui vede (RF11.3).
- PWA: manifest, icone 192/512 + SVG, service worker solo rete (niente cache di dati privati), `theme-color` per tema.
- Mobile (RD8.3): barra in basso con Cerca, "+" e interruttore tema; contenuti e tele si fermano sopra la barra.

Verificato nel browser: banner (6 novità da Lola e Giulia in 2 galassie) e modale, chiusura persistente; ricerca "lis" raggruppata per sfera, Invio apre Tram 28 sulla tela; lola non trova la nota privata di alberto ma trova la propria; export: alberto e lola ottengono ciascuno i propri contenuti privati e non quelli dell'altro (5 vs 4 collegamenti), giulia riceve 404; manifest valido; 390 px chiaro.

**Problemi noti**
- Il service worker non mette nulla in cache: l'app non funziona offline (scelta voluta per la privacy).
- Le immagini nell'export sono riferite con il loro path nello storage, non incluse nel file.

## Fase 7 — Eliminare una sfera da ovunque (MVP2, RF12)

**Fatto**
- "Delete" raggiungibile da tre nuovi punti, sempre con lo stesso `DeleteSphereDialog` e la stessa RPC `delete_sphere` (nessuna nuova logica di eliminazione): cestino nel pannello "Sphere index"; menu contestuale del pianeta (clic destro su desktop, pressione prolungata ~0,5 s su touch) con Open / Edit / Delete; menu ⋯ nell'intestazione di ogni colonna di Notes (Edit / Delete).
- Random non mostra mai "Delete" (resta modificabile).
- Dopo l'eliminazione dall'universo il pianeta resta in scena 260 ms e si dissolve rimpicciolendosi; con `prefers-reduced-motion` solo dissolvenza. Il pannello si chiude se riguardava quella sfera.
- L'eliminazione invalida sfere, conteggi, elementi, collegamenti e ora anche la ricerca (le novità derivano dagli elementi).
- RF12.4: le sfere private altrui non arrivano al client (RLS), quindi non hanno alcun menu; nessun buco emerso, nessun nuovo test pgTAP (RF12.5).

Verificato nel browser (desktop chiaro, 390 px scuro con touch, reduced motion): menu contestuale, cestino nel pannello con annulla/conferma, eliminazione con spostamento in Random e con "Delete them too", colonna Notes, pressione prolungata che non apre anche il pannello, alberto non vede "Gift ideas" di lola.

**Problemi noti**
- Il menu contestuale del pianeta non si apre da tastiera: da tastiera si elimina dal pannello "Sphere index" o da Notes.
- Ambiente: dopo `supabase link` al progetto remoto, `supabase/.temp/storage-version` torna all'immagine di default (segfault su questo Mac) e compare `supabase/.temp/storage-migration`, incompatibile con il pin `v1.60.0`: `supabase db reset` fallisce e lascia il database locale vuoto. Rimedio: riscrivere `v1.60.0` in `storage-version`, togliere `storage-migration`, rilanciare il reset.
