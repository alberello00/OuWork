# OurWorld — Requisiti di graphic design (MVP)

> **Documento ereditato da OurWorld.** Per OuWork vale solo dove non è contraddetto da `docs/requisiti-ouwork.md` (nomenclatura: galassia = workspace, sfera = board, Random = Inbox). I vincoli sui dati di produzione di OurWorld non si applicano.

_Sessione 1 — 9 novembre 2026. Da leggere insieme a `requisiti-funzionali-mvp.md`. Dove il prototipo Figma è più specifico (es. font DM Sans), vale il prototipo: vedi `figma.md`._

## Direzione visiva in una riga
Un **piccolo universo intimo**: le sfere sono pianeti/bolle che galleggiano su una tela, ma il tono è caldo e personale — più quaderno condiviso che plancia spaziale. Ispirazione: la libertà di Miro, la quiete di Obsidian, il calore di un album di ricordi.

## Principi
1. **Il contenuto è il protagonista**: interfaccia sobria, colore riservato a sfere ed elementi.
2. **Caldo, non freddo**: niente estetica sci-fi/tech; forme morbide, toni carta e notte.
3. **Riconoscibile a colpo d'occhio**: ogni sfera si distingue per colore + emoji + nome, mai per colore soltanto.
4. **Calmo**: animazioni morbide e brevi, niente notifiche urlate o badge rossi.

## RD1 — Identità
- RD1.1 Logo/wordmark "OurWorld" semplice: due cerchi che si sovrappongono (i due utenti) o un piccolo pianeta. Deve funzionare come icona app/PWA a 512 px e a 32 px (favicon).
- RD1.2 Ogni utente ha un **colore personale** e un avatar (iniziale o foto) usati per mostrare chi ha creato un elemento (RF1.4).

## RD2 — Palette
- RD2.1 **Due temi**, chiaro e scuro, entrambi di prima classe:
  - Chiaro "carta": sfondo crema caldo (~`#FAF6EF`), testo inchiostro (~`#2B2A33`).
  - Scuro "notte": sfondo blu notte profondo (~`#14152B`), testo avorio (~`#EDE8DF`). La vista universo rende al meglio qui.
- RD2.2 **Palette sfere**: 8–10 colori curati e saturi-ma-morbidi (es. corallo, ambra, salvia, verde acqua, cielo, lavanda, rosa antico, terracotta), ognuno definito in due varianti (chiaro/scuro). L'utente sceglie solo da questa palette, non da un color picker libero (RF2.1), così l'insieme resta armonioso.
- RD2.3 Colori neutri per UI (bordi, superfici, testi secondari) in 5–6 gradini per tema; un unico colore d'accento per le azioni primarie (pulsante "+").
- RD2.4 Colori semantici minimi: errore, conferma, avviso (servono per la conferma di eliminazione, RF2.5).
- RD2.5 Contrasto testo/sfondo almeno WCAG AA (4.5:1 per testo normale) in entrambi i temi.

## RD3 — Tipografia
- RD3.1 Due famiglie al massimo:
  - **Titoli**: una serif o "soft serif" con carattere (es. Fraunces, Recoleta) per nomi delle sfere e titoli delle note — dà il tono personale.
  - **Testo e UI**: una sans leggibile (es. Inter, DM Sans).
- RD3.2 Scala tipografica di 5–6 livelli; corpo del testo 16 px su mobile.
- RD3.3 Il markdown delle note (RF3.1) ha uno stile curato: titoli, liste, citazioni, link, codice inline.

## RD4 — Sfere (vista universo)
- RD4.1 Ogni sfera è un cerchio con **gradiente radiale morbido** nel suo colore, un leggero alone/glow e l'emoji al centro; il nome sta sotto o dentro.
- RD4.2 Il diametro cresce con il numero di elementi (RF2.3) in modo **non lineare** (es. radice quadrata), con un minimo e un massimo, così le sfere piccole restano cliccabili e le grandi non invadono tutto.
- RD4.3 Sfondo dell'universo: tema scuro con leggere stelle/puntini o grana; tema chiaro con puntini tenui.
- RD4.4 I collegamenti tra sfere (RF7.2) sono archi sottili e semitrasparenti; lo spessore può indicare quanti collegamenti ci sono.
- RD4.5 Stati: riposo, hover (leggero ingrandimento + glow), selezionata, vuota (contorno tratteggiato).

## RD5 — Card degli elementi
- RD5.1 Linguaggio comune: angoli arrotondati (~12 px), ombra morbida, larghezza fissa sulla tela (es. 240 px), un **segno del colore della sfera** (bordo sinistro o striscia in alto) e il mini-avatar dell'autore.
- RD5.2 Un layout per tipo (RF3.1):
  - **Nota**: titolo in serif + 3–4 righe di anteprima del testo.
  - **Link**: immagine di anteprima in alto, titolo, dominio con favicon. Fallback curato se l'anteprima manca (colore della sfera + dominio grande).
  - **Immagine**: l'immagine a tutta card, didascalia facoltativa; sembra una polaroid/foto attaccata.
- RD5.3 Stati: riposo, hover, selezionata, in trascinamento (ombra più alta, leggera inclinazione), in caricamento.
- RD5.4 Il dettaglio (clic sulla card) si apre come pannello laterale su desktop e come foglio a tutto schermo su mobile; in fondo mostra i collegamenti in entrata/uscita (RF7.3).

## RD6 — Tela e collegamenti
- RD6.1 Sfondo a **griglia di puntini** discreta, che si adatta allo zoom.
- RD6.2 **Zoom semantico**: da lontano le card mostrano solo titolo e colore; da vicino tutto il contenuto. Evita il rumore visivo con molti elementi.
- RD6.3 I collegamenti tra card (RF7.2) sono curve morbide (bezier), nel colore neutro o della sfera d'origine, con evidenza al passaggio del mouse sulla card.
- RD6.4 Controlli di zoom/"centra tutto" piccoli e raccolti in un angolo; minimappa facoltativa.
- RD6.5 Il clic/doppio clic su un punto vuoto (RF5.3) mostra un piccolo menu radiale o a comparsa per scegliere il tipo.

## RD7 — Movimento
- RD7.1 Durate brevi: 150–250 ms per le micro-interazioni, 300–500 ms per le transizioni di scena.
- RD7.2 Transizione firma: **entrare in una sfera** = zoom dentro il pianeta che si apre nella sua tela; uscire = zoom indietro. È il momento "wow" dell'app.
- RD7.3 Le sfere nell'universo possono avere un fluttuare lentissimo, disattivabile.
- RD7.4 Rispettare `prefers-reduced-motion`: niente fluttuazioni, transizioni ridotte a dissolvenze.

## RD8 — Mobile e layout
- RD8.1 Mobile first per aggiunta rapida, ricerca e consultazione (RF10.2).
- RD8.2 Pulsante "+" fisso (FAB) in basso a destra; il form rapido (RF10.1) si apre come **bottom sheet** con scelta tipo, contenuto e sfera (le sfere come chip colorate con emoji).
- RD8.3 Navigazione mobile: barra in basso con Cerca, interruttore tema, "+" (come nel frame `12:2`).
- RD8.4 Su mobile la sfera ha, oltre alla tela, una **vista elenco/griglia** di card, più comoda da consultare con il dito.
- RD8.5 Aree tattili di almeno 44×44 px; gesti standard (pinch per zoom, trascinamento con due dita o a vuoto per il pan).
- RD8.6 Punti di rottura: mobile (<640 px), tablet (640–1024 px), desktop (>1024 px).

## RD9 — Ricerca, vuoti, feedback
- RD9.1 Ricerca come palette di comando (scorciatoia ⌘K / Ctrl+K su desktop) con risultati raggruppati per sfera e filtri a chip (RF9.2).
- RD9.2 **Stati vuoti** con piccola illustrazione e frase affettuosa (es. sfera vuota, ricerca senza risultati, primo avvio).
- RD9.3 Conferme e messaggi come toast discreti in basso; la conferma di eliminazione di una sfera (RF2.5) è un dialogo modale chiaro.

## RD10 — Accessibilità
- RD10.1 Contrasti AA, focus visibile da tastiera su tutti gli elementi interattivi.
- RD10.2 Informazione mai affidata solo al colore (sfera = colore + emoji + nome).
- RD10.3 Testo alternativo per le immagini caricate (didascalia riusabile come alt).

## RD11 — Design system e consegne
- RD11.1 Tutto definito come **design token** (colori per tema, palette sfere, tipografia, spaziature su base 4/8 px, raggi, ombre, durate) per tenere coerenti design e codice.
- RD11.2 Componenti base: pulsante, input, chip sfera, avatar, card ×3 tipi, sfera, linea di collegamento, bottom sheet, pannello laterale, modale, toast, barra di ricerca.
- RD11.3 Schermate chiave: vedi la mappa dei frame in `figma.md`.

## Domande aperte di design
1. Tema predefinito: chiaro "carta" o scuro "notte"? (Oppure segue il sistema.) Il prototipo usa lo scuro per gli universi e il chiaro per tela e Notes.
2. Stile delle illustrazioni degli stati vuoti: disegnate a mano, geometriche o solo emoji?
3. Le sfere restano cerchi "puliti" o diventano pianeti più ricchi (texture, anelli) man mano che si riempiono?
