# OuWork — Stato del progetto

_Aggiornato a fine di ogni fase. Ultimo aggiornamento: 12 novembre 2026 (fine fase W0)._

## Riepilogo

| Fase | Stato | Branch |
| ---- | ----- | ------ |
| W0 — Separazione da OurWorld, rebrand (RW1) | ✅ fatta | `feat/w0-separazione` → `develop` |
| W1 — Design professionale (RW2) | ⏳ prossima; le proposte di logo richiedono la scelta di Albi | `feat/w1-design` |
| W2 — Ruoli + Realtime (RW3, RW4) | da fare | `feat/w2-ruoli-realtime` |
| W3 — Activity log, versioni, collegamenti (RW5–RW7) | da fare | `feat/w3-tracciamento` |
| W4 — Infrastruttura AI + bacchetta sulle note (RW8) | da fare | `feat/w4-ai-note` |
| W5 — Bacchetta sul board (RW9) | da fare | `feat/w5-ai-board` |
| W6 — Bacchetta sul workspace e digest (RW10) | da fare | `feat/w6-ai-workspace` |
| W7 — Portfolio (README, demo) | da fare | `feat/w7-portfolio` |

## Online

Niente. OuWork non ha ancora un progetto Supabase remoto né un progetto Vercel: li crea Albi a mano e passa le variabili d'ambiente (vedi `.env.example`). Fino ad allora si lavora solo sullo stack locale. `main` non è stato toccato dopo la copia.

## Come provarlo

```bash
supabase start -x logflare,vector,edge-runtime,imgproxy,supavisor,studio,mailpit   # serve Docker
supabase db reset        # migrazioni + seed demo
supabase test db         # 359 test pgTAP
pnpm dev                 # se la porta 3000 è occupata (es. da OurWorld) Next usa la 3001
```

- Stack locale: `project_id = "ouwork"`, API su `http://127.0.0.1:55321`, database sulla porta `55322`. Convive con lo stack locale di OurWorld (porte 543xx).
- `.env.local` si crea da `.env.example` con le chiavi di `supabase status -o env`; non è versionato.
- Utenti demo (password `ouwork-dev`): `maya` (owner), `jonas`, `priya`, `tom`, `elena` nel workspace "Product Launch"; `sam` solo in "Website Redesign" (è il "non membro" per le prove di privacy).
- Contenuti privati da controllare a mano: nota "Pricing — draft numbers" di maya (board Roadmap), board "Scratchpad" di priya.

## Punto di partenza (ereditato da OurWorld)

Al momento della copia OurWorld aveva completato l'MVP (fasi 0–6) e l'MVP2 fino alla fase 9. OuWork eredita quindi, funzionanti:

- login con username e password, account solo da invito, workspace condivisi e personale;
- board con sub-board a un livello, board e item privati garantiti dalle RLS;
- item nota / link (anteprima lato server con protezione SSRF) / immagine, dettaglio, spostamento, collegamenti tra item anche di board diversi;
- tela React Flow con card trascinabili, annotazioni (penna, frecce, sticker), zoom semantico;
- vista "universo" dei board, vista Notes, ricerca ⌘K, badge NEW e banner "since your last visit", export JSON/Markdown, PWA solo rete;
- eliminazione di un board da ovunque, setup iniziale del workspace con RPC transazionale e idempotente, tutorial al primo login.

La fase 10 di OurWorld (nuovo logo) non è stata implementata: in OuWork il logo è RW2.8.

## Fase W0 — Separazione e rebrand (RW1)

**Fatto**

- **Scope**: `docs/requisiti-ouwork.md` (RW1–RW10, piano W0–W7); `CLAUDE.md` e le regole di `src/` e `supabase/` aggiornati; i documenti ereditati hanno una nota in testa che ne limita la validità. Rimossi dal piano i vincoli sui dati di produzione di OurWorld.
- **Separazione**: `supabase/config.toml` con `project_id = "ouwork"` e porte proprie; nessun link della CLI a progetti remoti (`supabase/.temp` contiene solo il pin dell'immagine storage); nessun URL o ID del Supabase o del Vercel di OurWorld nel repo; `.env.example` con le nuove variabili (`ANTHROPIC_API_KEY`, `AI_DAILY_TOKEN_LIMIT`, `CRON_SECRET`).
- **Rebrand (RW1.1)**: nome "OuWork" in `package.json`, metadati, manifest, service worker, copy, README; email sintetiche `<username>@users.ouwork.local`.
- **Nomenclatura**: tutta la copy parla di Workspace / Board / Sub-board / Item / Inbox con tono asciutto; route `/w/<id>`, `/w/<id>/b/<id>`, `/w/<id>/notes`. Tabelle e nomi nel codice dei dati invariati.
- **RW1.2**: via seed, copy e sondaggio della coppia. Al loro posto la scelta di un **template** (Product launch, Research project, Client project, Blank) in due passi, con anteprima modificabile, sulla stessa RPC `complete_galaxy_setup` (anticipo di RW2.9).
- **RW1.3**: nuovo seed "Product Launch" (5 membri, board Roadmap, Research con Interviews e Competitors, Design, Engineering, Marketing, Inbox; 20 item, 13 collegamenti di cui 9 tra board diversi, annotazioni sul Roadmap, una nota e un board privati) più "Website Redesign" con un non membro.
- **RW1.4**: migrazione `20261112150000_ouwork_rebrand.sql`: il workspace personale si chiama "Personal", il board predefinito "Inbox" (📥).

Gate: lint, typecheck, 53 test unitari, 359 asserzioni pgTAP verdi.
Verificato nel browser (Chrome headless pilotato da script; desktop chiaro e scuro, 390 px scuro): login, elenco workspace con banner novità, overview di "Product Launch" con board e collegamenti, tela del Roadmap, Notes; `jonas` non vede né la nota privata di maya né il board privato di priya; `sam` non vede "Product Launch"; nuovo workspace → template → anteprima → 5 board creati.

**Mancante / rinviato**

- **L'aspetto è ancora quello di OurWorld** (carta/notte, Fraunces, pianeti, logo a due cerchi, icone PWA): è tutto lavoro della fase W1. In W0 è cambiato solo ciò che si legge.
- Attività e versioni nel seed (RW1.3) arrivano in W3, con le tabelle relative.
- I ruoli sono ancora `owner` / `member` (RW3 è nella fase W2).
- Il tutorial ha copy aggiornata ma gli stessi passi; verrà rivisto con il nuovo layout (RW2.9).

**Problemi noti**

- OurWorld e OuWork in locale usano entrambi `localhost` e lo stesso nome di cookie di sessione Supabase: nello stesso browser, il login in uno fa uscire dall'altro. Per provarli insieme servono due profili del browser (o una finestra privata).
- Su questo Mac l'immagine storage di default della CLI va in segfault: lo stack usa `storage-api v1.60.0` tramite `supabase/.temp/storage-version` (file non versionato, da ricreare se si clona altrove e il problema si ripresenta).
- Disco quasi pieno: all'inizio della sessione c'erano 190 MB liberi. Sono state rimosse cinque immagini Docker `supabase/storage-api` non usate (5 GB, riscaricabili); container, volumi e immagini di altri progetti non sono stati toccati. Con meno di qualche GB libero Docker tende a bloccarsi.
- La verifica nel browser lascia nel database locale eventuali workspace di prova (spariscono con `supabase db reset`).
