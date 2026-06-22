import { useLiveQuery } from 'dexie-react-hooks'
import { db, DEFAULT_SETTINGS } from '../db/db'
import type { Settings, ViewPrefs } from '../db/types'

/*
  useLiveQuery runs a database query AND re-runs your component whenever the
  underlying data changes. So if settings are updated anywhere in the app, every
  component using this hook updates automatically — no manual refresh needed.
*/
export function useSettings(): Settings {
  const settings = useLiveQuery(() => db.settings.get('app'), [])
  // Merge defaults under whatever's saved: a row written before a newer field
  // existed (or seeded externally) still resolves every field, so pages can read
  // e.g. `settings.view.liabilities` without a guard. `view` is merged one level
  // deep too, so a page added later (its sub-key missing from an older row) still
  // gets defaults instead of `undefined`. ensureSettings() persists the backfill
  // at startup; this keeps reads safe in between.
  if (!settings) return DEFAULT_SETTINGS
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    view: { ...DEFAULT_SETTINGS.view, ...settings.view },
  }
}

// A small helper to update part of the settings row.
export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  await db.settings.update('app', patch)
}

// Update one page's view preferences, preserving the other pages'. Reads the
// current row so we never clobber settings written elsewhere in the meantime.
export async function updateView(patch: Partial<ViewPrefs>): Promise<void> {
  const current = (await db.settings.get('app'))?.view ?? DEFAULT_SETTINGS.view
  await db.settings.update('app', { view: { ...current, ...patch } })
}
