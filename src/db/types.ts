// Shared TypeScript types for everything we store on-device.
// Defining these once means the compiler catches mistakes (e.g. a typo in a
// field name, or putting text where a number belongs) before we ever run the app.

export type ExpenseType = 'yearly' | 'monthlyFixed' | 'oneOff'
export type ItemFrequency = 'weekly' | 'twiceMonthly' | 'monthly'
export type TxnType = 'income' | 'expense' | 'divest' | 'invest'

// How a list is ordered. Stored in settings so the user's choice sticks.
export type SortKey =
  | 'name-asc'
  | 'name-desc'
  | 'amount-desc'
  | 'amount-asc'
  | 'date-desc'
  | 'date-asc'

// Per-page "view" preferences: which display sections are visible, and how the
// lists on that page are sorted. The add/edit forms are never hidden, so they're
// not represented here.
export interface ViewPrefs {
  expenses: {
    monthSummary: boolean // "Expenses for <month>" read-only roll-up
    list: boolean // "Your expenses" editable list
    staples: boolean // "Monthly staples" grouped items
    sort: SortKey
  }
  income: {
    monthSummary: boolean // "Income for <month>" editable amounts
    streams: boolean // "Income streams" manager
    sort: SortKey
  }
  investments: {
    cards: boolean // the detailed portfolio cards
    list: boolean // "All portfolios" quick-edit list
    sort: SortKey
  }
  liabilities: {
    cards: boolean // the detailed liability cards
    list: boolean // "All liabilities" quick-edit list
    sort: SortKey
  }
}

// Months are stored as 'YYYY-MM' strings (e.g. '2026-06') so they sort and
// compare naturally.
export type MonthKey = string

export interface Settings {
  id: 'app' // there is only ever one settings row, with this fixed key
  currency: string // currency code/label, e.g. 'NAD'
  currencySymbol: string // what we show, e.g. 'N$'
  startingBalance: number // sets the rolling ledger's opening balance
  ledgerStartMonth: MonthKey // the month startingBalance is the opening balance for
  activeTheme: string // e.g. 'clean'
  notifications: {
    yearlyThreeMonths: boolean
    yearlyOneMonth: boolean
  }
  gamification: boolean // Phase 9: show the quiet progress layer (level/streak/budget)
  reduceMotion: boolean // Phase 10: force-calm — disable animations regardless of OS setting
  view: ViewPrefs // which sections show + how lists sort, per page
}

export interface IncomeStream {
  id: string
  name: string
  defaultAmount: number
  active: boolean
}

export interface IncomeEntry {
  id: string
  streamId?: string // a stream-based entry belongs to a stream; divest income has none
  month: MonthKey
  amount: number
  note?: string
  sourceTxnId?: string // set when this income came from divesting an investment
}

export interface Expense {
  id: string
  name: string
  type: ExpenseType
  amount: number
  dueDate?: string // yearly expenses: the date they fall on (places them in a month)
  term?: number | null // monthlyFixed: how many months (null = until cancelled)
  startMonth: MonthKey
  hasItems: boolean // true = this is a parent that rolls up micro-expense items
  linkedPortfolioId?: string // set for an "investment expense" routed to a portfolio
}

export interface ExpenseItem {
  id: string
  expenseId: string
  name: string
  qty: number
  unitPrice: number
  store: string
  frequency: ItemFrequency
}

export interface Portfolio {
  id: string
  name: string
  initialDate: string
  initialAmount: number
  // Projection assumptions (Phase 11). Both optional, so older saved portfolios
  // keep working untouched — Dexie stores extra fields without a migration since
  // neither is indexed.
  assumedAnnualRate?: number // override % growth; unset = derive from history
  monthlyContribution?: number // a recurring top-up to feed into projections
}

export interface PortfolioBalance {
  id: string
  portfolioId: string
  date: string
  balance: number
}

// A debt you owe — the negative side of net worth. Modelled as the mirror image
// of a Portfolio: a current outstanding balance plus an interest rate, both
// tracked as dated snapshots (below) so history is preserved.
export type LiabilityKind =
  | 'homeLoan'
  | 'vehicle'
  | 'loan'
  | 'creditCard'
  | 'overdraft'
  | 'other'

export interface Liability {
  id: string
  name: string // e.g. 'Toyota Hilux', 'FNB credit card'
  kind: LiabilityKind // for grouping + an icon
  openingBalance: number // what you owed when you started tracking it
  openingDate: string // anchors it on the net-worth timeline
  monthlyRepayment?: number // optional — used for payoff projections
}

// A dated snapshot of what you still owe. Newest on-or-before a date wins, so the
// net-worth timeline can read the outstanding balance at any past month-end —
// exactly how PortfolioBalance works for assets.
export interface LiabilityBalance {
  id: string
  liabilityId: string
  date: string
  balance: number
}

// A dated snapshot of the annual interest rate (%). Each repo-rate change is one
// record; newest on-or-before a date wins, so projections use the right rate for
// each period rather than only today's.
export interface LiabilityRate {
  id: string
  liabilityId: string
  effectiveDate: string
  annualRate: number // percent, e.g. 11.75
}

// Every movement of money is one linked record. This is what lets a divest show
// as income here AND a deduction on the portfolio there (simplified double-entry).
export interface Transaction {
  id: string
  month: MonthKey
  type: TxnType
  amount: number
  fromPortfolioId?: string
  toPortfolioId?: string
  relatedExpenseId?: string
  relatedIncomeId?: string
}

// Cached rolling-ledger figures per month.
export interface MonthState {
  month: MonthKey
  carryIn: number
  carryOut: number
}
