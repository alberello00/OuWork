import math, sys
out = sys.argv[1]

# design tokens (src/app/globals.css) — the only colours used
PINK, TEAL, YELLOW = '#D9467A', '#2F8F83', '#F7D774'
PAPER, INK = '#FAF6EF', '#2B2A33'
NIGHT1, NIGHT2, NIGHT3, NIGHT_TEXT = '#2A2C5C', '#1F2144', '#14152B', '#EDE8DF'

def orbit(c1, c2, c3, uid):
    """A — Shared orbit: one planet, one orbit, a companion travelling on it."""
    t = math.radians(-38)
    mx, my = 32 + 29 * math.cos(t), 32 + 7 * math.sin(t)
    return f'''<defs>
    <mask id="{uid}-back" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
      <rect width="64" height="64" fill="#fff"/>
      <circle cx="32" cy="32" r="18.6" fill="#000"/>
    </mask>
    <mask id="{uid}-planet" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
      <rect width="64" height="64" fill="#fff"/>
      <path d="M3 32A29 7 0 0 0 61 32" transform="rotate(-24 32 32)" fill="none" stroke="#000" stroke-width="8.4"/>
    </mask>
  </defs>
  <g transform="rotate(-24 32 32)" fill="none" stroke="{c2}" stroke-width="4" stroke-linecap="round">
    <ellipse cx="32" cy="32" rx="29" ry="7" mask="url(#{uid}-back)"/>
  </g>
  <circle cx="32" cy="32" r="16" fill="{c1}" mask="url(#{uid}-planet)"/>
  <g transform="rotate(-24 32 32)">
    <path d="M3 32A29 7 0 0 0 61 32" fill="none" stroke="{c2}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="{mx:.2f}" cy="{my:.2f}" r="5.2" fill="{c3}"/>
  </g>'''

def conjunction(c1, c2, c3, uid, mono=False):
    """B — Conjunction: two planets meeting; where they overlap, a new light."""
    if mono:
        return f'''<defs>
    <mask id="{uid}-gap" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
      <rect width="64" height="64" fill="#fff"/>
      <circle cx="42.5" cy="23.5" r="16" fill="#000"/>
    </mask>
  </defs>
  <circle cx="26" cy="37" r="20" fill="{c1}" mask="url(#{uid}-gap)"/>
  <circle cx="42.5" cy="23.5" r="13" fill="{c1}"/>'''
    return f'''<defs>
    <clipPath id="{uid}-big"><circle cx="26" cy="37" r="20"/></clipPath>
  </defs>
  <circle cx="26" cy="37" r="20" fill="{c1}"/>
  <circle cx="42.5" cy="23.5" r="13" fill="{c2}"/>
  <circle cx="42.5" cy="23.5" r="13" fill="{c3}" clip-path="url(#{uid}-big)"/>'''

def oplanet(c1, c2, uid):
    """C — The O of OurWorld is an orbit, with a small world on it."""
    a = math.radians(-42)
    px, py = 32 + 21 * math.cos(a), 32 + 21 * math.sin(a)
    return f'''<defs>
    <mask id="{uid}-ring" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
      <rect width="64" height="64" fill="#fff"/>
      <circle cx="{px:.2f}" cy="{py:.2f}" r="12.5" fill="#000"/>
    </mask>
  </defs>
  <circle cx="32" cy="32" r="21" fill="none" stroke="{c1}" stroke-width="10" mask="url(#{uid}-ring)"/>
  <circle cx="{px:.2f}" cy="{py:.2f}" r="8.6" fill="{c2}"/>'''

PROPOSALS = [
    ('a-shared-orbit', 'A — Shared orbit',
     'One planet and its companion on the same orbit: two of us, one path. The orbit passes in front of the planet, so it keeps some depth even when tiny.',
     lambda uid: orbit(PINK, TEAL, TEAL, uid), lambda uid: orbit('currentColor', 'currentColor', 'currentColor', uid)),
    ('b-conjunction', 'B — Conjunction',
     'The closest to today\'s two circles: two planets of different size meeting in the sky, and a warm light where they overlap.',
     lambda uid: conjunction(TEAL, PINK, YELLOW, uid), lambda uid: conjunction('currentColor', None, None, uid, mono=True)),
    ('c-o-planet', 'C — The O is a world',
     'The "O" of OurWorld drawn as an orbit seen from above, with a small world sitting on it. The simplest of the three; it also works as the first letter of the name.',
     lambda uid: oplanet(TEAL, PINK, uid), lambda uid: oplanet('currentColor', 'currentColor', uid)),
]

def svg(body, size=None, extra=''):
    dim = f' width="{size}" height="{size}"' if size else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"{dim}{extra}>\n  {body}\n</svg>'

def app_icon(body, uid):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="{uid}-sky" cx="50%" cy="38%" r="70%">
      <stop offset="0" stop-color="{NIGHT1}"/>
      <stop offset="0.55" stop-color="{NIGHT2}"/>
      <stop offset="1" stop-color="{NIGHT3}"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#{uid}-sky)"/>
  <circle cx="96" cy="104" r="5" fill="{NIGHT_TEXT}" opacity="0.7"/>
  <circle cx="420" cy="118" r="4" fill="{YELLOW}" opacity="0.8"/>
  <circle cx="404" cy="420" r="5" fill="{NIGHT_TEXT}" opacity="0.6"/>
  <svg x="96" y="96" width="320" height="320" viewBox="0 0 64 64">
  {body}
  </svg>
</svg>'''

sections = []
for slug, title, why, colour, mono in PROPOSALS:
    open(f'{out}/{slug}.svg', 'w').write(svg(colour(slug)) + '\n')
    open(f'{out}/{slug}-mono.svg', 'w').write(svg(mono(slug + '-m')) + '\n')
    open(f'{out}/{slug}-icon.svg', 'w').write(app_icon(colour(slug + '-i'), slug + '-i') + '\n')

    n = [0]
    def inst(fn, size):
        n[0] += 1
        return svg(fn(f'{slug}-{n[0]}'), size, f' role="img" aria-label="{title}, {size}px"')
    def row(fn, label):
        cells = ''.join(f'<figure>{inst(fn, s)}<figcaption>{s}</figcaption></figure>' for s in (512, 192, 32, 16))
        return f'<div class="row"><span class="tag">{label}</span>{cells}</div>'
    def panel(cls, name):
        return f'''<div class="panel {cls}">
  <h3>{name}</h3>
  {row(colour, 'colour')}
  {row(mono, 'mono')}
  <div class="row uses"><span class="tag">in use</span>
    <span class="lockup">{inst(colour, 26)}<span>OurWorld</span></span>
    <span class="lockup mono">{inst(mono, 26)}<span>OurWorld</span></span>
    <span class="tab">{inst(colour, 16)}<span>OurWorld</span></span>
  </div>
</div>'''
    n[0] += 1
    icon = app_icon(colour(f'{slug}-ic'), f'{slug}-ic').replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="SIZE" height="SIZE">', 1)
    icons = ''.join(f'<figure>{icon.replace("SIZE", str(s)).replace(slug + "-ic", f"{slug}-ic{s}")}<figcaption>app icon {s}</figcaption></figure>' for s in (180, 64, 32))
    sections.append(f'''<section id="{slug}">
<h2>{title}</h2>
<p class="why">{why}</p>
<p class="files">Files: <code>{slug}.svg</code> · <code>{slug}-mono.svg</code> · <code>{slug}-icon.svg</code></p>
<div class="panels">{panel('paper', 'Paper')}{panel('night', 'Night')}</div>
<div class="row icons"><span class="tag">home screen</span>{icons}</div>
</section>''')

html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OurWorld — logo proposals</title>
<style>
  :root {{ --paper: {PAPER}; --ink: {INK}; --night: {NIGHT3}; --night-text: {NIGHT_TEXT}; --border: #E2DACB; --muted: #6B6872; }}
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; background: #F3EDE2; color: var(--ink); font: 15px/1.55 "DM Sans", system-ui, sans-serif; }}
  main {{ max-width: 2000px; margin: 0 auto; padding: 32px 20px 80px; }}
  h1, h2, h3, .lockup span {{ font-family: Fraunces, Georgia, serif; font-weight: 400; }}
  h1 {{ font-size: 34px; margin: 0 0 6px; }}
  h2 {{ font-size: 26px; margin: 56px 0 4px; }}
  h3 {{ font-size: 15px; margin: 0 0 12px; opacity: .7; }}
  p {{ margin: 0; max-width: 70ch; }}
  .intro, .why {{ color: var(--muted); }}
  .files {{ margin-top: 6px; font-size: 13px; color: var(--muted); }}
  code {{ font-size: 12.5px; background: #fff8; border: 1px solid var(--border); border-radius: 6px; padding: 1px 5px; }}
  nav {{ margin-top: 14px; display: flex; gap: 8px; flex-wrap: wrap; }}
  nav a {{ color: inherit; border: 1px solid var(--border); background: #FFFDF8; border-radius: 99px; padding: 8px 14px; text-decoration: none; font-size: 13px; }}
  .panels {{ display: grid; gap: 16px; margin-top: 18px; }}
  @media (min-width: 1900px) {{ .panels {{ grid-template-columns: 1fr 1fr; }} }}
  .panel {{ border-radius: 20px; padding: 20px; min-width: 0; }}
  .paper {{ background: var(--paper); color: var(--ink); border: 1px solid var(--border); }}
  .night {{ background: radial-gradient(ellipse at 50% 30%, {NIGHT1}, {NIGHT2} 45%, {NIGHT3}); color: var(--night-text); }}
  .row {{ display: flex; flex-wrap: wrap; align-items: flex-end; gap: 22px; margin-top: 18px; }}
  .tag {{ width: 62px; flex: none; font-size: 10.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; opacity: .6; align-self: center; }}
  figure {{ margin: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; flex: none; }}
  figure svg {{ display: block; }}
  .panel .row > figure:first-of-type svg {{ width: min(512px, 100vw - 82px); height: auto; }}
  @media (max-width: 700px) {{ .tag {{ width: 100%; }} }}
  figcaption {{ font-size: 11px; opacity: .6; }}
  .uses {{ align-items: center; flex-wrap: wrap; }}
  .lockup {{ display: inline-flex; align-items: center; gap: 8px; }}
  .lockup span {{ font-size: 19px; line-height: 1; }}
  .tab {{ display: inline-flex; align-items: center; gap: 7px; font-size: 12px; padding: 7px 12px; border-radius: 9px 9px 0 0; background: #8881; border: 1px solid #8883; }}
  .icons {{ background: #FFFDF8; border: 1px solid var(--border); border-radius: 20px; padding: 18px 20px; margin-top: 16px; }}
  .icons svg {{ border-radius: 22%; }}
</style>
</head>
<body>
<main>
  <h1>OurWorld — logo proposals</h1>
  <p class="intro">Three directions for RF16, each at 512, 192, 32 and 16&nbsp;px, on paper and on night, in colour and in one colour. Colours come only from the design tokens: personal pink <code>{PINK}</code> and teal <code>{TEAL}</code> (the two of us, as in today's logo), the "new" yellow <code>{YELLOW}</code>, and the night sky for the app icon. Nothing is wired into the app yet: pick one and the rest follows.</p>
  <nav>{''.join(f'<a href="#{s}">{t}</a>' for s, t, *_ in PROPOSALS)}</nav>
  {''.join(sections)}
</main>
</body>
</html>
'''
open(f'{out}/preview.html', 'w').write(html)
print('ok', len(html))
