import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Expense } from '../db/types'

/*
  Reads (a live hook) and writes (plain async functions) for expenses, mirroring
  the shape of useIncome.ts. Which months an expense lands on is decided by the
  rules in ../lib/expenses.ts, not stored — so here we just persist the expense
  definitions and let those rules do the placement.
*/

// All expenses, sorted by name. `name` isn't a Dexie index on this table, so we
// can't use orderBy('name'); we sort in memory instead (tiny list, no problem).
export function useExpenses(): Expense[] {
  return (
    useLiveQuery(() =>
      db.expenses.toArray().then((rows) =>
        rows.sort((a, b) => a.name.localeCompare(b.name)),
      ),
    []) ?? []
  )
}

// Create or overwrite an expense in one call. `put` replaces the whole record,
// so when an expense changes type (e.g. yearly -> monthly) no stale fields like
// an old dueDate are left behind. The add/edit form builds the full object.
export async function saveExpense(expense: Expense): Promise<void> {
  await db.expenses.put(expense)
}

// Delete an expense and, in the same transaction, any micro-expense items that
// belonged to it — so we never leave orphaned items pointing at a gone expense.
export async function deleteExpense(id: string): Promise<void> {
  await db.transaction('rw', db.expenses, db.expenseItems, async () => {
    await db.expenseItems.where('expenseId').equals(id).delete()
    await db.expenses.delete(id)
  })
}
