import { useEffect, useRef } from 'react'
import { animate } from 'framer-motion'
import { EASE } from '../lib/motion'
import { useReduceMotion } from '../hooks/useReduceMotion'

/*
  Smoothly counts a number from its previous value to its new value whenever
  `value` changes — e.g. your net worth ticking up after you log income. It's a
  "live accent": the figure itself is always exact (we format every frame), the
  motion just draws the eye to what changed.

  Implementation notes:
   - We write straight to the DOM node each frame (node.textContent) rather than
     through React state, so a 60fps count-up doesn't trigger 60 React renders.
   - `formatRef`/`fromRef` are refs so the effect can read the latest formatter
     and starting value without listing them as dependencies (which would
     restart the animation on every render).
   - If reduce-motion is on (OS or in-app), we snap straight to the value.
*/
export function CountUp({
  value,
  format,
  className,
}: {
  value: number
  format: (n: number) => string
  className?: string
}) {
  const reduce = useReduceMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const fromRef = useRef(value)
  const formatRef = useRef(format)
  formatRef.current = format

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const from = fromRef.current
    fromRef.current = value // next change animates from here

    // No movement needed: first paint, an unchanged value, or reduce-motion.
    if (reduce || from === value) {
      node.textContent = formatRef.current(value)
      return
    }

    const controls = animate(from, value, {
      duration: 0.5,
      ease: EASE,
      onUpdate: (v: number) => {
        node.textContent = formatRef.current(v)
      },
    })
    return () => controls.stop()
  }, [value, reduce])

  // Initial server/first render shows the formatted value immediately; the
  // effect takes over for subsequent changes.
  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  )
}
