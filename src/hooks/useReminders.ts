import { useEffect, useMemo } from 'react'
import { useExpenses } from './useExpenses'
import { useSettings } from './useSettings'
import {
  computeReminders,
  notifyForReminders,
  type Reminder,
} from '../lib/reminders'

/*
  Live reminders: combines the user's expenses and notification prefs and runs
  the pure rules in ../lib/reminders.ts. Because both source hooks are
  useLiveQuery-backed, this recomputes automatically whenever an expense or a
  pref changes. useMemo keeps the returned array referentially stable (same
  reference unless the inputs change), which matters for the effect below.
*/
export function useReminders(): Reminder[] {
  const expenses = useExpenses()
  const settings = useSettings()
  return useMemo(
    () => computeReminders(expenses, settings),
    [expenses, settings],
  )
}

/*
  Side-effect hook: when reminders (or the currency symbol) change, fire any
  not-yet-seen browser notifications. Mounted once high in the tree (Layout) so
  it runs on app open regardless of which page you land on. It's best-effort —
  a no-op unless the browser supports notifications and you've granted
  permission in Settings.
*/
export function useReminderNotifications(): void {
  const reminders = useReminders()
  const settings = useSettings()
  useEffect(() => {
    notifyForReminders(reminders, settings.currencySymbol)
  }, [reminders, settings.currencySymbol])
}
