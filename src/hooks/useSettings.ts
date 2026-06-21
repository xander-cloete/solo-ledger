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
  return settings ?? DEFAULT_SETTINGS
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
