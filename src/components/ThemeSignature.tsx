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
    default:
      return <SoftGlow />
  }
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
