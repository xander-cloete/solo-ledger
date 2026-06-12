// Phase 6 — Backup (Export / Import).
//
// Everything in Solo Ledger lives only on this device, in IndexedDB. That's great
// for privacy, but it means a cleared browser = lost data. So backup is a
// first-class feature: export bundles every table into one JSON file the user
// saves themselves; import reads that file back, validates it with Zod, and
// fully restores the database.
//
// "Validate with Zod" matters here: an import file is untrusted input (it may be
// hand-edited, truncated, or from an incompatible version). Zod is a schema
// library that checks the parsed JSON has exactly the right shape and types
// BEFORE we touch the database — so a bad file is rejected cleanly instead of
// corrupting the store.

import { z } from 'zod'
import { db } from '../db/db'

// Bump this if the data model ever changes in a backwards-incompatible way, so a
// future import can detect "this backup is from an older/newer app version".
export const SCHEMA_VERSION = 1

// --- One Zod schema per table, mirroring src/db/types.ts exactly. ---
// `.optional()` mirrors a `?` field; `.nullable()` mirrors a `| null`.

const settingsSchema = z.object({
  id: z.literal('app'),
  currency: z.string(),
  currencySymbol: z.string(),
  startingBalance: z.number(),
  ledgerStartMonth: z.string(),
  activeTheme: z.string(),
  notifications: z.object({
    yearlyThreeMonths: z.boolean(),
    yearlyOneMonth: z.boolean(),
  }),
})

const incomeStreamSchema = z.object({
  id: z.string(),
  name: z.string(),
  defaultAmount: z.number(),
  active: z.boolean(),
})

const incomeEntrySchema = z.object({
  id: z.string(),
  streamId: z.string().optional(),
  month: z.string(),
  amount: z.number(),
  note: z.string().optional(),
  sourceTxnId: z.string().optional(),
})

const expenseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['yearly', 'monthlyFixed', 'oneOff']),
  amount: z.number(),
  dueDate: z.string().optional(),
  term: z.number().nullable().optional(),
  startMonth: z.string(),
  hasItems: z.boolean(),
  linkedPortfolioId: z.string().optional(),
})

const expenseItemSchema = z.object({
  id: z.string(),
  expenseId: z.string(),
  name: z.string(),
  qty: z.number(),
  unitPrice: z.number(),
  store: z.string(),
  frequency: z.enum(['weekly', 'twiceMonthly', 'monthly']),
})

const portfolioSchema = z.object({
  id: z.string(),
  name: z.string(),
  initialDate: z.string(),
  initialAmount: z.number(),
})

const portfolioBalanceSchema = z.object({
  id: z.string(),
  portfolioId: z.string(),
  date: z.string(),
  balance: z.number(),
})

const transactionSchema = z.object({
  id: z.string(),
  month: z.string(),
  type: z.enum(['income', 'expense', 'divest', 'invest']),
  amount: z.number(),
  fromPortfolioId: z.string().optional(),
  toPortfolioId: z.string().optional(),
  relatedExpenseId: z.string().optional(),
  relatedIncomeId: z.string().optional(),
})

const monthStateSchema = z.object({
  month: z.string(),
  carryIn: z.number(),
  carryOut: z.number(),
})

// The whole backup file: a small envelope (what app, which version, when) plus a
// `data` object holding every table's rows.
export const backupSchema = z.object({
  app: z.literal('solo-ledger'),
  schemaVersion: z.number(),
  exportedAt: z.string(),
  data: z.object({
    settings: z.array(settingsSchema),
    incomeStreams: z.array(incomeStreamSchema),
    incomeEntries: z.array(incomeEntrySchema),
    expenses: z.array(expenseSchema),
    expenseItems: z.array(expenseItemSchema),
    portfolios: z.array(portfolioSchema),
    portfolioBalances: z.array(portfolioBalanceSchema),
    transactions: z.array(transactionSchema),
    monthState: z.array(monthStateSchema),
  }),
})

// `z.infer` derives a TypeScript type straight from the schema, so the type and
// the runtime validator can never drift apart.
export type Backup = z.infer<typeof backupSchema>

// Tables listed once, so the export reader and the import transaction always
// cover exactly the same set (no table silently left out).
const tables = () => [
  db.settings,
  db.incomeStreams,
  db.incomeEntries,
  db.expenses,
  db.expenseItems,
  db.portfolios,
  db.portfolioBalances,
  db.transactions,
  db.monthState,
]

// Read every table and assemble the in-memory backup object.
export async function buildBackup(): Promise<Backup> {
  const [
    settings,
    incomeStreams,
    incomeEntries,
    expenses,
    expenseItems,
    portfolios,
    portfolioBalances,
    transactions,
    monthState,
  ] = await Promise.all([
    db.settings.toArray(),
    db.incomeStreams.toArray(),
    db.incomeEntries.toArray(),
    db.expenses.toArray(),
    db.expenseItems.toArray(),
    db.portfolios.toArray(),
    db.portfolioBalances.toArray(),
    db.transactions.toArray(),
    db.monthState.toArray(),
  ])

  return {
    app: 'solo-ledger',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      settings,
      incomeStreams,
      incomeEntries,
      expenses,
      expenseItems,
      portfolios,
      portfolioBalances,
      transactions,
      monthState,
    },
  }
}

// A filename-safe timestamp like 2026-06-12_1430.
function fileStamp(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`
}

// Build the backup and hand the browser a download. We turn the JSON into a Blob
// (an in-memory file), make a temporary object URL for it, click a hidden link to
// trigger the "save as" dialog, then release the URL.
export async function exportToFile(): Promise<void> {
  const backup = await buildBackup()
  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `solo-ledger-backup-${fileStamp()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// A friendly count of what's in a backup, for the confirm/success UI.
export type BackupSummary = {
  exportedAt: string
  counts: Record<string, number>
  total: number
}

export function summarize(backup: Backup): BackupSummary {
  const counts: Record<string, number> = {}
  let total = 0
  for (const [name, rows] of Object.entries(backup.data)) {
    counts[name] = rows.length
    total += rows.length
  }
  return { exportedAt: backup.exportedAt, counts, total }
}

// Parse raw file text into a validated Backup. Throws on bad JSON (SyntaxError)
// or a wrong shape (ZodError) — the caller catches and shows a friendly message.
export function parseBackup(text: string): Backup {
  const raw = JSON.parse(text) // throws SyntaxError on malformed JSON
  return backupSchema.parse(raw) // throws ZodError if the shape is wrong
}

// Replace the entire database with the backup's contents. We do it inside a
// single read-write transaction across all tables: clear each one, then bulk-add
// the backup's rows. A transaction is all-or-nothing — if anything fails midway,
// Dexie rolls the whole thing back, so you can never end up half-restored.
export async function restoreBackup(backup: Backup): Promise<void> {
  await db.transaction('rw', tables(), async () => {
    await Promise.all(tables().map((t) => t.clear()))
    await Promise.all([
      db.settings.bulkAdd(backup.data.settings),
      db.incomeStreams.bulkAdd(backup.data.incomeStreams),
      db.incomeEntries.bulkAdd(backup.data.incomeEntries),
      db.expenses.bulkAdd(backup.data.expenses),
      db.expenseItems.bulkAdd(backup.data.expenseItems),
      db.portfolios.bulkAdd(backup.data.portfolios),
      db.portfolioBalances.bulkAdd(backup.data.portfolioBalances),
      db.transactions.bulkAdd(backup.data.transactions),
      db.monthState.bulkAdd(backup.data.monthState),
    ])
  })
}
