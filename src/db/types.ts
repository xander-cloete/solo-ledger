// Shared TypeScript types for everything we store on-device.
// Defining these once means the compiler catches mistakes (e.g. a typo in a
// field name, or putting text where a number belongs) before we ever run the app.

export type ExpenseType = 'yearly' | 'monthlyFixed' | 'oneOff'
export type ItemFrequency = 'weekly' | 'twiceMonthly' | 'monthly'
export type TxnType = 'income' | 'expense' | 'divest' | 'invest'

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
}

export interface PortfolioBalance {
  id: string
  portfolioId: string
  date: string
  balance: number
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
