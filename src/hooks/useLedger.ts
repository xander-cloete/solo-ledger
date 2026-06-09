import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { MonthKey } from '../db/types'
import { expenseTotalForMonth } from '../lib/expenses'
import { monthRange } from '../lib/month'
import { useSettings } from './useSettings'

/*
  THE ROLLING LEDGER
  ------------------
  Each month carries its leftover money into the next:

    carry-in (this month)  = carry-out (previous month)
    carry-out (this month) = carry-in + income − expenses
    carry-in (first month) = your starting balance

  So to know a month's opening balance we add up every month's net (income −
  expenses) from the ledger's start up to — but not including — the month we're
  looking at, then add the starting balance on top.
*/

export interface LedgerSummary {
  carryIn: number // balance brought in from previous months
  income: number // income recorded in the selected month
  expenses: number // expenses that apply to the selected month
  carryOut: number // closing balance = carry-in + income − expenses
  currencySymbol: string
}

export function useLedger(month: MonthKey): LedgerSummary {
  const settings = useSettings()

  // Pull every income entry and every expense once. For a single-user personal
  // app these stay tiny, so it's simpler and plenty fast to compute the ledger
  // live rather than maintain a cache.
  const entries = useLiveQuery(() => db.incomeEntries.toArray(), []) ?? []
  const expenseDefs = useLiveQuery(() => db.expenses.toArray(), []) ?? []

  const incomeByMonth = new Map<MonthKey, number>()
  for (const e of entries) {
    incomeByMonth.set(e.month, (incomeByMonth.get(e.month) ?? 0) + e.amount)
  }

  const start = settings.ledgerStartMonth

  // Walk every month from the ledger start up to (not including) the selected
  // month, accumulating each month's net so we know the opening balance. Income
  // comes from the map; expenses are worked out from their scheduling rules.
  let prior = 0
  for (const m of monthRange(start, month)) {
    const inc = incomeByMonth.get(m) ?? 0
    const exp = expenseTotalForMonth(expenseDefs, m)
    prior += inc - exp
  }

  const carryIn = settings.startingBalance + prior
  const income = incomeByMonth.get(month) ?? 0
  const expenses = expenseTotalForMonth(expenseDefs, month)
  const carryOut = carryIn + income - expenses

  return {
    carryIn,
    income,
    expenses,
    carryOut,
    currencySymbol: settings.currencySymbol,
  }
}
