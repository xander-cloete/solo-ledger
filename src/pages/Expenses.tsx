import { useState } from 'react'
import { LedgerCard } from '../components/LedgerCard'
import { MonthSwitcher } from '../components/MonthSwitcher'
import { PageHeader, SectionLabel } from '../components/ui'
import { deleteExpense, saveExpense, useExpenses } from '../hooks/useExpenses'
import {
  deleteItem,
  saveItem,
  useAllItems,
  useExpenseItems,
} from '../hooks/useItems'
import { useLedger } from '../hooks/useLedger'
import {
  EXPENSE_TYPE_LABEL,
  describeSchedule,
  expenseAmountForMonth,
} from '../lib/expenses'
import {
  FREQUENCY_LABEL,
  groupItemsByStore,
  itemMonthlyCost,
} from '../lib/items'
import { formatMoney } from '../lib/format'
import { currentMonthKey, formatMonthLabel } from '../lib/month'
import type {
  Expense,
  ExpenseItem,
  ExpenseType,
  ItemFrequency,
  MonthKey,
} from '../db/types'

const inputClass =
  'mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary'

export function Expenses() {
  const [month, setMonth] = useState<MonthKey>(() => currentMonthKey())
  // Which expense (if any) is currently loaded into the form for editing.
  const [editingId, setEditingId] = useState<string | null>(null)
  // Which itemised expense's items panel is expanded in the list (only one open
  // at a time, to keep the page calm).
  const [openItemsId, setOpenItemsId] = useState<string | null>(null)

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
      <PageHeader
        eyebrow="Money out"
        title="Expenses"
        right={<MonthSwitcher month={month} onChange={setMonth} />}
      />

      <LedgerCard ledger={ledger} month={month} />

      {/* What hits this specific month */}
      <section className="mt-6">
        <SectionLabel>Expenses for {formatMonthLabel(month)}</SectionLabel>

        {applicable.length === 0 ? (
          <p className="mt-2 rounded-card border border-border bg-surface p-4 text-sm text-muted">
            Nothing due this month. Add an expense below.
          </p>
        ) : (
          <div className="mt-2 divide-y divide-border rounded-card border border-border bg-surface">
            {applicable.map(({ expense, amount }) => (
              <div
                key={expense.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-border/30"
              >
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {expense.name}
                  </span>
                  <span className="text-xs text-muted">
                    {describeSchedule(expense)}
                    {expense.hasItems && ' · itemised'}
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
              <span className="font-display text-base font-semibold tabular-nums text-negative">
                − {formatMoney(ledger.expenses, sym)}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Add / edit form */}
      <section className="mt-8">
        <SectionLabel>{editing ? 'Edit expense' : 'Add an expense'}</SectionLabel>
        <ExpenseForm
          key={editing?.id ?? 'new'}
          editing={editing}
          defaultMonth={month}
          currencySymbol={sym}
          onCancel={() => setEditingId(null)}
          onCreated={(expense) => {
            // A new itemised expense has no items yet — open its panel so the
            // user can start adding them right away.
            if (expense.hasItems) setOpenItemsId(expense.id)
          }}
        />
      </section>

      {/* The full list of expense definitions */}
      <section className="mt-8">
        <SectionLabel>All expenses</SectionLabel>
        <div className="mt-2 divide-y divide-border rounded-card border border-border bg-surface">
          {expenses.length === 0 && (
            <p className="px-4 py-3 text-sm text-muted">No expenses yet.</p>
          )}
          {expenses.map((expense) => (
            <div key={expense.id}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {expense.name}
                  </span>
                  <span className="text-xs text-muted">
                    {describeSchedule(expense)}
                  </span>
                </div>
                <span className="text-sm">
                  {formatMoney(expense.amount, sym)}
                  {expense.hasItems && (
                    <span className="text-xs text-muted">/mo</span>
                  )}
                </span>
                {expense.hasItems && (
                  <button
                    type="button"
                    onClick={() =>
                      setOpenItemsId((id) =>
                        id === expense.id ? null : expense.id,
                      )
                    }
                    className="rounded-lg border border-border px-2 py-1 text-xs text-muted hover:text-fg"
                  >
                    {openItemsId === expense.id ? 'Hide items' : 'Items'}
                  </button>
                )}
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
                      if (openItemsId === expense.id) setOpenItemsId(null)
                    }
                  }}
                  className="rounded-lg px-2 py-1 text-muted hover:text-negative"
                >
                  ✕
                </button>
              </div>
              {expense.hasItems && openItemsId === expense.id && (
                <ItemManager expenseId={expense.id} currencySymbol={sym} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Monthly Staples — every item across all expenses, grouped by store */}
      <StaplesSection currencySymbol={sym} />
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

// --- Add / edit expense form ----------------------------------------------

function ExpenseForm({
  editing,
  defaultMonth,
  currencySymbol,
  onCancel,
  onCreated,
}: {
  editing: Expense | null
  defaultMonth: MonthKey
  currencySymbol: string
  onCancel: () => void
  onCreated: (expense: Expense) => void
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
  // Itemising is only offered for monthly expenses (the recurring "staples" use
  // case), since the roll-up always produces a per-month figure.
  const [itemise, setItemise] = useState(editing?.hasItems ?? false)
  const isItemised = type === 'monthlyFixed' && itemise

  function resetForAdd() {
    setName('')
    setType('monthlyFixed')
    setAmount('')
    setDueDate('')
    setStartMonth(defaultMonth)
    setTerm('')
    setItemise(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    // Itemised expenses get their amount from their items (kept in sync by
    // useItems), so the typed amount is ignored and not required.
    const amt = isItemised ? (editing?.amount ?? 0) : Number(amount)
    if (!isItemised && !(amt > 0)) return
    if (type === 'yearly' && !dueDate) return
    if (type !== 'yearly' && !startMonth) return

    // Build the complete record. Only the fields relevant to the chosen type are
    // set; `saveExpense` uses `put`, so anything left out is cleared.
    const base = {
      id: editing?.id ?? crypto.randomUUID(),
      name: name.trim(),
      amount: amt,
      hasItems: isItemised,
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
    if (editing) {
      onCancel()
    } else {
      onCreated(expense)
      resetForAdd()
    }
  }

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
            placeholder="e.g. Rent, Groceries"
            className={inputClass}
          />
        </div>
        {!isItemised && (
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
        )}
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

      {/* Itemise toggle — only sensible for monthly expenses */}
      {type === 'monthlyFixed' && (
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={itemise}
            onChange={(e) => setItemise(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
          />
          <span className="text-sm">
            Itemise this expense
            <span className="block text-xs text-muted">
              Build the monthly total from individual items (qty, price, store,
              how often you buy). The amount is calculated for you.
            </span>
          </span>
        </label>
      )}

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

      {isItemised && (
        <p className="rounded-lg border border-border bg-bg px-3 py-2 text-xs text-muted">
          {editing
            ? 'Manage this expense’s items with the “Items” button in the list below.'
            : 'Save the expense, then add its items from the “Items” button in the list below.'}
        </p>
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

// --- Item manager (one itemised expense's items) ---------------------------

function ItemManager({
  expenseId,
  currencySymbol,
}: {
  expenseId: string
  currencySymbol: string
}) {
  const items = useExpenseItems(expenseId)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const editingItem = editingItemId
    ? (items.find((i) => i.id === editingItemId) ?? null)
    : null
  const total = items.reduce((sum, i) => sum + itemMonthlyCost(i), 0)

  return (
    <div className="border-t border-border bg-bg/40 px-4 py-4">
      {items.length === 0 ? (
        <p className="text-xs text-muted">No items yet — add the first below.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {item.name}
                </span>
                <span className="text-xs text-muted">
                  {item.qty} × {formatMoney(item.unitPrice, currencySymbol)} ·{' '}
                  {FREQUENCY_LABEL[item.frequency]}
                  {item.store.trim() && ` · ${item.store.trim()}`}
                </span>
              </div>
              <span className="text-sm font-medium">
                {formatMoney(itemMonthlyCost(item), currencySymbol)}
                <span className="text-xs text-muted">/mo</span>
              </span>
              <button
                type="button"
                onClick={() => setEditingItemId(item.id)}
                className="rounded-lg border border-border px-2 py-0.5 text-xs text-muted hover:text-fg"
              >
                Edit
              </button>
              <button
                type="button"
                aria-label={`Delete ${item.name}`}
                onClick={() => {
                  deleteItem(item)
                  if (editingItemId === item.id) setEditingItemId(null)
                }}
                className="rounded-lg px-2 py-0.5 text-muted hover:text-negative"
              >
                ✕
              </button>
            </li>
          ))}
          <li className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-medium">Monthly total</span>
            <span className="text-sm font-semibold">
              {formatMoney(total, currencySymbol)}
            </span>
          </li>
        </ul>
      )}

      <ItemForm
        key={editingItem?.id ?? 'new-item'}
        expenseId={expenseId}
        editing={editingItem}
        currencySymbol={currencySymbol}
        onDone={() => setEditingItemId(null)}
      />
    </div>
  )
}

function ItemForm({
  expenseId,
  editing,
  currencySymbol,
  onDone,
}: {
  expenseId: string
  editing: ExpenseItem | null
  currencySymbol: string
  onDone: () => void
}) {
  const [name, setName] = useState(editing?.name ?? '')
  const [qty, setQty] = useState(editing ? String(editing.qty) : '1')
  const [unitPrice, setUnitPrice] = useState(
    editing ? String(editing.unitPrice) : '',
  )
  const [store, setStore] = useState(editing?.store ?? '')
  const [frequency, setFrequency] = useState<ItemFrequency>(
    editing?.frequency ?? 'monthly',
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = Number(qty)
    const price = Number(unitPrice)
    if (!name.trim() || !(q > 0) || !(price >= 0)) return

    await saveItem({
      id: editing?.id ?? crypto.randomUUID(),
      expenseId,
      name: name.trim(),
      qty: q,
      unitPrice: price,
      store: store.trim(),
      frequency,
    })

    if (editing) {
      onDone()
    } else {
      // Keep adding: clear the fields but stay in the form.
      setName('')
      setQty('1')
      setUnitPrice('')
      setStore('')
      setFrequency('monthly')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium" htmlFor="item-name">
            Item
          </label>
          <input
            id="item-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Milk"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium" htmlFor="item-store">
            Store
          </label>
          <input
            id="item-store"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            placeholder="e.g. Checkers"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium" htmlFor="item-qty">
            Qty
          </label>
          <input
            id="item-qty"
            type="number"
            min="1"
            step="1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium" htmlFor="item-price">
            Unit price ({currencySymbol})
          </label>
          <input
            id="item-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium" htmlFor="item-freq">
            How often
          </label>
          <select
            id="item-freq"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as ItemFrequency)}
            className={inputClass}
          >
            <option value="weekly">Weekly</option>
            <option value="twiceMonthly">Twice a month</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-fg transition-opacity hover:opacity-90"
        >
          {editing ? 'Save item' : 'Add item'}
        </button>
        {editing && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:text-fg"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

// --- Monthly Staples (all items grouped by store) --------------------------

function StaplesSection({ currencySymbol }: { currencySymbol: string }) {
  const items = useAllItems()
  const groups = groupItemsByStore(items)
  const grandTotal = groups.reduce((sum, g) => sum + g.total, 0)

  return (
    <section className="mt-8">
      <SectionLabel>Monthly staples</SectionLabel>
      {items.length === 0 ? (
        <p className="mt-2 rounded-card border border-border bg-surface p-4 text-sm text-muted">
          Items from your itemised expenses appear here, grouped by store.
        </p>
      ) : (
        <div className="mt-2 space-y-4">
          {groups.map((group) => (
            <div
              key={group.store}
              className="rounded-card border border-border bg-surface"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <span className="text-sm font-semibold">{group.store}</span>
                <span className="text-sm font-medium">
                  {formatMoney(group.total, currencySymbol)}
                  <span className="text-xs text-muted">/mo</span>
                </span>
              </div>
              <ul className="divide-y divide-border">
                {group.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-sm">
                        {item.name}
                      </span>
                      <span className="text-xs text-muted">
                        {item.qty} ×{' '}
                        {formatMoney(item.unitPrice, currencySymbol)} ·{' '}
                        {FREQUENCY_LABEL[item.frequency]}
                      </span>
                    </div>
                    <span className="text-sm">
                      {formatMoney(itemMonthlyCost(item), currencySymbol)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-card border border-border bg-surface px-4 py-3">
            <span className="text-sm font-medium">All staples / month</span>
            <span className="text-sm font-semibold">
              {formatMoney(grandTotal, currencySymbol)}
            </span>
          </div>
        </div>
      )}
    </section>
  )
}
