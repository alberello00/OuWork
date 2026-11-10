# Database (Supabase) — regole per questa cartella

Modello dati e policy di riferimento: `docs/architettura.md`.

## Migrazioni

- Nuova migrazione: `supabase migration new <nome_snake_case>`. Mai modificare una migrazione già applicata: correggi con una nuova.
- Ordine consigliato per la fase 1: `extensions` (pg_trgm) → tabelle → funzioni helper → trigger (sfere predefinite, galassia "Just me", un solo livello di sotto-sfere, link solo nella stessa galassia, `updated_at`) → RLS e policy → storage bucket e policy → indici.
- Ogni tabella in `public` ha **RLS abilitata**. Nessuna eccezione.
- Funzioni `security definer`: sempre `set search_path = ''` e nomi qualificati (`public.items`).
- Dopo ogni modifica di schema: `supabase gen types typescript --local > src/lib/supabase/database.types.ts`.

## Test (obbligatori)

- Test pgTAP in `supabase/tests/*.test.sql`, lanciati con `supabase test db`.
- Per ogni policy, verifica il comportamento per tre ruoli: **autore**, **altro membro della galassia**, **non membro**. Includi sempre i casi privati:
  - un elemento privato non è visibile all'altro membro (né in select diretta, né in ricerca, né tramite `item_links`);
  - gli elementi di una sfera privata sono invisibili anche se non sono marcati privati;
  - un non membro non vede galassie, sfere, elementi, annotazioni o oggetti in storage.
- Un test RLS rosso blocca la fase: non disattivare né allentare una policy per far passare un test senza chiedere.

## Seed

`seed.sql` ricrea la demo del Figma: utenti `lola` e `alberto` (password di sviluppo documentata nel file), galassie "Lola & Alberto" e "Just me" per entrambi, sfere predefinite con qualche elemento (Lisbon, Lake Braies, Procida, Bolzano, Faenza), un elemento privato e una sotto-sfera Italy/Abroad.
