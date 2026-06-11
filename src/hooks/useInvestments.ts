import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { MonthKey, Portfolio, Transaction } from '../db/types'

/*
  LINKED TRANSACTIONS — the heart of Phase 4.

  Every movement of money between your budget and a portfolio is recorded as ONE
  transaction that also creates its "other half" somewhere else, so the two views
  always agree (a simplified version of double-entry bookkeeping):

    • CONTRIBUTE (money budget → portfolio)
        - a one-off EXPENSE  → your monthly budget drops
        - the portfolio BALANCE goes up
        - an `invest` transaction ties them together

    • DIVEST (money portfolio → budget)
        - an INCOME entry     → your monthly budget rises
        - the portfolio BALANCE goes down
        - a `divest` transaction ties them together

  Because the rolling ledger already reads income entries and expenses, these
  movements show up in the ledger automatically — no ledger changes needed.

  Linking trick: the auto-created balance snapshot gets the id `bal:<txnId>`, so
  deleting a transaction can find and remove its balance bump without storing an
  extra reference.
*/

// All transactions touching one portfolio (as source or destination), newest
// month first. We read all and filter in memory — the table stays tiny, and
// "from OR to" isn't a single Dexie index.
export function usePortfolioTransactions(portfolioId: string): Transaction[] {
  return (
    useLiveQuery(
      () =>
        db.transactions.toArray().then((rows) =>
          rows
            .filter(
              (t) =>
                t.fromPortfolioId === portfolioId ||
                t.toPortfolioId === portfolioId,
            )
            .sort((a, b) => b.month.localeCompare(a.month)),
        ),
      [portfolioId],
    ) ?? []
  )
}

// The balance to build on before a movement: the latest snapshot, or — if none
// yet — what the portfolio started with.
async function currentBalanceOf(p: Portfolio): Promise<number> {
  const balances = await db.portfolioBalances
    .where('portfolioId')
    .equals(p.id)
    .toArray()
  if (balances.length === 0) return p.initialAmount
  balances.sort((a, b) => a.date.localeCompare(b.date))
  return balances.at(-1)!.balance
}

// CONTRIBUTE: put money from the budget into a portfolio (a one-off top-up).
export async function contribute(
  portfolioId: string,
  amount: number,
  month: MonthKey,
): Promise<void> {
  await db.transaction(
    'rw',
    db.portfolios,
    db.portfolioBalances,
    db.transactions,
    db.expenses,
    async () => {
      const p = await db.portfolios.get(portfolioId)
      if (!p) return
      const txnId = crypto.randomUUID()
      const expenseId = crypto.randomUUID()
      const balanceBefore = await currentBalanceOf(p)

      // 1) The budget side: a one-off expense in the chosen month.
      await db.expenses.put({
        id: expenseId,
        name: `Invest: ${p.name}`,
        type: 'oneOff',
        amount,
        startMonth: month,
        hasItems: false,
        linkedPortfolioId: portfolioId,
      })
      // 2) The link record.
      await db.transactions.put({
        id: txnId,
        month,
        type: 'invest',
        amount,
        toPortfolioId: portfolioId,
        relatedExpenseId: expenseId,
      })
      // 3) The portfolio side: balance rises by the contribution. A full
      //    timestamp keeps this newest so it becomes the current balance.
      await db.portfolioBalances.put({
        id: `bal:${txnId}`,
        portfolioId,
        date: new Date().toISOString(),
        balance: balanceBefore + amount,
      })
    },
  )
}

// DIVEST: take money out of a portfolio and into the budget as income.
export async function divest(
  portfolioId: string,
  amount: number,
  month: MonthKey,
): Promise<void> {
  await db.transaction(
    'rw',
    db.portfolios,
    db.portfolioBalances,
    db.transactions,
    db.incomeEntries,
    async () => {
      const p = await db.portfolios.get(portfolioId)
      if (!p) return
      const txnId = crypto.randomUUID()
      const incomeId = `txn:${txnId}`
      const balanceBefore = await currentBalanceOf(p)

      // 1) The budget side: an income entry (no stream — it's one-off). The ledger
      //    sums all income entries, so this lifts the chosen month automatically.
      await db.incomeEntries.put({
        id: incomeId,
        month,
        amount,
        note: `Divested from ${p.name}`,
        sourceTxnId: txnId,
      })
      // 2) The link record.
      await db.transactions.put({
        id: txnId,
        month,
        type: 'divest',
        amount,
        fromPortfolioId: portfolioId,
        relatedIncomeId: incomeId,
      })
      // 3) The portfolio side: balance falls by the withdrawal.
      await db.portfolioBalances.put({
        id: `bal:${txnId}`,
        portfolioId,
        date: new Date().toISOString(),
        balance: balanceBefore - amount,
      })
    },
  )
}

// Undo a movement: remove the transaction and its other half (the linked expense
// or income) and the balance bump it created — all together.
export async function deleteTransaction(t: Transaction): Promise<void> {
  await db.transaction(
    'rw',
    db.transactions,
    db.expenses,
    db.incomeEntries,
    db.portfolioBalances,
    async () => {
      if (t.relatedExpenseId) await db.expenses.delete(t.relatedExpenseId)
      if (t.relatedIncomeId) await db.incomeEntries.delete(t.relatedIncomeId)
      await db.portfolioBalances.delete(`bal:${t.id}`)
      await db.transactions.delete(t.id)
    },
  )
}
