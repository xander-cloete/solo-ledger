import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useSettings } from '../hooks/useSettings'
import { useReduceMotion } from '../hooks/useReduceMotion'

/*
  Shared editorial UI primitives — the vocabulary of the design overhaul.
  Every page uses these so the look stays cohesive: an uppercase "eyebrow"
  rhythm, a display-font page title, and cards that lift a touch on hover.
  Colour always flows from the theme CSS variables, so each primitive looks
  right in all 10 themes.
*/

// The small uppercase micro-label used above numbers and sections.
export function Eyebrow({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`eyebrow block text-[11px] font-medium uppercase tracking-[0.18em] text-muted ${className}`}
    >
      {children}
    </span>
  )
}

// Same styling as Eyebrow but as a semantic <h2> — for labelling list groups.
export function SectionLabel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h2
      className={`eyebrow text-[11px] font-medium uppercase tracking-[0.18em] text-muted ${className}`}
    >
      {children}
    </h2>
  )
}

// The masthead at the top of every page: an optional eyebrow over a large
// display-font title, with an optional control (e.g. the month switcher) on the
// right.
export function PageHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  right?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <Eyebrow className="mb-1.5">{eyebrow}</Eyebrow>}
        <h1 className="page-title font-display text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        {/* The title rule — each world draws its own under the heading (see
            BrushStroke). Japandi brushes ink; Cyberpunk lights a neon HUD bar. */}
        <BrushStroke className="mt-2.5" />
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  )
}

// The title rule under each page heading. It's theme-aware: every world gets to
// draw its own mark here (the same idea as ThemeSignature / BrandMark), so the
// underline reads as ink, neon, gold, etc. — never the same line twice.
export function BrushStroke({ className = '' }: { className?: string }) {
  const { activeTheme } = useSettings()
  if (activeTheme === 'cyberpunk') return <NeonRule className={className} />
  if (activeTheme === 'tokyo-night') return <SkylineRule className={className} />
  if (activeTheme === 'manga') return <SpeedRule className={className} />
  if (activeTheme === 'art-deco') return <DecoRule className={className} />
  if (activeTheme === 'neoclassical') return <MeanderRule className={className} />
  if (activeTheme === 'pixel') return <PixelRule className={className} />
  if (activeTheme === 'sketch') return <SketchRule className={className} />
  if (activeTheme === 'bauhaus') return <ShapesRule className={className} />
  if (activeTheme === 'mixed-media') return <TapeRule className={className} />
  if (activeTheme === 'utilitarian') return <DimensionRule className={className} />
  if (activeTheme === 'terminal')
    return (
      // Terminal: a phosphor ASCII divider instead of a brush. Box-drawing
      // characters in the mono face fuse into one glowing CRT line.
      <div aria-hidden className={`term-rule ${className}`}>
        ────────────
      </div>
    )
  return (
    // Default: a short, slightly irregular hand-brushed stroke in the accent.
    <svg
      aria-hidden
      className={`block ${className}`}
      width="68"
      height="9"
      viewBox="0 0 68 9"
      fill="none"
    >
      <path
        d="M2 5.2C14 2.1 31 6.6 44 3.4 52 1.5 60 4.2 66 3"
        stroke="var(--primary)"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  )
}

// Neoclassical: a Greek-key (meander) rule in gold — the classical fret border.
function MeanderRule({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={`block ${className}`}
      width="116"
      height="12"
      viewBox="0 0 116 12"
      fill="none"
    >
      <path
        d="M2 10 V3 H10 V8 H6 M16 10 V3 H24 V8 H20 M30 10 V3 H38 V8 H34 M44 10 V3 H52 V8 H48 M58 10 V3 H66 V8 H62 M72 10 V3 H80 V8 H76 M86 10 V3 H94 V8 H90 M100 10 V3 H108 V8 H104"
        stroke="var(--primary)"
        strokeWidth="1.4"
        strokeLinecap="square"
      />
      <line x1="2" y1="10.6" x2="114" y2="10.6" stroke="var(--gold)" strokeOpacity="0.6" strokeWidth="1" />
    </svg>
  )
}

// Pixel: a dithered row of pixel blocks alternating magenta and cyan.
function PixelRule({ className = '' }: { className?: string }) {
  const blocks = Array.from({ length: 11 }, (_, i) => i)
  return (
    <svg
      aria-hidden
      shapeRendering="crispEdges"
      className={`block ${className}`}
      width="100"
      height="8"
      viewBox="0 0 100 8"
      fill="none"
    >
      {blocks.map((i) => (
        <rect
          key={i}
          x={i * 9}
          y={0}
          width={7}
          height={7}
          fill={i % 2 === 0 ? 'var(--primary)' : 'var(--cyan)'}
          fillOpacity={i % 3 === 2 ? 0.5 : 1}
        />
      ))}
    </svg>
  )
}

// Sketch: a roughed-in double underline in graphite with a small red annotation tick.
function SketchRule({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={`block ${className}`}
      width="110"
      height="12"
      viewBox="0 0 110 12"
      fill="none"
    >
      <g stroke="var(--graphite)" strokeLinecap="round" fill="none">
        <path d="M3 5 C24 3 46 6 68 4 84 2.8 96 5 104 4" strokeWidth="1.7" />
        <path d="M5 8 C26 6.6 50 9 72 7.4 88 6.4 98 8 106 7.4" strokeWidth="1.1" strokeOpacity="0.45" />
      </g>
      {/* red correction tick */}
      <path d="M96 1 L100 5 L108 -2" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

// Bauhaus: the trio in a row — blue circle, yellow triangle, red square.
function ShapesRule({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={`block ${className}`}
      width="64"
      height="14"
      viewBox="0 0 64 14"
      fill="none"
    >
      <circle cx="8" cy="7" r="6.5" fill="var(--blue)" />
      <polygon points="24,13 38,13 31,2" fill="var(--yellow)" />
      <rect x="45" y="1" width="13" height="13" fill="var(--primary)" />
    </svg>
  )
}

// Mixed media: a strip of washi tape, torn at the ends, set at a slight angle.
function TapeRule({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={`block ${className}`}
      width="104"
      height="16"
      viewBox="0 0 104 16"
      fill="none"
    >
      <polygon
        points="3,5 99,3 101,12 5,14"
        fill="var(--tape)"
        transform="rotate(-2 52 8)"
      />
      {/* faint tape edges */}
      <line x1="4" y1="5.5" x2="100" y2="3.8" stroke="var(--primary)" strokeOpacity="0.2" strokeWidth="0.6" />
    </svg>
  )
}

// Utilitarian: a dimension line — a precise rule with end ticks and a filled accent
// square at the start, like a measurement on a spec drawing.
function DimensionRule({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      shapeRendering="crispEdges"
      className={`block ${className}`}
      width="108"
      height="10"
      viewBox="0 0 108 10"
      fill="none"
    >
      <rect x="1" y="2" width="6" height="6" fill="var(--primary)" />
      <line x1="10" y1="5" x2="104" y2="5" stroke="var(--fg)" strokeWidth="1" />
      <line x1="10" y1="1.5" x2="10" y2="8.5" stroke="var(--fg)" strokeWidth="1" />
      <line x1="104" y1="1.5" x2="104" y2="8.5" stroke="var(--fg)" strokeWidth="1" />
    </svg>
  )
}

// Manga: speed-lines under the title — tapered ink streaks of varying length, one
// in crimson, like motion lines whipping past. Static (the energy is in the shape).
function SpeedRule({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={`block ${className}`}
      width="108"
      height="13"
      viewBox="0 0 108 13"
      fill="none"
    >
      <path d="M2 3H78" stroke="var(--fg)" strokeWidth="2.4" strokeLinecap="round" strokeOpacity="0.85" />
      <path d="M2 6.6H104" stroke="var(--primary)" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M2 10H58" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

// Art Deco: a symmetric gilt divider — a centre lozenge flanked by thin rules that
// taper to small diamonds, like an engraved name-plate underline. The diamonds glint.
function DecoRule({ className = '' }: { className?: string }) {
  const reduce = useReduceMotion()
  return (
    <svg
      aria-hidden
      className={`block ${className}`}
      width="116"
      height="12"
      viewBox="0 0 116 12"
      fill="none"
    >
      <path d="M10 6H48" stroke="var(--primary)" strokeWidth="1.3" />
      <path d="M68 6H106" stroke="var(--primary)" strokeWidth="1.3" />
      {/* end caps */}
      <path d="M6 6 3 6M110 6 113 6" stroke="var(--primary)" strokeWidth="1.3" strokeLinecap="round" />
      <g
        className={reduce ? '' : 'glyph-deco-shimmer'}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        fill="var(--gold)"
      >
        {/* left & right small diamonds */}
        <path d="M9 6 6.5 8.5 4 6 6.5 3.5Z" />
        <path d="M112 6 109.5 8.5 107 6 109.5 3.5Z" />
        {/* centre lozenge */}
        <path d="M58 0.5 63 6 58 11.5 53 6Z" />
      </g>
    </svg>
  )
}

// Tokyo Night: a horizon line under the title with a few city lights twinkling
// above it. Blue→violet gradient rail; the lights pulse on staggered delays.
// A softer, nocturnal cousin to the neon HUD — gradient and atmosphere, not signage.
function SkylineRule({ className = '' }: { className?: string }) {
  const reduce = useReduceMotion()
  const lights = [
    { cx: 16, cy: 5, r: 1.5, fill: 'var(--primary)', delay: '0s' },
    { cx: 40, cy: 3.4, r: 1.7, fill: 'var(--accent)', delay: '0.9s' },
    { cx: 63, cy: 5.5, r: 1.4, fill: 'var(--accent-2)', delay: '0.4s' },
    { cx: 82, cy: 4, r: 1.5, fill: 'var(--accent)', delay: '1.5s' },
  ]
  return (
    <svg
      aria-hidden
      className={`block ${className}`}
      width="100"
      height="14"
      viewBox="0 0 100 14"
      fill="none"
    >
      <defs>
        <linearGradient id="sl-tokyo-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--primary)" />
          <stop offset="1" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      <line x1="2" y1="10.5" x2="94" y2="10.5" stroke="url(#sl-tokyo-grad)" strokeWidth="2.4" strokeLinecap="round" />
      {lights.map((l, i) => (
        <circle
          key={i}
          cx={l.cx}
          cy={l.cy}
          r={l.r}
          fill={l.fill}
          className={reduce ? '' : 'glyph-twinkle'}
          style={reduce ? undefined : { animationDelay: l.delay }}
        />
      ))}
    </svg>
  )
}

// Cyberpunk: a glowing neon HUD bar instead of a brush. A bright cyan rail with a
// magenta chromatic ghost beneath it, a lit node at the left and a circuit-corner
// tick at the right — like a heads-up underline. The whole rail breathes (pulse),
// dropped under reduce-motion.
function NeonRule({ className = '' }: { className?: string }) {
  const reduce = useReduceMotion()
  return (
    <svg
      aria-hidden
      className={`block ${className} ${reduce ? '' : 'glyph-neon-rule'}`}
      width="104"
      height="12"
      viewBox="0 0 104 12"
      fill="none"
    >
      <defs>
        <filter id="sl-neon-rule-glow" x="-20%" y="-120%" width="140%" height="340%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* magenta chromatic ghost, nudged down */}
      <path d="M3 7.4H86" stroke="var(--neon-2)" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" filter="url(#sl-neon-rule-glow)" />
      {/* cyan rail with a circuit-corner tick up at the right end */}
      <path d="M3 6H88L94 1.5" stroke="var(--neon)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#sl-neon-rule-glow)" />
      {/* lit node at the left */}
      <circle cx="3" cy="6" r="2.6" fill="var(--neon)" filter="url(#sl-neon-rule-glow)" />
    </svg>
  )
}

// A full-width, hand-drawn tapered ink rule for separating sections — softer and
// more characterful than a flat border. Sits in the theme's hairline colour.
export function InkRule({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={`block w-full text-border ${className}`}
      height="10"
      viewBox="0 0 800 10"
      preserveAspectRatio="none"
    >
      <path
        d="M2 5C200 1.5 600 1.5 798 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  )
}

// Spread onto a `motion.*` element to give it the standard gentle hover lift.
// The lift is a transform, so reduce-motion (via MotionConfig) disables it.
export const hoverLift = {
  whileHover: { y: -3 },
  transition: { type: 'spring' as const, stiffness: 300, damping: 28 },
}

// A surface card that lifts on hover — the common case across the app.
export function LiftCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      {...hoverLift}
      className={`rounded-card border border-border bg-surface ${className}`}
    >
      {children}
    </motion.div>
  )
}
