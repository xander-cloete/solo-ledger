// Looking FORWARD: where could a portfolio be in 1, 3, 5 or 10 years?
//
// This file is the projection engine. Kept pure (data in, numbers out — no
// database, no UI) so the maths lives in one place and both the Dashboard and
// the Investments page can lean on it. It pairs with `investments.ts`, which
// looks backward at what already happened.
//
// TWO JOBS:
//   1. deriveAnnualRate() — read your real history and work out the growth rate
//      your money has *actually* earned, carefully separating market gains from
//      the cash you deposited (so we don't flatter the number).
//   2. project() — take a starting value, an assumed growth rate, and an optional
//      monthly top-up, and compound it forward month by month.

import type { Portfolio, PortfolioBalance, Transaction } from '../db/types'
import { currentBalance } from './investments'
import { currentMonthKey, monthsBetween } from './month'

const r2 = (n: number) => Math.round(n * 100) / 100

// What we assume when we genuinely can't tell (a brand-new portfolio with no
// real track record). 6% is a deliberately modest long-run figure.
export const DEFAULT_ANNUAL_RATE = 6

// Below this much real history, any derived rate is just noise, so we decline to
// guess and let the caller fall back to the default / an override.
const MIN_DERIVE_MONTHS = 3

// One dated cash movement, measured in whole months from the portfolio's start.
// Sign is from YOUR point of view: money you put IN is negative (it left your
// pocket), money that comes back OUT is positive.
interface CashFlow {
  monthsFromStart: number
  amount: number
}

// THE PROPER MATH — money-weighted return (a.k.a. IRR, "internal rate of
// return"). Given a list of dated cash flows, find the single monthly growth
// rate `r` that makes them all balance out to zero in today's money:
//
//     Σ  amount / (1 + r) ^ months   =   0
//
// There's no algebra that solves this directly, so we hunt for `r` by bisection:
// pick a low and high guess that straddle zero, then keep halving the gap until
// we're close enough. Robust and easy to follow — no calculus required.
function monthlyIrr(flows: CashFlow[]): number | null {
  const hasOutflow = flows.some((f) => f.amount < 0)
  const hasInflow = flows.some((f) => f.amount > 0)
  if (!hasOutflow || !hasInflow) return null // need money both in and out

  // Net present value of all flows at a trial monthly rate.
  const npv = (rate: number) =>
    flows.reduce((sum, f) => sum + f.amount / (1 + rate) ** f.monthsFromStart, 0)

  let lo = -0.9999 // ≈ losing everything each month
  let hi = 1 // +100% a month — absurdly high, just an upper bracket
  let flo = npv(lo)
  let fhi = npv(hi)

  // If both ends have the same sign there's no crossing in range; nudge `hi` up
  // a few times in case the real return is wild, then give up gracefully.
  let widen = 0
  while (flo * fhi > 0 && widen < 100) {
    hi *= 1.5
    fhi = npv(hi)
    widen++
  }
  if (flo * fhi > 0) return null

  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    const fmid = npv(mid)
    if (Math.abs(fmid) < 1e-7) return mid
    if (flo * fmid < 0) {
      hi = mid
      fhi = fmid
    } else {
      lo = mid
      flo = fmid
    }
  }
  return (lo + hi) / 2
}

// Derive a portfolio's real annual growth rate (as a %) from its own history,
// backing out every contribution and withdrawal so only market gains count.
// Returns null when there isn't enough history to say anything honest.
export function deriveAnnualRate(
  p: Portfolio,
  balances: PortfolioBalance[],
  txns: Transaction[],
): number | null {
  const startMonth = p.initialDate.slice(0, 7)
  const monthsElapsed = monthsBetween(startMonth, currentMonthKey())
  if (monthsElapsed < MIN_DERIVE_MONTHS) return null

  // Build the cash-flow timeline:
  //   • day one: you committed the initial amount        → outflow (negative)
  //   • each contribution / withdrawal at its month      → out / in
  //   • today: pretend you cashed out at current value   → inflow (positive)
  const flows: CashFlow[] = [{ monthsFromStart: 0, amount: -p.initialAmount }]
  for (const t of txns) {
    const m = monthsBetween(startMonth, t.month)
    if (t.type === 'invest') flows.push({ monthsFromStart: m, amount: -t.amount })
    else if (t.type === 'divest') flows.push({ monthsFromStart: m, amount: t.amount })
  }
  flows.push({ monthsFromStart: monthsElapsed, amount: currentBalance(p, balances) })

  const monthly = monthlyIrr(flows)
  if (monthly == null) return null

  // Compound the monthly rate into an annual one: (1 + r)^12 − 1.
  const annual = ((1 + monthly) ** 12 - 1) * 100
  if (!Number.isFinite(annual)) return null
  return Math.round(annual * 10) / 10 // one decimal place, e.g. 8.4
}

// Which rate a projection should actually use, in priority order:
//   1. the user's explicit override on the portfolio
//   2. the rate we derived from its history
//   3. the safe default
export function effectiveRate(
  p: Portfolio,
  derived: number | null,
): number {
  if (typeof p.assumedAnnualRate === 'number') return p.assumedAnnualRate
  if (derived != null) return derived
  return DEFAULT_ANNUAL_RATE
}

// One step on a projection line: how many months from now, and the value then.
export interface ProjectionPoint {
  monthsFromNow: number
  value: number
}

// Compound a starting value forward, optionally adding a fixed top-up at the end
// of every month. We convert the annual rate to an equivalent monthly one with
// (1 + annual)^(1/12) − 1 so a stated "8% a year" really lands on 8% after 12
// steps — not 8%/12 each month, which would quietly overshoot.
export function project(
  start: number,
  monthlyContribution: number,
  annualRatePct: number,
  months: number,
): ProjectionPoint[] {
  const annual = annualRatePct / 100
  const monthly = (1 + annual) ** (1 / 12) - 1

  const points: ProjectionPoint[] = [{ monthsFromNow: 0, value: r2(start) }]
  let value = start
  for (let i = 1; i <= months; i++) {
    value = value * (1 + monthly) + monthlyContribution
    points.push({ monthsFromNow: i, value: r2(value) })
  }
  return points
}

// A portfolio reduced to just what the engine needs to project it.
export interface ProjectionInput {
  start: number
  monthlyContribution: number
  annualRatePct: number
}

// Project several portfolios together and sum them month by month, giving a
// single combined value at each step (index 0 = today, index `months` = the end
// of the horizon). Used for the whole-portfolio net-worth projection.
export function projectCombined(
  inputs: ProjectionInput[],
  months: number,
): number[] {
  const totals = new Array(months + 1).fill(0)
  for (const input of inputs) {
    const line = project(
      input.start,
      input.monthlyContribution,
      input.annualRatePct,
      months,
    )
    for (let i = 0; i <= months; i++) totals[i] += line[i].value
  }
  return totals.map(r2)
}
