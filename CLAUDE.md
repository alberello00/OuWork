# OuWork

Web app per un gruppo di colleghi che lavora a un progetto, in stile Miro: note, link e immagini dentro **workspace** condivisi (o personali), organizzati in **board** tematici con tela libera, collegamenti tra item, cronologia e un assistente AI (la "bacchetta magica") su tre livelli: nota, board, workspace.

OuWork nasce come copia di OurWorld (stessa cronologia git) ma è un **prodotto distinto**: non deve mai puntare al progetto Supabase o Vercel di OurWorld.

Autore: Albi (Alberto). Progetto da portfolio: deve funzionare bene, avere un aspetto curato e un README che lo racconti. Privilegia la semplicità e il costo zero rispetto alla scalabilità.

## Nomenclatura

Nell'interfaccia: **Workspace**, **Board**, **Sub-board**, **Item** (note, link, image), **Inbox**. Nel database e nel codice dei dati i nomi storici restano: `galaxies` = workspace, `spheres` = board (con `parent_id` = sub-board, `is_inbox` = Inbox), `items`. Non rinominare lo schema.

## Documenti di riferimento (leggili quando il task li tocca)

| File                               | Quando leggerlo                                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| `docs/requisiti-ouwork.md`         | **Sempre per primo.** Gli ID `RW1`–`RW10` sono la fonte di verità di OuWork, con il piano a fasi W0–W7. |
| `docs/requisiti-funzionali-mvp.md` | Requisiti `RFx.y` ereditati da OurWorld: validi solo dove `requisiti-ouwork.md` non li contraddice. |
| `docs/requisiti-graphic-design.md` | Requisiti `RDx.y` ereditati: stati, accessibilità e mobile restano utili; stile e tono sono sostituiti da RW2. |
| `docs/requisiti-mvp2.md`           | Requisiti `RF12`–`RF16` ereditati (eliminazione, setup, tutorial): validi dove non contraddetti. I vincoli sui dati di produzione **non** valgono per OuWork. |
| `docs/architettura.md`             | Stack, modello dati, regole di sicurezza (RLS).                                                     |
| `docs/figma.md`                    | Prototipo Figma di OurWorld: solo riferimento storico, il design di OuWork è definito da RW2.       |
| `docs/stato.md`, `docs/decisioni.md` | Stato per fase e registro delle decisioni.                                                        |

Se due fonti si contraddicono vince `docs/requisiti-ouwork.md`; nei casi dubbi scegli l'opzione più coerente con la visione e annotala in docs/decisioni.md

## Stack

- **Next.js** (App Router, ultima stabile) + **TypeScript** strict
- **Tailwind CSS v4** (token in `@theme` dentro `src/app/globals.css`) + componenti **shadcn/ui** dove servono primitive (dialog, sheet, command, toast)
- **@xyflow/react** (React Flow) per la tela delle sfere e per le viste universo
- **perfect-freehand** per i tratti a mano libera (livello SVG sopra la tela)
- **Supabase**: Postgres, Auth, Storage (immagini), Realtime dalla fase W2 (RW4).
- **AI** (dalla fase W4): Anthropic tramite Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) e `zod`; nomi dei modelli in un unico file di configurazione, chiave solo lato server.
- **TanStack Query** per fetch e cache (polling solo come fallback del Realtime, RW4.1)
- Hosting: **Vercel** (frontend) + **Supabase** (piano free)
- Package manager: **pnpm**

Non aggiungere dipendenze pesanti senza chiedere. Niente stato globale (Redux/Zustand) finché TanStack Query e lo stato locale bastano.

## Comandi

```bash
pnpm dev                 # sviluppo locale
pnpm build && pnpm start # build di produzione
pnpm lint                # ESLint
pnpm typecheck           # tsc --noEmit
pnpm test                # Vitest
supabase start -x logflare,vector,edge-runtime,imgproxy,supavisor,studio,mailpit   # stack locale (Docker)
supabase db reset        # riapplica migrazioni + seed
supabase test db         # test SQL/RLS (pgTAP) in supabase/tests
supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

## Struttura del repo (obiettivo)

```
src/
  app/                    # route (App Router)
    (auth)/login, invite/[token]
    (app)/                # area autenticata
      page.tsx            # elenco dei workspace
      w/[galaxyId]/       # overview di un workspace
      w/[galaxyId]/b/[sphereId]/  # tela del board
      notes/              # vista Notes (griglia)
    api/                  # route handler: link-preview, export
  components/
    ui/                   # shadcn/ui (non modificare a mano se non serve)
    canvas/               # tela React Flow, nodi-card, archi, livello annotazioni
    universe/             # overview e mappa dei board
    items/                # card nota/link/immagine, dettaglio, form rapido
  lib/
    supabase/             # client browser/server, tipi generati
    queries/              # hook TanStack Query, uno per entità
    tokens.ts             # palette dei board (valori JS per canvas/SVG)
supabase/
  migrations/             # SQL versionato, mai modificare una migrazione già applicata
  tests/                  # test pgTAP per le RLS
  seed.sql                # dati demo (workspace "Product Launch")
docs/
```

## Convenzioni

- Codice, nomi di variabili, commit e commenti in **inglese**. Documentazione in `docs/` in **italiano**.
- Testi dell'interfaccia: in **inglese**, tono professionale e asciutto, raccolti in `src/lib/copy.ts` per poterli tradurre in futuro.
- Componenti React: function component, file `PascalCase.tsx`, un componente esportato per file.
- Server Components di default; `"use client"` solo dove serve interazione (tela, form, palette ⌘K).
- Accesso ai dati: dal client solo tramite i hook in `src/lib/queries/`. Mai chiamare `supabase.from(...)` direttamente nei componenti.
- La **service role key** di Supabase si usa solo lato server (route handler/server action) e solo per: creazione utenti da invito, link preview, job del digest (che filtra esplicitamente `is_private = false`). Mai nel bundle client.
- Colori, raggi, ombre e font **solo tramite token**: niente esadecimali sparsi nei componenti (eccezione: `src/lib/tokens.ts`).
- Commit piccoli in stile Conventional Commits (`feat:`, `fix:`, `chore:`, `db:`...).

## Regole che non vanno mai violate

1. **Privacy prima di tutto**: un contenuto con `is_private = true` (o dentro un board privato) è visibile solo al suo autore. Lo garantiscono le **RLS** del database, non il frontend. Ogni nuova tabella o query deve avere policy e un test in `supabase/tests/`.
2. Un utente vede solo i workspace di cui è membro.
3. Nessuna registrazione pubblica: gli account nascono solo da un invito valido.
4. Le migrazioni sono append-only.
5. **Mai** collegare questo repo al Supabase o al Vercel di OurWorld. I contenuti privati non entrano mai in un prompt AI condiviso (digest, riassunti).

## Come lavorare (autonomia piena)

Hai piena autonomia per costruire OuWork. Albi non è presente durante il lavoro: non fermarti a chiedere conferme per scelte reversibili.

- **Procedi fase dopo fase** seguendo il piano di `docs/requisiti-ouwork.md` (fasi W0–W7), senza aspettare approvazioni tra una fase e l'altra. OuWork parte da un database nuovo e vuoto: nessun dato di produzione da preservare, nessun backfill.
- **Decidi tu** su dettagli di implementazione, librerie minori, struttura dei componenti, copy e piccole ambiguità dei requisiti. Ogni decisione non ovvia va in `docs/decisioni.md` (data, contesto, scelta, alternative scartate).
- **Un branch per fase** `feat/wN-<nome>`, commit piccoli e frequenti. A fine fase merge in `develop` (crealo se manca). Non toccare `main`.
- **Gate di fine fase** (obbligatorio): `pnpm lint && pnpm typecheck && pnpm test && supabase test db` verdi + verifica nel browser (desktop e 390px, tema chiaro e scuro). Se un gate fallisce correggi, non andare avanti con test rossi.
- **Aggiorna `docs/stato.md`** a fine fase: fatto, mancante, problemi noti, come provarlo.
- **Fermati e chiedi solo se**: serve una credenziale o un account che non hai (nuovo Supabase, nuovo Vercel, `ANTHROPIC_API_KEY`); un'azione è irreversibile o tocca dati reali (primo `supabase db push` remoto, merge su `main`, account demo pubblico); serve una dipendenza oltre a `ai`, `@ai-sdk/anthropic` e `zod`; c'è da scegliere il logo (RW2.8); una scelta cambierebbe lo scope dei requisiti RW. Altrimenti vai avanti.
- Puoi usare subagenti per lavoro parallelo e indipendente, ma integrazione e gate restano tuoi.
