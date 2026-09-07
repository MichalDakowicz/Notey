/**
 * Design tokens lifted from the "Organic" design system that the
 * Class Notes canvas is built on (_ds/.../styles.css).
 */
export const c = {
  bg: '#f5ead8',
  surface: '#ebddc5',
  paper: '#fffdf9',
  text: '#201e1d',
  accent: '#c67139',
  accent2: '#7a8a5e',

  n100: '#f9f4ed',
  n200: '#eee7db',
  n300: '#dcd3c4',
  n400: '#c0b6a5',
  n500: '#a19786',
  n600: '#82796a',
  n700: '#645c50',
  n800: '#474238',
  n900: '#2e2b25',

  a100: '#fff2eb',
  a200: '#ffe1d0',
  a300: '#ffc6a5',
  a400: '#f6a06b',
  a500: '#d67f48',
  a600: '#b2622d',
  a700: '#8c491a',
  a800: '#643312',
  a900: '#402310',

  g100: '#f0fae1',
  g200: '#e1eecc',
  g300: '#ccdbb2',
  g400: '#aebf92',
  g500: '#8fa073',
  g600: '#728157',
  g700: '#56633f',
  g800: '#3d472b',
  g900: '#272e1b',
} as const;

export const f = {
  head: 'NoteyDisplay',
  b400: 'Figtree_400Regular',
  b500: 'Figtree_500Medium',
  b600: 'Figtree_600SemiBold',
  b700: 'Figtree_700Bold',
  b800: 'Figtree_800ExtraBold',
  mono: 'monospace',
} as const;

export const shadow = {
  sm: {
    shadowColor: c.n900,
    shadowOpacity: 0.14,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  md: {
    shadowColor: c.n900,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  lg: {
    shadowColor: c.n900,
    shadowOpacity: 0.22,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
} as const;

/** Notebook colour ways, indexed by `notebooks.tint` (0-4). */
export const TINTS = [
  { tint: c.a500, soft: c.a100, dark: c.a700, hex: '#d67f48' },
  { tint: c.g500, soft: c.g100, dark: c.g700, hex: '#8fa073' },
  { tint: c.a700, soft: c.n200, dark: c.a800, hex: '#8c491a' },
  { tint: c.g700, soft: c.g100, dark: c.g800, hex: '#56633f' },
  { tint: c.n500, soft: c.n200, dark: c.n800, hex: '#a19786' },
] as const;

export const tintOf = (i: number) => TINTS[((i % TINTS.length) + TINTS.length) % TINTS.length];

export const NAV_ON = { bg: c.a200, fg: c.a800 };
export const NAV_OFF = { bg: 'transparent', fg: c.n600 };
