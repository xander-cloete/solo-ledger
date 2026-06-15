import { useState } from 'react'
import { useSettings, updateSettings } from '../hooks/useSettings'
import { formatMoney } from '../lib/format'
import { BackupSection } from '../components/BackupSection'
import { RemindersSettings } from '../components/RemindersSettings'
import { PageHeader } from '../components/ui'
import type { Settings as SettingsType } from '../db/types'

export function Settings() {
  const settings = useSettings()
  const [saved, setSaved] = useState(false)

  // A signature of the persisted values. When the saved settings load or change,
  // this string changes, which (via the `key` below) remounts the form so its
  // fields re-seed from the saved data — no effect needed to keep them in sync.
  const sig = `${settings.currencySymbol}|${settings.currency}|${settings.startingBalance}`

  function handleSaved() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <PageHeader eyebrow="Preferences" title="Settings" />

      <SettingsForm
        key={sig}
        settings={settings}
        saved={saved}
        onSaved={handleSaved}
      />

      <RemindersSettings />

      <BackupSection />

      <p className="mt-6 rounded-card border border-border bg-surface p-4 text-xs text-muted">
        🔒 Your data is stored only on this device, in this browser. It never
        leaves your device and is never sent to any server. Export a backup
        regularly so you can restore it if you clear your browser or switch
        devices.
      </p>
    </div>
  )
}

function SettingsForm({
  settings,
  saved,
  onSaved,
}: {
  settings: SettingsType
  saved: boolean
  onSaved: () => void
}) {
  // Seeded once from the saved settings (the parent remounts us when they change).
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol)
  const [currency, setCurrency] = useState(settings.currency)
  const [startingBalance, setStartingBalance] = useState(
    String(settings.startingBalance),
  )

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    await updateSettings({
      currencySymbol: currencySymbol.trim() || 'N$',
      currency: currency.trim() || 'NAD',
      startingBalance: Number(startingBalance) || 0,
    })
    onSaved()
  }

  return (
    <form
      onSubmit={handleSave}
      className="mt-6 space-y-5 rounded-card border border-border bg-surface p-6"
    >
      <div>
        <label className="block text-sm font-medium" htmlFor="symbol">
          Currency symbol
        </label>
        <input
          id="symbol"
          value={currencySymbol}
          onChange={(e) => setCurrencySymbol(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-primary"
          placeholder="N$"
        />
        <p className="mt-1 text-xs text-muted">Shown next to every amount.</p>
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="code">
          Currency code
        </label>
        <input
          id="code"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-primary"
          placeholder="NAD"
        />
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="balance">
          Starting balance
        </label>
        <input
          id="balance"
          type="number"
          step="0.01"
          value={startingBalance}
          onChange={(e) => setStartingBalance(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-primary"
          placeholder="0"
        />
        <p className="mt-1 text-xs text-muted">
          Set this to your current bank balance so the rolling ledger lines up
          with reality. Preview:{' '}
          <span className="font-medium text-fg">
            {formatMoney(Number(startingBalance) || 0, currencySymbol || 'N$')}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg transition-opacity hover:opacity-90"
        >
          Save
        </button>
        {saved && <span className="text-sm text-positive">Saved ✓</span>}
      </div>
    </form>
  )
}
