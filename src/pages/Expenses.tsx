import { useState } from 'react'
import { LedgerCard } from '../components/LedgerCard'
import { MonthSwitcher } from '../components/MonthSwitcher'
import { deleteExpense, saveExpense, useExpenses } from '../hooks/useExpenses'
import { useLedger } from '../hooks/useLedger'
import {
  EXPENSE_TYPE_LABEL,
  describeSchedule,
  expenseAmountForMonth,
} from '../lib/expenses'
import { formatMoney } from '../lib/format'
import { currentMonthKey, formatMonthLabel } from '../lib/month'
import type { Expense, ExpenseType, MonthKey } from '../db/types'

export function Expenses() {
  const [month, setMonth] = useState<MonthKey>(() => currentMonthKey())
  // Which expense (if any) is currently loaded into the form for editing.
  const [editingId, setEditingId] = useState<string | null>(null)

  const expenses = useExpenses()
  const ledger = useLedger(month)
  const sym = ledger.currencySymbol

  const editing = editingId
    ? (expenses.find((e) => e.id === editingId) ?? null)
    : null

  // The expenses that actually land on the selected month, with their amounts.
  const applicable = expenses
    .map((e) => ({ expense: e, amount: expenseAmountForMonth(e, month) }))
    .filter((x) => x.amount > 0)

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
        <MonthSwitcher month={month} onChange={setMonth} />
      </div>

      <LedgerCard ledger={ledger} month={month} />

      {/* What hits this specific month */}
      <section className="mt-6">
        <h2 className="text-sm font-medium text-muted">
          Expenses for {formatMonthLabel(month)}
        </h2>

        {applicable.length === 0 ? (
          <p className="mt-2 rounded-card border border-border bg-surface p-4 text-sm text-muted">
            Nothing due this month. Add an expense below.
          </p>
        ) : (
          <div className="mt-2 divide-y divide-border rounded-card border border-border bg-surface">
            {applicable.map(({ expense, amount }) => (
              <div
                key={expense.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {expense.name}
                  </span>
                  <span className="text-xs text-muted">
                    {describeSchedule(expense)}
                  </span>
                </div>
                <TypeBadge type={expense.type} />
                <span className="text-sm font-semibold text-negative">
                  − {formatMoney(amount, sym)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium">Total expenses</span>
              <span className="text-sm font-semibold text-negative">
                − {formatMoney(ledger.expenses, sym)}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Add / edit form */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-muted">
          {editing ? 'Edit expense' : 'Add an expense'}
        </h2>
        <ExpenseForm
          key={editing?.id ?? 'new'}
          editing={editing}
          defaultMonth={month}
          currencySymbol={sym}
          onCancel={() => setEditingId(null)}
        />
      </section>

      {/* The full list of expense definitions */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-muted">All expenses</h2>
        <div className="mt-2 divide-y divide-border rounded-card border border-border bg-surface">
          {expenses.length === 0 && (
            <p className="px-4 py-3 text-sm text-muted">No expenses yet.</p>
          )}
          {expenses.map((expense) => (
            <div key={expense.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {expense.name}
                </span>
                <span className="text-xs text-muted">
                  {describeSchedule(expense)}
                </span>
              </div>
              <span className="text-sm">{formatMoney(expense.amount, sym)}</span>
              <button
                type="button"
                onClick={() => setEditingId(expense.id)}
                className="rounded-lg border border-border px-2 py-1 text-xs text-muted hover:text-fg"
              >
                Edit
              </button>
              <button
                type="button"
                aria-label={`Delete ${expense.name}`}
                onClick={() => {
                  if (window.confirm(`Delete "${expense.name}"?`)) {
                    deleteExpense(expense.id)
                    if (editingId === expense.id) setEditingId(null)
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
    </div>
  )
}

function TypeBadge({ type }: { type: ExpenseType }) {
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">
      {EXPENSE_TYPE_LABEL[type]}
    </span>
  )
}

// --- Add / edit form -------------------------------------------------------

function ExpenseForm({
  editing,
  defaultMonth,
  currencySymbol,
  onCancel,
}: {
  editing: Expense | null
  defaultMonth: MonthKey
  currencySymbol: string
  onCancel: () => void
}) {
  // Seeded from `editing` when editing, or sensible blanks when adding. The
  // parent keys this component by the expense id, so it remounts (and re-seeds)
  // whenever you switch which expense you're editing.
  const [name, setName] = useState(editing?.name ?? '')
  const [type, setType] = useState<ExpenseType>(editing?.type ?? 'monthlyFixed')
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '')
  const [dueDate, setDueDate] = useState(editing?.dueDate ?? '')
  const [startMonth, setStartMonth] = useState(editing?.startMonth ?? defaultMonth)
  const [term, setTerm] = useState(
    editing?.term != null ? String(editing.term) : '',
  )

  function resetForAdd() {
    setName('')
    setType('monthlyFixed')
    setAmount('')
    setDueDate('')
    setStartMonth(defaultMonth)
    setTerm('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = Number(amount)
    if (!name.trim() || !(amt > 0)) return
    if (type === 'yearly' && !dueDate) return
    if (type !== 'yearly' && !startMonth) return

    // Build the complete record. Only the fields relevant to the chosen type are
    // set; `saveExpense` uses `put`, so anything left out is cleared.
    const base = {
      id: editing?.id ?? crypto.randomUUID(),
      name: name.trim(),
      amount: amt,
      hasItems: editing?.hasItems ?? false,
    }
    let expense: Expense
    if (type === 'yearly') {
      // Anchor the start to the due date's month so the expense shows in that
      // month every year from then on, regardless of when it was entered.
      expense = { ...base, type, dueDate, startMonth: dueDate.slice(0, 7) }
    } else if (type === 'monthlyFixed') {
      expense = {
        ...base,
        type,
        startMonth,
        term: term.trim() === '' ? null : Number(term),
      }
    } else {
      expense = { ...base, type: 'oneOff', startMonth }
    }

    await saveExpense(expense)
    if (editing) onCancel()
    else resetForAdd()
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary'

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 space-y-4 rounded-card border border-border bg-surface p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium" htmlFor="exp-name">
            Name
          </label>
          <input
            id="exp-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rent, Car insurance"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="exp-amount">
            Amount ({currencySymbol})
          </label>
          <input
            id="exp-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="exp-type">
          Type
        </label>
        <select
          id="exp-type"
          value={type}
          onChange={(e) => setType(e.target.value as ExpenseType)}
          className={inputClass}
        >
          <option value="monthlyFixed">Monthly (recurring)</option>
          <option value="yearly">Yearly</option>
          <option value="oneOff">One-off</option>
        </select>
      </div>

      {/* Type-specific fields */}
      {type === 'yearly' && (
        <div>
          <label className="block text-sm font-medium" htmlFor="exp-due">
            Due date
          </label>
          <input
            id="exp-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted">
            Appears in this month every year, starting from this date.
          </p>
        </div>
      )}

      {type === 'monthlyFixed' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium" htmlFor="exp-start">
              Starts
            </label>
            <input
              id="exp-start"
              type="month"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="exp-term">
              Term (months)
            </label>
            <input
              id="exp-term"
              type="number"
              min="1"
              step="1"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Blank = until cancelled"
              className={inputClass}
            />
          </div>
        </div>
      )}

      {type === 'oneOff' && (
        <div>
          <label className="block text-sm font-medium" htmlFor="exp-month">
            Month
          </label>
          <input
            id="exp-month"
            type="month"
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg transition-opacity hover:opacity-90"
        >
          {editing ? 'Save changes' : 'Add expense'}
        </button>
        {editing && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-fg"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
