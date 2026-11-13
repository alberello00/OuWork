"""Generates the three OuWork logo proposals (RW2.8) and docs/logo/preview.html.

Usage: python3 docs/logo/generate.py docs/logo
Every mark is drawn on a 64x64 grid. Colours are the accent and the neutrals
planned for the RW2.1 tokens.
"""
import sys

out = sys.argv[1] if len(sys.argv) > 1 else '.'

ACCENT, ACCENT_DARK = '#4F46E5', '#8B8DF8'      # indigo: on light / on dark
INK, PAPER = '#18181B', '#FFFFFF'                # light theme text / background
SLATE, SLATE_TEXT = '#16181D', '#F4F4F5'         # dark theme background / text


def linked(c1, c2, uid):
    """A — Linked boards: two boards, one in front of the other, joined at the overlap."""
    return f'''<defs>
    <mask id="{uid}-gap" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
      <rect width="64" height="64" fill="#fff"/>
      <rect x="21" y="21" width="42" height="42" rx="11" fill="#000"/>
    </mask>
  </defs>
  <rect x="7" y="7" width="32" height="32" rx="8" fill="none" stroke="{c2}" stroke-width="6" mask="url(#{uid}-gap)"/>
  <rect x="25" y="25" width="34" height="34" rx="8" fill="{c1}"/>'''


def frame(c1, c2, uid):
    """B — Board O: the O of OuWork as a board frame, with one item (or one person) on it."""
    return f'''<defs>
    <mask id="{uid}-ring" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
      <rect width="64" height="64" fill="#fff"/>
      <circle cx="47" cy="47" r="14.5" fill="#000"/>
    </mask>
  </defs>
  <rect x="10" y="10" width="40" height="40" rx="12" fill="none" stroke="{c2}" stroke-width="9" mask="url(#{uid}-ring)"/>
  <circle cx="47" cy="47" r="9.5" fill="{c1}"/>'''


def spark(c1, c2, uid):
    """C — Boards + spark: three boards on a grid, the fourth cell is the AI wand's spark."""
    cx, cy, r, k = 46.5, 17.5, 11.5, 2.2
    star = (f'M{cx} {cy - r}Q{cx + k} {cy - k} {cx + r} {cy}Q{cx + k} {cy + k} {cx} {cy + r}'
            f'Q{cx - k} {cy + k} {cx - r} {cy}Q{cx - k} {cy - k} {cx} {cy - r}Z')
    return f'''<rect x="5" y="5" width="25" height="25" rx="6.5" fill="{c2}"/>
  <rect x="5" y="34" width="25" height="25" rx="6.5" fill="{c2}"/>
  <rect x="34" y="34" width="25" height="25" rx="6.5" fill="{c2}"/>
  <path d="{star}" fill="{c1}" stroke="{c1}" stroke-width="2.5" stroke-linejoin="round"/>'''


PROPOSALS = [
    ('a-linked-boards', 'A — Linked boards', linked,
     'Due board, uno davanti all\'altro, che si toccano: i collegamenti tra board sono il cuore di OuWork. '
     'Il più semplice dei tre: due forme, regge bene a 16 px.'),
    ('b-board-o', 'B — Board O', frame,
     'La "O" di OuWork è la cornice di un board; il punto è un item, o un collega presente sul board. '
     'Si legge come lettera e come oggetto, ed è il più vicino a un monogramma.'),
    ('c-boards-spark', 'C — Boards + spark', spark,
     'Tre board su una griglia; al posto del quarto, la scintilla della bacchetta AI. '
     'Racconta tutto il prodotto, ma a 16 px la scintilla è il dettaglio più fragile.'),
]


def svg(inner, size=64):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="{size}" height="{size}">\n  {inner}\n</svg>'


def icon(fn, uid, size=512):
    """App icon: white mark on the accent, rounded square (maskable-safe padding)."""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="{size}" height="{size}">\n'
            f'  <rect width="512" height="512" rx="112" fill="{ACCENT}"/>\n'
            f'  <svg x="112" y="112" width="288" height="288" viewBox="0 0 64 64">\n  {fn("#FFFFFF", "#FFFFFF", uid)}\n  </svg>\n</svg>')


files = {}
for slug, _, fn, _ in PROPOSALS:
    files[f'{slug}.svg'] = svg(fn(ACCENT, INK, slug))
    files[f'{slug}-dark.svg'] = svg(fn(ACCENT_DARK, SLATE_TEXT, slug + '-d'))
    files[f'{slug}-mono.svg'] = svg(fn('currentColor', 'currentColor', slug + '-m'))
    files[f'{slug}-icon.svg'] = icon(fn, slug + '-i')
for name, content in files.items():
    open(f'{out}/{name}', 'w').write(content + '\n')

# ── preview page ────────────────────────────────────────────────────────────
SIZES = [512, 192, 32, 16]
n = 0


def mark(fn, c1, c2, size):
    global n
    n += 1
    return svg(fn(c1, c2, f'p{n}'), size)


def app_icon(fn, size):
    global n
    n += 1
    return icon(fn, f'p{n}', size)


def panel(fn, theme):
    dark = theme == 'dark'
    c1, c2 = (ACCENT_DARK, SLATE_TEXT) if dark else (ACCENT, INK)
    mono = SLATE_TEXT if dark else INK
    rows = ''.join(f'<figure>{mark(fn, c1, c2, s)}<figcaption>{s} px</figcaption></figure>' for s in SIZES)
    monos = ''.join(f'<figure>{mark(fn, mono, mono, s)}<figcaption>mono {s}</figcaption></figure>' for s in [192, 32, 16])
    icons = ''.join(f'<figure>{app_icon(fn, s)}<figcaption>icona {s}</figcaption></figure>' for s in [192, 32, 16])
    lockup = f'<div class="lockup">{mark(fn, c1, c2, 28)}<span>OuWork</span></div>'
    return (f'<div class="panel {theme}"><h3>{"Tema scuro" if dark else "Tema chiaro"}</h3>'
            f'<div class="row">{rows}</div><div class="row small">{monos}{icons}</div>{lockup}</div>')


sections = ''.join(
    f'<section><h2>{title}</h2><p>{why}</p>{panel(fn, "light")}{panel(fn, "dark")}</section>'
    for _, title, fn, why in PROPOSALS)

html = f'''<!doctype html>
<html lang="it">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OuWork — proposte di logo</title>
<style>
  body {{ margin: 0; padding: 32px 24px 64px; font: 14px/1.5 Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; color: {INK}; background: #F4F4F5; }}
  main {{ max-width: 1100px; margin: 0 auto; }}
  h1 {{ font-size: 22px; margin: 0 0 4px; }}
  h2 {{ font-size: 17px; margin: 40px 0 4px; }}
  h3 {{ font-size: 11px; letter-spacing: .06em; text-transform: uppercase; margin: 0 0 16px; opacity: .6; }}
  p {{ margin: 0 0 16px; max-width: 70ch; color: #52525B; }}
  .panel {{ border: 1px solid #E4E4E7; border-radius: 8px; padding: 20px; margin-bottom: 12px; overflow-x: auto; }}
  .panel.light {{ background: {PAPER}; color: {INK}; }}
  .panel.dark {{ background: {SLATE}; color: {SLATE_TEXT}; border-color: #2A2D35; }}
  .row {{ display: flex; align-items: flex-end; gap: 32px; }}
  .row.small {{ margin-top: 24px; gap: 28px; }}
  figure {{ margin: 0; display: flex; flex-direction: column; align-items: center; gap: 8px; }}
  figcaption {{ font-size: 11px; opacity: .6; white-space: nowrap; }}
  .lockup {{ display: flex; align-items: center; gap: 9px; margin-top: 24px; font-size: 20px; font-weight: 600; letter-spacing: -0.01em; }}
</style>
<main>
  <h1>OuWork — tre proposte di logo (RW2.8)</h1>
  <p>Vincoli: geometrico, sobrio, leggibile a 16 px. Colori: l'accento indaco dei nuovi token e i neutri del tema. Ogni proposta è mostrata a 512, 192, 32 e 16 px su tema chiaro e scuro, in monocromo, come icona dell'app e accanto al nome.</p>
  {sections}
</main>
</html>
'''
open(f'{out}/preview.html', 'w').write(html)
print(f'wrote {len(files)} svg files and preview.html to {out}')
