# Frontend — regole per questa cartella

Riferimenti: `docs/requisiti-graphic-design.md` (RD) e `docs/figma.md` (frame e token).

## Design system

- Token in `src/app/globals.css` dentro `@theme`, con due set (`:root` chiaro "carta", `.dark` scuro "notte"). Nei componenti usa solo classi basate sui token (`bg-card`, `text-muted`, `border-border`...).
- Palette delle sfere: 8–10 colori fissi in `src/lib/tokens.ts`, ciascuno con variante chiara e scura (RD2.2). L'utente sceglie solo da lì, niente color picker libero.
- Font tramite `next/font`: Fraunces (titoli, con `"SOFT" 0, "WONK" 1`) e DM Sans (UI).
- Ogni sfera si riconosce da colore + emoji + nome, mai solo dal colore (RD10.2).

## Tela (`components/canvas/`)

- React Flow: un nodo custom per tipo di card (`NoteCard`, `LinkCard`, `ImageCard`), un edge custom bezier per i collegamenti.
- Posizioni: salva `x,y` al termine del drag con debounce (~400 ms) e aggiornamento ottimistico.
- Annotazioni: componente separato che disegna un `<svg>` sincronizzato con il viewport di React Flow (`useViewport`), tratti con `perfect-freehand`. Modalità strumento: seleziona / penna / freccia / sticker.
- Zoom semantico (RD6.2): sotto una soglia di zoom le card mostrano solo titolo e colore.
- Su mobile la tela deve essere almeno navigabile (pinch, pan); per consultare c'è la vista elenco.

## Movimento

- Micro-interazioni 150–250 ms, transizioni di scena 300–500 ms (RD7).
- Rispetta sempre `prefers-reduced-motion`: niente fluttuazioni, solo dissolvenze.

## Accessibilità

- Contrasto almeno AA in entrambi i temi, focus visibile, aree tattili ≥ 44×44 px.
- Le immagini usano la didascalia come `alt`.

## Prima di dire "fatto" su una UI

1. Confronta con lo screenshot del frame Figma corrispondente (`get_screenshot`).
2. Prova desktop e mobile (390 px), tema chiaro e scuro.
3. Prova con un utente che **non** è l'autore di un contenuto privato: non deve vederlo.
