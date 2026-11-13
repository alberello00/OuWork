# Frontend — regole per questa cartella

Riferimenti: RW2 in `docs/requisiti-ouwork.md` (design di OuWork). `docs/requisiti-graphic-design.md` (RD) vale per stati, accessibilità e mobile dove RW2 non dice altro.

> Fino alla fine della fase W1 il codice ha ancora token, font e componenti di OurWorld (carta/notte, Fraunces, pianeti): le regole qui sotto descrivono l'obiettivo di RW2.

## Design system

- Token in `src/app/globals.css` dentro `@theme`: tema chiaro predefinito, tema scuro grigio-ardesia, scala di neutri a 10 gradini, un solo colore d'accento, colori semantici (RW2.1). Nei componenti usa solo classi basate sui token.
- Palette dei board: 8 colori poco saturi in `src/lib/tokens.ts`, usati come etichetta (bordo o pallino), non come riempimento. Niente color picker libero.
- Font tramite `next/font`: una sola famiglia sans per tutto e una monospazio per codice e ID. Niente serif. Corpo 14 px su desktop, 16 px su mobile (RW2.2).
- Ogni board si riconosce da colore + emoji + nome, mai solo dal colore.
- Nell'interfaccia si dice Workspace / Board / Sub-board / Item / Inbox; nel codice dei dati restano `galaxy` / `sphere`.

## Tela (`components/canvas/`)

- React Flow: un nodo custom per tipo di card (`NoteCard`, `LinkCard`, `ImageCard`), un edge custom bezier per i collegamenti.
- Posizioni: salva `x,y` al termine del drag con debounce (~400 ms) e aggiornamento ottimistico.
- Annotazioni: componente separato che disegna un `<svg>` sincronizzato con il viewport di React Flow (`useViewport`), tratti con `perfect-freehand`. Toolbar flottante: select, note, link, image, connector, pen, arrow, sticker (RW2.5).
- Zoom semantico (RD6.2): sotto una soglia di zoom le card mostrano solo titolo e colore.
- Su mobile la tela deve essere almeno navigabile (pinch, pan); per consultare c'è la vista elenco.

## Movimento

- Movimento sobrio: 120–200 ms, nessuna transizione di scena elaborata (RW2.6).
- Rispetta sempre `prefers-reduced-motion`: solo dissolvenze.

## Accessibilità

- Contrasto almeno AA in entrambi i temi, focus visibile, aree tattili ≥ 44×44 px.
- Le immagini usano la didascalia come `alt`.

## Prima di dire "fatto" su una UI

1. Confronta con RW2: niente stelle, glow, serif o colori pieni dei board.
2. Prova desktop e mobile (390 px), tema chiaro e scuro.
3. Prova con un utente che **non** è l'autore di un contenuto privato: non deve vederlo.
