import { useState } from 'react'
import { useSettings, updateSettings } from '../hooks/useSettings'
import {
  notificationPermission,
  requestNotificationPermission,
  type PermissionState,
} from '../lib/reminders'
import type { Settings } from '../db/types'

// Settings for yearly-expense reminders: the two lead-time toggles, plus a
// best-effort browser-notification permission control.
export function RemindersSettings() {
  const settings = useSettings()
  // The browser's current permission. Held in local state so the UI updates
  // immediately after the user responds to the permission prompt.
  const [perm, setPerm] = useState<PermissionState>(notificationPermission())

  // Flip one notification pref. notifications is a nested object, so we spread
  // the current values and override the one field.
  async function toggle(field: keyof Settings['notifications']) {
    await updateSettings({
      notifications: {
        ...settings.notifications,
        [field]: !settings.notifications[field],
      },
    })
  }

  async function enable() {
    setPerm(await requestNotificationPermission())
  }

  return (
    <section className="mt-6 rounded-card border border-border bg-surface p-6">
      <h2 className="font-display text-lg font-semibold tracking-tight">Reminders</h2>
      <p className="mt-1 text-sm text-muted">
        Yearly expenses are easy to forget. Get a heads-up before each one is due
        so you can set the money aside in time.
      </p>

      <div className="mt-5 space-y-3">
        <Toggle
          label="3 months before"
          hint="An early warning while there's still plenty of time to save."
          checked={settings.notifications.yearlyThreeMonths}
          onChange={() => toggle('yearlyThreeMonths')}
        />
        <Toggle
          label="1 month before"
          hint="A final nudge as the due date approaches."
          checked={settings.notifications.yearlyOneMonth}
          onChange={() => toggle('yearlyOneMonth')}
        />
      </div>

      <hr className="my-5 border-border" />

      {/* Browser notifications — best-effort, on top of the in-app banner. */}
      <div>
        <div className="text-sm font-medium">Browser notifications</div>
        <p className="mt-1 text-xs text-muted">
          Optional. Reminders always show inside the app; allow notifications to
          also be alerted by your device.
        </p>
        <div className="mt-3">{renderPermission(perm, enable)}</div>
      </div>
    </section>
  )
}

function renderPermission(perm: PermissionState, enable: () => void) {
  switch (perm) {
    case 'granted':
      return <p className="text-sm text-positive">Enabled ✓</p>
    case 'denied':
      return (
        <p className="text-sm text-muted">
          Blocked in your browser. Re-enable notifications for this site in your
          browser settings to turn them on.
        </p>
      )
    case 'unsupported':
      return (
        <p className="text-sm text-muted">
          This browser doesn't support notifications — the in-app banner still
          works.
        </p>
      )
    default: // 'default' — not yet asked
      return (
        <button
          onClick={enable}
          className="rounded-lg border border-border bg-bg px-4 py-2 text-sm font-medium transition-colors hover:border-primary"
        >
          Enable browser notifications
        </button>
      )
  }
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 accent-[var(--primary)]"
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
    </label>
  )
}
