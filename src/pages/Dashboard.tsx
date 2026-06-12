import { NetWorthChart } from '../components/NetWorthChart'
import { useDashboard } from '../hooks/useDashboard'
import { formatMoney } from '../lib/format'
import { currentMonthKey, formatMonthLabel } from '../lib/month'
import type { ReactNode } from 'react'

export function Dashboard() {
  const d = useDashboard()
  const sym = d.sym
  const monthNet = d.monthIncome - d.monthExpenses

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">
        Your whole picture at a glance — {formatMonthLabel(currentMonthKey())}.
      </p>

      {!d.hasAnyData ? (
        <p className="mt-6 rounded-card border border-border bg-surface p-5 text-sm text-muted">
          Nothing to show yet. Add income, expenses, or an investment and your net
          worth and growth chart will appear here.
        </p>
      ) : (
        <>
          {/* Hero: net worth */}
          <section className="mt-6 rounded-card border border-border bg-surface p-5">
            <div className="text-sm text-muted">Net worth</div>
            <div className="mt-1 text-4xl font-semibold tracking-tight">
              {formatMoney(d.netWorth, sym)}
            </div>
            <p className="mt-1 text-xs text-muted">
              Liquid balance plus the value of every investment.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <StatCard label="Liquid balance" value={formatMoney(d.liquid, sym)}>
                in your rolling budget
              </StatCard>
              <StatCard
                label="Investments"
                value={formatMoney(d.investmentsValue, sym)}
              >
                <span className={growthColor(d.investmentsGain)}>
                  {formatSigned(d.investmentsGain, sym)}
                  {d.investmentsGainPct != null &&
                    ` (${d.investmentsGainPct >= 0 ? '+' : ''}${d.investmentsGainPct.toFixed(1)}%)`}
                </span>{' '}
                all-time growth
              </StatCard>
            </div>
          </section>

          {/* Growth chart */}
          <section className="mt-4 rounded-card border border-border bg-surface p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-medium">Net worth over time</h2>
              <span className="text-xs text-muted">last 12 months</span>
            </div>
            <NetWorthChart series={d.series} sym={sym} />
          </section>

          {/* This month */}
          <section className="mt-4">
            <h2 className="text-sm font-medium text-muted">This month</h2>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard
                label="Income"
                value={`+ ${formatMoney(d.monthIncome, sym)}`}
                tone="positive"
              />
              <StatCard
                label="Expenses"
                value={`− ${formatMoney(d.monthExpenses, sym)}`}
                tone="negative"
              />
              <StatCard
                label="Net this month"
                value={formatMoney(monthNet, sym)}
                tone={monthNet < 0 ? 'negative' : 'positive'}
              >
                income minus expenses
              </StatCard>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

// --- Small presentational helpers ------------------------------------------

function growthColor(amount: number): string {
  if (amount > 0) return 'text-positive'
  if (amount < 0) return 'text-negative'
  return 'text-muted'
}

function formatSigned(amount: number, sym: string): string {
  const sign = amount > 0 ? '+' : amount < 0 ? '−' : ''
  return `${sign}${formatMoney(Math.abs(amount), sym)}`
}

function StatCard({
  label,
  value,
  tone = 'fg',
  children,
}: {
  label: string
  value: string
  tone?: 'fg' | 'positive' | 'negative'
  children?: ReactNode
}) {
  const valueClass =
    tone === 'positive'
      ? 'text-positive'
      : tone === 'negative'
        ? 'text-negative'
        : 'text-fg'
  return (
    <div className="rounded-lg border border-border bg-bg px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-0.5 text-lg font-semibold ${valueClass}`}>{value}</div>
      {children && <div className="mt-0.5 text-[11px] text-muted">{children}</div>}
    </div>
  )
}
