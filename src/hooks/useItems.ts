import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { ExpenseItem } from '../db/types'
import { itemsMonthlyTotal } from '../lib/items'

/*
  Reads + writes for micro-expense items.

  THE KEY IDEA: an itemised expense's `amount` is never typed by hand — it is the
  roll-up of its items. So every time an item changes we recompute that total and
  write it back onto the parent expense. Because the rolling ledger already reads
  `expense.amount`, keeping that field in sync means the ledger needs zero changes
  to "understand" itemised expenses.
*/

// Live list of one expense's items (sorted by name). Passing `null` (e.g. no
// expense selected) yields an empty list. `expenseId` is a Dexie index, so the
// `where(...).equals(...)` query is fast.
export function useExpenseItems(expenseId: string | null): ExpenseItem[] {
  return (
    useLiveQuery(
      () =>
        expenseId
          ? db.expenseItems
              .where('expenseId')
              .equals(expenseId)
              .toArray()
              .then((rows) => rows.sort((a, b) => a.name.localeCompare(b.name)))
          : Promise.resolve<ExpenseItem[]>([]),
      [expenseId],
    ) ?? []
  )
}

// Live list of EVERY item across all expenses — feeds the Monthly Staples view.
export function useAllItems(): ExpenseItem[] {
  return useLiveQuery(() => db.expenseItems.toArray(), []) ?? []
}

// Recompute one expense's monthly total from its items and store it back on the
// expense. Called after any item change so `expense.amount` always matches.
async function syncExpenseAmount(expenseId: string): Promise<void> {
  const items = await db.expenseItems
    .where('expenseId')
    .equals(expenseId)
    .toArray()
  await db.expenses.update(expenseId, { amount: itemsMonthlyTotal(items) })
}

// Create or overwrite an item, then refresh the parent expense's total.
export async function saveItem(item: ExpenseItem): Promise<void> {
  await db.expenseItems.put(item)
  await syncExpenseAmount(item.expenseId)
}

// Delete an item, then refresh the parent expense's total.
export async function deleteItem(item: ExpenseItem): Promise<void> {
  await db.expenseItems.delete(item.id)
  await syncExpenseAmount(item.expenseId)
}
