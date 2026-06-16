// Phase 8 — the theme registry.
//
// The *colours* for each theme live in src/index.css as CSS-variable blocks
// (one per `[data-theme='id']`). This file is the small catalogue the UI reads:
// it lists which themes exist, their labels/descriptions, and a few swatch
// colours so the picker can draw a mini-preview of each one.
//
// The swatch hexes mirror a handful of the values in index.css. They're only for
// the preview tiles — the real, full palette is always the CSS. Keep them in
// sync if you re-tune a theme (or, later, read them live with getComputedStyle).

export interface ThemeDef {
  id: string // matches the [data-theme='id'] in index.css
  label: string // shown in the picker
  description: string // one line of flavour
  swatch: {
    bg: string
    surface: string
    primary: string
    fg: string
  }
}

export const THEMES: ThemeDef[] = [
  {
    id: 'japandi',
    label: 'Japandi',
    description: 'Warm oat, washi paper, a hand-brushed ensō. The default.',
    swatch: { bg: '#e7e1d3', surface: '#f3eee2', primary: '#b06a47', fg: '#2c2922' },
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk Noir',
    description: 'Rain-slick neon dark — scanlines, a flickering cyan/magenta sign.',
    swatch: { bg: '#0a0a12', surface: '#13131f', primary: '#2de2ff', fg: '#e9e7ff' },
  },
  {
    id: 'manga',
    label: 'Anime / Manga',
    description: 'Cozy-retro anime — warm dark room, manga-panel frame, kira sparkles.',
    swatch: { bg: '#201912', surface: '#2a2118', primary: '#e05a4f', fg: '#ece0c8' },
  },
  {
    id: 'art-deco',
    label: 'Art Deco',
    description: 'Gold on midnight ink — sunburst geometry and a Gatsby-era serif.',
    swatch: { bg: '#10141a', surface: '#171d26', primary: '#c9a44c', fg: '#efe6d0' },
  },
  {
    id: 'clean',
    label: 'Clean',
    description: 'Warm, calm Japandi tones — the default.',
    swatch: { bg: '#f5f3ee', surface: '#fffdf8', primary: '#4f6f52', fg: '#2b2a28' },
  },
  {
    id: 'tokyo-night',
    label: 'Tokyo Night',
    description: 'Omarchy-inspired deep blues and purples.',
    swatch: { bg: '#1a1b26', surface: '#24283b', primary: '#7aa2f7', fg: '#c0caf5' },
  },
  {
    id: 'terminal',
    label: 'Terminal',
    description: 'Green-on-black monospace, like a classic CRT.',
    swatch: { bg: '#0a0d0a', surface: '#0f140f', primary: '#2ee06a', fg: '#c8f7c8' },
  },
  {
    id: 'catppuccin-latte',
    label: 'Catppuccin Latte',
    description: 'Soft pastel mauve on warm white.',
    swatch: { bg: '#eff1f5', surface: '#ffffff', primary: '#8839ef', fg: '#4c4f69' },
  },
  {
    id: 'neoclassical',
    label: 'Neoclassical',
    description: 'Gold on marble — a gilt laurel and a Greek-key meander.',
    swatch: { bg: '#ece7dd', surface: '#f7f3ea', primary: '#9a7b3f', fg: '#2b2823' },
  },
  {
    id: 'pixel',
    label: 'Pixel Art',
    description: 'PC-98 dusk — magenta + cyan, dithering, a pixel torii.',
    swatch: { bg: '#1a1730', surface: '#241f3e', primary: '#ff5ca8', fg: '#e8e6f5' },
  },
  {
    id: 'sketch',
    label: 'Conceptual Sketch',
    description: 'Graphite on graph paper — construction lines, a red pen.',
    swatch: { bg: '#f6f4ee', surface: '#fcfaf4', primary: '#d8483b', fg: '#3a3a3a' },
  },
  {
    id: 'bauhaus',
    label: 'Bauhaus',
    description: 'Red, yellow, blue + black — circle, triangle, square.',
    swatch: { bg: '#f0ece3', surface: '#faf7f0', primary: '#d62828', fg: '#1a1a1a' },
  },
  {
    id: 'mixed-media',
    label: 'Mixed Media',
    description: 'Collage — torn kraft, washi tape, rubber stamps.',
    swatch: { bg: '#e9e3d6', surface: '#f4efe3', primary: '#e2562f', fg: '#2a2622' },
  },
  {
    id: 'utilitarian',
    label: 'Utilitarian',
    description: 'Swiss-industrial — concrete, ink, one signal-orange accent.',
    swatch: { bg: '#e4e4e1', surface: '#f2f2ef', primary: '#ff6a00', fg: '#1c1c1a' },
  },
]

export const DEFAULT_THEME = 'japandi'

// True if `id` is one of our known themes (used to fall back safely if settings
// ever hold a theme id we no longer ship).
export function isKnownTheme(id: string): boolean {
  return THEMES.some((t) => t.id === id)
}
