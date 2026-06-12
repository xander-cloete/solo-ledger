import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { MonthKey, Transaction } from '../db/types'
import { expenseTotalForMonth } from '../lib/expenses'
import { netCapital, portfolioValueOn } from '../lib/investments'
import { addMonthsKey, currentMonthKey, formatMonthShort, monthRange } from '../lib/month'
import { useSettings } from './useSettings'

/*
  THE DASHBOARD HOOK
  ------------------
  The dashboard invents no new data — it's a read-only mirror of Phases 1–4. We
  pull everything once, then derive two things:

    1) Headline figures for "right now" (net worth and its parts).
    2) A net-worth time series — net worth at the end of every month from the
       ledger's start to today — so we can draw a growth chart.

  NET WORTH = liquid budget money + total investment value.
    • "Liquid" is the rolling-ledger closing balance (the same carry-out the
      Income/Expenses pages show), worked out by walking the months and adding
      each month's income − expenses on top of the starting balance.
    • "Investments" is the sum of each portfolio's value at that point in time.

  Because we walk month by month anyway, the LAST point of the series is exactly
  "today", so the headline numbers fall out of the series for free — no chance of
  the cards and the chart disagreeing.
*/

// One point on the net-worth chart: a month, and what you were worth at its end.
export interface NetWorthPoint {
  month: MonthKey
  label: string // short axis label, e.g. 'Jun 26'
  liquid: number // rolling-ledger closing balance that month
  investments: number // total portfolio value at month-end
  netWorth: number // liquid + investments
}

export interface DashboardData {
  sym: string // currency symbol, e.g. 'N$'
  netWorth: number // headline: liquid + investments, today
  liquid: number // rolling-ledger closing balance this month
  investmentsValue: number // total portfolio value today
  investmentsCapital: number // money actually put into investments
  investmentsGain: number // investmentsValue − capital (real growth, all-time)
  investmentsGainPct: number | null // that gain as a % of capital (null if no capital)
  monthIncome: number // income recorded this month
  monthExpenses: number // expenses applying to this month
  series: NetWorthPoint[] // net worth at each month-end, oldest → newest
  hasAnyData: boolean // false on a brand-new install (nothing to show yet)
}

// The last calendar day we treat as "within" a month, as a string upper bound.
// Snapshot dates are 'YYYY-MM-DD' or full ISO timestamps; both sort before this,
// so a string comparison `date <= monthEnd(m)` catches every snapshot in month m.
function monthEnd(m: MonthKey): string {
  return `${m}-31`
}

export function useDashboard(): DashboardData {
  const settings = useSettings()

  // Pull every table the figures depend on, once. For a single-user app these
  // stay tiny, so computing live is simpler than caching — and useLiveQuery
  // re-runs this hook automatically whenever any of them changes.
  const entries = useLiveQuery(() => db.incomeEntries.toArray(), []) ?? []
  const expenseDefs = useLiveQuery(() => db.expenses.toArray(), []) ?? []
  const portfolios = useLiveQuery(() => db.portfolios.toArray(), []) ?? []
  const allBalances = useLiveQuery(() => db.portfolioBalances.toArray(), []) ?? []
  const allTxns = useLiveQuery(() => db.transactions.toArray(), []) ?? []

  // Group income and portfolio data by their key so lookups in the loop are cheap.
  const incomeByMonth = new Map<MonthKey, number>()
  for (const e of entries) {
    incomeByMonth.set(e.month, (incomeByMonth.get(e.month) ?? 0) + e.amount)
  }
  const balancesByPortfolio = new Map<string, typeof allBalances>()
  for (const b of allBalances) {
    const list = balancesByPortfolio.get(b.portfolioId) ?? []
    list.push(b)
    balancesByPortfolio.set(b.portfolioId, list)
  }
  const txnsByPortfolio = new Map<string, Transaction[]>()
  for (const t of allTxns) {
    for (const pid of [t.fromPortfolioId, t.toPortfolioId]) {
      if (!pid) continue
      const list = txnsByPortfolio.get(pid) ?? []
      list.push(t)
      txnsByPortfolio.set(pid, list)
    }
  }

  const current = currentMonthKey()
  // The series spans the ledger's life. Guard against a start month set in the
  // future so "today" is always the final point.
  const start = settings.ledgerStartMonth <= current ? settings.ledgerStartMonth : current

  // Walk each month once, carrying the running ledger balance forward (this IS
  // the rolling ledger) and reading the portfolio value at each month-end.
  const series: NetWorthPoint[] = []
  let liquid = settings.startingBalance
  let monthIncome = 0
  let monthExpenses = 0
  for (const m of monthRange(start, addMonthsKey(current, 1))) {
    const inc = incomeByMonth.get(m) ?? 0
    const exp = expenseTotalForMonth(expenseDefs, m)
    liquid += inc - exp // closing balance for month m

    const end = monthEnd(m)
    let investments = 0
    for (const p of portfolios) {
      investments += portfolioValueOn(p, balancesByPortfolio.get(p.id) ?? [], end)
    }

    if (m === current) {
      monthIncome = inc
      monthExpenses = exp
    }
    series.push({
      month: m,
      label: formatMonthShort(m),
      liquid,
      investments,
      netWorth: liquid + investments,
    })
  }

  // The final point is "today" — derive the headline numbers from it.
  const last = series.at(-1)!
  const investmentsCapital = portfolios.reduce(
    (sum, p) => sum + netCapital(p, txnsByPortfolio.get(p.id) ?? []),
    0,
  )
  const investmentsGain = Math.round((last.investments - investmentsCapital) * 100) / 100

  return {
    sym: settings.currencySymbol,
    netWorth: last.netWorth,
    liquid: last.liquid,
    investmentsValue: last.investments,
    investmentsCapital,
    investmentsGain,
    investmentsGainPct:
      investmentsCapital !== 0
        ? Math.round((investmentsGain / investmentsCapital) * 1000) / 10
        : null,
    monthIncome,
    monthExpenses,
    series,
    hasAnyData:
      entries.length > 0 ||
      expenseDefs.length > 0 ||
      portfolios.length > 0 ||
      settings.startingBalance !== 0,
  }
}
