export const colors = {
  charcoal: '#161616',
  charcoalSoft: '#1C1C1C',
  ivory: '#E8E4DC',
  ivoryMuted: '#C9C4BB',
  stone: '#8A8680',
  gold: '#C9A46C',
  overlay: 'rgba(16, 16, 16, 0.52)',
  overlayDeep: 'rgba(12, 12, 12, 0.72)',
  cream: '#F4EEE3',
  creamDeep: '#E7DFD0',
  bark: '#3F2A1D',
  mutedNest: '#7A6E62',
  sage: '#8A9A7B',
  sageDeep: '#6F7D62',
  shell: '#FBF6EC',
  twig: '#6B5344',
  nightVeil: 'rgba(4, 4, 4, 0.92)',
  nightClock: 'rgba(232, 228, 220, 0.52)',
  nightPeriod: 'rgba(232, 228, 220, 0.36)',
  nightMark: 'rgba(201, 196, 187, 0.28)',
  nightPlate: 'rgba(8, 8, 8, 0.92)',
} as const;

/** Sized for a Samsung Tab A (small, ~2021) in landscape on the fridge. */
export const type = {
  wordmark: 24,
  kicker: 18,
  title: 40,
  weatherTemp: 118,
  weatherMeta: 28,
  body: 32,
  verse: 36,
  caption: 18,
  branding: 34,
  greeting: 28,
  serifMark: 76,
  answer: 38,
  hint: 20,
  meta: 24,
} as const;

export const serif = {
  fontFamily: 'Georgia',
} as const;
