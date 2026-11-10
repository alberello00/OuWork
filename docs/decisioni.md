# OurWorld — Registro delle decisioni

Una riga o due per decisione non ovvia presa durante lo sviluppo. Le più recenti in alto.

| Data       | Area   | Decisione                                                                       | Alternative scartate / motivo                                  |
| ---------- | ------ | ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 2026-11-10 | Universo | `spheres.x/y` sono il **centro** del pianeta | Angolo in alto a sinistra: cambiando dimensione (più elementi) il pianeta si sposterebbe |
| 2026-11-10 | Universo | Clic su un pianeta = pannello "Sphere index"; doppio clic = entra | Clic = entra: il pannello del frame `7:2` non avrebbe un modo naturale di aprirsi |
| 2026-11-10 | Universo | Universo della galassia con React Flow (come la tela) | Canvas/SVG a mano: pan, zoom, drag e touch da riscrivere |
| 2026-11-10 | Tela | Clic singolo su uno spazio vuoto apre un piccolo menu del tipo (non crea subito) | Doppio clic: il Figma dice "Click anywhere to add". Creare al clic: troppe note vuote per sbaglio |
| 2026-11-10 | Tela | Un solo tipo di nodo React Flow (`item`) che usa `ItemCard`, invece di tre nodi | Tre nodi duplicherebbero drag, selezione e zoom semantico; la card cambia già layout per tipo |
| 2026-11-10 | Tela | Le annotazioni stanno in un `ViewportPortal` sopra le card; nuove annotazioni vanno nella sotto-sfera filtrata, altrimenti nella sfera | SVG separato sincronizzato a mano con `useViewport`: più codice per lo stesso risultato |
| 2026-11-10 | Scope | Domanda aperta 1 dei requisiti (tela o elenco entrando in una sfera): tela su desktop, elenco su telefono, scelta ricordata nell'URL | Una sola vista predefinita per tutti i dispositivi |
| 2026-11-10 | UI | Il dettaglio di un elemento si apre con `?item=<id>` nell'URL, ovunque dentro una galassia | Stato locale: la ricerca (RF9.3) e i link condivisi non potrebbero aprire un elemento |
| 2026-11-10 | UX | Aprire una sfera la segna come vista subito, ma i badge NEW restano visibili fino a quando la si lascia | Segnarla alla chiusura: fragile su mobile. Toglierli subito: l'utente non vedrebbe mai cosa è nuovo |
| 2026-11-10 | UX | L'aggiunta rapida preseleziona la sfera in cui ci si trova; fuori da una galassia si sceglie la galassia (ricordata in `localStorage`) | Sempre Random: scomodo quando si aggiunge dentro una sfera |
| 2026-11-10 | Rotte | Notes è per galassia (`/g/<id>/notes`); `/notes` porta alla prima galassia condivisa | Notes globale su tutte le galassie: il frame `9:2` mostra una sola galassia |
| 2026-11-10 | UI | `<img>` normale (regola ESLint disattivata) invece di `next/image` | Signed URL di Storage e domini arbitrari delle anteprime richiederebbero `remotePatterns` per ognuno |
| 2026-11-10 | UI | Sfondi degli universi seguono il tema (puntini "carta" di giorno, cielo "notte" di notte) | Universi sempre scuri come nel Figma: l'interruttore tema (RF11.4) non avrebbe effetto lì; RD4.3 descrive entrambe le varianti |
| 2026-11-10 | UI | `accent-strong` (#C8431F) per i pulsanti con testo bianco; `accent` (#E4572E) resta per FAB e dettagli | Bianco su #E4572E ha contrasto 3,6:1, sotto AA (RD2.5) |
| 2026-11-10 | UI | Primitive scritte a mano in stile shadcn su Radix (`dialog`, `dropdown-menu`), più `sonner`, `cmdk`, `lucide-react`, `react-markdown` | CLI shadcn: interattiva e con più dipendenze del necessario |
| 2026-11-10 | Figma | UI basata su `docs/figma.md`: il Figma MCP ha esaurito le chiamate del piano Starter | Aggirare il limite o fare l'upgrade: decisione di Albi |
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
