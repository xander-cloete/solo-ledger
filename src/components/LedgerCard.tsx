import { formatMoney } from '../lib/format'
import { addMonthsKey, formatMonthLabel } from '../lib/month'
import { CountUp } from './CountUp'
import type { LedgerSummary } from '../hooks/useLedger'
import type { MonthKey } from '../db/types'

// The rolling-ledger summary for one month: what came in, what went out, and the
// balance that carries into next month. Shown on both Income and Expenses.
export function LedgerCard({
  ledger,
  month,
}: {
  ledger: LedgerSummary
  month: MonthKey
}) {
  const sym = ledger.currencySymbol
  return (
    <div className="mt-4 rounded-card border border-border bg-surface p-5">
      <div className="space-y-1.5 text-sm">
        <Line label="Carried in" value={formatMoney(ledger.carryIn, sym)} />
        <Line
          label="Income this month"
          value={`+ ${formatMoney(ledger.income, sym)}`}
          tone="positive"
        />
        <Line
          label="Expenses this month"
          value={`− ${formatMoney(ledger.expenses, sym)}`}
          tone="negative"
        />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="font-medium">
          Balance carried into {formatMonthLabel(addMonthsKey(month, 1))}
        </span>
        <CountUp
          value={ledger.carryOut}
          format={(n) => formatMoney(n, sym)}
          className={`text-lg font-semibold tabular-nums ${
            ledger.carryOut < 0 ? 'text-negative' : 'text-fg'
          }`}
        />
      </div>
    </div>
  )
}

function Line({
  label,
  value,
  tone = 'fg',
}: {
  label: string
  value: string
  tone?: 'fg' | 'muted' | 'positive' | 'negative'
}) {
  const valueClass =
    tone === 'positive'
      ? 'text-positive'
      : tone === 'negative'
        ? 'text-negative'
        : tone === 'muted'
          ? 'text-muted'
          : 'text-fg'
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  )
}
