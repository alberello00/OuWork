# OurWorld — Registro delle decisioni

Una riga o due per decisione non ovvia presa durante lo sviluppo. Le più recenti in alto.

| Data       | Area   | Decisione                                                                       | Alternative scartate / motivo                                  |
| ---------- | ------ | ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 2026-11-10 | Ambiente | Storage locale fissato a `v1.60.0` (`supabase/.temp/storage-version`, non versionato) e Realtime disattivato in `config.toml` | L'immagine storage di default (Node 26) va in segfault su Docker Desktop 4.36 / M3; Realtime non serve all'MVP. Aggiornando Docker Desktop il pin si può togliere |
| 2026-11-10 | DB | `updated_by` su `items`; NEW = modifica di contenuto fatta da un altro. Spostare una card (x, y) non genera novità | Con il solo `created_by` chi modifica l'elemento di un altro lo vedrebbe come NEW; ogni trascinamento accenderebbe i badge |
| 2026-11-10 | DB | Lettura tramite viste `security_invoker` (`items_feed`, `sphere_stats`) e RPC invoker (`search_items`, `mark_seen`…) | Viste/RPC definer: conteggi, ricerca e novità rischierebbero di includere contenuti privati (RF4.3) |
| 2026-11-10 | Privacy | Lo storage segue l'elemento: path `<galaxy_id>/<item_id o annotation_id>/<file>`; chi carica vede il proprio file anche prima che l'elemento esista, finché è membro | Policy basata solo sulla galassia: le immagini di elementi privati sarebbero leggibili dagli altri membri |
| 2026-11-10 | Privacy | Le sfere si eliminano solo con `delete_sphere(id, move_to)`: ciò che chi elimina non può vedere (elementi privati altrui, sotto-sfere private altrui) non viene distrutto ma finisce in Random / al primo livello | `DELETE` diretto con cascade: un membro cancellerebbe senza saperlo i contenuti privati di un altro |
| 2026-11-10 | Privacy | In una sfera privata vivono solo elementi del suo autore. Rendendo privata una sfera, gli elementi altrui passano in Random e le sotto-sfere altrui tornano al primo livello | Lasciarli dentro: sparirebbero per i loro autori. Bloccare l'operazione: rivelerebbe l'esistenza di elementi privati altrui |
| 2026-11-10 | Privacy | Privilegi concessi **per colonna** al ruolo `authenticated`: `created_by`, `galaxy_id`, `updated_*`, `owner_id`, `token` non sono scrivibili dal client; `anon` non ha alcun privilegio | Trigger di immutabilità: più codice e più facile dimenticarne uno |
| 2026-11-10 | Privacy | Funzioni helper RLS nello schema `private` (non esposto da PostgREST) invece che in `public` | `architettura.md` le citava senza schema; in `public` sarebbero chiamabili come RPC |
| 2026-11-10 | Inviti | Solo l'**owner** della galassia crea/revoca inviti; niente inviti per "Just me" | `architettura.md` diceva "creati dai membri", ma RF1.3 (fonte di verità) assegna la gestione dei membri a chi ha creato la galassia |
| 2026-11-10 | DB | Profilo, galassia "Just me", membership dell'owner e sfere predefinite nascono da trigger (`auth.users` → `profiles` → `galaxies`) | Farlo nella server action: non atomico, e il seed/test dovrebbero duplicare la logica |
| 2026-11-10 | DB | Colori salvati come **chiave di palette** (`amber`, `teal`…) con check constraint, non come esadecimali | RD2.2: l'utente sceglie solo dalla palette; i valori chiaro/scuro stanno in `tokens.ts` |
| 2026-11-10 | Font   | DM Sans per testo/UI (non Inter)                                                | Il prototipo Figma usa DM Sans; prevale sui requisiti          |
| 2026-11-10 | Auth   | Login username + password con email sintetica `<username>@users.ourworld.local` | Supabase Auth richiede un'email; il Figma mostra solo username |
| 2026-11-10 | Inviti | Link condivisibile monouso con scadenza 7 giorni                                | Email rinviata al backlog: richiede SMTP                       |
| 2026-11-10 | Scope  | Smistamento AI della sfera Random rinviato alla fase 2                          | Deciso con Albi                                                |
