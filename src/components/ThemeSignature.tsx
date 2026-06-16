import { useSettings } from '../hooks/useSettings'
import { useReduceMotion } from '../hooks/useReduceMotion'

/*
  The decorative "signature" that sits in the Dashboard hero. Each theme world
  gets its own — Japandi's is a hand-brushed ensō. Themes without a bespoke
  signature fall back to a soft, theme-tinted glow. Placed absolutely inside the
  hero (which is `relative overflow-hidden`), so it bleeds elegantly off a corner.
*/
export function ThemeSignature() {
  const { activeTheme } = useSettings()

  switch (activeTheme) {
    case 'japandi':
      return <Enso />
    case 'cyberpunk':
      return <NeonSign />
    case 'manga':
      return <FocusLines />
    case 'art-deco':
      return <Sunburst />
    case 'neoclassical':
      return <Laurel />
    case 'pixel':
      return <Torii />
    case 'sketch':
      return <Construction />
    case 'bauhaus':
      return <Trio />
    case 'mixed-media':
      return <Collage />
    case 'utilitarian':
      return <Registration />
    default:
      return <SoftGlow />
  }
}

// Neoclassical: a gilt laurel wreath — two mirrored leafy branches, open at the top.
// Built once and mirrored. A slow gilt shimmer.
function Laurel() {
  const reduce = useReduceMotion()
  // one branch: a curving stem with leaves stepping along it
  const leaves = Array.from({ length: 7 }, (_, i) => {
    const t = i / 6
    const ang = -200 + t * 120 // sweep up the left side
    const rad = (ang * Math.PI) / 180
    const r = 60
    const cx = 100 + Math.cos(rad) * r
    const cy = 100 + Math.sin(rad) * r
    return { cx, cy, rot: ang + 90 }
  })
  const branch = (
    <g stroke="var(--gold)" strokeOpacity="0.7" fill="var(--gold)" fillOpacity="0.5">
      <path
        d={`M ${100 + Math.cos((-200 * Math.PI) / 180) * 60} ${100 + Math.sin((-200 * Math.PI) / 180) * 60}
            A 60 60 0 0 1 ${100 + Math.cos((-80 * Math.PI) / 180) * 60} ${100 + Math.sin((-80 * Math.PI) / 180) * 60}`}
        fill="none"
        strokeWidth="1.6"
      />
      {leaves.map((l, i) => (
        <ellipse key={i} cx={l.cx} cy={l.cy} rx="7" ry="3" transform={`rotate(${l.rot} ${l.cx} ${l.cy})`} strokeWidth="0.8" />
      ))}
    </g>
  )
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className={`pointer-events-none absolute -right-12 -top-12 h-60 w-60 ${reduce ? '' : 'glyph-deco-shimmer'}`}
    >
      {branch}
      <g transform="translate(200 0) scale(-1 1)">{branch}</g>
    </svg>
  )
}

// Pixel (PC-98): a pixel torii gate built from crisp rects, plus two blinking cyan
// pixel-stars. The gate bobs in hard 2-frame steps.
function Torii() {
  const reduce = useReduceMotion()
  // grid units scaled up; everything snaps to whole pixels
  const px = (n: number) => n * 8
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      shapeRendering="crispEdges"
      className="pointer-events-none absolute -right-10 -top-10 h-56 w-56"
    >
      <g className={reduce ? '' : 'glyph-pixel-bob'} fill="var(--primary)" fillOpacity="0.85">
        {/* top beam (kasagi) with a little step at each end */}
        <rect x={px(3)} y={px(5)} width={px(16)} height={px(2)} />
        <rect x={px(2)} y={px(6)} width={px(18)} height={px(1)} />
        {/* second beam (nuki) */}
        <rect x={px(4)} y={px(9)} width={px(14)} height={px(1.5)} />
        {/* two pillars */}
        <rect x={px(5)} y={px(7)} width={px(2)} height={px(12)} />
        <rect x={px(15)} y={px(7)} width={px(2)} height={px(12)} />
      </g>
      <g fill="var(--cyan)">
        <PixelStar x={px(1)} y={px(2)} reduce={reduce} delay="0s" />
        <PixelStar x={px(19)} y={px(13)} reduce={reduce} delay="0.7s" />
      </g>
    </svg>
  )
}
function PixelStar({ x, y, reduce, delay }: { x: number; y: number; reduce: boolean; delay: string }) {
  // a 5px plus-shaped pixel star
  return (
    <g
      transform={`translate(${x} ${y})`}
      className={reduce ? '' : 'glyph-pixel-blink'}
      style={reduce ? undefined : { animationDelay: delay }}
    >
      <rect x="6" y="0" width="6" height="18" />
      <rect x="0" y="6" width="18" height="6" />
    </g>
  )
}

// Sketch: a roughed-in circle with construction marks — a doubled, wobbly graphite
// circle, a dashed crosshair, and a red dimension arrow with annotation ticks.
function Construction() {
  const reduce = useReduceMotion()
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className="pointer-events-none absolute -right-12 -top-12 h-60 w-60"
    >
      {/* dashed construction crosshair */}
      <g stroke="var(--graphite)" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="4 4">
        <line x1="100" y1="34" x2="100" y2="166" />
        <line x1="34" y1="100" x2="166" y2="100" />
      </g>
      {/* doubled hand-drawn circle (two slightly offset passes) */}
      <g fill="none" stroke="var(--graphite)" strokeOpacity="0.7" strokeWidth="1.6" strokeLinecap="round">
        <path d="M100 38 C135 38 162 66 162 100 C162 135 134 161 100 161 C65 161 38 134 38 100 C38 66 66 39 100 38 Z" />
        <path d="M101 40 C133 41 160 67 159 101 C159 133 133 159 99 159 C66 159 40 133 41 99 C41 67 67 41 101 40" strokeOpacity="0.4" strokeWidth="1.1" />
      </g>
      {/* red dimension arrow + ticks (the annotation) */}
      <g stroke="var(--primary)" strokeWidth="1.4" strokeLinecap="round" className={reduce ? '' : 'glyph-deco-shimmer'}>
        <line x1="38" y1="178" x2="162" y2="178" />
        <path d="M38 178 44 174 M38 178 44 182 M162 178 156 174 M162 178 156 182" />
        <line x1="38" y1="172" x2="38" y2="184" strokeOpacity="0.7" />
        <line x1="162" y1="172" x2="162" y2="184" strokeOpacity="0.7" />
      </g>
    </svg>
  )
}

// Bauhaus: the canonical trio — a blue circle, a red square, a turning yellow
// triangle, composed and overlapping.
function Trio() {
  const reduce = useReduceMotion()
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className="pointer-events-none absolute -right-10 -top-12 h-60 w-60"
    >
      <circle cx="118" cy="78" r="46" fill="var(--blue)" fillOpacity="0.85" />
      <rect x="96" y="86" width="74" height="74" fill="var(--primary)" fillOpacity="0.9" />
      <polygon
        points="70,150 110,150 90,108"
        fill="var(--yellow)"
        className={reduce ? '' : 'glyph-bauhaus-spin'}
      />
    </svg>
  )
}

// Mixed media: a layered collage cluster — a torn paper scrap, a rubber-stamp ring,
// and a strip of washi tape, each slightly rotated.
function Collage() {
  const reduce = useReduceMotion()
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className="pointer-events-none absolute -right-10 -top-10 h-56 w-56"
    >
      {/* torn paper scrap */}
      <polygon
        points="60,60 150,52 156,140 66,150"
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth="1"
        transform="rotate(6 110 100)"
        opacity="0.9"
      />
      {/* washi tape strip across the top corner */}
      <rect x="120" y="38" width="64" height="20" fill="var(--tape)" transform="rotate(-24 150 48)" />
      {/* rubber-stamp ring + star */}
      <g stroke="var(--primary)" fill="none" strokeWidth="2.4" className={reduce ? '' : 'glyph-deco-shimmer'}>
        <circle cx="112" cy="104" r="30" strokeOpacity="0.8" />
        <path d="M112 90 l4 11 12 0 -9 8 3 12 -10 -7 -10 7 3 -12 -9 -8 12 0z" fill="var(--primary)" fillOpacity="0.85" stroke="none" />
      </g>
    </svg>
  )
}

// Utilitarian: a print registration target — concentric rings + a crosshair, with a
// signal-orange inner ring that slowly pulses. Precise, mechanical.
function Registration() {
  const reduce = useReduceMotion()
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className="pointer-events-none absolute -right-10 -top-10 h-56 w-56"
    >
      <g fill="none" stroke="var(--fg)" strokeOpacity="0.55" strokeWidth="1.4">
        <circle cx="110" cy="90" r="54" />
        <circle cx="110" cy="90" r="30" />
        <line x1="110" y1="20" x2="110" y2="160" />
        <line x1="40" y1="90" x2="180" y2="90" />
      </g>
      <circle
        cx="110"
        cy="90"
        r="42"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        className={reduce ? '' : 'glyph-neon-rule'}
      />
    </svg>
  )
}

// Manga: radiating focus-lines (the classic "concentration" burst) converging on
// a point off the corner. Ink streaks of varied weight; the whole field rotates
// very slowly so it shimmers with energy. Rotation drops for reduce-motion.
function FocusLines() {
  const reduce = useReduceMotion()
  const cx = 100
  const cy = 100
  const rays = Array.from({ length: 40 }, (_, i) => {
    const a = (i / 40) * Math.PI * 2
    const inner = 46
    const outer = 168
    // a touch of jitter so it reads hand-inked, not machined
    const w = 1 + ((i * 7) % 5) * 0.5
    return {
      x1: cx + Math.cos(a) * inner,
      y1: cy + Math.sin(a) * inner,
      x2: cx + Math.cos(a) * outer,
      y2: cy + Math.sin(a) * outer,
      w,
    }
  })
  // 4-point kira-kira sparkle, centred on its own origin so it can scale in place.
  const KIRA = 'M0,-7 C1,-2 2,-1 7,0 C2,1 1,2 0,7 C-1,2 -2,1 -7,0 C-2,-1 -1,-2 0,-7 Z'
  const sparkles = [
    { x: 150, y: 44, s: 1.15, fill: 'var(--primary)', delay: '0s' },
    { x: 118, y: 150, s: 0.85, fill: 'var(--accent)', delay: '0.9s' },
    { x: 62, y: 78, s: 0.7, fill: 'var(--accent-2)', delay: '1.6s' },
    { x: 176, y: 116, s: 0.55, fill: 'var(--accent)', delay: '1.2s' },
  ]
  return (
    <>
      {/* rotating ink focus-lines */}
      <svg
        aria-hidden
        viewBox="0 0 200 200"
        className={`pointer-events-none absolute -right-14 -top-16 h-64 w-64 ${reduce ? '' : 'glyph-manga-spin'}`}
      >
        {rays.map((r, i) => (
          <line
            key={i}
            x1={r.x1}
            y1={r.y1}
            x2={r.x2}
            y2={r.y2}
            stroke="var(--fg)"
            strokeOpacity="0.12"
            strokeWidth={r.w}
          />
        ))}
      </svg>
      {/* kira-kira sparkles layered on top (a separate, non-rotating field) */}
      <svg
        aria-hidden
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -right-14 -top-16 h-64 w-64"
      >
        {sparkles.map((p, i) => (
          <g key={i} transform={`translate(${p.x} ${p.y}) scale(${p.s})`}>
            <path
              d={KIRA}
              fill={p.fill}
              className={reduce ? '' : 'glyph-sparkle'}
              style={reduce ? undefined : { animationDelay: p.delay }}
            />
          </g>
        ))}
      </svg>
    </>
  )
}

// Art Deco: a gold sunburst fan rising from the corner — radiating rays plus two
// concentric arcs, the whole thing shimmering like gilt catching light.
function Sunburst() {
  const reduce = useReduceMotion()
  const ox = 176 // origin near the top-right corner
  const oy = 26
  const rays = Array.from({ length: 11 }, (_, i) => {
    // fan spans roughly down-and-left from the corner
    const a = (Math.PI * 0.52 + (i / 10) * Math.PI * 0.46) // ~94°..177°
    const len = 150
    return { x2: ox + Math.cos(a) * len, y2: oy + Math.sin(a) * len }
  })
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className={`pointer-events-none absolute right-0 top-0 h-64 w-64 ${reduce ? '' : 'glyph-deco-shimmer'}`}
    >
      <g stroke="var(--primary)" strokeOpacity="0.5" strokeWidth="1.4">
        {rays.map((r, i) => (
          <line key={i} x1={ox} y1={oy} x2={r.x2} y2={r.y2} />
        ))}
      </g>
      <g fill="none" stroke="var(--gold)" strokeOpacity="0.6" strokeWidth="1.6">
        <path d={`M ${ox - 64} ${oy + 4} A 66 66 0 0 0 ${ox - 4} ${oy + 66}`} />
        <path d={`M ${ox - 96} ${oy + 6} A 98 98 0 0 0 ${ox - 6} ${oy + 98}`} />
      </g>
    </svg>
  )
}

// Japandi: a single hand-brushed circle. The brushed EDGE ripples like ink in
// water via animated turbulence; the whole mark drifts and breathes. Both the
// SMIL ripple and the CSS float are dropped when reduce-motion is requested.
function Enso() {
  const reduce = useReduceMotion()
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className={`pointer-events-none absolute -right-12 -top-14 h-60 w-60 ${reduce ? '' : 'glyph-enso'}`}
    >
      <defs>
        <filter id="sl-enso-brush">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.022 0.04"
            numOctaves={3}
            seed={7}
            result="t"
          >
            {!reduce && (
              <animate
                attributeName="baseFrequency"
                dur="16s"
                repeatCount="indefinite"
                values="0.022 0.04; 0.028 0.047; 0.019 0.036; 0.022 0.04"
              />
            )}
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="t"
            scale="11"
            xChannelSelector="R"
            yChannelSelector="G"
          >
            {!reduce && (
              <animate attributeName="scale" dur="9s" repeatCount="indefinite" values="10; 13.5; 10" />
            )}
          </feDisplacementMap>
        </filter>
      </defs>
      <circle
        cx="100"
        cy="100"
        r="74"
        fill="none"
        stroke="var(--primary)"
        strokeOpacity="0.34"
        strokeWidth="15"
        strokeLinecap="round"
        strokeDasharray="402 60"
        strokeDashoffset="28"
        transform="rotate(-18 100 100)"
        filter="url(#sl-enso-brush)"
      />
    </svg>
  )
}

// Cyberpunk: a broken neon ring — the noir answer to the ensō. The same arc
// form, an entirely different soul. It's drawn three times: a wide blurred halo,
// then a magenta tube offset a couple of px and a cyan tube on top, so the gap
// between them reads as chromatic aberration. The whole sign FLICKERS like a
// failing tube; the flicker (and only the flicker) is dropped for reduce-motion.
function NeonSign() {
  const reduce = useReduceMotion()
  // A nearly-closed ring with a deliberate break at the top-right, like a real
  // bent-glass sign. dasharray leaves the gap; the round caps soften the ends.
  const ring = {
    cx: 100,
    cy: 100,
    r: 70,
    fill: 'none',
    strokeWidth: 9,
    strokeLinecap: 'round' as const,
    strokeDasharray: '372 68',
    strokeDashoffset: 40,
    transform: 'rotate(-26 100 100)',
  }
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className={`pointer-events-none absolute -right-12 -top-14 h-60 w-60 ${reduce ? '' : 'glyph-neon'}`}
    >
      <defs>
        <filter id="sl-neon-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* soft halo cast onto the wet street */}
      <circle {...ring} stroke="var(--neon)" strokeOpacity="0.18" strokeWidth={22} filter="url(#sl-neon-glow)" />
      {/* magenta tube, nudged — the chromatic shadow */}
      <circle {...ring} stroke="var(--neon-2)" strokeOpacity="0.85" transform="rotate(-26 100 100) translate(2.4 1.6)" filter="url(#sl-neon-glow)" />
      {/* cyan tube on top */}
      <circle {...ring} stroke="var(--neon)" strokeOpacity="0.95" filter="url(#sl-neon-glow)" />
    </svg>
  )
}

// Default signature: the soft theme-tinted corner glow.
function SoftGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full opacity-50 blur-3xl"
      style={{
        background:
          'radial-gradient(circle, color-mix(in srgb, var(--primary) 28%, transparent), transparent 70%)',
      }}
    />
  )
}
