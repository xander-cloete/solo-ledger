// Phase 9 — a quiet, optional gamification layer.
//
// Nothing here is stored. Like the dashboard, it's a pure read-derivation of
// data you already entered, so it can never disagree with your real figures.
// Three gentle mechanics, all designed to encourage without nagging:
//
//   • Level     — a garden that grows as your net worth grows.
//   • Streak    — consecutive completed months where you didn't overspend.
//   • Budget    — how much of THIS month's income your expenses have used.

import type { Expense, IncomeEntry, MonthKey } from '../db/types'
import { expenseTotalForMonth } from './expenses'
import { monthRange } from './month'

// --- Levels -----------------------------------------------------------------

// Each tier starts at a net-worth `floor`. A growing-garden theme keeps it calm
// and on-brand with the default palette. Tweak freely — it's just encouragement.
const LEVELS: { floor: number; title: string; emoji: string }[] = [
  { floor: 0, title: 'Seedling', emoji: '🌱' },
  { floor: 1_000, title: 'Sprout', emoji: '🌿' },
  { floor: 5_000, title: 'Sapling', emoji: '🪴' },
  { floor: 20_000, title: 'Grove', emoji: '🌳' },
  { floor: 50_000, title: 'Forest', emoji: '🌲' },
  { floor: 100_000, title: 'Wilds', emoji: '🏞️' },
  { floor: 250_000, title: 'Summit', emoji: '🏔️' },
  { floor: 500_000, title: 'Vista', emoji: '🌄' },
  { floor: 1_000_000, title: 'Magnate', emoji: '👑' },
]

export interface LevelInfo {
  level: number // 1-based
  title: string
  emoji: string
  floor: number // net worth at which this level begins
  next: number | null // net worth needed for the next level (null = top tier)
  toNext: number // how much more net worth to level up (0 at top)
  progress: number // 0..1 through the current level
}

export function computeLevel(netWorth: number): LevelInfo {
  const nw = Math.max(0, netWorth) // debt just sits at the first level
  let idx = 0
  for (let i = 0; i < LEVELS.length; i++) {
    if (nw >= LEVELS[i].floor) idx = i
  }
  const cur = LEVELS[idx]
  const next = LEVELS[idx + 1]?.floor ?? null
  const progress = next === null ? 1 : (nw - cur.floor) / (next - cur.floor)
  return {
    level: idx + 1,
    title: cur.title,
    emoji: cur.emoji,
    floor: cur.floor,
    next,
    toNext: next === null ? 0 : next - nw,
    progress: Math.max(0, Math.min(1, progress)),
  }
}

// --- Savings streak ---------------------------------------------------------

export interface MonthNet {
  month: MonthKey
  net: number // income − expenses for that month
  active: boolean // did anything actually happen this month?
}

// Net (income − expenses) for every COMPLETED month in [start, currentExclusive).
// The current, in-progress month is deliberately excluded — its expenses are
// already fully scheduled while its income may only be partly entered, so judging
// it as a "saving month" mid-month would be unfair. (Budget adherence below
// covers the live month instead.)
export function monthlyNets(
  entries: IncomeEntry[],
  expenseDefs: Expense[],
  start: MonthKey,
  currentExclusive: MonthKey,
): MonthNet[] {
  const incomeByMonth = new Map<MonthKey, number>()
  for (const e of entries) {
    incomeByMonth.set(e.month, (incomeByMonth.get(e.month) ?? 0) + e.amount)
  }
  return monthRange(start, currentExclusive).map((m) => {
    const income = incomeByMonth.get(m) ?? 0
    const expenses = expenseTotalForMonth(expenseDefs, m)
    return { month: m, net: income - expenses, active: income > 0 || expenses > 0 }
  })
}

// Drop empty months at the very start (before you'd entered anything), so a
// brand-new ledger doesn't award a "streak" for months that never happened.
function fromFirstActive(nets: MonthNet[]): MonthNet[] {
  const i = nets.findIndex((n) => n.active)
  return i === -1 ? [] : nets.slice(i)
}

// Current run: most-recent completed months in a row where you didn't overspend
// (net >= 0). Stops at the first month you went negative.
export function currentStreak(nets: MonthNet[]): number {
  const months = fromFirstActive(nets)
  let streak = 0
  for (let i = months.length - 1; i >= 0; i--) {
    if (months[i].net >= 0) streak++
    else break
  }
  return streak
}

// Longest such run you've ever managed (for a gentle "personal best").
export function bestStreak(nets: MonthNet[]): number {
  const months = fromFirstActive(nets)
  let best = 0
  let run = 0
  for (const n of months) {
    if (n.net >= 0) {
      run++
      best = Math.max(best, run)
    } else {
      run = 0
    }
  }
  return best
}

// --- Budget adherence (current month) ---------------------------------------

export interface BudgetStatus {
  usedPct: number | null // expenses as a % of income (null if no income yet)
  onTrack: boolean // expenses within income this month
}

export function budgetStatus(monthIncome: number, monthExpenses: number): BudgetStatus {
  return {
    usedPct: monthIncome > 0 ? (monthExpenses / monthIncome) * 100 : null,
    onTrack: monthExpenses <= monthIncome,
  }
}
