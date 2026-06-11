// Micro-expense items: the maths that turns a list of itemised purchases (each
// with its own buying frequency) into ONE monthly budget figure for the parent
// expense. Kept here — away from the UI and the database — so the roll-up rule
// lives in exactly one place and can be reasoned about on its own.

import type { ExpenseItem, ItemFrequency } from '../db/types'

export const FREQUENCY_LABEL: Record<ItemFrequency, string> = {
  weekly: 'Weekly',
  twiceMonthly: 'Twice a month',
  monthly: 'Monthly',
}

// A year has 52 weeks but only 12 months, so a "weekly" buy happens 52/12 ≈
// 4.33 times in an average month — not 4. Using the true average keeps a year's
// worth of weekly shopping from quietly under-counting by ~4 weeks.
const WEEKS_PER_MONTH = 52 / 12

// How many times an item is bought in an average month, by frequency.
const TIMES_PER_MONTH: Record<ItemFrequency, number> = {
  weekly: WEEKS_PER_MONTH,
  twiceMonthly: 2,
  monthly: 1,
}

// One item's contribution to the monthly budget:
//   (quantity bought each time) × (price each) × (times bought per month)
// Rounded to cents so the stored parent amount stays clean.
export function itemMonthlyCost(item: ExpenseItem): number {
  const perBuy = item.qty * item.unitPrice
  const monthly = perBuy * TIMES_PER_MONTH[item.frequency]
  return Math.round(monthly * 100) / 100
}

// The whole list rolled up into the single number the ledger deducts each month.
export function itemsMonthlyTotal(items: ExpenseItem[]): number {
  const total = items.reduce((sum, item) => sum + itemMonthlyCost(item), 0)
  return Math.round(total * 100) / 100
}

// One store's worth of items, with its own monthly subtotal — the unit the
// "Monthly Staples" view is built from.
export interface StoreGroup {
  store: string
  items: ExpenseItem[]
  total: number
}

// Group items by the store they're bought at, for the Monthly Staples view.
// Stores are sorted A–Z; items within a store are sorted by name. An empty
// store string is shown under "Unspecified" so nothing silently disappears.
export function groupItemsByStore(items: ExpenseItem[]): StoreGroup[] {
  const byStore = new Map<string, ExpenseItem[]>()
  for (const item of items) {
    const key = item.store.trim() || 'Unspecified'
    const list = byStore.get(key) ?? []
    list.push(item)
    byStore.set(key, list)
  }

  return [...byStore.entries()]
    .map(([store, list]) => ({
      store,
      items: list.sort((a, b) => a.name.localeCompare(b.name)),
      total: itemsMonthlyTotal(list),
    }))
    .sort((a, b) => a.store.localeCompare(b.store))
}
