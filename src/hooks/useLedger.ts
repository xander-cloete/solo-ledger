import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { MonthKey } from '../db/types'
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

  Expenses arrive in Phase 2; for now they're always 0, but the formula already
  leaves a slot for them so Phase 2 just fills it in.
*/

export interface LedgerSummary {
  carryIn: number // balance brought in from previous months
  income: number // income recorded in the selected month
  expenses: number // expenses in the selected month (0 until Phase 2)
  carryOut: number // closing balance = carry-in + income − expenses
  currencySymbol: string
}

export function useLedger(month: MonthKey): LedgerSummary {
  const settings = useSettings()

  // Pull every income entry once and total it per month in memory. For a
  // single-user personal app this stays tiny, so it's simpler and plenty fast
  // to compute live rather than maintain a cache.
  const entries = useLiveQuery(() => db.incomeEntries.toArray(), []) ?? []

  const incomeByMonth = new Map<MonthKey, number>()
  for (const e of entries) {
    incomeByMonth.set(e.month, (incomeByMonth.get(e.month) ?? 0) + e.amount)
  }

  const start = settings.ledgerStartMonth

  // Sum income for every month from the ledger start up to (not including) the
  // selected month. Because month keys are 'YYYY-MM' strings, a plain >=/<
  // comparison gives us the right chronological range.
  let priorIncome = 0
  for (const [m, total] of incomeByMonth) {
    if (m >= start && m < month) priorIncome += total
  }

  // Expenses are not modelled yet (Phase 2). Placeholder so the maths is ready.
  const priorExpenses = 0
  const expenses = 0

  const carryIn = settings.startingBalance + priorIncome - priorExpenses
  const income = incomeByMonth.get(month) ?? 0
  const carryOut = carryIn + income - expenses

  return {
    carryIn,
    income,
    expenses,
    carryOut,
    currencySymbol: settings.currencySymbol,
  }
}
