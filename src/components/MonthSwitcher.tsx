import { addMonthsKey, currentMonthKey, formatMonthLabel } from '../lib/month'
import type { MonthKey } from '../db/types'

// Prev / current-month label / next, plus a "Today" jump. Shared by the Income
// and Expenses pages so they stay in lock-step.
export function MonthSwitcher({
  month,
  onChange,
}: {
  month: MonthKey
  onChange: (m: MonthKey) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Previous month"
        onClick={() => onChange(addMonthsKey(month, -1))}
        className="rounded-lg border border-border px-2 py-1 text-muted hover:text-fg"
      >
        ‹
      </button>
      <span className="min-w-36 text-center text-sm font-medium">
        {formatMonthLabel(month)}
      </span>
      <button
        type="button"
        aria-label="Next month"
        onClick={() => onChange(addMonthsKey(month, 1))}
        className="rounded-lg border border-border px-2 py-1 text-muted hover:text-fg"
      >
        ›
      </button>
      <button
        type="button"
        onClick={() => onChange(currentMonthKey())}
        className="ml-1 rounded-lg border border-border px-2 py-1 text-xs text-muted hover:text-fg"
      >
        Today
      </button>
    </div>
  )
}
