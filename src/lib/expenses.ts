// The rules that decide WHEN an expense lands on the ledger and HOW MUCH it
// contributes to a given month. Keeping this logic in one place (separate from
// the UI and the database) means the ledger and the Expenses page always agree,
// and we can reason about / test the rules on their own.

import { format, parseISO } from 'date-fns'
import type { Expense, ExpenseType, MonthKey } from '../db/types'
import { formatMonthLabel, monthsBetween } from './month'

export const EXPENSE_TYPE_LABEL: Record<ExpenseType, string> = {
  oneOff: 'One-off',
  monthlyFixed: 'Monthly',
  yearly: 'Yearly',
}

// How much this expense contributes to `month`. Returns 0 when it doesn't apply.
export function expenseAmountForMonth(e: Expense, month: MonthKey): number {
  switch (e.type) {
    // One-off: only the single month it was logged in.
    case 'oneOff':
      return e.startMonth === month ? e.amount : 0

    // Monthly-fixed: every month from startMonth onward. If it has a term
    // (a number of months) it stops after that many; term null/undefined means
    // "until cancelled" (forever).
    case 'monthlyFixed': {
      if (month < e.startMonth) return 0
      const elapsed = monthsBetween(e.startMonth, month) // 0 in the first month
      if (e.term != null && elapsed >= e.term) return 0
      return e.amount
    }

    // Yearly: the same calendar month as its due date, every year from the due
    // date's month onward. (e.g. due 2026-03-15 -> March 2026, March 2027, ...)
    case 'yearly': {
      if (!e.dueDate) return 0
      const dueMonthKey = e.dueDate.slice(0, 7) // 'YYYY-MM-DD' -> 'YYYY-MM'
      if (month < dueMonthKey) return 0
      const sameMonthOfYear = month.slice(5, 7) === dueMonthKey.slice(5, 7)
      return sameMonthOfYear ? e.amount : 0
    }
  }
}

// Total of all expenses that apply to a given month.
export function expenseTotalForMonth(
  expenses: Expense[],
  month: MonthKey,
): number {
  return expenses.reduce((sum, e) => sum + expenseAmountForMonth(e, month), 0)
}

// A short human-readable description of an expense's schedule, for list rows.
export function describeSchedule(e: Expense): string {
  switch (e.type) {
    case 'oneOff':
      return `One-off · ${formatMonthLabel(e.startMonth)}`
    case 'monthlyFixed':
      return e.term != null
        ? `Monthly · from ${formatMonthLabel(e.startMonth)} for ${e.term} months`
        : `Monthly · from ${formatMonthLabel(e.startMonth)}`
    case 'yearly':
      return e.dueDate
        ? `Yearly · due ${format(parseISO(e.dueDate), 'd LLLL')}`
        : 'Yearly'
  }
}
