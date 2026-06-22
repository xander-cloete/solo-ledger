// The maths behind a liability — a debt you owe. Kept pure (data in, numbers out
// — no database, no UI) so the rules live in one place, exactly like
// investments.ts (assets) and projections.ts (forward growth).
//
// A liability is the MIRROR of a Portfolio:
//   • a Portfolio has a value that (hopefully) grows  → adds to net worth
//   • a Liability has a balance that you pay down      → subtracts from net worth
//
// Two things change over time, and both are tracked as dated snapshots so history
// is never lost:
//   • the outstanding balance (LiabilityBalance) — shrinks as you repay
//   • the annual interest rate (LiabilityRate)   — changes when the repo rate does
//
// For each, the rule is the same one investments.ts uses for balances: the newest
// snapshot dated on-or-before the date you ask about wins.

import type { Liability, LiabilityBalance, LiabilityRate } from '../db/types'

const r2 = (n: number) => Math.round(n * 100) / 100

// --- READING THE CURRENT STATE --------------------------------------------

// The most recent record dated on-or-before `dateStr`. Shared by both the
// balance and rate lookups below (they differ only in which date field they use,
// passed in via `dateOf`). Returns `fallback` when nothing is dated that early.
function latestOnOrBefore<T>(
  records: T[],
  dateOf: (r: T) => string,
  dateStr: string,
  fallback: number,
  valueOf: (r: T) => number,
): number {
  const prior = records
    .filter((r) => dateOf(r) <= dateStr)
    .sort((a, b) => dateOf(a).localeCompare(dateOf(b)))
  return prior.length ? valueOf(prior.at(-1)!) : fallback
}

// What you still owe right now — the newest balance snapshot. With no snapshots
// yet, you owe exactly the opening balance you started tracking with.
export function currentOwed(l: Liability, balances: LiabilityBalance[]): number {
  if (balances.length === 0) return l.openingBalance
  const latest = [...balances].sort((a, b) => a.date.localeCompare(b.date)).at(-1)
  return latest!.balance
}

// What you owed at a point in time — the most recent balance on-or-before
// `dateStr`. Before the liability existed it's 0 (it wasn't dragging net worth
// down yet); once it exists but has no later snapshot, it's the opening balance.
// Used by the dashboard to plot net worth month by month.
export function owedOn(
  l: Liability,
  balances: LiabilityBalance[],
  dateStr: string,
): number {
  if (dateStr < l.openingDate) return 0
  return latestOnOrBefore(balances, (b) => b.date, dateStr, l.openingBalance, (b) => b.balance)
}

// The annual interest rate (%) in effect on `dateStr` — the newest rate snapshot
// dated on-or-before it. `fallback` covers the (unexpected) case of no rate
// recorded at all; the hook always writes an initial rate when a liability is
// created, so in practice there's always one.
export function rateOn(
  rates: LiabilityRate[],
  dateStr: string,
  fallback = 0,
): number {
  return latestOnOrBefore(rates, (r) => r.effectiveDate, dateStr, fallback, (r) => r.annualRate)
}

// The interest rate in effect today.
export function currentRate(rates: LiabilityRate[], fallback = 0): number {
  if (rates.length === 0) return fallback
  const latest = [...rates].sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate)).at(-1)
  return latest!.annualRate
}

// Total debt across every liability, for the "Total owed" overview. Mirrors how
// the dashboard sums portfolio values, reading each liability's balances from a
// map keyed by liability id.
export function totalOwed(
  liabilities: Liability[],
  balancesByLiability: Map<string, LiabilityBalance[]>,
): number {
  return r2(
    liabilities.reduce(
      (sum, l) => sum + currentOwed(l, balancesByLiability.get(l.id) ?? []),
      0,
    ),
  )
}

// --- LOOKING FORWARD: PAYING IT OFF ---------------------------------------
//
// Interest accrual is compounding (the same operation projections.ts does to grow
// a portfolio): each month the balance earns interest, then your repayment chips
// it down. We convert the annual rate to an equivalent monthly one with
// (1 + annual)^(1/12) − 1 so a stated "11% a year" really lands on 11% after 12
// months — not 11%/12 each month, which would quietly understate it.

// One step on the payoff line: how many months from now, and what you'd still owe.
export interface BalancePoint {
  monthsFromNow: number
  value: number
}

// Project the outstanding balance forward, month by month, subtracting the fixed
// repayment after interest each month and clamping at 0 (you can't owe less than
// nothing). Used to draw the falling-debt line on a chart.
export function projectBalance(
  start: number,
  monthlyRepayment: number,
  annualRatePct: number,
  months: number,
): BalancePoint[] {
  const monthly = (1 + annualRatePct / 100) ** (1 / 12) - 1

  const points: BalancePoint[] = [{ monthsFromNow: 0, value: r2(start) }]
  let balance = start
  for (let i = 1; i <= months; i++) {
    balance = Math.max(0, balance + balance * monthly - monthlyRepayment)
    points.push({ monthsFromNow: i, value: r2(balance) })
  }
  return points
}

// How long until it's paid off, and what it costs to get there. Returns nulls
// when the debt never clears — i.e. the monthly repayment doesn't even cover the
// monthly interest, so the balance never shrinks (a genuinely useful warning).
export interface PayoffSummary {
  monthsToPayoff: number | null // null = never pays off at this repayment
  totalInterest: number | null // interest paid over the life of the debt
  totalPaid: number | null // every rand you hand over (principal + interest)
}

// Stop looking this far out (100 years). If it isn't paid off by then, treat it
// as "never" — cheap to compute and well past any real loan term.
const PAYOFF_CAP_MONTHS = 1200

export function payoffSummary(
  start: number,
  monthlyRepayment: number,
  annualRatePct: number,
): PayoffSummary {
  if (start <= 0) return { monthsToPayoff: 0, totalInterest: 0, totalPaid: 0 }

  const monthly = (1 + annualRatePct / 100) ** (1 / 12) - 1
  let balance = start
  let totalInterest = 0
  let totalPaid = 0

  for (let m = 1; m <= PAYOFF_CAP_MONTHS; m++) {
    const interest = balance * monthly
    balance += interest
    totalInterest += interest
    const pay = Math.min(monthlyRepayment, balance) // last payment is partial
    balance -= pay
    totalPaid += pay
    if (balance <= 1e-6) {
      return {
        monthsToPayoff: m,
        totalInterest: r2(totalInterest),
        totalPaid: r2(totalPaid),
      }
    }
  }
  return { monthsToPayoff: null, totalInterest: null, totalPaid: null }
}
