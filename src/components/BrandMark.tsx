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

  return <img src="/sl-icon.svg" alt="" className="h-8 w-8 rounded-lg" />
}
