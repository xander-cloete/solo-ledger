// Phase 7 — Reminders.
//
// Yearly expenses (insurance, domain renewals, subscriptions…) are easy to
// forget because they hit once a year. This module works out, for each yearly
// expense, when it's next due and whether we're at a "heads-up" lead time —
// 3 months before, or 1 month before — so the app can warn you in time to set
// the money aside.
//
// As always, the *rules* live here (pure functions, no UI, no database) so they
// can be reasoned about on their own and reused by both the in-app banner and
// the browser notifications.

import type { Expense, Settings, MonthKey } from '../db/types'
import { currentMonthKey, monthsBetween, formatMonthLabel } from './month'
import { formatMoney } from './format'

// One thing worth reminding the user about.
export interface Reminder {
  expenseId: string
  name: string
  amount: number
  dueMonth: MonthKey // the month it's next due, e.g. '2027-03'
  dueDateLabel: string // friendly, e.g. '15 March 2027'
  leadMonths: number // 3 or 1 — how far ahead this reminder fires
  monthsUntil: number // whole months from now until the due month
}

// The lead times we fire at, each tied to the matching on/off pref in settings.
// (Keeping them together means the banner and notifications stay in lock-step
// with the toggles, and adding a new lead time later is a one-line change.)
const LEADS: { months: number; pref: keyof Settings['notifications'] }[] = [
  { months: 3, pref: 'yearlyThreeMonths' },
  { months: 1, pref: 'yearlyOneMonth' },
]

// The next month (>= `from`) in which a yearly expense falls. A yearly expense
// recurs in the same calendar month every year, so we take that month-of-year in
// the current year, and roll to next year if it's already passed.
function nextDueMonth(dueDate: string, from: MonthKey): MonthKey {
  const monthOfYear = dueDate.slice(5, 7) // 'YYYY-MM-DD' -> 'MM'
  const fromYear = Number(from.slice(0, 4))
  const thisYear = `${fromYear}-${monthOfYear}`
  return thisYear >= from ? thisYear : `${fromYear + 1}-${monthOfYear}`
}

// Build the list of reminders that apply right now, given the user's expenses
// and prefs. `today` is injectable so the logic is easy to test.
export function computeReminders(
  expenses: Expense[],
  settings: Settings,
  today: MonthKey = currentMonthKey(),
): Reminder[] {
  const out: Reminder[] = []

  for (const e of expenses) {
    if (e.type !== 'yearly' || !e.dueDate) continue

    const dueMonth = nextDueMonth(e.dueDate, today)
    const monthsUntil = monthsBetween(today, dueMonth)

    for (const lead of LEADS) {
      if (monthsUntil !== lead.months) continue
      if (!settings.notifications[lead.pref]) continue

      const day = Number(e.dueDate.slice(8, 10)) // day-of-month from the due date
      out.push({
        expenseId: e.id,
        name: e.name,
        amount: e.amount,
        dueMonth,
        // formatMonthLabel('2027-03') -> 'March 2027'; prefix the day -> '15 March 2027'.
        dueDateLabel: `${day} ${formatMonthLabel(dueMonth)}`,
        leadMonths: lead.months,
        monthsUntil,
      })
    }
  }

  // Soonest first, then alphabetical for a stable order.
  out.sort((a, b) => a.monthsUntil - b.monthsUntil || a.name.localeCompare(b.name))
  return out
}

// A short sentence for a reminder card or notification body.
export function describeReminder(r: Reminder, sym: string): string {
  const away =
    r.monthsUntil === 0
      ? 'this month'
      : `${r.monthsUntil} month${r.monthsUntil === 1 ? '' : 's'} away`
  return `${formatMoney(r.amount, sym)} due ${r.dueDateLabel} · ${away}`
}

// --- Browser notifications (best-effort) -----------------------------------
//
// The Notification API only works if the browser supports it AND the user has
// granted permission. Everything here degrades gracefully: if support or
// permission is missing, we simply do nothing — the in-app banner is always the
// reliable channel.

export type PermissionState = NotificationPermission | 'unsupported'

export function notificationPermission(): PermissionState {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

// Ask the user to allow notifications. Returns the resulting permission.
export async function requestNotificationPermission(): Promise<PermissionState> {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.requestPermission()
}

// We remember which reminders we've already shown a notification for, so opening
// the app repeatedly doesn't re-notify. The key includes the due month, so next
// year's occurrence (a different month) correctly notifies again.
const NOTIFIED_KEY = 'solo-ledger:notified-reminders'

function reminderKey(r: Reminder): string {
  return `${r.expenseId}:${r.dueMonth}:${r.leadMonths}`
}

function loadNotified(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

// Fire one browser notification per not-yet-seen reminder. No-op unless the
// browser supports notifications and permission has been granted.
export function notifyForReminders(reminders: Reminder[], sym: string): void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return
  }

  const seen = loadNotified()
  let changed = false

  for (const r of reminders) {
    const key = reminderKey(r)
    if (seen.has(key)) continue
    try {
      new Notification(`Upcoming: ${r.name}`, {
        body: describeReminder(r, sym),
        tag: key, // collapses duplicates if two fire at once
      })
    } catch {
      // best-effort: ignore any platform hiccup
    }
    seen.add(key)
    changed = true
  }

  if (changed) {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...seen]))
  }
}
