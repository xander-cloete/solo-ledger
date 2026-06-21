import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  addBalanceEntry,
  deleteBalanceEntry,
  deletePortfolio,
  savePortfolio,
  usePortfolioBalances,
  usePortfolios,
} from '../hooks/usePortfolios'
import {
  contribute,
  deleteTransaction,
  divest,
  usePortfolioTransactions,
} from '../hooks/useInvestments'
import { useSettings, updateView } from '../hooks/useSettings'
import { PageHeader, SectionLabel } from '../components/ui'
import { ViewToolbar } from '../components/ViewControls'
import { sortBy } from '../lib/sort'
import {
  allTimeGrowth,
  currentBalance,
  growthOverMonths,
  netCapital,
  type Growth,
} from '../lib/investments'
import { formatMoney } from '../lib/format'
import { currentMonthKey, formatMonthLabel } from '../lib/month'
import type { Portfolio } from '../db/types'

const inputClass =
  'mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary'
const todayKey = () => format(new Date(), 'yyyy-MM-dd')

export function Investments() {
  const settings = useSettings()
  const sym = settings.currencySymbol
  const [editingId, setEditingId] = useState<string | null>(null)

  // View preferences (which sections show + sort order), persisted in settings.
  const vp = settings.view.investments
  const setVp = (patch: Partial<typeof vp>) =>
    updateView({ investments: { ...vp, ...patch } })

  // Portfolios in the chosen order. "Amount" sorts on starting capital and
  // "date" on when the portfolio began (current balance lives inside each card).
  const portfolios = sortBy(usePortfolios(), vp.sort, {
    name: (p) => p.name,
    amount: (p) => p.initialAmount,
    date: (p) => p.initialDate,
  })

  const editing = editingId
    ? (portfolios.find((p) => p.id === editingId) ?? null)
    : null

  return (
    <div>
      <PageHeader eyebrow="Holdings" title="Investments" />
      <p className="mt-2 text-sm text-muted">
        Track each portfolio by recording its balance yourself — no bank linking.
        Growth separates real gains from the money you add or withdraw.
      </p>

      {portfolios.length > 0 && (
        <ViewToolbar
          sort={vp.sort}
          onSortChange={(sort) => setVp({ sort })}
          sections={[
            {
              key: 'cards',
              label: 'Portfolio cards',
              on: vp.cards,
              toggle: () => setVp({ cards: !vp.cards }),
            },
            {
              key: 'list',
              label: 'Quick-edit list',
              on: vp.list,
              toggle: () => setVp({ list: !vp.list }),
            },
          ]}
        />
      )}

      <section className="mt-6 space-y-4">
        {portfolios.length === 0 && (
          <p className="rounded-card border border-border bg-surface p-4 text-sm text-muted">
            No portfolios yet. Add one below to start tracking.
          </p>
        )}
        {vp.cards &&
          portfolios.map((p) => (
            <PortfolioCard key={p.id} portfolio={p} currencySymbol={sym} />
          ))}
      </section>

      {/* Add / edit portfolio */}
      <section className="mt-8">
        <SectionLabel>{editing ? 'Edit portfolio' : 'Add a portfolio'}</SectionLabel>
        <PortfolioForm
          key={editing?.id ?? 'new'}
          editing={editing}
          currencySymbol={sym}
          onDone={() => setEditingId(null)}
        />
      </section>

      {/* Quick-edit list (rename / change starting figures) */}
      {vp.list && portfolios.length > 0 && (
        <section className="mt-8">
          <SectionLabel>All portfolios</SectionLabel>
          <div className="mt-2 divide-y divide-border rounded-card border border-border bg-surface">
            {portfolios.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-border/30">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {p.name}
                </span>
                <span className="text-xs text-muted">
                  started {format(parseISO(p.initialDate), 'd LLL yyyy')} ·{' '}
                  {formatMoney(p.initialAmount, sym)}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingId(p.id)}
                  className="rounded-lg border border-border px-2 py-1 text-xs text-muted hover:text-fg"
                >
                  Edit
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${p.name}`}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete "${p.name}"? This also removes its balance history and every contribution/withdrawal linked to it.`,
                      )
                    ) {
                      deletePortfolio(p.id)
                      if (editingId === p.id) setEditingId(null)
                    }
                  }}
                  className="rounded-lg px-2 py-1 text-muted hover:text-negative"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// --- One portfolio: headline figures, actions, and expandable history -------

type Panel = 'balance' | 'contribute' | 'withdraw' | 'history' | null

function PortfolioCard({
  portfolio,
  currencySymbol,
}: {
  portfolio: Portfolio
  currencySymbol: string
}) {
  const balances = usePortfolioBalances(portfolio.id)
  const txns = usePortfolioTransactions(portfolio.id)
  const [panel, setPanel] = useState<Panel>(null)

  const balance = currentBalance(portfolio, balances)
  const capital = netCapital(portfolio, txns)
  const allTime = allTimeGrowth(portfolio, balances, txns)
  const month = growthOverMonths(portfolio, balances, txns, 1)
  const quarter = growthOverMonths(portfolio, balances, txns, 3)
  const year = growthOverMonths(portfolio, balances, txns, 12)

  function toggle(p: Panel) {
    setPanel((cur) => (cur === p ? null : p))
  }

  return (
    <div className="rounded-card border border-border bg-surface">
      <div className="p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate text-base font-semibold">{portfolio.name}</h3>
          <GrowthBadge growth={allTime} currencySymbol={currencySymbol} />
        </div>

        <div className="mt-1 font-display text-3xl font-semibold tracking-tight tabular-nums">
          {formatMoney(balance, currencySymbol)}
        </div>
        <p className="text-xs text-muted">
          Net invested {formatMoney(capital, currencySymbol)} · all-time growth
        </p>

        {/* Recent performance */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <PeriodStat label="1 month" growth={month} currencySymbol={currencySymbol} />
          <PeriodStat label="3 months" growth={quarter} currencySymbol={currencySymbol} />
          <PeriodStat label="1 year" growth={year} currencySymbol={currencySymbol} />
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton active={panel === 'balance'} onClick={() => toggle('balance')}>
            Record balance
          </ActionButton>
          <ActionButton active={panel === 'contribute'} onClick={() => toggle('contribute')}>
            Contribute
          </ActionButton>
          <ActionButton active={panel === 'withdraw'} onClick={() => toggle('withdraw')}>
            Withdraw
          </ActionButton>
          <ActionButton active={panel === 'history'} onClick={() => toggle('history')}>
            History
          </ActionButton>
        </div>
      </div>

      {/* Expandable panel */}
      {panel === 'balance' && (
        <BalanceForm
          portfolioId={portfolio.id}
          currencySymbol={currencySymbol}
          onDone={() => setPanel(null)}
        />
      )}
      {panel === 'contribute' && (
        <MovementForm
          kind="contribute"
          currencySymbol={currencySymbol}
          onSubmit={(amount, m) => contribute(portfolio.id, amount, m)}
          onDone={() => setPanel(null)}
        />
      )}
      {panel === 'withdraw' && (
        <MovementForm
          kind="withdraw"
          currencySymbol={currencySymbol}
          onSubmit={(amount, m) => divest(portfolio.id, amount, m)}
          onDone={() => setPanel(null)}
        />
      )}
      {panel === 'history' && (
        <History
          balances={balances}
          txns={txns}
          currencySymbol={currencySymbol}
        />
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

function formatPct(pct: number | null): string {
  if (pct == null) return '—'
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}

function formatSigned(amount: number, sym: string): string {
  const sign = amount > 0 ? '+' : amount < 0 ? '−' : ''
  return `${sign}${formatMoney(Math.abs(amount), sym)}`
}

function GrowthBadge({
  growth,
  currencySymbol,
}: {
  growth: Growth
  currencySymbol: string
}) {
  return (
    <span className={`text-sm font-semibold ${growthColor(growth.amount)}`}>
      {formatSigned(growth.amount, currencySymbol)} ({formatPct(growth.pct)})
    </span>
  )
}

function PeriodStat({
  label,
  growth,
  currencySymbol,
}: {
  label: string
  growth: Growth
  currencySymbol: string
}) {
  return (
    <div className="rounded-lg border border-border bg-bg px-3 py-2">
      <div className="text-[11px] text-muted">{label}</div>
      <div className={`text-sm font-medium ${growthColor(growth.amount)}`}>
        {formatPct(growth.pct)}
      </div>
      <div className={`text-[11px] ${growthColor(growth.amount)}`}>
        {formatSigned(growth.amount, currencySymbol)}
      </div>
    </div>
  )
}

function ActionButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'border-primary bg-primary text-primary-fg'
          : 'border-border text-muted hover:text-fg'
      }`}
    >
      {children}
    </button>
  )
}

// --- Record-a-balance form -------------------------------------------------

function BalanceForm({
  portfolioId,
  currencySymbol,
  onDone,
}: {
  portfolioId: string
  currencySymbol: string
  onDone: () => void
}) {
  const [balance, setBalance] = useState('')
  const [date, setDate] = useState(todayKey())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = Number(balance)
    if (!(amt >= 0) || !date) return
    await addBalanceEntry(portfolioId, date, amt)
    onDone()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 border-t border-border bg-bg/40 px-5 py-4"
    >
      <p className="text-xs text-muted">
        Record what the portfolio is worth today. The newest snapshot becomes its
        current value.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium" htmlFor="bal-amount">
            Balance ({currencySymbol})
          </label>
          <input
            id="bal-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium" htmlFor="bal-date">
            As of
          </label>
          <input
            id="bal-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <FormButtons submitLabel="Save balance" onCancel={onDone} />
    </form>
  )
}

// --- Contribute / withdraw form (shared) -----------------------------------

function MovementForm({
  kind,
  currencySymbol,
  onSubmit,
  onDone,
}: {
  kind: 'contribute' | 'withdraw'
  currencySymbol: string
  onSubmit: (amount: number, month: string) => Promise<void>
  onDone: () => void
}) {
  const [amount, setAmount] = useState('')
  const [month, setMonth] = useState(() => currentMonthKey())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = Number(amount)
    if (!(amt > 0) || !month) return
    await onSubmit(amt, month)
    onDone()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 border-t border-border bg-bg/40 px-5 py-4"
    >
      <p className="text-xs text-muted">
        {kind === 'contribute'
          ? 'Move money from your budget into this portfolio: it adds a one-off expense that month and tops up the balance.'
          : 'Take money out of this portfolio: it adds income that month and reduces the balance.'}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium" htmlFor="mv-amount">
            Amount ({currencySymbol})
          </label>
          <input
            id="mv-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium" htmlFor="mv-month">
            Month
          </label>
          <input
            id="mv-month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <FormButtons
        submitLabel={kind === 'contribute' ? 'Contribute' : 'Withdraw'}
        onCancel={onDone}
      />
    </form>
  )
}

function FormButtons({
  submitLabel,
  onCancel,
}: {
  submitLabel: string
  onCancel: () => void
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="submit"
        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-fg transition-opacity hover:opacity-90"
      >
        {submitLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:text-fg"
      >
        Cancel
      </button>
    </div>
  )
}

// --- History (balance snapshots + transactions) ----------------------------

function History({
  balances,
  txns,
  currencySymbol,
}: {
  balances: ReturnType<typeof usePortfolioBalances>
  txns: ReturnType<typeof usePortfolioTransactions>
  currencySymbol: string
}) {
  return (
    <div className="grid gap-4 border-t border-border bg-bg/40 px-5 py-4 sm:grid-cols-2">
      <div>
        <h4 className="text-xs font-medium text-muted">Balance snapshots</h4>
        {balances.length === 0 ? (
          <p className="mt-1 text-xs text-muted">None recorded yet.</p>
        ) : (
          <ul className="mt-1 divide-y divide-border rounded-lg border border-border bg-surface">
            {balances.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <span className="text-xs text-muted">
                  {format(parseISO(b.date), 'd LLL yyyy')}
                </span>
                <span className="flex items-center gap-2">
                  {formatMoney(b.balance, currencySymbol)}
                  {/* Auto-created bumps (id starts with "bal:") belong to a
                      transaction — delete those from Transactions, not here. */}
                  {!b.id.startsWith('bal:') && (
                    <button
                      type="button"
                      aria-label="Delete snapshot"
                      onClick={() => deleteBalanceEntry(b.id)}
                      className="text-muted hover:text-negative"
                    >
                      ✕
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h4 className="text-xs font-medium text-muted">Transactions</h4>
        {txns.length === 0 ? (
          <p className="mt-1 text-xs text-muted">No contributions or withdrawals.</p>
        ) : (
          <ul className="mt-1 divide-y divide-border rounded-lg border border-border bg-surface">
            {txns.map((t) => {
              const isIn = t.type === 'invest'
              return (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                >
                  <span className="text-xs text-muted">
                    {isIn ? 'Contributed' : 'Withdrew'} ·{' '}
                    {formatMonthLabel(t.month)}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={isIn ? 'text-negative' : 'text-positive'}>
                      {isIn ? '−' : '+'} {formatMoney(t.amount, currencySymbol)}
                    </span>
                    <button
                      type="button"
                      aria-label="Undo transaction"
                      onClick={() => deleteTransaction(t)}
                      className="text-muted hover:text-negative"
                    >
                      ✕
                    </button>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

// --- Add / edit portfolio form ---------------------------------------------

function PortfolioForm({
  editing,
  currencySymbol,
  onDone,
}: {
  editing: Portfolio | null
  currencySymbol: string
  onDone: () => void
}) {
  const [name, setName] = useState(editing?.name ?? '')
  const [initialDate, setInitialDate] = useState(
    editing?.initialDate ?? todayKey(),
  )
  const [initialAmount, setInitialAmount] = useState(
    editing ? String(editing.initialAmount) : '',
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = Number(initialAmount)
    if (!name.trim() || !initialDate || !(amt >= 0)) return

    await savePortfolio({
      id: editing?.id ?? crypto.randomUUID(),
      name: name.trim(),
      initialDate,
      initialAmount: amt,
    })

    if (editing) {
      onDone()
    } else {
      setName('')
      setInitialDate(todayKey())
      setInitialAmount('')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 space-y-4 rounded-card border border-border bg-surface p-5"
    >
      <div>
        <label className="block text-sm font-medium" htmlFor="pf-name">
          Name
        </label>
        <input
          id="pf-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. EasyEquities, Emergency fund"
          className={inputClass}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium" htmlFor="pf-date">
            Started on
          </label>
          <input
            id="pf-date"
            type="date"
            value={initialDate}
            onChange={(e) => setInitialDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="pf-amount">
            Initial amount ({currencySymbol})
          </label>
          <input
            id="pf-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={initialAmount}
            onChange={(e) => setInitialAmount(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </div>
      </div>
      <p className="text-xs text-muted">
        The initial amount is your starting capital — growth is measured against
        what you put in, not just the balance.
      </p>
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg transition-opacity hover:opacity-90"
        >
          {editing ? 'Save changes' : 'Add portfolio'}
        </button>
        {editing && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-fg"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
