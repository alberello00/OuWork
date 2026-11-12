# OurWorld — Requisiti funzionali minimi (MVP)

> **Documento ereditato da OurWorld.** Per OuWork vale solo dove non è contraddetto da `docs/requisiti-ouwork.md` (nomenclatura: galassia = workspace, sfera = board, Random = Inbox). I vincoli sui dati di produzione di OurWorld non si applicano.

_Sessione 1 — 9 novembre 2026 · Aggiornato il 10 novembre 2026 dopo la revisione del prototipo Figma "ouniverse"._

## Visione in una riga
Uno spazio condiviso, molto visivo: una tela infinita in stile Miro con i contenuti raggruppati in **sfere** (ambiti tematici) e collegabili tra loro in stile Obsidian. Lo spazio nasce per noi due, ma si può aprire ad altre "galassie" con altre persone o solo per sé.

## Concetti base
- **Utente**: una persona con login personale.
- **Galassia**: uno spazio condiviso con un gruppo di membri (es. "Lola & Alberto", "Book club"), oppure personale ("Just me"). Ogni utente può far parte di più galassie.
- **Sfera**: un ambito tematico dentro una galassia (es. Places, Music). È sia una categoria sia una "zona" visiva. Può avere **sotto-sfere** (es. Places → Italy / Abroad).
- **Elemento**: il singolo contenuto (nota, link, immagine) che vive dentro una sfera.
- **Collegamento**: una relazione esplicita tra due elementi, anche se stanno in sfere diverse.
- **Annotazione**: un segno libero sulla tela (tratto a mano, freccia, sticker) che non è un elemento.

## Requisiti funzionali MVP

### RF1 — Accesso, galassie e membri
- RF1.1 Nessuna registrazione pubblica: si entra solo tramite invito a una galassia. Nell'MVP l'invito è un **link condivisibile** (monouso, con scadenza); login con **username + password**.
- RF1.2 Un utente può creare galassie, dare loro un nome e invitare membri. Alla creazione dell'account si ottiene una galassia personale "Just me".
- RF1.3 Dentro una galassia tutti i membri hanno gli stessi permessi sui contenuti condivisi; chi l'ha creata gestisce i membri (invita/rimuove) e può eliminarla.
- RF1.4 Ogni elemento registra chi l'ha creato e quando, mostrato con avatar/iniziale e colore personale.
- RF1.5 Vista "universo delle galassie": tutte le galassie dell'utente come riquadri con le loro sfere in miniatura, i membri e un badge con il numero di novità. Un selettore "All galaxies" permette di filtrare o entrare in una galassia.

### RF2 — Sfere e sotto-sfere
- RF2.1 Si possono creare, rinominare, ricolorare (colore dalla palette + emoji) ed eliminare le sfere.
- RF2.2 Alla creazione di una galassia ci sono sfere predefinite: Places, Music, Movies & Shows, Ideas, Memories, Random.
- RF2.3 Vista universo della galassia: le sfere appaiono come bolle sulla tela, con dimensione proporzionale (radice quadrata) al numero di elementi.
- RF2.4 Quando si entra in una sfera si apre la sua tela con gli elementi che contiene.
- RF2.5 Prima di eliminare una sfera che contiene elementi viene chiesta una conferma, e si sceglie se spostarli o cancellarli.
- RF2.6 Una sfera può avere sotto-sfere (un solo livello). Le sotto-sfere appaiono come chip con conteggio (es. "Italy · 14") e filtrano la tela o l'elenco della sfera madre.
- RF2.7 La sfera **Random** è la "inbox": raccoglie ciò che si aggiunge senza scegliere una sfera. Gli elementi mostrano "in attesa di una sfera" finché non vengono spostati a mano. (Lo smistamento automatico è in fase 2.)

### RF3 — Elementi
- RF3.1 Tipi minimi:
  - **Nota**: titolo + testo in markdown.
  - **Link**: URL con anteprima automatica (titolo, immagine, dominio).
  - **Immagine**: caricata da dispositivo, con didascalia facoltativa.
- RF3.2 Gli elementi si possono creare, modificare ed eliminare.
- RF3.3 Un elemento si può spostare da una sfera (o sotto-sfera) all'altra, dentro la stessa galassia.
- RF3.4 Ogni elemento appare come card sulla tela, con un'anteprima compatta; il clic apre il dettaglio.

### RF4 — Privacy
- RF4.1 Una sfera o un singolo elemento può essere segnato come **privato ("solo io")**: lo vede solo chi l'ha creato, anche se sta in una galassia condivisa.
- RF4.2 Gli elementi di una sfera privata sono privati per costruzione.
- RF4.3 Il contenuto privato è mostrato con un lucchetto e la dicitura "only me", ed è escluso da ricerca, conteggi, novità ed export degli altri membri.

### RF5 — Tela (stile Miro)
- RF5.1 Si naviga con pan e zoom.
- RF5.2 Le card si trascinano liberamente e la posizione viene salvata.
- RF5.3 Il clic/doppio clic su un punto vuoto crea un nuovo elemento in quel punto.

### RF6 — Annotazioni sulla tela
- RF6.1 Si può disegnare a mano libera sulla tela (tratti con colore e spessore), ad esempio per cerchiare o sottolineare.
- RF6.2 Si possono aggiungere frecce e **sticker** (emoji o piccole immagini) liberi sulla tela.
- RF6.3 Le annotazioni si salvano con posizione e autore, si possono spostare ed eliminare.

### RF7 — Collegamenti (stile Obsidian)
- RF7.1 Si può collegare manualmente un elemento a un altro, anche di un'altra sfera della stessa galassia.
- RF7.2 Sulla tela i collegamenti sono linee tra le card; nella vista universo compaiono come linee tra le sfere.
- RF7.3 Il dettaglio di un elemento mostra l'elenco dei collegamenti (in entrata e in uscita).

### RF8 — Novità dall'ultima visita
- RF8.1 Per ogni utente si registra cosa ha già visto. Gli elementi creati o modificati da altri dopo l'ultima visita hanno il badge **NEW**.
- RF8.2 All'apertura un banner riassume "dall'ultima visita": numero di nuovi elementi, da chi, in quante galassie. Si può chiudere.
- RF8.3 Sfere e galassie con novità hanno un badge; aprire un elemento (o la sfera) lo segna come visto.

### RF9 — Ricerca e viste elenco
- RF9.1 La ricerca testuale (⌘K) copre titolo, testo e URL degli elementi visibili all'utente.
- RF9.2 I risultati sono raggruppati per sfera e si possono filtrare per sfera (chip) e per galassia.
- RF9.3 Un clic su un risultato apre la sfera e centra la tela sull'elemento.
- RF9.4 Vista **Notes** (desktop e mobile): una griglia con una colonna per sfera, che mostra gli ultimi elementi, i chip delle sotto-sfere e i badge NEW. È l'alternativa alla tela per la consultazione.

### RF10 — Aggiunta rapida e mobile
- RF10.1 Un pulsante "+" sempre visibile apre un form rapido (tipo, contenuto, sfera facoltativa → altrimenti Random) senza passare dalla tela.
- RF10.2 L'app è usabile da telefono: universo delle galassie, aggiunta rapida, ricerca e consultazione. La tela su mobile deve essere almeno navigabile.

### RF11 — Sincronizzazione e dati
- RF11.1 Le modifiche di un membro compaiono agli altri senza perdita di dati. Per l'MVP basta l'aggiornamento al refresh o un polling; il tempo reale non è richiesto.
- RF11.2 I dati sono persistenti lato server.
- RF11.3 Si può esportare una galassia (i contenuti visibili all'utente) in JSON o markdown, come backup.
- RF11.4 Tema chiaro "carta" e scuro "notte" con interruttore.

## Fase 2 (subito dopo l'MVP)
- **Smistamento AI** della sfera Random: un LLM propone o assegna la sfera ("Sorted into Places"), con possibilità di correggere.

## Fuori dall'MVP (backlog)
- Inviti via email
- Tag trasversali alle sfere
- Stato per elemento (es. "visitato", "ascoltata") e campi specifici per sfera
- Mappa per la sfera Places
- Embed Spotify/YouTube per le canzoni
- Condivisione da altre app del telefono (share target PWA)
- Collaborazione in tempo reale con cursori live
- Vista a grafo globale stile Obsidian
- Commenti e reazioni sugli elementi
- Link `[[wiki]]` dentro il testo delle note
- Sotto-sfere su più livelli

## Domande chiuse
- Sotto-sfere: **sì**, un livello (RF2.6).
- Contenuti privati: **sì**, a livello di sfera ed elemento (RF4).
- Inviti: **link condivisibile** nell'MVP, email nel backlog (RF1.1).

## Domande aperte
1. Entrando in una sfera, la vista predefinita è la tela o l'elenco? Il prototipo le prevede entrambe.
2. Si useranno più da telefono o da computer?
