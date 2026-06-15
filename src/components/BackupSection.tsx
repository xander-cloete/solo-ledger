import { useRef, useState } from 'react'
import {
  exportToFile,
  parseBackup,
  restoreBackup,
  summarize,
  type Backup,
  type BackupSummary,
} from '../lib/backup'

// The import flow is a little state machine:
//  idle    → nothing happening
//  staged  → a valid file is loaded and waiting for the user to confirm restore
//  done    → restore succeeded
//  error   → the chosen file was invalid (bad JSON or wrong shape)
type Stage =
  | { kind: 'idle' }
  | { kind: 'staged'; backup: Backup; summary: BackupSummary }
  | { kind: 'done'; summary: BackupSummary }
  | { kind: 'error'; message: string }

// Pretty labels for the per-table counts shown before restoring.
const TABLE_LABELS: Record<string, string> = {
  settings: 'Settings',
  incomeStreams: 'Income streams',
  incomeEntries: 'Income entries',
  expenses: 'Expenses',
  expenseItems: 'Expense items',
  portfolios: 'Portfolios',
  portfolioBalances: 'Balance snapshots',
  transactions: 'Transactions',
  monthState: 'Cached months',
}

export function BackupSection() {
  const [exported, setExported] = useState(false)
  const [stage, setStage] = useState<Stage>({ kind: 'idle' })
  // A ref to the hidden <input type="file"> so a styled button can open it.
  const fileInput = useRef<HTMLInputElement>(null)

  async function handleExport() {
    await exportToFile()
    setExported(true)
    setTimeout(() => setExported(false), 2000)
  }

  // Runs when the user picks a file. We read it, validate it, and stage it for
  // confirmation — we do NOT touch the database yet.
  async function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Reset the input so picking the same file again still fires onChange.
    e.target.value = ''
    if (!file) return

    try {
      const text = await file.text()
      const backup = parseBackup(text)
      setStage({ kind: 'staged', backup, summary: summarize(backup) })
    } catch (err) {
      const message =
        err instanceof SyntaxError
          ? "That file isn't valid JSON — it may be corrupted or not a backup file."
          : "That file doesn't look like a Solo Ledger backup (its contents didn't match the expected format)."
      setStage({ kind: 'error', message })
    }
  }

  async function handleConfirmRestore() {
    if (stage.kind !== 'staged') return
    const summary = stage.summary
    await restoreBackup(stage.backup)
    setStage({ kind: 'done', summary })
  }

  return (
    <section className="mt-6 rounded-card border border-border bg-surface p-6">
      <h2 className="font-display text-lg font-semibold tracking-tight">Backup</h2>
      <p className="mt-1 text-sm text-muted">
        Your data lives only in this browser. Export a backup file to keep it
        safe, and import it to restore everything on a new device or after
        clearing your data.
      </p>

      {/* Export */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={handleExport}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg transition-opacity hover:opacity-90"
        >
          Export backup
        </button>
        {exported && <span className="text-sm text-positive">Downloaded ✓</span>}
      </div>

      <hr className="my-5 border-border" />

      {/* Import */}
      <div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChosen}
          className="hidden"
        />
        <button
          onClick={() => fileInput.current?.click()}
          className="rounded-lg border border-border bg-bg px-4 py-2 text-sm font-medium transition-colors hover:border-primary"
        >
          Import backup…
        </button>

        {stage.kind === 'error' && (
          <p className="mt-3 rounded-lg border border-negative/40 bg-negative/10 p-3 text-sm text-negative">
            {stage.message}
          </p>
        )}

        {stage.kind === 'staged' && (
          <div className="mt-4 rounded-lg border border-border bg-bg p-4">
            <p className="text-sm font-medium text-negative">
              ⚠ This replaces all current data
            </p>
            <p className="mt-1 text-xs text-muted">
              Everything in this app right now will be overwritten by the backup
              from {new Date(stage.summary.exportedAt).toLocaleString()}.
            </p>

            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted">
              {Object.entries(stage.summary.counts).map(([name, count]) => (
                <li key={name} className="flex justify-between">
                  <span>{TABLE_LABELS[name] ?? name}</span>
                  <span className="font-medium text-fg">{count}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleConfirmRestore}
                className="rounded-lg bg-negative px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Overwrite & restore
              </button>
              <button
                onClick={() => setStage({ kind: 'idle' })}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {stage.kind === 'done' && (
          <p className="mt-3 rounded-lg border border-positive/40 bg-positive/10 p-3 text-sm text-positive">
            Restored {stage.summary.total} records ✓ — your data is back.
          </p>
        )}
      </div>
    </section>
  )
}
