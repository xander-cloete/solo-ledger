import { useState } from 'react'
import { useReminders } from '../hooks/useReminders'
import { useSettings } from '../hooks/useSettings'
import { describeReminder } from '../lib/reminders'

// The in-app reminders area, shown at the top of the Dashboard ("on open").
// Each card can be dismissed for the current session (it reappears on reload, so
// you never lose track of a genuinely upcoming bill).
export function RemindersBanner() {
  const reminders = useReminders()
  const settings = useSettings()
  // A set of dismissed reminder keys. Lives in component state only, so it
  // resets when the app is reopened.
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = reminders.filter(
    (r) => !dismissed.has(`${r.expenseId}:${r.leadMonths}`),
  )
  if (visible.length === 0) return null

  function dismiss(key: string) {
    setDismissed((prev) => new Set(prev).add(key))
  }

  return (
    <section className="mt-6 space-y-2">
      {visible.map((r) => {
        const key = `${r.expenseId}:${r.leadMonths}`
        // 1-month reminders read as more urgent than 3-month ones.
        const urgent = r.leadMonths <= 1
        return (
          <div
            key={key}
            className={`flex items-start gap-3 rounded-card border p-4 ${
              urgent
                ? 'border-negative/40 bg-negative/10'
                : 'border-primary/40 bg-primary/10'
            }`}
          >
            <span className="mt-0.5 text-lg leading-none" aria-hidden>
              {urgent ? '⏰' : '🔔'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">
                {r.name} is coming up
              </div>
              <div className="mt-0.5 text-xs text-muted">
                {describeReminder(r, settings.currencySymbol)}
              </div>
            </div>
            <button
              onClick={() => dismiss(key)}
              aria-label="Dismiss reminder"
              className="shrink-0 rounded-md px-2 py-0.5 text-muted transition-colors hover:bg-border/40 hover:text-fg"
            >
              ✕
            </button>
          </div>
        )
      })}
    </section>
  )
}
