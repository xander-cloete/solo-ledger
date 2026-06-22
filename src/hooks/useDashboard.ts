import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { MonthKey, Transaction } from '../db/types'
import { expenseTotalForMonth } from '../lib/expenses'
import { currentBalance, netCapital, portfolioValueOn } from '../lib/investments'
import { currentOwed, currentRate, owedOn, projectBalance } from '../lib/liabilities'
import { deriveAnnualRate, effectiveRate, projectCombined } from '../lib/projections'
import { addMonthsKey, currentMonthKey, formatMonthShort, monthRange } from '../lib/month'
import type { ProjectionSeriesPoint } from '../components/NetWorthChart'
import { useSettings } from './useSettings'

/*
  THE DASHBOARD HOOK
  ------------------
  The dashboard invents no new data — it's a read-only mirror of Phases 1–4. We
  pull everything once, then derive two things:

    1) Headline figures for "right now" (net worth and its parts).
    2) A net-worth time series — net worth at the end of every month from the
       ledger's start to today — so we can draw a growth chart.

  NET WORTH = liquid budget money + total investment value − total debt.
    • "Liquid" is the rolling-ledger closing balance (the same carry-out the
      Income/Expenses pages show), worked out by walking the months and adding
      each month's income − expenses on top of the starting balance.
    • "Investments" is the sum of each portfolio's value at that point in time.
    • "Liabilities" is the sum of each debt's outstanding balance then — the only
      component that pulls net worth DOWN.

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
  liabilities: number // total outstanding debt at month-end
  netWorth: number // liquid + investments − liabilities
}

export interface DashboardData {
  sym: string // currency symbol, e.g. 'N$'
  netWorth: number // headline: liquid + investments − liabilities, today
  liquid: number // rolling-ledger closing balance this month
  investmentsValue: number // total portfolio value today
  liabilitiesValue: number // total outstanding debt today
  investmentsCapital: number // money actually put into investments
  investmentsGain: number // investmentsValue − capital (real growth, all-time)
  investmentsGainPct: number | null // that gain as a % of capital (null if no capital)
  monthIncome: number // income recorded this month
  monthExpenses: number // expenses applying to this month
  series: NetWorthPoint[] // net worth at each month-end, oldest → newest
  projection: ProjectionData | null // forward net-worth estimate (null = no portfolios)
  hasAnyData: boolean // false on a brand-new install (nothing to show yet)
}

// The forward-looking net-worth estimate shown on the dashboard.
export interface ProjectionData {
  series: ProjectionSeriesPoint[] // month-by-month projected net worth, out to 5yr
  horizons: { label: string; months: number; value: number }[] // 1 / 3 / 5yr marks
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
  const liabilities = useLiveQuery(() => db.liabilities.toArray(), []) ?? []
  const allLiabBalances = useLiveQuery(() => db.liabilityBalances.toArray(), []) ?? []
  const allLiabRates = useLiveQuery(() => db.liabilityRates.toArray(), []) ?? []

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
  const liabBalancesById = new Map<string, typeof allLiabBalances>()
  for (const b of allLiabBalances) {
    const list = liabBalancesById.get(b.liabilityId) ?? []
    list.push(b)
    liabBalancesById.set(b.liabilityId, list)
  }
  const liabRatesById = new Map<string, typeof allLiabRates>()
  for (const r of allLiabRates) {
    const list = liabRatesById.get(r.liabilityId) ?? []
    list.push(r)
    liabRatesById.set(r.liabilityId, list)
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
    let liabilitiesOwed = 0
    for (const l of liabilities) {
      liabilitiesOwed += owedOn(l, liabBalancesById.get(l.id) ?? [], end)
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
      liabilities: liabilitiesOwed,
      netWorth: liquid + investments - liabilitiesOwed,
    })
  }

  // The final point is "today" — derive the headline numbers from it.
  const last = series.at(-1)!
  const investmentsCapital = portfolios.reduce(
    (sum, p) => sum + netCapital(p, txnsByPortfolio.get(p.id) ?? []),
    0,
  )
  const investmentsGain = Math.round((last.investments - investmentsCapital) * 100) / 100

  // FORWARD PROJECTION (Phase 11, extended for liabilities). Each portfolio
  // compounds at its effective rate (override → derived-from-history → 6%
  // default) plus any fixed monthly contribution; each liability shrinks as
  // interest accrues and its monthly repayment chips it down. The liquid balance
  // is held flat at today's value. We project 60 months (5 years) for the chart.
  // Projecting debt too keeps the dashed line continuous with the solid history
  // at "now" — otherwise net worth would jump up the moment debt stopped counting.
  const PROJECTION_MONTHS = 60
  const round2 = (n: number) => Math.round(n * 100) / 100
  const projectionInputs = portfolios.map((p) => {
    const bals = balancesByPortfolio.get(p.id) ?? []
    const ptxns = txnsByPortfolio.get(p.id) ?? []
    return {
      start: currentBalance(p, bals),
      monthlyContribution: p.monthlyContribution ?? 0,
      annualRatePct: effectiveRate(p, deriveAnnualRate(p, bals, ptxns)),
    }
  })
  const combinedInvest = projectCombined(projectionInputs, PROJECTION_MONTHS)

  // Sum every liability's projected outstanding balance, month by month, so we
  // can subtract the shrinking debt from projected net worth at each step.
  const combinedDebt = new Array(PROJECTION_MONTHS + 1).fill(0)
  for (const l of liabilities) {
    const line = projectBalance(
      currentOwed(l, liabBalancesById.get(l.id) ?? []),
      l.monthlyRepayment ?? 0,
      currentRate(liabRatesById.get(l.id) ?? []),
      PROJECTION_MONTHS,
    )
    for (let i = 0; i <= PROJECTION_MONTHS; i++) combinedDebt[i] += line[i].value
  }

  const flatLiquid = last.liquid // held constant — we don't model future cash flow yet
  const projSeries: ProjectionSeriesPoint[] = []
  for (let i = 1; i <= PROJECTION_MONTHS; i++) {
    const m = addMonthsKey(current, i)
    projSeries.push({
      month: m,
      label: formatMonthShort(m),
      projected: round2(flatLiquid + combinedInvest[i] - combinedDebt[i]),
    })
  }
  const horizonValue = (months: number) =>
    round2(flatLiquid + combinedInvest[months] - combinedDebt[months])
  const projection: ProjectionData | null =
    portfolios.length > 0 || liabilities.length > 0
      ? {
          series: projSeries,
          horizons: [
            { label: '1 yr', months: 12, value: horizonValue(12) },
            { label: '3 yr', months: 36, value: horizonValue(36) },
            { label: '5 yr', months: 60, value: horizonValue(60) },
          ],
        }
      : null

  return {
    sym: settings.currencySymbol,
    netWorth: last.netWorth,
    liquid: last.liquid,
    investmentsValue: last.investments,
    liabilitiesValue: last.liabilities,
    investmentsCapital,
    investmentsGain,
    investmentsGainPct:
      investmentsCapital !== 0
        ? Math.round((investmentsGain / investmentsCapital) * 1000) / 10
        : null,
    monthIncome,
    monthExpenses,
    series,
    projection,
    hasAnyData:
      entries.length > 0 ||
      expenseDefs.length > 0 ||
      portfolios.length > 0 ||
      liabilities.length > 0 ||
      settings.startingBalance !== 0,
  }
}
