# OurWorld — Riferimenti Figma

File: **ouniverse — prototype**
URL: https://www.figma.com/design/MKuQzfWUMfDdfQvOPzZF3v/ouniverse-%E2%80%94-prototype
`fileKey`: `MKuQzfWUMfDdfQvOPzZF3v` · pagina `0:1`

Il file non ha variabili Figma e i layer si chiamano quasi tutti "Container": sembra generato da codice. Per i valori usa `get_design_context` sul frame e confrontali con i token qui sotto.

## Mappa dei frame

### Desktop (1120 px di larghezza, tranne dove indicato)

| node-id | Schermata | Tema | Note |
|---|---|---|---|
| `2:2` | Login "Our little universe." | chiaro + illustrazione scura | Username + password, "Invite only. No public sign-up." |
| `3:2` | Universo delle galassie | scuro | Riquadri per galassia (Lola & Alberto, Friends, Ingegno, Just me, Family, Book club) con membri e badge novità; banner "Since your last visit"; legenda in basso |
| `4:2` | Universo delle galassie + selettore aperto | scuro | Menu "All galaxies": elenco galassie con membri e "New galaxy" |
| `1:2` | Universo delle galassie + ricerca ⌘K | scuro | Palette di ricerca con chip per sfera e risultati raggruppati |
| `5:2` | Universo di una galassia (Lola & Alberto) | scuro | Sfere-pianeta con sotto-sfere come lune, archi tra sfere, "Reorganize", FAB "+", interruttore tema |
| `6:2` | Universo di una galassia + ricerca | scuro | Come `1:2` ma dentro la galassia |
| `7:2` | Universo di una galassia + pannello "Sphere index" | scuro | Pannello laterale: nome sfera, conteggio, "+3 new", anteprima della tela |
| `8:2` | Universo di una galassia + modale "Since your last visit" | scuro | Elenco delle novità con sfera, autore e galassia |
| `9:2` | Vista Notes (griglia, 1120×1287) | chiaro | Una card per sfera: chip sotto-sfere, badge NEW, elementi privati "only me", Random con "Sorted into…" / "Waiting for a topic" |
| `15:2` | Tela della sfera Places (1280×900) | chiaro | Card nota/link/immagine-polaroid, collegamenti, tratti a mano, frecce, sticker emoji e foto, "Click anywhere to add", controlli zoom, FAB |

### Mobile (420×780 con cornice del telefono)

| node-id | Schermata |
|---|---|
| `10:2` | Universo delle galassie + banner novità |
| `11:2` | Selettore galassie aperto |
| `12:2` | Universo di una galassia, barra in basso: ricerca, tema, "+" |
| `13:2` | Ricerca (lista raggruppata per sfera, con sotto-sfera a destra) |
| `14:2` | Sphere index come bottom sheet: anteprima tela, sotto-sfere, elementi |

## Elementi visivi da notare

- Legenda dell'universo: dimensione = numero di elementi (radice quadrata) · linee = collegamenti tra elementi di sfere diverse · contorno tratteggiato = sfera vuota · lucchetto = sfera privata · badge giallo = novità.
- "move closer to see the sub-spheres": zoom semantico, le sotto-sfere compaiono come lune avvicinandosi.
- Card con striscia colorata in alto da 5 px (note), immagine di testata con gradiente (link senza immagine), polaroid ruotata ±1–7° (immagini).
- Sticker: emoji 44 px o foto 96 px ruotate, con ombra.

## Design token estratti (tema chiaro, da `2:2` e `15:2`)

| Token | Valore | Uso |
|---|---|---|
| `bg` | `#FAF6EF` | Sfondo app / tela |
| `surface-2` | `#F3EDE2` | Barra superiore, chip |
| `card` | `#FFFDF8` | Card, pulsanti secondari |
| `border` | `#E2DACB` | Bordi di card, input, chip |
| `dot-grid` | `#D6CDBD` | Puntini della griglia della tela |
| `text` | `#2B2A33` | Testo principale |
| `text-muted` | `#6B6872` | Testo secondario |
| `placeholder` | `#757575` | Placeholder degli input |
| `accent` | `#E4572E` | Pulsante primario, FAB (ombra `0 8 11 rgba(228,87,46,.45)`) |
| `new-bg` / `new-text` | `#F7D774` / `#7A5A00` | Badge NEW |
| `user-lola` | `#D9467A` | Colore personale (avatar "L") |
| `user-alberto` | `#2F8F83` | Colore personale (avatar "A") |
| `card-stripe` | `#C7A96C` | Striscia delle note in Places |
| `sphere-places` | `#FFD98A` | Pallino della sfera Places |

Tema scuro (`2:2`, illustrazione): gradiente radiale `#2A2C5C` → `#1F2144` → `#14152B`. **Superfici, bordi e testi del tema scuro vanno estratti** da `3:2` / `5:2` con `get_design_context`.

Forme e ombre:
- Raggio card/input: **12 px**; pill/chip: **99 px**; contenitore login: 20 px.
- Ombra card: `0 6px 18px rgba(80,60,30,0.12)`.
- Controlli zoom: cerchi 32 px con alone `0 0 14px 2px rgba(247,215,116,0.28)`.
- Card sulla tela: larghezza **240 px**, padding 12/14 px.

Tipografia:
- Titoli: **Fraunces** Regular con `font-variation-settings: "SOFT" 0, "WONK" 1`. Login 40/44; nome sfera 20; titolo card 15/18.75.
- Testo/UI: **DM Sans** (`opsz` 14). Corpo 13/19.5; testo card 11/16.5; meta 11.5; badge 10 Bold; pulsanti 11–12 Medium/Bold.

> Nota: i requisiti di design citavano Inter come esempio; il prototipo usa **DM Sans** e vale il prototipo.

## Setup Figma MCP in Claude Code

```bash
claude mcp add --transport http figma https://mcp.figma.com/mcp
```

Poi in Claude Code: `/mcp` → autentica Figma. Le URL degli asset restituite dal MCP scadono dopo 7 giorni: scarica in `public/` gli asset statici che ti servono.
