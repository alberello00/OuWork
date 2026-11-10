# OurWorld (ouniverse)

Web app personale, molto visiva, per condividere note, link e immagini dentro **galassie** (spazi condivisi con altre persone o personali) organizzate in **sfere** tematiche. Ispirazione: la tela libera di Miro, i collegamenti di Obsidian, il calore di un album di ricordi.

Autore: Albi (Alberto). Progetto personale, non un prodotto: privilegia la semplicità e il costo zero rispetto alla scalabilità.

## Documenti di riferimento (leggili quando il task li tocca)

| File                               | Quando leggerlo                                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| `docs/requisiti-funzionali-mvp.md` | Prima di implementare qualsiasi funzionalità. Gli ID `RFx.y` sono la fonte di verità sullo scope.   |
| `docs/requisiti-graphic-design.md` | Prima di qualsiasi lavoro di UI. Gli ID `RDx.y` descrivono stile, stati, movimento e accessibilità. |
| `docs/architettura.md`             | Stack, modello dati, regole di sicurezza (RLS), piano a fasi.                                       |
| `docs/figma.md`                    | Mappa dei frame Figma (node-id) e design token già estratti.                                        |

Se un requisito e il prototipo Figma si contraddicono, scegli l’opzione più coerente con la visione e annotala in docs/decisioni.md

## Stack

- **Next.js** (App Router, ultima stabile) + **TypeScript** strict
- **Tailwind CSS v4** (token in `@theme` dentro `src/app/globals.css`) + componenti **shadcn/ui** dove servono primitive (dialog, sheet, command, toast)
- **@xyflow/react** (React Flow) per la tela delle sfere e per le viste universo
- **perfect-freehand** per i tratti a mano libera (livello SVG sopra la tela)
- **Supabase**: Postgres, Auth, Storage (immagini). Realtime **non** usato nell'MVP.
- **TanStack Query** per fetch, cache e polling (RF11.1)
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
      page.tsx            # universo delle galassie
      g/[galaxyId]/       # universo di una galassia
      g/[galaxyId]/s/[sphereId]/  # tela della sfera
      notes/              # vista Notes (griglia)
    api/                  # route handler: link-preview, export
  components/
    ui/                   # shadcn/ui (non modificare a mano se non serve)
    canvas/               # tela React Flow, nodi-card, archi, livello annotazioni
    universe/             # sfere-pianeta, galassie, legenda
    items/                # card nota/link/immagine, dettaglio, form rapido
  lib/
    supabase/             # client browser/server, tipi generati
    queries/              # hook TanStack Query, uno per entità
    tokens.ts             # palette sfere (valori JS per canvas/SVG)
supabase/
  migrations/             # SQL versionato, mai modificare una migrazione già applicata
  tests/                  # test pgTAP per le RLS
  seed.sql                # dati demo (galassia "Lola & Alberto" come nel Figma)
docs/
```

## Convenzioni

- Codice, nomi di variabili, commit e commenti in **inglese**. Documentazione in `docs/` in **italiano**.
- Testi dell'interfaccia: in **inglese** come nel prototipo Figma, raccolti in `src/lib/copy.ts` per poterli tradurre in futuro.
- Componenti React: function component, file `PascalCase.tsx`, un componente esportato per file.
- Server Components di default; `"use client"` solo dove serve interazione (tela, form, palette ⌘K).
- Accesso ai dati: dal client solo tramite i hook in `src/lib/queries/`. Mai chiamare `supabase.from(...)` direttamente nei componenti.
- La **service role key** di Supabase si usa solo lato server (route handler/server action) e solo per: creazione utenti da invito, link preview. Mai nel bundle client.
- Colori, raggi, ombre e font **solo tramite token**: niente esadecimali sparsi nei componenti (eccezione: `src/lib/tokens.ts`).
- Commit piccoli in stile Conventional Commits (`feat:`, `fix:`, `chore:`, `db:`...).

## Regole che non vanno mai violate

1. **Privacy prima di tutto**: un contenuto con `is_private = true` (o dentro una sfera privata) è visibile solo al suo autore. Lo garantiscono le **RLS** del database, non il frontend. Ogni nuova tabella o query deve avere policy e un test in `supabase/tests/`.
2. Un utente vede solo le galassie di cui è membro.
3. Nessuna registrazione pubblica: gli account nascono solo da un invito valido.
4. Le migrazioni sono append-only.

## Come lavorare (autonomia piena)

Hai piena autonomia per costruire l'MVP. Albi non è presente durante il lavoro: non fermarti a chiedere conferme per scelte reversibili.

- **Procedi fase dopo fase** seguendo il piano in `docs/architettura.md`, senza aspettare approvazioni tra una fase e l'altra.
- **Decidi tu** su dettagli di implementazione, librerie minori, struttura dei componenti, copy e piccole ambiguità tra requisiti e Figma. Ogni decisione non ovvia va in `docs/decisioni.md` (data, contesto, scelta, alternative scartate).
- **Un branch per fase** `feat/fase-N-<nome>`, commit piccoli e frequenti. A fine fase merge in `develop` (crealo se manca). Non toccare `main`.
- **Gate di fine fase** (obbligatorio): `pnpm lint && pnpm typecheck && pnpm test && supabase test db` verdi + verifica nel browser (desktop e 390px, tema chiaro e scuro). Se un gate fallisce correggi, non andare avanti con test rossi.
- **Aggiorna `docs/stato.md`** a fine fase: fatto, mancante, problemi noti, come provarlo.
- **Fermati e chiedi solo se**: serve una credenziale o un account che non hai (Supabase remoto, Vercel); un'azione è irreversibile o tocca dati reali/produzione; una scelta cambierebbe lo scope dei requisiti RF. Altrimenti vai avanti.
- Puoi usare subagenti per lavoro parallelo e indipendente, ma integrazione e gate restano tuoi.
- Per implementare una schermata dal Figma usa il Figma MCP (vedi `docs/figma.md`): `get_design_context` sul node-id, poi adatta a token e componenti del progetto.
