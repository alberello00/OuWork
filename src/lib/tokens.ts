// Design tokens as JS values for canvas/SVG usage where CSS variables are unavailable.
// Keep in sync with the @theme block in globals.css.

export const colors = {
  bg: '#FAF6EF',
  surface2: '#F3EDE2',
  card: '#FFFDF8',
  border: '#E2DACB',
  dotGrid: '#D6CDBD',
  text: '#2B2A33',
  textMuted: '#6B6872',
  placeholder: '#757575',
  accent: '#E4572E',
  newBg: '#F7D774',
  newText: '#7A5A00',
  userLola: '#D9467A',
  userAlberto: '#2F8F83',
  cardStripe: '#C7A96C',
  spherePlaces: '#FFD98A',
} as const;

export const colorsDark = {
  bg: '#14152B',
  surface2: '#1F2144',
  card: '#2A2C5C',
  border: '#3A3D6B',
  dotGrid: '#2E3158',
  text: '#EDE8F5',
  textMuted: '#9B96B0',
  placeholder: '#6B6880',
} as const;

export const radius = {
  card: 12,
  pill: 99,
  login: 20,
} as const;
