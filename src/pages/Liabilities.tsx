import { useState, type FormEvent, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import {
  addBalanceSnapshot,
  addRateSnapshot,
  createLiability,
  deleteBalanceSnapshot,
  deleteLiability,
  deleteRateSnapshot,
  saveLiability,
  updateLiability,
  useLiabilities,
  useLiabilityBalances,
  useLiabilityRates,
} from '../hooks/useLiabilities'
import { useSettings, updateView } from '../hooks/useSettings'
import { PageHeader, SectionLabel, Eyebrow, hoverLift } from '../components/ui'
import { CountUp } from '../components/CountUp'
import { ViewToolbar } from '../components/ViewControls'
import { sortBy } from '../lib/sort'
import {
  currentOwed,
  currentRate,
  payoffSummary,
  projectBalance,
  totalOwed,
} from '../lib/liabilities'
import { formatMoney } from '../lib/format'
import type { Liability, LiabilityKind } from '../db/types'

const inputClass =
  'mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary'
const todayKey = () => format(new Date(), 'yyyy-MM-dd')

// The kinds of debt we recognise. The little glyph is a friendly marker (the app
// already uses emoji in the gamification layer), the label drives the form.
const KINDS: { value: LiabilityKind; label: string; glyph: string }[] = [
  { value: 'homeLoan', label: 'Home loan', glyph: '🏠' },
  { value: 'vehicle', label: 'Vehicle', glyph: '🚗' },
  { value: 'loan', label: 'Loan', glyph: '💸' },
  { value: 'creditCard', label: 'Credit card', glyph: '💳' },
  { value: 'overdraft', label: 'Overdraft', glyph: '🏦' },
  { value: 'other', label: 'Other', glyph: '📄' },
]
const kindMeta = (k: LiabilityKind) => KINDS.find((x) => x.value === k) ?? KINDS[5]

export function Liabilities() {
  const settings = useSettings()
  const sym = settings.currencySymbol
  const [editingId, setEditingId] = useState<string | null>(null)

  // View preferences (which sections show + sort order), persisted in settings.
  const vp = settings.view.liabilities
  const setVp = (patch: Partial<typeof vp>) =>
    updateView({ liabilities: { ...vp, ...patch } })

  const liabilities = sortBy(useLiabilities(), vp.sort, {
    name: (l) => l.name,
    amount: (l) => l.openingBalance,
    date: (l) => l.openingDate,
  })

  // Read every snapshot once for the overview aggregate (the dashboard does the
  // same). Per-card figures come from each card's own scoped hooks.
  const allBalances = useLiveQuery(() => db.liabilityBalances.toArray(), []) ?? []
  const allRates = useLiveQuery(() => db.liabilityRates.toArray(), []) ?? []
  const balancesById = groupBy(allBalances, (b) => b.liabilityId)
  const ratesById = groupBy(allRates, (r) => r.liabilityId)

  const total = totalOwed(liabilities, balancesById)
  const monthlyRepayments = liabilities.reduce(
    (sum, l) => sum + (l.monthlyRepayment ?? 0),
    0,
  )
  // A debt-weighted average rate: bigger balances pull the blend toward their
  // rate, so it reflects what you're actually paying overall.
  const blendedRate =
    total > 0
      ? liabilities.reduce((sum, l) => {
          const owed = currentOwed(l, balancesById.get(l.id) ?? [])
          return sum + owed * currentRate(ratesById.get(l.id) ?? [])
        }, 0) / total
      : 0

  const editing = editingId
    ? (liabilities.find((l) => l.id === editingId) ?? null)
    : null

  return (
    <div>
      <PageHeader eyebrow="What you owe" title="Liabilities" />
      <p className="mt-2 text-sm text-muted">
        Track debts — home loans, vehicles, loans, cards, overdrafts. They pull
        your net worth down, and you can adjust each rate whenever the repo rate
        moves.
      </p>

      {/* Overview hero — the counterweight to the dashboard's net-worth hero,
          tinted in the "money out" accent so debt reads at a glance. */}
      {liabilities.length > 0 && (
        <section
          className="relative mt-6 overflow-hidden rounded-card border border-border p-6 sm:p-7"
          style={{
            backgroundImage:
              'linear-gradient(150deg, color-mix(in srgb, var(--negative) 9%, var(--surface)) 0%, var(--surface) 62%)',
          }}
        >
          <Eyebrow>Total owed</Eyebrow>
          <CountUp
            value={total}
            format={(n) => formatMoney(n, sym)}
            className="mt-2 block font-display text-4xl font-semibold tracking-tight tabular-nums text-negative sm:text-5xl"
          />
          <p className="mt-2 text-sm text-muted">
            Across {liabilities.length}{' '}
            {liabilities.length === 1 ? 'debt' : 'debts'}
            {monthlyRepayments > 0 && (
              <>
                {' · '}
                {formatMoney(monthlyRepayments, sym)}/mo in repayments
              </>
            )}
            {blendedRate > 0 && <> · {blendedRate.toFixed(1)}% blended rate</>}
          </p>
        </section>
      )}

      {liabilities.length > 0 && (
        <ViewToolbar
          sort={vp.sort}
          onSortChange={(sort) => setVp({ sort })}
          sections={[
            {
              key: 'cards',
              label: 'Debt cards',
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
        {liabilities.length === 0 && (
          <p className="rounded-card border border-border bg-surface p-4 text-sm text-muted">
            No liabilities yet. Add one below to start tracking what you owe.
          </p>
        )}
        {vp.cards &&
          liabilities.map((l) => (
            <LiabilityCard key={l.id} liability={l} currencySymbol={sym} />
          ))}
      </section>

      {/* Add / edit liability */}
      <section className="mt-8">
        <SectionLabel>{editing ? 'Edit liability' : 'Add a liability'}</SectionLabel>
        <LiabilityForm
          key={editing?.id ?? 'new'}
          editing={editing}
          currencySymbol={sym}
          onDone={() => setEditingId(null)}
        />
      </section>

      {/* Quick-edit list */}
      {vp.list && liabilities.length > 0 && (
        <section className="mt-8">
          <SectionLabel>All liabilities</SectionLabel>
          <div className="mt-2 divide-y divide-border rounded-card border border-border bg-surface">
            {liabilities.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-border/30"
              >
                <span aria-hidden>{kindMeta(l.kind).glyph}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {l.name}
                </span>
                <span className="text-xs text-muted">
                  opened {format(parseISO(l.openingDate), 'd LLL yyyy')} ·{' '}
                  {formatMoney(l.openingBalance, sym)}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingId(l.id)}
                  className="rounded-lg border border-border px-2 py-1 text-xs text-muted hover:text-fg"
                >
                  Edit
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${l.name}`}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete "${l.name}"? This also removes its balance and rate history.`,
                      )
                    ) {
                      deleteLiability(l.id)
                      if (editingId === l.id) setEditingId(null)
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

// --- One liability: balance, rate, payoff, and expandable panels ------------

type Panel = 'balance' | 'rate' | 'project' | 'history' | null

function LiabilityCard({
  liability,
  currencySymbol,
}: {
  liability: Liability
  currencySymbol: string
}) {
  const balances = useLiabilityBalances(liability.id)
  const rates = useLiabilityRates(liability.id)
  const [panel, setPanel] = useState<Panel>(null)

  const owed = currentOwed(liability, balances)
  const rate = currentRate(rates)
  const repayment = liability.monthlyRepayment ?? 0
  const payoff = payoffSummary(owed, repayment, rate)
  const meta = kindMeta(liability.kind)

  // How much of the original debt you've cleared (0–100). Anchored on the
  // opening balance, so it reflects real progress toward zero.
  const paidPct =
    liability.openingBalance > 0
      ? Math.max(0, Math.min(100, ((liability.openingBalance - owed) / liability.openingBalance) * 100))
      : 0

  const toggle = (p: Panel) => setPanel((cur) => (cur === p ? null : p))

  return (
    <div className="rounded-card border border-border bg-surface">
      <div className="p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="flex min-w-0 items-center gap-2 truncate text-base font-semibold">
            <span aria-hidden>{meta.glyph}</span>
            <span className="truncate">{liability.name}</span>
          </h3>
          <span className="shrink-0 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted">
            {rate.toFixed(2)}%
          </span>
        </div>

        <div className="mt-1 font-display text-3xl font-semibold tracking-tight tabular-nums text-negative">
          {formatMoney(owed, currencySymbol)}
        </div>
        <p className="text-xs text-muted">
          {meta.label} · outstanding balance
        </p>

        {/* Shrinking-debt progress bar — fills as you pay it down. */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>{paidPct.toFixed(0)}% paid off</span>
            <span>opened at {formatMoney(liability.openingBalance, currencySymbol)}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border/60">
            <motion.div
              className="h-full rounded-full bg-positive"
              initial={{ width: 0 }}
              animate={{ width: `${paidPct}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 24 }}
            />
          </div>
        </div>

        {/* Payoff snapshot — at this rate and repayment. */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat label="Paid off in">
            {repayment <= 0 ? '—' : formatTerm(payoff.monthsToPayoff)}
          </Stat>
          <Stat label="Total interest">
            {repayment <= 0 || payoff.totalInterest == null
              ? '—'
              : formatMoney(payoff.totalInterest, currencySymbol)}
          </Stat>
        </div>
        {repayment <= 0 ? (
          <p className="mt-2 text-[11px] text-muted">
            Set a monthly repayment (via Project) to estimate payoff.
          </p>
        ) : payoff.monthsToPayoff == null ? (
          <p className="mt-2 text-[11px] text-negative">
            Your {formatMoney(repayment, currencySymbol)}/mo repayment doesn't yet
            cover the monthly interest — the balance won't shrink.
          </p>
        ) : null}

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton active={panel === 'balance'} onClick={() => toggle('balance')}>
            Update balance
          </ActionButton>
          <ActionButton active={panel === 'rate'} onClick={() => toggle('rate')}>
            Update rate
          </ActionButton>
          <ActionButton active={panel === 'project'} onClick={() => toggle('project')}>
            Project
          </ActionButton>
          <ActionButton active={panel === 'history'} onClick={() => toggle('history')}>
            History
          </ActionButton>
        </div>
      </div>

      {panel === 'balance' && (
        <BalanceForm
          liabilityId={liability.id}
          currencySymbol={currencySymbol}
          onDone={() => setPanel(null)}
        />
      )}
      {panel === 'rate' && (
        <RateForm
          liabilityId={liability.id}
          currentRateValue={rate}
          onDone={() => setPanel(null)}
        />
      )}
      {panel === 'project' && (
        <PayoffPanel
          liability={liability}
          owed={owed}
          rate={rate}
          currencySymbol={currencySymbol}
          onDone={() => setPanel(null)}
        />
      )}
      {panel === 'history' && (
        <History
          balances={balances}
          rates={rates}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  )
}

// --- Small presentational helpers ------------------------------------------

// Turn a month count into a friendly "8 yr 5 mo" term.
function formatTerm(months: number | null): string {
  if (months == null) return 'never'
  if (months === 0) return 'paid off'
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y && m) return `${y} yr ${m} mo`
  if (y) return `${y} yr`
  return `${m} mo`
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-bg px-3 py-2">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="text-sm font-medium tabular-nums">{children}</div>
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
  children: ReactNode
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

// --- Update-balance form ----------------------------------------------------

function BalanceForm({
  liabilityId,
  currencySymbol,
  onDone,
}: {
  liabilityId: string
  currencySymbol: string
  onDone: () => void
}) {
  const [balance, setBalance] = useState('')
  const [date, setDate] = useState(todayKey())

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const amt = Number(balance)
    if (!(amt >= 0) || !date) return
    await addBalanceSnapshot(liabilityId, date, amt)
    onDone()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 border-t border-border bg-bg/40 px-5 py-4"
    >
      <p className="text-xs text-muted">
        Record what you still owe today. The newest snapshot becomes the current
        balance.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium" htmlFor="liab-bal">
            Outstanding ({currencySymbol})
          </label>
          <input
            id="liab-bal"
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
          <label className="block text-xs font-medium" htmlFor="liab-bal-date">
            As of
          </label>
          <input
            id="liab-bal-date"
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

// --- Update-rate form (a repo-rate change) ----------------------------------

function RateForm({
  liabilityId,
  currentRateValue,
  onDone,
}: {
  liabilityId: string
  currentRateValue: number
  onDone: () => void
}) {
  const [rate, setRate] = useState(String(currentRateValue))
  const [date, setDate] = useState(todayKey())

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const r = Number(rate)
    if (!Number.isFinite(r) || r < 0 || !date) return
    await addRateSnapshot(liabilityId, date, r)
    onDone()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 border-t border-border bg-bg/40 px-5 py-4"
    >
      <p className="text-xs text-muted">
        Rates change when the repo rate moves. Record the new rate and when it
        took effect — past rates are kept, so history stays accurate.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium" htmlFor="liab-rate">
            New annual rate (%)
          </label>
          <input
            id="liab-rate"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="e.g. 11.75"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium" htmlFor="liab-rate-date">
            Effective from
          </label>
          <input
            id="liab-rate-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <FormButtons submitLabel="Save rate" onCancel={onDone} />
    </form>
  )
}

// --- Payoff projection panel ------------------------------------------------

const HORIZONS = [
  { label: '1 yr', months: 12 },
  { label: '3 yr', months: 36 },
  { label: '5 yr', months: 60 },
]

function PayoffPanel({
  liability,
  owed,
  rate,
  currencySymbol,
  onDone,
}: {
  liability: Liability
  owed: number
  rate: number
  currencySymbol: string
  onDone: () => void
}) {
  // Editable monthly repayment, saved back onto the liability so the card's
  // payoff estimate updates. The rate is fixed here (changed via Update rate)
  // since it's a dated snapshot, not a freeform assumption.
  const [repayment, setRepayment] = useState(
    liability.monthlyRepayment != null ? String(liability.monthlyRepayment) : '',
  )
  const pay = Number(repayment) || 0
  const summary = payoffSummary(owed, pay, rate)

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    await updateLiability(liability.id, {
      monthlyRepayment: repayment.trim() === '' ? undefined : pay,
    })
    onDone()
  }

  return (
    <form
      onSubmit={handleSave}
      className="space-y-4 border-t border-border bg-bg/40 px-5 py-4"
    >
      <p className="text-xs text-muted">
        At {rate.toFixed(2)}% a year, see how a monthly repayment pays this down.
        Change the rate from “Update rate” when the repo rate moves.
      </p>

      <div className="sm:max-w-[50%]">
        <label className="block text-xs font-medium" htmlFor="liab-pay">
          Monthly repayment ({currencySymbol})
        </label>
        <input
          id="liab-pay"
          type="number"
          inputMode="decimal"
          step="0.01"
          value={repayment}
          onChange={(e) => setRepayment(e.target.value)}
          placeholder="0"
          className={inputClass}
        />
      </div>

      {pay > 0 && summary.monthsToPayoff == null && (
        <p className="text-[11px] text-negative">
          This repayment doesn't cover the monthly interest, so the balance never
          clears. Increase it to see a payoff.
        </p>
      )}

      {/* Live balance preview at each horizon. */}
      <div className="grid grid-cols-3 gap-2">
        {HORIZONS.map((h) => {
          const value = projectBalance(owed, pay, rate, h.months).at(-1)!.value
          return (
            <div
              key={h.months}
              className="rounded-lg border border-border bg-surface px-3 py-2"
            >
              <div className="text-[11px] text-muted">In {h.label}</div>
              <div className="font-display text-base font-semibold tabular-nums">
                {formatMoney(value, currencySymbol)}
              </div>
            </div>
          )
        })}
      </div>

      {pay > 0 && summary.monthsToPayoff != null && (
        <p className="text-[11px] text-muted">
          Paid off in {formatTerm(summary.monthsToPayoff)} ·{' '}
          {formatMoney(summary.totalInterest ?? 0, currencySymbol)} total interest.
          An estimate — rates and repayments change.
        </p>
      )}

      <FormButtons submitLabel="Save repayment" onCancel={onDone} />
    </form>
  )
}

// --- History (balance + rate snapshots) -------------------------------------

function History({
  balances,
  rates,
  currencySymbol,
}: {
  balances: ReturnType<typeof useLiabilityBalances>
  rates: ReturnType<typeof useLiabilityRates>
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
                <span className="flex items-center gap-2 tabular-nums">
                  {formatMoney(b.balance, currencySymbol)}
                  <button
                    type="button"
                    aria-label="Delete snapshot"
                    onClick={() => deleteBalanceSnapshot(b.id)}
                    className="text-muted hover:text-negative"
                  >
                    ✕
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h4 className="text-xs font-medium text-muted">Rate changes</h4>
        {rates.length === 0 ? (
          <p className="mt-1 text-xs text-muted">No rate recorded yet.</p>
        ) : (
          <ul className="mt-1 divide-y divide-border rounded-lg border border-border bg-surface">
            {rates.map((r, i) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <span className="text-xs text-muted">
                  from {format(parseISO(r.effectiveDate), 'd LLL yyyy')}
                </span>
                <span className="flex items-center gap-2 tabular-nums">
                  {r.annualRate.toFixed(2)}%
                  {/* Keep at least one rate on record — only older ones can go. */}
                  {i !== 0 && (
                    <button
                      type="button"
                      aria-label="Delete rate"
                      onClick={() => deleteRateSnapshot(r.id)}
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
    </div>
  )
}

// --- Add / edit liability form ----------------------------------------------

function LiabilityForm({
  editing,
  currencySymbol,
  onDone,
}: {
  editing: Liability | null
  currencySymbol: string
  onDone: () => void
}) {
  const [name, setName] = useState(editing?.name ?? '')
  const [kind, setKind] = useState<LiabilityKind>(editing?.kind ?? 'loan')
  const [openingDate, setOpeningDate] = useState(editing?.openingDate ?? todayKey())
  const [openingBalance, setOpeningBalance] = useState(
    editing ? String(editing.openingBalance) : '',
  )
  const [repayment, setRepayment] = useState(
    editing?.monthlyRepayment != null ? String(editing.monthlyRepayment) : '',
  )
  // Rate is only set when CREATING (it seeds the first rate snapshot). On edit,
  // the rate lives in snapshots and is changed via the card's “Update rate”.
  const [rate, setRate] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const bal = Number(openingBalance)
    if (!name.trim() || !openingDate || !(bal >= 0)) return
    const pay = repayment.trim() === '' ? undefined : Number(repayment)

    if (editing) {
      await saveLiability({
        ...editing,
        name: name.trim(),
        kind,
        openingDate,
        openingBalance: bal,
        monthlyRepayment: pay,
      })
      onDone()
    } else {
      const r = Number(rate)
      await createLiability(
        {
          id: crypto.randomUUID(),
          name: name.trim(),
          kind,
          openingDate,
          openingBalance: bal,
          monthlyRepayment: pay,
        },
        Number.isFinite(r) && r >= 0 ? r : 0,
      )
      setName('')
      setKind('loan')
      setOpeningDate(todayKey())
      setOpeningBalance('')
      setRepayment('')
      setRate('')
    }
  }

  return (
    <motion.form
      {...hoverLift}
      onSubmit={handleSubmit}
      className="mt-2 space-y-4 rounded-card border border-border bg-surface p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium" htmlFor="liab-name">
            Name
          </label>
          <input
            id="liab-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Home loan, Toyota Hilux"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="liab-kind">
            Type
          </label>
          <select
            id="liab-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as LiabilityKind)}
            className={inputClass}
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.glyph} {k.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium" htmlFor="liab-open-date">
            Opened on
          </label>
          <input
            id="liab-open-date"
            type="date"
            value={openingDate}
            onChange={(e) => setOpeningDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="liab-open-bal">
            Amount owed ({currencySymbol})
          </label>
          <input
            id="liab-open-bal"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {!editing && (
          <div>
            <label className="block text-sm font-medium" htmlFor="liab-init-rate">
              Interest rate (%)
            </label>
            <input
              id="liab-init-rate"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="e.g. 11.75"
              className={inputClass}
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium" htmlFor="liab-repay">
            Monthly repayment ({currencySymbol})
            <span className="ml-1 font-normal text-muted">— optional</span>
          </label>
          <input
            id="liab-repay"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={repayment}
            onChange={(e) => setRepayment(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </div>
      </div>

      <p className="text-xs text-muted">
        {editing
          ? 'Editing details here keeps your balance and rate history. Change the current rate from the card’s “Update rate”.'
          : 'The amount owed and rate seed this debt’s history — update both over time as you repay and as rates change.'}
      </p>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg transition-opacity hover:opacity-90"
        >
          {editing ? 'Save changes' : 'Add liability'}
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
    </motion.form>
  )
}

// Group an array into a Map keyed by a derived string.
function groupBy<T>(items: T[], key: (t: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const k = key(item)
    const list = map.get(k) ?? []
    list.push(item)
    map.set(k, list)
  }
  return map
}
