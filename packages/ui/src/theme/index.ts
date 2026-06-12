// Design tokens — the TS mirror of packages/ui/src/styles.css.

export const COLORS = {
  paper: '#f8f4ee',
  paperDeep: '#f0eae1',
  print: '#fffefb',
  printEdge: '#e8e0e2',
  ink: '#2b2429',
  ink2: '#4a4048',
  ink3: '#80737d',
  ink4: '#b3a8b0',
  hair: '#e8e0e2',
  hairStrong: '#d1c4ca',
  // The one accent
  plum: '#6e455e',
  plumDeep: '#5a3850',
  plumSoft: '#8a5f7d',
  // The two heavy doors
  crit: '#8e1b1b',
  // System urgency (whispers, never shouts)
  wait: '#9a6a23',
  // Calm confirmation, used tiny
  ok: '#4d6b4f',
} as const;

export type ColorToken = keyof typeof COLORS;

export const FONTS = {
  // The human voice — anything a person wrote or said.
  serif: "'Source Serif 4', Georgia, serif",
  // Rare ceremony — covers, the year-in-review.
  display: "'Fraunces', 'Source Serif 4', serif",
  // Chrome — every machine-spoken surface.
  sans: "'Inter', system-ui, sans-serif",
  // The record — codes, timestamps, counts, durations.
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;

export const RADII = {
  pill: '9999px',
  print: '4px', // polaroids, postcards — paper is paper
  card: '14px', // voice card, sheets, panels
  bar: '9999px', // compose bar, reaction picker
} as const;

export const MOTION = {
  easeSettle: 'cubic-bezier(0.22, 0.8, 0.36, 1)',
  quick: '140ms',
  settle: '260ms',
  slow: '420ms',
} as const;
