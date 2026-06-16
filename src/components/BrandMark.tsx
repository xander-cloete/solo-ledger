import { useSettings } from '../hooks/useSettings'
import { useReduceMotion } from '../hooks/useReduceMotion'

/*
  The app mark in the sidebar. Most themes use the default Solo Ledger icon; the
  Japandi world swaps in a vermilion hanko seal (蓄 — "savings/store up"),
  slightly rotated like a real ink stamp, with a slow breathing glow.
*/
export function BrandMark() {
  const { activeTheme } = useSettings()
  const reduce = useReduceMotion()

  if (activeTheme === 'japandi') {
    return (
      <span
        aria-hidden
        className={`grid h-8 w-8 -rotate-3 place-items-center rounded-lg font-display text-lg font-semibold ${reduce ? '' : 'glyph-seal'}`}
        style={{ background: 'var(--seal)', color: 'var(--surface)' }}
      >
        蓄
      </span>
    )
  }

  // Cyberpunk: a neon ¥ sign — cyan glass on a dark panel with a magenta
  // chromatic edge, buzzing in its glow halo (the buzz is dropped for
  // reduce-motion). ¥ keeps the noir-money read; the ring border is the tube.
  if (activeTheme === 'cyberpunk') {
    return (
      <span
        aria-hidden
        className={`grid h-8 w-8 place-items-center rounded-md font-display text-lg font-bold ${reduce ? '' : 'glyph-neon-seal'}`}
        style={{
          color: 'var(--neon)',
          background: 'var(--surface)',
          boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--neon) 55%, transparent)',
        }}
      >
        ¥
      </span>
    )
  }

  // Manga: a crimson speech-pop with a white ¥, inked outline, tilted like a
  // sticker — it gives a tiny "pop" beat on a loop (dropped for reduce-motion).
  if (activeTheme === 'manga') {
    return (
      <span
        aria-hidden
        className={`grid h-8 w-8 -rotate-6 place-items-center rounded-lg font-display text-lg font-extrabold italic ${reduce ? '' : 'glyph-manga-pop'}`}
        style={{
          background: 'var(--primary)',
          color: '#fff5ec',
          boxShadow: 'inset 0 0 0 2px var(--ink)',
        }}
      >
        ¥
      </span>
    )
  }

  // Art Deco: a stepped gilt emblem — octagon-clipped panel, gold ¥, thin gold
  // inner border. Kept static so the mark always reads; the living gilt lives in
  // the Dashboard sunburst and the heading rule instead.
  if (activeTheme === 'art-deco') {
    return (
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center font-display text-lg font-semibold"
        style={{
          color: 'var(--gold)',
          background: 'var(--surface)',
          clipPath:
            'polygon(28% 0, 72% 0, 100% 28%, 100% 72%, 72% 100%, 28% 100%, 0 72%, 0 28%)',
          boxShadow: 'inset 0 0 0 1.5px var(--primary)',
        }}
      >
        ¥
      </span>
    )
  }

  // Neoclassical: a gilt medallion — a gold ¥ ringed in a thin gold band on marble.
  if (activeTheme === 'neoclassical') {
    return (
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center rounded-full font-display text-base font-semibold"
        style={{
          color: 'var(--gold)',
          background: 'var(--surface)',
          boxShadow: 'inset 0 0 0 1.5px var(--primary)',
        }}
      >
        ¥
      </span>
    )
  }

  // Pixel: a pixel ¥ coin — magenta block with a hard cyan pixel drop, no rounding.
  if (activeTheme === 'pixel') {
    return (
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center font-display text-base font-bold"
        style={{
          color: 'var(--primary-fg)',
          background: 'var(--primary)',
          boxShadow: '3px 3px 0 0 var(--cyan)',
          borderRadius: 0,
        }}
      >
        ¥
      </span>
    )
  }

  // Sketch: a hand-drawn badge — a graphite ¥ in a wobbly pencilled box (irregular
  // corner radii read as drawn-by-hand), tilted a touch.
  if (activeTheme === 'sketch') {
    return (
      <span
        aria-hidden
        className="grid h-8 w-8 -rotate-2 place-items-center font-display text-base font-semibold"
        style={{
          color: 'var(--graphite)',
          background: 'var(--surface)',
          boxShadow: 'inset 0 0 0 1.5px var(--graphite)',
          borderRadius: '0.4rem 0.55rem 0.38rem 0.5rem',
        }}
      >
        ¥
      </span>
    )
  }

  // Bauhaus: a red square holding the ¥, with a yellow triangle corner and a blue dot.
  if (activeTheme === 'bauhaus') {
    return (
      <span
        aria-hidden
        className="relative grid h-8 w-8 place-items-center overflow-hidden font-display text-base font-extrabold"
        style={{ color: 'var(--primary-fg)', background: 'var(--primary)', borderRadius: '0.15rem' }}
      >
        <span
          aria-hidden
          className="absolute right-0 top-0"
          style={{ width: 0, height: 0, borderTop: '9px solid var(--yellow)', borderLeft: '9px solid transparent' }}
        />
        <span
          aria-hidden
          className="absolute bottom-1 left-1 h-2 w-2 rounded-full"
          style={{ background: 'var(--blue)' }}
        />
        ¥
      </span>
    )
  }

  // Mixed media: a taped paper tag — a ¥ stamped on a cream scrap with a washi-tape
  // strip across the top, tilted like it was stuck on.
  if (activeTheme === 'mixed-media') {
    return (
      <span
        aria-hidden
        className="relative grid h-8 w-8 -rotate-6 place-items-center font-display text-base font-bold"
        style={{
          color: 'var(--primary)',
          background: 'var(--surface)',
          boxShadow: 'inset 0 0 0 1px var(--border), 1px 2px 3px rgba(0, 0, 0, 0.15)',
          borderRadius: '0.1rem',
        }}
      >
        <span
          aria-hidden
          className="absolute -top-1 left-1 h-2 w-6 -rotate-12"
          style={{ background: 'var(--tape)' }}
        />
        ¥
      </span>
    )
  }

  // Utilitarian: a stamped label box — a ¥ in a sharp inked frame with one signal-
  // orange corner tick. Zero rounding.
  if (activeTheme === 'utilitarian') {
    return (
      <span
        aria-hidden
        className="relative grid h-8 w-8 place-items-center font-display text-base font-bold"
        style={{
          color: 'var(--fg)',
          background: 'var(--surface)',
          boxShadow: 'inset 0 0 0 1.5px var(--fg)',
          borderRadius: 0,
        }}
      >
        <span aria-hidden className="absolute right-0 top-0 h-1.5 w-1.5" style={{ background: 'var(--primary)' }} />
        ¥
      </span>
    )
  }

  // Terminal: a phosphor prompt box — a green ¥ behind a CRT glow with a blinking
  // block cursor in the corner. Sharp, mono.
  if (activeTheme === 'terminal') {
    return (
      <span
        aria-hidden
        className="relative grid h-8 w-8 place-items-center font-display text-base font-bold"
        style={{
          color: 'var(--primary)',
          background: 'var(--surface)',
          boxShadow:
            'inset 0 0 0 1.5px color-mix(in srgb, var(--primary) 55%, transparent), 0 0 8px color-mix(in srgb, var(--primary) 22%, transparent)',
          borderRadius: 0,
        }}
      >
        ¥
        <span
          aria-hidden
          className={`absolute bottom-1 right-1 h-2 w-1 ${reduce ? '' : 'glyph-term-blink'}`}
          style={{ background: 'var(--primary)' }}
        />
      </span>
    )
  }

  // Tokyo Night: a soft-glow box holding a blue→violet gradient ¥, echoing the
  // skyline heading.
  if (activeTheme === 'tokyo-night') {
    return (
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center font-display text-lg font-bold"
        style={{
          background: 'var(--surface)',
          borderRadius: '0.5rem',
          boxShadow:
            'inset 0 0 0 1px color-mix(in srgb, var(--primary) 30%, transparent), 0 0 9px color-mix(in srgb, var(--primary) 22%, transparent)',
        }}
      >
        <span
          style={{
            backgroundImage: 'linear-gradient(92deg, var(--primary), var(--accent))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          ¥
        </span>
      </span>
    )
  }

  // Clean: an airy sage ¥ in a thin ring — minimal and editorial.
  if (activeTheme === 'clean') {
    return (
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center rounded-full font-display text-base font-semibold"
        style={{
          color: 'var(--primary)',
          background: 'var(--surface)',
          boxShadow: 'inset 0 0 0 1.5px color-mix(in srgb, var(--primary) 45%, transparent)',
        }}
      >
        ¥
      </span>
    )
  }

  // Catppuccin Latte: a soft mauve badge with two little cat ears poking up and a
  // white ¥ — cozy and playful.
  if (activeTheme === 'catppuccin-latte') {
    return (
      <span
        aria-hidden
        className="relative grid h-8 w-8 place-items-center rounded-xl font-display text-base font-bold"
        style={{ color: '#ffffff', background: 'var(--primary)' }}
      >
        <span
          aria-hidden
          className="absolute -top-1 left-1"
          style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '7px solid var(--primary)' }}
        />
        <span
          aria-hidden
          className="absolute -top-1 right-1"
          style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '7px solid var(--primary)' }}
        />
        ¥
      </span>
    )
  }

  return <img src="/sl-icon.svg" alt="" className="h-8 w-8 rounded-lg" />
}
