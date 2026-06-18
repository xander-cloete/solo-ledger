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
    case 'terminal':
      return <Scope />
    case 'tokyo-night':
      return <Moon />
    case 'clean':
      return <Sprig />
    case 'catppuccin-latte':
      return <CatCurl />
    default:
      return <SoftGlow />
  }
}

// Clean: a delicate botanical sprig — a thin sage stem with small paired leaves,
// swaying gently like something on a sunlit windowsill. Editorial calm.
function Sprig() {
  const reduce = useReduceMotion()
  const leaf = (x: number, y: number, rot: number) => (
    <ellipse cx={x} cy={y} rx="11" ry="4.5" transform={`rotate(${rot} ${x} ${y})`} />
  )
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className={`pointer-events-none absolute -right-8 -top-10 h-60 w-60 ${reduce ? '' : 'glyph-sway'}`}
      style={{ transformOrigin: '60% 95%' }}
    >
      <g stroke="var(--primary)" strokeOpacity="0.5" strokeWidth="1.6" fill="none">
        <path d="M150 176 C150 130 138 96 112 64 C100 49 92 40 90 24" strokeLinecap="round" />
      </g>
      <g fill="var(--primary)" fillOpacity="0.32" stroke="var(--primary)" strokeOpacity="0.45" strokeWidth="0.8">
        {leaf(132, 150, -28)}
        {leaf(118, 120, 32)}
        {leaf(124, 122, -34)}
        {leaf(104, 94, 38)}
        {leaf(110, 92, -40)}
        {leaf(92, 64, 44)}
        {leaf(90, 30, 8)}
      </g>
    </svg>
  )
}

// Catppuccin Latte: a curled sleeping cat in soft mauve — round body, two ears, a
// looping tail — breathing slowly. Cozy and a little playful (Catppuccin's cat).
function CatCurl() {
  const reduce = useReduceMotion()
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className="pointer-events-none absolute -right-8 -top-8 h-56 w-56"
    >
      <g
        className={reduce ? '' : 'glyph-breathe'}
        fill="var(--primary)"
        fillOpacity="0.42"
      >
        {/* body */}
        <circle cx="112" cy="100" r="44" />
        {/* ears */}
        <polygon points="80,68 90,30 106,60" />
        <polygon points="144,68 134,30 118,60" />
        {/* tail curling around */}
        <path
          d="M150 112 C182 112 184 152 150 156"
          fill="none"
          stroke="var(--primary)"
          strokeOpacity="0.42"
          strokeWidth="11"
          strokeLinecap="round"
        />
      </g>
      {/* closed eye + nose hints (still, not part of the breath) */}
      <g stroke="var(--surface)" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.8">
        <path d="M96 96 q6 5 12 0" />
        <path d="M122 96 q6 5 12 0" />
      </g>
    </svg>
  )
}

// Terminal: a CRT oscilloscope — a jagged phosphor trace with a lit beam sweeping
// along it (the sweep is a dash travelling the path). Reduce-motion stills the beam.
function Scope() {
  const reduce = useReduceMotion()
  const trace = 'M-10 120 L18 120 32 92 48 132 68 58 92 142 116 98 138 110 158 70 184 122 230 122'
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className="pointer-events-none absolute -right-10 -top-8 h-56 w-56"
    >
      <defs>
        <filter id="sl-scope-glow" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* dim base trace */}
      <path d={trace} fill="none" stroke="var(--primary)" strokeOpacity="0.28" strokeWidth="1.6" />
      {/* lit beam: a short dash travelling the trace */}
      <path
        d={trace}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.2"
        strokeLinecap="round"
        filter="url(#sl-scope-glow)"
        strokeDasharray="22 618"
        className={reduce ? '' : 'glyph-scope'}
      />
    </svg>
  )
}

// Tokyo Night: a glowing crescent moon (carved with a mask) and a few twinkling
// stars — calm and nocturnal. The moon breathes; the stars wink.
function Moon() {
  const reduce = useReduceMotion()
  const stars = [
    { cx: 60, cy: 56, r: 1.8, fill: 'var(--primary)', delay: '0s' },
    { cx: 150, cy: 120, r: 1.5, fill: 'var(--accent)', delay: '0.9s' },
    { cx: 78, cy: 132, r: 1.4, fill: 'var(--accent-2)', delay: '1.6s' },
    { cx: 40, cy: 100, r: 1.3, fill: 'var(--primary)', delay: '1.2s' },
  ]
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className="pointer-events-none absolute -right-10 -top-10 h-60 w-60"
    >
      <defs>
        <mask id="sl-moon-mask">
          <circle cx="118" cy="84" r="46" fill="white" />
          <circle cx="138" cy="76" r="40" fill="black" />
        </mask>
        <filter id="sl-moon-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle
        cx="118"
        cy="84"
        r="46"
        fill="var(--fg)"
        fillOpacity="0.55"
        mask="url(#sl-moon-mask)"
        filter="url(#sl-moon-glow)"
        className={reduce ? '' : 'glyph-moon'}
      />
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          fill={s.fill}
          className={reduce ? '' : 'glyph-twinkle'}
          style={reduce ? undefined : { animationDelay: s.delay }}
        />
      ))}
    </svg>
  )
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

// Sketch: a roughed-in circle worked up like a drafting plate — a dashed bounding
// box with corner crop ticks, a doubled wobbly graphite circle, a surveying
// crosshair, a red radius leader, a scale bar and a dimension arrow. Lots of
// construction marks so it reads as a working sketch, not a lone shape.
function Construction() {
  const reduce = useReduceMotion()
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className="pointer-events-none absolute -right-12 -top-12 h-60 w-60"
    >
      {/* dashed bounding box + corner crop ticks (the construction frame) */}
      <g stroke="var(--graphite)" strokeOpacity="0.3" strokeWidth="1" fill="none">
        <rect x="38" y="38" width="124" height="124" strokeDasharray="3 5" />
        <path d="M30 38 H46 M38 30 V46 M154 38 H170 M162 30 V46 M30 162 H46 M38 154 V170 M154 162 H170 M162 154 V170" strokeOpacity="0.5" />
      </g>
      {/* dashed surveying crosshair — slowly "surveys" via a draw-crawl */}
      <g
        stroke="var(--graphite)"
        strokeOpacity="0.35"
        strokeWidth="1"
        strokeDasharray="4 4"
        className={reduce ? '' : 'glyph-draw'}
      >
        <line x1="100" y1="34" x2="100" y2="166" />
        <line x1="34" y1="100" x2="166" y2="100" />
      </g>
      {/* doubled hand-drawn circle (two slightly offset passes) */}
      <g fill="none" stroke="var(--graphite)" strokeOpacity="0.7" strokeWidth="1.6" strokeLinecap="round">
        <path d="M100 38 C135 38 162 66 162 100 C162 135 134 161 100 161 C65 161 38 134 38 100 C38 66 66 39 100 38 Z" />
        <path d="M101 40 C133 41 160 67 159 101 C159 133 133 159 99 159 C66 159 40 133 41 99 C41 67 67 41 101 40" strokeOpacity="0.4" strokeWidth="1.1" />
      </g>
      {/* centre dot + small registration crosses pinned around the plate */}
      <g stroke="var(--graphite)" strokeOpacity="0.5" strokeWidth="1" strokeLinecap="round">
        <circle cx="100" cy="100" r="1.6" fill="var(--graphite)" stroke="none" fillOpacity="0.7" />
        <path d="M54 56 h6 M57 53 v6 M146 56 h6 M149 53 v6" strokeOpacity="0.35" />
      </g>
      {/* red annotations: a radius leader (centre→edge), a scale bar, a dimension arrow */}
      <g stroke="var(--primary)" strokeWidth="1.4" strokeLinecap="round" className={reduce ? '' : 'glyph-deco-shimmer'}>
        {/* radius leader to the circle edge with an arrowhead + an "R" tick */}
        <line x1="100" y1="100" x2="143" y2="71" />
        <path d="M143 71 137 71 M143 71 141 77" />
        <line x1="100" y1="95" x2="100" y2="105" strokeOpacity="0.6" />
        {/* segmented scale bar, top-left */}
        <line x1="40" y1="24" x2="88" y2="24" />
        <path d="M40 21 v6 M56 22 v4 M72 22 v4 M88 21 v6" strokeOpacity="0.8" />
        {/* bottom dimension arrow with extension ticks */}
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

// Mixed media: a layered collage cluster — a tinted scrap behind a torn paper note,
// a perforated postage stamp, crossing washi-tape strips, a paperclip, a dashed
// "cut here" line and a rubber-stamp ring. Lots of pasted-up pieces.
function Collage() {
  const reduce = useReduceMotion()
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className="pointer-events-none absolute -right-10 -top-10 h-56 w-56"
    >
      {/* teal scrap peeking out behind, rotated the other way */}
      <polygon
        points="52,72 120,58 132,128 58,142"
        fill="var(--accent)"
        fillOpacity="0.16"
        stroke="var(--accent)"
        strokeOpacity="0.4"
        strokeWidth="1"
        transform="rotate(-9 92 100)"
      />
      {/* main torn paper scrap */}
      <polygon
        points="60,60 150,52 156,140 66,150"
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth="1"
        transform="rotate(6 110 100)"
        opacity="0.95"
      />
      {/* dashed "cut here" line across the scrap */}
      <line x1="70" y1="116" x2="150" y2="110" stroke="var(--muted)" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.7" transform="rotate(6 110 100)" />
      {/* perforated postage stamp, bottom-left */}
      <g transform="rotate(-7 78 132)">
        <rect x="58" y="116" width="40" height="34" fill="var(--surface)" stroke="var(--accent)" strokeOpacity="0.6" strokeWidth="1" strokeDasharray="0.5 3.5" strokeLinecap="round" />
        <circle cx="78" cy="133" r="9" fill="var(--accent)" fillOpacity="0.45" />
      </g>
      {/* two crossing washi-tape strips on the top corner */}
      <rect x="120" y="38" width="64" height="20" fill="var(--tape)" transform="rotate(-24 150 48)" />
      <rect x="40" y="44" width="48" height="16" fill="var(--tape)" transform="rotate(18 64 52)" />
      {/* a bent-wire paperclip clipping the top edge of the scrap */}
      <path
        d="M150 44 v22 a6 6 0 0 1 -12 0 v-16 a4 4 0 0 1 8 0 v14"
        fill="none"
        stroke="var(--muted)"
        strokeOpacity="0.85"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* rubber-stamp ring + star */}
      <g stroke="var(--primary)" fill="none" strokeWidth="2.4" className={reduce ? '' : 'glyph-deco-shimmer'}>
        <circle cx="118" cy="98" r="26" strokeOpacity="0.8" />
        <path d="M118 86 l3.4 9.4 10 0 -7.6 6.8 2.6 10 -8.4 -5.8 -8.4 5.8 2.6 -10 -7.6 -6.8 10 0z" fill="var(--primary)" fillOpacity="0.85" stroke="none" />
      </g>
    </svg>
  )
}

// Utilitarian: a technical drawing plate — a print registration target (rings +
// crosshair) framed by corner crop marks, with dimension lines, a segmented scale
// bar and a tick ruler. A pulsing signal-orange inner ring. Precise, mechanical.
function Registration() {
  const reduce = useReduceMotion()
  const ticks = Array.from({ length: 13 }, (_, i) => 44 + i * 10) // ruler ticks
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className="pointer-events-none absolute -right-10 -top-10 h-56 w-56"
    >
      {/* corner crop marks framing the plate */}
      <g stroke="var(--fg)" strokeOpacity="0.5" strokeWidth="1.2">
        <path d="M34 22 H50 M34 22 V38 M186 22 H170 M186 22 V38 M34 158 H50 M34 158 V142 M186 158 H170 M186 158 V142" />
      </g>
      {/* registration target: concentric rings + crosshair */}
      <g fill="none" stroke="var(--fg)" strokeOpacity="0.55" strokeWidth="1.4">
        <circle cx="110" cy="90" r="54" />
        <circle cx="110" cy="90" r="30" />
        <line x1="110" y1="20" x2="110" y2="160" />
        <line x1="40" y1="90" x2="180" y2="90" />
      </g>
      {/* tick ruler along the bottom + a segmented scale bar */}
      <g stroke="var(--fg)" strokeOpacity="0.45" strokeWidth="1">
        {ticks.map((x, i) => (
          <line key={i} x1={x} y1="172" x2={x} y2={i % 5 === 0 ? 164 : 168} />
        ))}
        <line x1="44" y1="172" x2="164" y2="172" />
      </g>
      {/* signal-orange annotations: a dimension line + the pulsing inner ring */}
      <g stroke="var(--primary)" strokeWidth="1.6">
        <line x1="40" y1="36" x2="76" y2="36" />
        <path d="M40 36 45 33 M40 36 45 39 M76 36 71 33 M76 36 71 39" strokeWidth="1.2" />
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
            stroke="var(--ink)"
            strokeOpacity="0.16"
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
      style={{ filter: 'drop-shadow(0 0 13px color-mix(in srgb, var(--primary) 34%, transparent))' }}
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
        strokeOpacity="0.42"
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
