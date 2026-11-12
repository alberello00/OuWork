# OurWorld — Requisiti MVP2

> **Documento ereditato da OurWorld.** Per OuWork vale solo dove non è contraddetto da `docs/requisiti-ouwork.md` (nomenclatura: galassia = workspace, sfera = board, Random = Inbox). I vincoli sui dati di produzione di OurWorld non si applicano.

L'MVP (fasi 0–6, vedi `docs/stato.md`) è finito e il sito è online con dati reali. Questo documento fissa lo scope dell'**MVP2**: gli ID `RF12`–`RF16` sono la fonte di verità, come gli `RFx.y` di `docs/requisiti-funzionali-mvp.md` lo sono per l'MVP. Le regole del `CLAUDE.md` restano valide così come sono.

## Vincoli specifici dell'MVP2

- **Dati di produzione intoccabili.** Nessuna migrazione deve cancellare, spostare o rinominare le sfere e gli elementi delle galassie esistenti. Le nuove regole valgono solo per le galassie create da qui in poi.
- **Backfill.** I nuovi campi di stato (setup della galassia, tutorial dell'utente) vanno impostati come "già fatti" per le galassie e gli utenti esistenti. Altrimenti, al prossimo accesso, Albi e la sua ragazza si troverebbero il sondaggio sulle galassie che usano già.
- **Database remoto.** `supabase db push` verso il database remoto e il merge su `main` (che pubblica il sito) toccano la produzione: ci si ferma e si chiede prima di farli. Tutto il resto procede in autonomia su `develop`.
- **Seed e test.** Il seed demo deve continuare a ricreare la galassia "Lola & Alberto" del Figma. Se il trigger smette di creare le sfere predefinite, il seed le inserisce esplicitamente. I test pgTAP che contano 6 sfere per galassia vanno aggiornati.
- **Nomenclatura.** Nell'interfaccia le sfere si chiamano ancora "spheres" (copy in inglese). "Mondo" è solo il nome che usiamo tra noi.

## Requisiti

### RF12 — Eliminare una sfera da ovunque

L'eliminazione esiste già (fase 3: `delete_sphere(id, move_to)` e `DeleteSphereDialog`), con le garanzie di privacy registrate in `decisioni.md`. Però si raggiunge solo dal menu ⋯ dentro la sfera, e nell'uso reale non si trova.

- RF12.1 L'azione "Delete" è disponibile anche:
  - nel pannello "Sphere index" dell'universo;
  - in un menu contestuale del pianeta (clic destro su desktop, pressione prolungata su mobile);
  - nell'intestazione di ogni colonna della vista Notes.
- RF12.2 Si riusa `DeleteSphereDialog` così com'è: scelta "sposta in…" / "elimina anche gli elementi", Random non eliminabile, toast. Nessuna nuova logica di eliminazione nel client.
- RF12.3 Dopo l'eliminazione dall'universo, il pianeta sparisce con una breve dissolvenza (solo dissolvenza con `prefers-reduced-motion`). Le query di universo, Notes, conteggi, novità e ricerca vengono invalidate.
- RF12.4 Una sfera privata di un altro membro non mostra mai l'azione (oggi non è nemmeno visibile, quindi verifica che resti così).
- RF12.5 Aggiungi casi pgTAP solo se emerge un buco. Le regole di `delete_sphere` sono già coperte da `05_delete_sphere.test.sql`.

### RF13 — Le nuove galassie partono vuote (solo Random)

- RF13.1 Una nuova migrazione sostituisce `private.handle_new_galaxy`: membership dell'owner + **sola** sfera Random (`is_inbox = true`, colore `sage`, 🎲, al centro). Vale anche per la "Just me" creata alla registrazione.
- RF13.2 Nuova colonna `galaxies.setup_completed_at timestamptz`:
  - backfill `now()` per tutte le galassie esistenti;
  - `null` per le nuove;
  - scrivibile solo tramite RPC, secondo la regola dei privilegi per colonna.
- RF13.3 Universo con la sola Random: stato vuoto affettuoso (RD9.2) con un invito a creare le proprie sfere, che apre il sondaggio se il setup non è completato oppure il form "New sphere" se è completato.

### RF14 — Mini-sondaggio iniziale e creazione automatica delle sfere

- RF14.1 **Quando**: alla prima apertura di una galassia con `setup_completed_at is null`, solo per l'**owner**.
  - Gli altri membri vedono lo stato vuoto con il messaggio "<owner> is setting up this galaxy" e possono comunque creare sfere a mano.
  - Dopo la creazione di una galassia da `NewGalaxyDialog`, si entra direttamente nel sondaggio.
- RF14.2 Si può saltare ("Maybe later": la galassia resta non configurata e il sondaggio si riapre dallo stato vuoto e dalle impostazioni della galassia) oppure chiudere definitivamente ("Start from scratch", che segna il setup come completato).
- RF14.3 **Contenuto**: 3 passi, meno di un minuto, in un dialog a schermo intero su mobile e centrato su desktop.
  1. **Chi siete**: Couple / Friends / Family / Just me. Preselezionato "Just me" sulla galassia personale; per le altre si deduce dal numero di membri, ma resta modificabile. Il tipo cambia l'ordine e i testi dei suggerimenti.
  2. **Interessi in comune**: chip multi-selezione con emoji. Catalogo iniziale: Places to visit, Music, Movies & Shows, Books, Food & Restaurants, Recipes, Ideas & Projects, Memories, Gifts & Wishlist, Outdoor & Sport, Home, Events & Concerts, Games, Podcasts. Per "Couple" in testa anche "Date ideas". In più c'è un campo "Something else" per interessi liberi (nome + emoji).
  3. **Anteprima**: i pianeti che verranno creati, ognuno modificabile (nome, emoji, colore dalla palette) o rimovibile. Pulsante "Create our spheres" (con "my" per "Just me").
- RF14.4 **Creazione**:
  - mappatura **deterministica** interesse → template (`name`, `emoji`, chiave di palette da `tokens.ts`), senza LLM;
  - colori distribuiti in modo che non si ripetano finché la palette basta;
  - massimo 10 sfere;
  - posizioni ad anello attorno a Random, con la stessa logica di "Reorganize" in `universeLayout.ts`.
- RF14.5 Tutto avviene in **una RPC transazionale** (es. `complete_galaxy_setup(galaxy_id, answers jsonb, spheres jsonb)`) che:
  - verifica che chi chiama sia l'owner;
  - valida nomi, emoji e colori;
  - crea le sfere e imposta `setup_completed_at`;
  - è idempotente: una seconda chiamata su una galassia già configurata fallisce senza creare duplicati.
- RF14.6 Le risposte si salvano (es. `galaxies.setup_answers jsonb`) e sono leggibili solo dai membri. Test pgTAP per owner, altro membro e non membro, più il caso della doppia chiamata.
- RF14.7 **Chiusura**: si torna all'universo e i nuovi pianeti compaiono uno dopo l'altro con una piccola animazione (solo dissolvenza con `prefers-reduced-motion`).

### RF15 — Tutorial al primo login

- RF15.1 Nuova colonna `profiles.tutorial_completed_at timestamptz`, con backfill `now()` per gli utenti esistenti. Si imposta quando il tutorial viene completato **o** saltato.
- RF15.2 **Ordine al primo accesso**: se la galassia in cui si atterra ha bisogno del setup e l'utente ne è l'owner, prima il sondaggio (RF14); poi il tutorial sull'universo con i pianeti veri appena creati. Chi arriva da un invito in una galassia già configurata va dritto al tutorial.
- RF15.3 **Formato**: coach-marks con spotlight sopra l'interfaccia reale, al massimo 6–7 passi, con frasi brevi e calde (copy in `copy.ts`):
  1. Galassie e sfere.
  2. Entrare in una sfera (doppio clic / tap).
  3. Il "+" e Random come inbox.
  4. Card, collegamenti e annotazioni.
  5. "Only me".
  6. Le novità (NEW) e la ricerca ⌘K.
  7. Invitare qualcuno (solo per l'owner di una galassia condivisa).

  Se un passo punta a un elemento che non c'è nella vista corrente, si salta o si adatta: niente spotlight sul vuoto.
- RF15.4 **Comandi**: Next / Back / Skip, indicatore di avanzamento, Esc per chiudere. Focus intrappolato e ripristinato alla chiusura, annunci per screen reader, aree tattili ≥ 44 px. Su 390 px i passi puntano alla barra in basso e al FAB, senza tooltip fuori schermo.
- RF15.5 "Replay tutorial" nello `UserMenu`.
- RF15.6 Implementazione propria e leggera, sui token esistenti. Una libreria di tour è una dipendenza da chiedere, secondo il `CLAUDE.md`.

### RF16 — Nuovo logo

- RF16.1 Oggi il logo sono due cerchi sovrapposti (`--user-pink`, `--user-teal`) in `Logo.tsx`, più `icon.svg` e le PNG 192/512 in `public/`. Va sostituito, ma la direzione **non è ancora decisa**.
- RF16.2 Prepara 3 proposte SVG in `docs/logo/`, con una pagina di anteprima (`docs/logo/preview.html`) che le mostra a 512, 192, 32 e 16 px, su sfondo "carta" e "notte", in monocromo e a colori. Spunti: pianeta con un'orbita condivisa; due pianeti in congiunzione; una piccola galassia/spirale; la "O" di OurWorld come pianeta. Vincoli: semplice, caldo, leggibile a 16 px, colori solo dai token.
- RF16.3 **Fermati e chiedi ad Albi quale scegliere**: è una scelta di gusto, non un dettaglio tecnico. Dopo la scelta:
  - aggiorna `Logo.tsx`, `icon.svg`, le PNG 192/512, la versione maskable (con area di sicurezza), `apple-touch-icon` 180, favicon, `manifest.ts` e i metadati;
  - rimuovi gli asset vecchi.

## Piano

| Fase | Branch | Contenuto | Note |
| ---- | ------ | --------- | ---- |
| 7 | `feat/fase-7-delete-anywhere` | RF12 | Piccola, solo UI |
| 8 | `feat/fase-8-onboarding-survey` | RF13 + RF14 insieme | Vanno insieme: RF13 da solo lascerebbe galassie vuote senza un modo guidato per riempirle |
| 9 | `feat/fase-9-tutorial` | RF15 | Dipende dal flusso della fase 8 |
| 10 | `feat/fase-10-logo` | RF16 | Le proposte si preparano subito, in parallelo; l'implementazione arriva dopo la scelta di Albi |

Ogni fase si chiude con il gate del `CLAUDE.md` (`pnpm lint && pnpm typecheck && pnpm test && supabase test db` + browser desktop/390 px, chiaro/scuro) e con l'aggiornamento di `docs/stato.md`. Per le fasi 8 e 9 si fa la prova completa con un utente nuovo, creato da un link d'invito nel database locale: invito → registrazione → sondaggio sulla "Just me" → tutorial. Si fa anche la prova inversa: un utente demo esistente (`alberto`) non deve vedere né il sondaggio né il tutorial.

## Quando fermarsi

Oltre ai casi già previsti nel `CLAUDE.md`, ci si ferma solo per:

- la scelta del logo (RF16.3);
- il push delle migrazioni sul database remoto;
- il merge su `main`.

Tutte le altre ambiguità (sotto-dettagli del sondaggio, copy, ordine dei passi del tutorial) si decidono in autonomia e si registrano in `docs/decisioni.md`.
