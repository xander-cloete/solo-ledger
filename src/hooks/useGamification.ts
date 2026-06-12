import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { currentMonthKey } from '../lib/month'
import {
  budgetStatus,
  bestStreak,
  computeLevel,
  currentStreak,
  monthlyNets,
  type BudgetStatus,
  type LevelInfo,
} from '../lib/gamification'
import { useSettings } from './useSettings'
import { useDashboard } from './useDashboard'

export interface GamificationData {
  sym: string
  level: LevelInfo
  netWorth: number
  streak: number // current run of completed saving months
  bestStreak: number // best such run ever
  monthIncome: number // this month so far
  monthExpenses: number // this month (fully scheduled)
  budget: BudgetStatus
  hasAnyData: boolean
}

/*
  Combines two sources, inventing nothing:
    • useDashboard() for net worth and this month's income/expenses (so the level
      and budget figures match the dashboard cards exactly).
    • a tiny ledger walk over completed months for the savings streak.
  Because both underlying queries are live, this recomputes automatically.
*/
export function useGamification(): GamificationData {
  const settings = useSettings()
  const d = useDashboard()
  const entries = useLiveQuery(() => db.incomeEntries.toArray(), []) ?? []
  const expenseDefs = useLiveQuery(() => db.expenses.toArray(), []) ?? []

  const current = currentMonthKey()
  // Guard against a start month set in the future (mirrors useDashboard).
  const start =
    settings.ledgerStartMonth <= current ? settings.ledgerStartMonth : current
  const nets = monthlyNets(entries, expenseDefs, start, current)

  return {
    sym: d.sym,
    level: computeLevel(d.netWorth),
    netWorth: d.netWorth,
    streak: currentStreak(nets),
    bestStreak: bestStreak(nets),
    monthIncome: d.monthIncome,
    monthExpenses: d.monthExpenses,
    budget: budgetStatus(d.monthIncome, d.monthExpenses),
    hasAnyData: d.hasAnyData,
  }
}
