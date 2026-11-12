# OuWork — Requisiti e piano

_Fonte: kickoff di Albi del 12 novembre 2026. Gli ID `RW1`–`RW10` sono la fonte di verità di OuWork. I vecchi `RFx.y` / `RDx.y` (OurWorld) restano validi solo dove non sono contraddetti da questo documento._

OuWork è la versione professionale di OurWorld: uno spazio in stile Miro per un gruppo di colleghi che lavora a un progetto, con un assistente AI (la "bacchetta magica") su tre livelli: nota, board, workspace. È un progetto da portfolio: deve funzionare bene, avere un aspetto curato e un README che lo racconti.

## Separazione da OurWorld (vincolo assoluto)

- OuWork **non deve mai** puntare al progetto Supabase di OurWorld né al suo progetto Vercel. Nessun riferimento (project id, link della CLI, URL, ID) nel codice o nella documentazione.
- Albi crea a mano il nuovo progetto Supabase e il nuovo progetto Vercel e passa le variabili d'ambiente. Finché non ci sono, si lavora solo sul Supabase locale.
- `.env.local` non è nel repo: si crea da `.env.example`.

## Decisioni già prese

- **Nomenclatura nell'interfaccia**: Galassia → **Workspace**, Sfera/mondo → **Board**, sotto-sfera → **Sub-board**, elemento → **Item** (note, link, image). La sfera Random diventa **Inbox**. Copy in inglese, tono professionale e asciutto.
- **Nomenclatura nel database**: le tabelle restano `galaxies`, `spheres`, `items` ecc. Rinominare lo schema costerebbe molto e non porterebbe niente. Cambiano solo copy, route (`/w/...`, `/b/...`) e nomi dei componenti dove serve chiarezza.
- **Provider AI**: Anthropic tramite **Vercel AI SDK** (`ai` + `@ai-sdk/anthropic`). Modello veloce (`claude-haiku-5-5`) per la bacchetta sulle note, modello più capace (`claude-sonnet-5-5`) per riassunti, organizzazione e digest. I nomi dei modelli stanno in un unico file di configurazione.
- **Database nuovo e vuoto**: niente migrazione di dati da OurWorld.

## Requisiti

### RW1 — Rebrand e separazione
- RW1.1 Nome "OuWork" ovunque: `package.json`, metadati, `manifest.ts`, titoli, email sintetiche (`<username>@users.ouwork.local`), README.
- RW1.2 Rimuovi ciò che è specifico della coppia: seed "Lola & Alberto", copy affettuosi, sondaggio "Couple / Friends / Family", suggerimenti di sfere personali (Music, Movies, Date ideas…).
- RW1.3 Nuovo seed demo: un workspace "Product Launch" con 4–5 membri finti, board realistici (Roadmap, Research, Design, Engineering, Marketing, Inbox), item collegati tra board, un po' di attività e versioni, così ogni funzione si vede subito.
- RW1.4 Il workspace personale "Just me" diventa **"Personal"**.

### RW2 — Design professionale
Direzione: **strumento di lavoro pulito e preciso**, sul modello di Miro, Linear e Notion. Il contenuto resta protagonista, ma il tono è neutro e non romantico.
- RW2.1 Nuovi token in `@theme`:
  - tema **chiaro predefinito** (sfondo bianco / grigio molto chiaro), tema scuro opzionale in grigio-ardesia, senza blu notte;
  - scala di neutri a 10 gradini per tema;
  - **un solo colore d'accento** (es. indaco/blu) per azioni primarie e selezione;
  - palette dei board ridotta e meno satura (8 colori), usata come etichetta, non come riempimento;
  - colori semantici: errore, successo, avviso, info.
- RW2.2 Tipografia: una sola famiglia sans (Inter o Geist) per tutto, più una monospazio per codice e ID. Niente serif. Densità più alta: corpo 14 px su desktop, 16 px su mobile.
- RW2.3 **Overview del workspace**: al posto dell'universo di pianeti, una **griglia di board** con miniatura, colore, conteggio item, ultimi editor e ultima modifica. Accanto, una vista **"Map"** che mostra i board come nodi rettangolari con le linee dei collegamenti tra item di board diversi (riusa il layout dell'universo). Niente stelle, fluttuazione o glow.
- RW2.4 **Card**: angoli 6–8 px, bordo sottile invece dell'ombra morbida, nessuna inclinazione in trascinamento, etichetta colore del board come bordo o pallino. Le immagini non sono più "polaroid".
- RW2.5 **Tela**: griglia a puntini neutra, toolbar flottante in stile Miro (select, note, link, image, connector, pen, arrow, sticker), zoom e minimappa in basso a destra. Gli sticker restano, ma con un set orientato al lavoro (✅ ❗ ❓ 💡 🔥 👍 📌).
- RW2.6 Movimento sobrio: 120–200 ms, niente transizione "entra nel pianeta". Al suo posto uno zoom/dissolvenza breve. `prefers-reduced-motion` rispettato.
- RW2.7 Layout desktop-first con sidebar sinistra (workspace switcher, elenco board, Activity, Digest), barra in alto (breadcrumb, presenza dei membri, ricerca ⌘K, bacchetta del livello corrente). Su mobile restano consultazione, ricerca, aggiunta rapida e lettura dei digest.
- RW2.8 **Logo**: prepara 3 proposte SVG in `docs/logo/` con `docs/logo/preview.html` (512/192/32/16 px, chiaro/scuro). Vincoli: geometrico, sobrio, leggibile a 16 px. **Fermati e chiedi ad Albi quale scegliere**, poi aggiorna tutti gli asset come nella fase 10 di OurWorld.
- RW2.9 Il tutorial al primo login (MVP2) resta, ma con passi e copy aggiornati a OuWork. Il sondaggio iniziale diventa una scelta di **template** (Product launch, Research project, Client project, Blank) che crea i board in modo deterministico, con la stessa RPC transazionale e idempotente.

### RW3 — Ruoli
- RW3.1 Ruoli di membership: `owner` | `editor` | `viewer`.
  - owner: gestisce membri, ruoli, impostazioni del workspace e del digest; può eliminare il workspace.
  - editor: crea, modifica e collega board e item; usa la bacchetta AI.
  - viewer: legge, cerca, vede attività, versioni e digest; non modifica e non usa le azioni AI che scrivono.
- RW3.2 Il link d'invito porta con sé il ruolo scelto da chi lo genera (default editor).
- RW3.3 RLS aggiornate con test pgTAP per ognuno dei tre ruoli, più il non membro. Il client nasconde le azioni non permesse, ma la garanzia sta nelle RLS.

### RW4 — Collaborazione in tempo reale
- RW4.1 Sostituisci il polling a 15 s con **Supabase Realtime** (postgres changes) per item, annotazioni, collegamenti e board, con invalidazione mirata delle query di TanStack Query. Il polling resta come fallback se la connessione cade.
- RW4.2 **Presenza**: avatar dei membri attualmente nel board, nella barra in alto (Realtime Presence).
- RW4.3 Cursori live: nice-to-have della fase W2, da fare solo se il resto è stabile.
- RW4.4 Conflitti: resta last-write-wins su `updated_at`, ma ora ogni scrittura è recuperabile dalla cronologia (RW6).

### RW5 — Activity log
- RW5.1 Nuova tabella `activity_events` (`id`, `galaxy_id`, `sphere_id`, `item_id`, `actor_id`, `verb`, `summary jsonb`, `created_at`). Si riempie **da trigger** su board, item, collegamenti, annotazioni, membri e ruoli, così nessuna modifica sfugge al client. Verbi: created, updated, moved, deleted, linked, unlinked, restored, member_joined, role_changed, ai_applied.
- RW5.2 `summary` contiene il minimo per una frase leggibile (titolo, board di origine e destinazione, campi cambiati), non il contenuto completo.
- RW5.3 **Privacy**: gli eventi su contenuti privati sono visibili solo all'autore. Test pgTAP dedicati.
- RW5.4 **Feed Activity** a livello di board (pannello laterale) e di workspace (pagina dedicata), con filtri per membro, board e tipo di evento, e raggruppamento per giorno. Un clic su un evento apre l'item.
- RW5.5 Il badge NEW e il banner "since your last visit" dell'MVP restano e si appoggiano allo stesso concetto.

### RW6 — Cronologia versioni
- RW6.1 Nuova tabella `item_versions` (`item_id`, `version`, snapshot dei campi editabili, `edited_by`, `created_at`, `source` = `manual` | `ai` | `restore`). Si scrive **da trigger** a ogni update.
- RW6.2 Coalescenza: modifiche consecutive dello stesso autore sullo stesso item entro 2 minuti aggiornano l'ultima versione invece di crearne una nuova. Massimo 100 versioni per item (le più vecchie si eliminano).
- RW6.3 Nel dettaglio dell'item: tab **History** con elenco versioni (autore, quando, origine), **diff** testuale tra una versione e la precedente (titolo, corpo markdown, URL, didascalia) e **Restore**, che crea una nuova versione con `source = restore` senza riscrivere la storia.
- RW6.4 Le versioni di un item privato seguono la visibilità dell'item. Test pgTAP.

### RW7 — Collegamenti tra board
- RW7.1 I collegamenti tra item di board diversi dello stesso workspace esistono già: rendili centrali. Il picker dei collegamenti cerca in tutto il workspace, raggruppato per board.
- RW7.2 Nel dettaglio dell'item, i collegamenti mostrano board di provenienza e colore. Una sezione **Backlinks** elenca chi punta all'item.
- RW7.3 Nella vista Map (RW2.3) lo spessore della linea tra due board indica il numero di collegamenti. Al clic su una linea si vede l'elenco delle coppie collegate.
- RW7.4 Spostare un item in un altro board non rompe i collegamenti e genera un evento `moved`.

### RW8 — Bacchetta magica sulle note
- RW8.1 Icona bacchetta nella toolbar dell'editor della nota e nel menu di selezione del testo. Azioni:
  - Improve clarity, Make shorter, Make longer, Fix grammar, Turn into bullet list, Professional tone, Translate (IT ↔ EN);
  - un campo libero "Ask AI…".
- RW8.2 Funziona sulla selezione, oppure sull'intera nota se non c'è selezione. Risposta in **streaming** in un'anteprima con diff rispetto all'originale. Comandi: Replace / Insert below / Discard / Try again.
- RW8.3 Solo editor e owner. L'accettazione crea una versione con `source = ai` e un evento `ai_applied`.

### RW9 — Bacchetta magica sul board
- RW9.1 **Summarize board**: riassunto strutturato (punti chiave, decisioni, domande aperte, prossimi passi) in un pannello laterale, con riferimenti cliccabili agli item citati. Il riassunto si può salvare come nuova nota nel board.
- RW9.2 **Organize**: l'AI propone raggruppamenti degli item (cluster con nome), eventuali sub-board e nuove posizioni sulla tela. La proposta si mostra come **anteprima sovrapposta** (card fantasma e riquadri dei gruppi) e si applica con un solo comando, in **una RPC transazionale**, oppure si scarta. Mai modifiche applicate senza conferma.
- RW9.3 **Ideas**: l'AI propone 3–5 nuovi item (idee, rischi, domande) come card fantasma vicino al contenuto rilevante. Ognuna si accetta o scarta singolarmente.
- RW9.4 Tutte le uscite strutturate (Organize, Ideas) sono JSON validato con zod tramite `generateObject`. Un output non valido mostra un errore gentile e non scrive nulla.

### RW10 — Bacchetta magica sul workspace e digest
- RW10.1 **Summarize workspace** on demand: stato di ogni board in 1–3 righe, temi trasversali (anche dai collegamenti tra board), cose ferme da tempo.
- RW10.2 **Organize workspace**: suggerimenti su board da unire, dividere o rinominare, item probabilmente nel board sbagliato e item dell'Inbox da smistare. Si applicano uno per uno, con la stessa logica di anteprima e conferma.
- RW10.3 **Digest periodico**:
  - frequenza per workspace impostata dall'owner: daily, weekly (default, lunedì mattina ora di Roma) oppure off;
  - generato da un job pianificato (Vercel Cron → route protetta da segreto) a partire da `activity_events` dall'ultimo digest;
  - salvato nella tabella `digests` (`galaxy_id`, `period_start`, `period_end`, `content_md`, `created_at`);
  - contenuto: cosa è cambiato per board, chi ha contribuito, decisioni e nuove domande, item che richiedono attenzione (es. Inbox non smistato, board fermi);
  - se non c'è attività nel periodo, nessun digest.
- RW10.4 **Notifica in-app**: campanella con i digest non letti e una pagina Digest con lo storico. L'email è backlog (richiederebbe un provider esterno: dipendenza da chiedere).
- RW10.5 **Privacy dei digest**: il digest è unico per workspace e si costruisce **solo dai contenuti non privati**. I contenuti privati non entrano mai nel prompt di un digest o di un riassunto condiviso.

### Regole trasversali per l'AI
- La chiave `ANTHROPIC_API_KEY` vive solo lato server (route handler o server action), mai nel client.
- Il contesto per l'AI si legge **con la sessione dell'utente** (client Supabase con RLS), mai con la service role. Unica eccezione: il job del digest, che usa la service role ma filtra esplicitamente `is_private = false` a livello di query. Questo filtro va coperto da un test.
- Il contenuto degli utenti va nel prompt come **dati delimitati** (es. tag XML), con l'istruzione esplicita di non eseguire istruzioni contenute negli item.
- **Limite d'uso**: tabella `ai_usage` (utente, workspace, azione, token in/out, data) e tetto giornaliero per workspace configurabile da env (`AI_DAILY_TOKEN_LIMIT`). Superato il tetto, la bacchetta mostra un messaggio chiaro.
- Prompt di sistema in file dedicati sotto `src/lib/ai/prompts/`, versionati, con test che verificano almeno lo schema delle risposte strutturate (con il modello simulato).
- Testi della bacchetta in `copy.ts`. Ogni risposta AI mostra un'etichetta discreta "AI-generated".

## Variabili d'ambiente

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # solo server
ANTHROPIC_API_KEY=              # solo server
AI_DAILY_TOKEN_LIMIT=           # es. 200000
CRON_SECRET=                    # protegge la route del digest
```

## Piano

| Fase | Branch | Contenuto | Note |
| ---- | ------ | --------- | ---- |
| W0 | `feat/w0-separazione` | Primo passo, separazione da OurWorld, RW1 | Nessuna nuova funzione: il repo diventa OuWork e gira sul Supabase locale con il nuovo seed |
| W1 | `feat/w1-design` | RW2 (proposte logo subito, implementazione dopo la scelta) | La più visibile: verifica in browser di ogni schermata |
| W2 | `feat/w2-ruoli-realtime` | RW3 + RW4 | Ruoli prima, poi Realtime |
| W3 | `feat/w3-tracciamento` | RW5 + RW6 + RW7 | Activity log e versioni condividono i trigger |
| W4 | `feat/w4-ai-note` | Regole AI trasversali + RW8 | Qui nascono l'infrastruttura AI, `ai_usage` e i prompt |
| W5 | `feat/w5-ai-board` | RW9 | |
| W6 | `feat/w6-ai-workspace` | RW10 | Cron, digest, campanella |
| W7 | `feat/w7-portfolio` | README con screenshot e GIF, sezione architettura, seed demo rifinito, proposta di account demo | Account demo pubblico: proponi come (es. workspace in sola lettura che si resetta ogni notte) e chiedi prima di farlo |

Ogni fase si chiude con il gate del `CLAUDE.md` (`pnpm lint && pnpm typecheck && pnpm test && supabase test db` + browser desktop e 390 px, chiaro e scuro) e con l'aggiornamento di `docs/stato.md`. Dalla fase W4 le funzioni AI si provano anche dal vivo con la chiave vera, quando Albi l'ha fornita. Senza chiave si usa il modello simulato e si annota in `stato.md` cosa resta da provare.

## Quando fermarsi

Oltre ai casi già previsti nel `CLAUDE.md`, ci si ferma solo per:
- la scelta del logo (RW2.8);
- le credenziali che mancano (nuovo Supabase, nuovo Vercel, `ANTHROPIC_API_KEY`);
- nuove dipendenze oltre a `ai`, `@ai-sdk/anthropic` e `zod`, che sono già approvate;
- il primo `supabase db push` verso il nuovo database remoto e il merge su `main`;
- l'account demo pubblico (W7).

Tutte le altre ambiguità (copy, dettagli dei prompt, layout dei pannelli, soglie) si decidono in autonomia e si registrano in `docs/decisioni.md`.
