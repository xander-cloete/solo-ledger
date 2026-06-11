// The maths behind a portfolio's "how am I doing?" numbers. Kept pure (just data
// in, numbers out — no database, no UI) so the rules live in one place and are
// easy to reason about.
//
// THE CORE IDEA — separating GROWTH from CONTRIBUTIONS:
//   Your balance goes up for two very different reasons: (1) you added money, and
//   (2) the investment earned money. Only (2) is real growth. So everywhere below
//   we take the change in balance and subtract the money you put in / took out.
//
//     growth = (balance now − balance then) − (money added − money withdrawn)
//
//   "Net capital" is the running total of money you've actually put in:
//     net capital = initial amount + every contribution − every withdrawal
//   and all-time growth is simply: current balance − net capital.

import { format, subMonths } from 'date-fns'
import type { Portfolio, PortfolioBalance, Transaction } from '../db/types'

const r2 = (n: number) => Math.round(n * 100) / 100

// A growth figure: the gain/loss in money, and as a percentage of the base it's
// measured against. `pct` is null when there's no meaningful base to divide by.
export interface Growth {
  amount: number
  pct: number | null
}

// The latest balance you've recorded (snapshots are dated; newest wins). With no
// snapshots yet, the portfolio is worth exactly what you started it with.
export function currentBalance(
  p: Portfolio,
  balances: PortfolioBalance[],
): number {
  if (balances.length === 0) return p.initialAmount
  const latest = [...balances].sort((a, b) => a.date.localeCompare(b.date)).at(-1)
  return latest!.balance
}

// Money you've actually committed: what you started with, plus contributions,
// minus withdrawals.
export function netCapital(p: Portfolio, txns: Transaction[]): number {
  let capital = p.initialAmount
  for (const t of txns) {
    if (t.type === 'invest') capital += t.amount
    else if (t.type === 'divest') capital -= t.amount
  }
  return r2(capital)
}

// All-time growth: current value minus the capital you put in, and that gain as a
// percentage of the capital.
export function allTimeGrowth(
  p: Portfolio,
  balances: PortfolioBalance[],
  txns: Transaction[],
): Growth {
  const amount = r2(currentBalance(p, balances) - netCapital(p, txns))
  const capital = netCapital(p, txns)
  return { amount, pct: capital !== 0 ? r2((amount / capital) * 100) : null }
}

// The most recent balance recorded on or before `dateStr`; falls back to the
// initial amount if you hadn't recorded anything by then.
function balanceOnOrBefore(
  balances: PortfolioBalance[],
  dateStr: string,
  fallback: number,
): number {
  const prior = balances
    .filter((b) => b.date <= dateStr)
    .sort((a, b) => a.date.localeCompare(b.date))
  return prior.length ? prior.at(-1)!.balance : fallback
}

// Growth over the last `months` months: how much the balance moved, minus what
// you contributed/withdrew during that window, as a % of the balance back then.
export function growthOverMonths(
  p: Portfolio,
  balances: PortfolioBalance[],
  txns: Transaction[],
  months: number,
  now: Date = new Date(),
): Growth {
  const startDate = format(subMonths(now, months), 'yyyy-MM-dd')
  const startMonth = startDate.slice(0, 7)

  const startBal = balanceOnOrBefore(balances, startDate, p.initialAmount)
  const curBal = currentBalance(p, balances)

  let contributions = 0
  for (const t of txns) {
    if (t.month >= startMonth) {
      if (t.type === 'invest') contributions += t.amount
      else if (t.type === 'divest') contributions -= t.amount
    }
  }

  const amount = r2(curBal - startBal - contributions)
  return { amount, pct: startBal !== 0 ? r2((amount / startBal) * 100) : null }
}
