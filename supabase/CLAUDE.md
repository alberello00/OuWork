# Database (Supabase) — regole per questa cartella

Modello dati e policy di riferimento: `docs/architettura.md`.

## Migrazioni

- Nuova migrazione: `supabase migration new <nome_snake_case>`. Mai modificare una migrazione già applicata: correggi con una nuova.
- Ordine consigliato per la fase 1: `extensions` (pg_trgm) → tabelle → funzioni helper → trigger (board Inbox, workspace "Personal", un solo livello di sotto-sfere, link solo nella stessa galassia, `updated_at`) → RLS e policy → storage bucket e policy → indici.
- Ogni tabella in `public` ha **RLS abilitata**. Nessuna eccezione.
- Funzioni `security definer`: sempre `set search_path = ''` e nomi qualificati (`public.items`).
- Dopo ogni modifica di schema: `supabase gen types typescript --local > src/lib/supabase/database.types.ts`.

## Test (obbligatori)

- Test pgTAP in `supabase/tests/*.test.sql`, lanciati con `supabase test db`.
- Per ogni policy, verifica il comportamento per tre ruoli: **autore**, **altro membro del workspace**, **non membro**. Includi sempre i casi privati:
  - un elemento privato non è visibile all'altro membro (né in select diretta, né in ricerca, né tramite `item_links`);
  - gli elementi di una sfera privata sono invisibili anche se non sono marcati privati;
  - un non membro non vede galassie, sfere, elementi, annotazioni o oggetti in storage.
- Un test RLS rosso blocca la fase: non disattivare né allentare una policy per far passare un test senza chiedere.

## Seed

`seed.sql` crea la demo di OuWork: sei utenti (password di sviluppo documentata nel file), il workspace "Product Launch" con i board Roadmap, Research (sub-board Interviews e Competitors), Design, Engineering, Marketing e Inbox, item collegati tra board, una nota privata e un board privato, più il workspace "Website Redesign" con un utente che non è membro del primo.

## Nomi

Le tabelle restano `galaxies` (workspace), `spheres` (board), `items`. Non rinominare lo schema. Lo stack locale usa `project_id = "ouwork"` e le porte 553xx: non collegare mai la CLI (`supabase link`) al progetto di OurWorld.
