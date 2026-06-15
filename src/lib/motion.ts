import type { Variants } from 'framer-motion'

/*
  Phase 10 — shared animation vocabulary.

  Keeping every timing and movement curve in one place means the whole app feels
  consistent and "calm" — nothing bounces or overshoots, durations stay short,
  and tweaking the feel is a one-file change. Components import these `variants`
  objects (named states like "initial"/"enter"/"exit") and Framer Motion handles
  the in-between frames.
*/

// A gentle ease-out curve (fast start, soft landing). The four numbers are the
// control points of a cubic-bezier, same idea as CSS `cubic-bezier(...)`.
export const EASE = [0.22, 1, 0.36, 1] as const

// Short by design — long enough to feel smooth, short enough to never delay you.
export const DURATION = 0.22

// Page-to-page transition: a small fade + a few pixels of vertical drift.
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  enter: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.14, ease: EASE } },
}

// A container whose children appear one-after-another instead of all at once.
// Put `variants={staggerContainer}` on a parent and `variants={fadeItem}` on
// each child; the parent's `staggerChildren` schedules them.
export const staggerContainer: Variants = {
  initial: {},
  enter: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
}

// One child of a stagger container: a soft rise-and-fade entrance.
export const fadeItem: Variants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE } },
}
