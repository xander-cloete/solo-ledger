import Dexie, { type Table } from 'dexie'
import type {
  Settings,
  IncomeStream,
  IncomeEntry,
  Expense,
  ExpenseItem,
  Portfolio,
  PortfolioBalance,
  Transaction,
  MonthState,
} from './types'
import { currentMonthKey } from '../lib/month'

/*
  Dexie is a friendly wrapper around IndexedDB — the database that lives inside
  the user's browser, on their device. Nothing here ever talks to a server.

  Each `Table<T, K>` is one collection of records (T = the record shape, K = the
  type of its primary key). The `.stores({...})` call below declares the tables
  and which fields are indexed (indexed fields can be searched/filtered quickly).
*/
export class SoloLedgerDB extends Dexie {
  settings!: Table<Settings, string>
  incomeStreams!: Table<IncomeStream, string>
  incomeEntries!: Table<IncomeEntry, string>
  expenses!: Table<Expense, string>
  expenseItems!: Table<ExpenseItem, string>
  portfolios!: Table<Portfolio, string>
  portfolioBalances!: Table<PortfolioBalance, string>
  transactions!: Table<Transaction, string>
  monthState!: Table<MonthState, string>

  constructor() {
    super('solo-ledger')
    // The first string in each line is the primary key; the rest are indexes.
    this.version(1).stores({
      settings: 'id',
      incomeStreams: 'id, name, active',
      incomeEntries: 'id, streamId, month',
      expenses: 'id, type, startMonth, dueDate, linkedPortfolioId',
      expenseItems: 'id, expenseId, store',
      portfolios: 'id, name',
      portfolioBalances: 'id, portfolioId, date',
      transactions: 'id, month, type',
      monthState: 'month',
    })
  }
}

export const db = new SoloLedgerDB()

// The values a brand-new install starts with.
export const DEFAULT_SETTINGS: Settings = {
  id: 'app',
  currency: 'NAD',
  currencySymbol: 'N$',
  startingBalance: 0,
  ledgerStartMonth: currentMonthKey(),
  activeTheme: 'japandi',
  notifications: { yearlyThreeMonths: true, yearlyOneMonth: true },
  gamification: true,
  reduceMotion: false,
}

// Make sure the single settings row exists, and backfill any fields added in
// later phases (so installs from an earlier phase keep working). Called once at
// startup.
export async function ensureSettings(): Promise<Settings> {
  const existing = await db.settings.get('app')
  if (!existing) {
    await db.settings.put(DEFAULT_SETTINGS)
    return DEFAULT_SETTINGS
  }
  // Merge defaults under the saved row: any field missing on the old row gets a
  // sensible default, while everything the user set is preserved. If the saved
  // row was missing any field we now expect (i.e. it's from an earlier phase),
  // persist the backfilled version so later code can rely on every field.
  const merged: Settings = { ...DEFAULT_SETTINGS, ...existing }
  const wasMissingField = Object.keys(DEFAULT_SETTINGS).some(
    (key) => !(key in existing),
  )
  if (wasMissingField) {
    await db.settings.put(merged)
  }
  return merged
}
