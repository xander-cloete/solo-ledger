import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

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
      className={`block text-[11px] font-medium uppercase tracking-[0.18em] text-muted ${className}`}
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
      className={`text-[11px] font-medium uppercase tracking-[0.18em] text-muted ${className}`}
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
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {title}
        </h1>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
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
