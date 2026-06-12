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
]

export const DEFAULT_THEME = 'clean'

// True if `id` is one of our known themes (used to fall back safely if settings
// ever hold a theme id we no longer ship).
export function isKnownTheme(id: string): boolean {
  return THEMES.some((t) => t.id === id)
}
