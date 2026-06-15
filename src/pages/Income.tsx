import { useState } from 'react'
import {
  addStream,
  deleteStream,
  setStreamEntry,
  updateStream,
  useIncomeStreams,
  useMonthIncomeEntries,
} from '../hooks/useIncome'
import { useLedger } from '../hooks/useLedger'
import { LedgerCard } from '../components/LedgerCard'
import { MonthSwitcher } from '../components/MonthSwitcher'
import { PageHeader, SectionLabel } from '../components/ui'
import { formatMoney } from '../lib/format'
import { currentMonthKey, formatMonthLabel } from '../lib/month'
import type { IncomeStream, MonthKey } from '../db/types'

export function Income() {
  // Which month we're viewing. Starts on the current real-world month.
  const [month, setMonth] = useState<MonthKey>(() => currentMonthKey())

  const streams = useIncomeStreams()
  const entries = useMonthIncomeEntries(month)
  const ledger = useLedger(month)

  // Fast lookup of "what did this stream pay in this month?".
  const amountByStream = new Map(entries.map((e) => [e.streamId, e.amount]))
  const activeStreams = streams.filter((s) => s.active)
  // Income that came from divesting an investment (created on the Investments
  // page). It has no stream, so we list it on its own — read-only here.
  const divestEntries = entries.filter((e) => e.sourceTxnId)

  return (
    <div>
      <PageHeader
        eyebrow="Money in"
        title="Income"
        right={<MonthSwitcher month={month} onChange={setMonth} />}
      />

      {/* Rolling-ledger summary for the selected month */}
      <LedgerCard ledger={ledger} month={month} />

      {/* This month's income, one row per active stream */}
      <section className="mt-6">
        <SectionLabel>Income for {formatMonthLabel(month)}</SectionLabel>

        {activeStreams.length === 0 ? (
          <p className="mt-2 rounded-card border border-border bg-surface p-4 text-sm text-muted">
            No active income streams yet. Add one below to start recording income.
          </p>
        ) : (
          <div className="mt-2 divide-y divide-border rounded-card border border-border bg-surface">
            {activeStreams.map((stream) => (
              <StreamIncomeRow
                // Include the month in the key so switching months remounts the
                // row with a fresh value seeded from that month's saved entry.
                key={`${stream.id}:${month}`}
                stream={stream}
                month={month}
                savedAmount={amountByStream.get(stream.id)}
                currencySymbol={ledger.currencySymbol}
              />
            ))}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium">Total income</span>
              <span className="font-display text-base font-semibold tabular-nums text-positive">
                {formatMoney(ledger.income, ledger.currencySymbol)}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Income from investment withdrawals (managed on the Investments page) */}
      {divestEntries.length > 0 && (
        <section className="mt-6">
          <SectionLabel>From investments</SectionLabel>
          <div className="mt-2 divide-y divide-border rounded-card border border-border bg-surface">
            {divestEntries.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1 truncate text-sm">
                  {e.note ?? 'Investment withdrawal'}
                </span>
                <span className="text-sm font-semibold text-positive">
                  {formatMoney(e.amount, ledger.currencySymbol)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted">
            Created when you withdraw from a portfolio. Remove it from the
            Investments page.
          </p>
        </section>
      )}

      {/* Manage the streams themselves */}
      <StreamManager streams={streams} currencySymbol={ledger.currencySymbol} />
    </div>
  )
}

// --- One income row for the selected month ---------------------------------

function StreamIncomeRow({
  stream,
  month,
  savedAmount,
  currencySymbol,
}: {
  stream: IncomeStream
  month: MonthKey
  savedAmount: number | undefined
  currencySymbol: string
}) {
  // Local text state for the input, seeded from what's saved for this month
  // (blank if nothing is recorded yet). The parent keys this component by
  // `${streamId}:${month}`, so switching months remounts it and re-seeds here —
  // no effect needed to keep it in sync.
  const [value, setValue] = useState(savedAmount != null ? String(savedAmount) : '')

  // Save whatever is in the box. Empty/zero clears the entry for this month.
  function commit(next: string) {
    setStreamEntry(stream.id, month, Number(next))
  }

  const showDefaultHint = value.trim() === '' && stream.defaultAmount > 0

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{stream.name}</span>
        {showDefaultHint && (
          <button
            type="button"
            onClick={() => {
              const next = String(stream.defaultAmount)
              setValue(next)
              commit(next)
            }}
            className="text-xs text-muted hover:text-primary"
          >
            Use default {formatMoney(stream.defaultAmount, currencySymbol)}
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted">{currencySymbol}</span>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          placeholder="0"
          className="w-28 rounded-lg border border-border bg-bg px-3 py-1.5 text-right text-sm outline-none focus:border-primary"
        />
      </div>
    </div>
  )
}

// --- Stream manager (add / edit / delete streams) --------------------------

function StreamManager({
  streams,
  currencySymbol,
}: {
  streams: IncomeStream[]
  currencySymbol: string
}) {
  const [newName, setNewName] = useState('')
  const [newDefault, setNewDefault] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    await addStream(newName, Number(newDefault) || 0)
    setNewName('')
    setNewDefault('')
  }

  return (
    <section className="mt-8">
      <SectionLabel>Income streams</SectionLabel>
      <p className="mt-1 text-xs text-muted">
        Your recurring sources of money. The default amount pre-fills each new
        month so you only adjust what changed.
      </p>

      <div className="mt-2 divide-y divide-border rounded-card border border-border bg-surface">
        {streams.length === 0 && (
          <p className="px-4 py-3 text-sm text-muted">No streams yet.</p>
        )}
        {streams.map((stream) => (
          <StreamManagerRow
            key={stream.id}
            stream={stream}
            currencySymbol={currencySymbol}
          />
        ))}

        {/* Add-a-stream form lives at the bottom of the same card */}
        <form onSubmit={handleAdd} className="flex items-center gap-2 px-4 py-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New stream name (e.g. Salary)"
            className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm outline-none focus:border-primary"
          />
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={newDefault}
            onChange={(e) => setNewDefault(e.target.value)}
            placeholder="Default"
            className="w-28 rounded-lg border border-border bg-bg px-3 py-1.5 text-right text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-fg transition-opacity hover:opacity-90"
          >
            Add
          </button>
        </form>
      </div>
    </section>
  )
}

function StreamManagerRow({
  stream,
  currencySymbol,
}: {
  stream: IncomeStream
  currencySymbol: string
}) {
  // Seeded once from the stream. The only thing that edits a stream's name or
  // default in Phase 1 is this row itself, so local state stays authoritative.
  const [name, setName] = useState(stream.name)
  const [def, setDef] = useState(String(stream.defaultAmount))

  async function handleDelete() {
    const ok = window.confirm(
      `Delete "${stream.name}"? This also removes its recorded income in every month.`,
    )
    if (ok) await deleteStream(stream.id)
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => updateStream(stream.id, { name: name.trim() || stream.name })}
        className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-medium outline-none hover:border-border focus:border-primary"
      />
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted">{currencySymbol}</span>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          value={def}
          onChange={(e) => setDef(e.target.value)}
          onBlur={() =>
            updateStream(stream.id, { defaultAmount: Number(def) || 0 })
          }
          className="w-24 rounded-lg border border-border bg-bg px-2 py-1 text-right text-sm outline-none focus:border-primary"
        />
      </div>
      <label className="flex cursor-pointer items-center gap-1 text-xs text-muted">
        <input
          type="checkbox"
          checked={stream.active}
          onChange={(e) => updateStream(stream.id, { active: e.target.checked })}
        />
        Active
      </label>
      <button
        type="button"
        onClick={handleDelete}
        aria-label={`Delete ${stream.name}`}
        className="rounded-lg px-2 py-1 text-muted hover:text-negative"
      >
        ✕
      </button>
    </div>
  )
}
