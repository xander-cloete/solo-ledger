// One place that knows how to order any list the app shows. Pages hand it the
// chosen SortKey plus small "accessor" functions (how to read an item's name,
// amount, and date), and get back a sorted copy. Keeping it generic means every
// page sorts identically and the dropdown options stay in sync everywhere.

import type { SortKey } from '../db/types'

// The options the sort dropdown offers, in display order. Labels use an en dash
// and arrows to read cleanly in the menu.
export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'amount-desc', label: 'Amount: high → low' },
  { value: 'amount-asc', label: 'Amount: low → high' },
  { value: 'date-desc', label: 'Date: newest first' },
  { value: 'date-asc', label: 'Date: oldest first' },
]

export interface SortAccessors<T> {
  name?: (x: T) => string
  amount?: (x: T) => number
  // A naturally-sortable date string, e.g. 'YYYY-MM' or 'YYYY-MM-DD'.
  date?: (x: T) => string
}

// Return a sorted copy of `items`. When the requested dimension isn't available
// for this list (e.g. sorting income streams by date — they have none), we fall
// back to name order so the list still reads sensibly instead of shuffling.
export function sortBy<T>(
  items: T[],
  key: SortKey,
  acc: SortAccessors<T>,
): T[] {
  const byName = acc.name
    ? (a: T, b: T) => acc.name!(a).localeCompare(acc.name!(b))
    : () => 0

  const out = [...items]
  switch (key) {
    case 'name-asc':
      out.sort(byName)
      break
    case 'name-desc':
      out.sort((a, b) => byName(b, a))
      break
    case 'amount-asc':
      out.sort(acc.amount ? (a, b) => acc.amount!(a) - acc.amount!(b) || byName(a, b) : byName)
      break
    case 'amount-desc':
      out.sort(acc.amount ? (a, b) => acc.amount!(b) - acc.amount!(a) || byName(a, b) : byName)
      break
    case 'date-asc':
      out.sort(acc.date ? (a, b) => acc.date!(a).localeCompare(acc.date!(b)) || byName(a, b) : byName)
      break
    case 'date-desc':
      out.sort(acc.date ? (a, b) => acc.date!(b).localeCompare(acc.date!(a)) || byName(a, b) : byName)
      break
  }
  return out
}
