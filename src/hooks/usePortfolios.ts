import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Portfolio, PortfolioBalance } from '../db/types'

/*
  Reads + writes for portfolios and their balance snapshots.

  A "balance snapshot" is you manually recording what the portfolio is worth on a
  given date (we never connect to a bank). The newest snapshot is the portfolio's
  current value; older ones let us measure growth over time.
*/

// All portfolios, sorted by name.
export function usePortfolios(): Portfolio[] {
  return useLiveQuery(() => db.portfolios.orderBy('name').toArray(), []) ?? []
}

// One portfolio's balance snapshots, newest first. `portfolioId` is an index so
// this query is fast; we sort in memory because `date` isn't a compound index.
export function usePortfolioBalances(portfolioId: string): PortfolioBalance[] {
  return (
    useLiveQuery(
      () =>
        db.portfolioBalances
          .where('portfolioId')
          .equals(portfolioId)
          .toArray()
          .then((rows) => rows.sort((a, b) => b.date.localeCompare(a.date))),
      [portfolioId],
    ) ?? []
  )
}

// --- Portfolio CRUD --------------------------------------------------------

// Create or overwrite a portfolio (the form builds the whole record).
export async function savePortfolio(portfolio: Portfolio): Promise<void> {
  await db.portfolios.put(portfolio)
}

// Delete a portfolio and everything attached to it, in one transaction:
//   - its balance snapshots
//   - its transactions (invest/divest), AND the linked expense or income each
//     one created — otherwise a withdrawal's income (or a contribution's expense)
//     would linger in the ledger pointing at a portfolio that's gone.
export async function deletePortfolio(id: string): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.portfolios,
      db.portfolioBalances,
      db.transactions,
      db.expenses,
      db.incomeEntries,
    ],
    async () => {
      const txns = (await db.transactions.toArray()).filter(
        (t) => t.fromPortfolioId === id || t.toPortfolioId === id,
      )
      for (const t of txns) {
        if (t.relatedExpenseId) await db.expenses.delete(t.relatedExpenseId)
        if (t.relatedIncomeId) await db.incomeEntries.delete(t.relatedIncomeId)
        await db.transactions.delete(t.id)
      }
      await db.portfolioBalances.where('portfolioId').equals(id).delete()
      await db.portfolios.delete(id)
    },
  )
}

// --- Balance snapshots -----------------------------------------------------

// Record (or overwrite) a manual balance snapshot for a portfolio on a date.
export async function addBalanceEntry(
  portfolioId: string,
  date: string,
  balance: number,
): Promise<void> {
  await db.portfolioBalances.put({
    id: crypto.randomUUID(),
    portfolioId,
    date,
    balance,
  })
}

export async function deleteBalanceEntry(id: string): Promise<void> {
  await db.portfolioBalances.delete(id)
}
