import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { IncomeEntry, IncomeStream, MonthKey } from '../db/types'

/*
  This file holds everything the UI needs to read and change income data:
    - two "live" queries (hooks) that re-render the page whenever the data changes
    - plain async functions that write to the database

  Splitting reads (hooks) from writes (functions) keeps components simple: they
  read with a hook, and call a function to mutate. Dexie + useLiveQuery then push
  the new data back into every component automatically.
*/

// All income streams, sorted by name. (Streams = your recurring sources of money.)
export function useIncomeStreams(): IncomeStream[] {
  return useLiveQuery(() => db.incomeStreams.orderBy('name').toArray(), []) ?? []
}

// The income entries recorded for one month (one entry = "stream X paid Y this month").
export function useMonthIncomeEntries(month: MonthKey): IncomeEntry[] {
  return (
    useLiveQuery(
      () => db.incomeEntries.where('month').equals(month).toArray(),
      [month],
    ) ?? []
  )
}

// --- Stream CRUD -----------------------------------------------------------

export async function addStream(
  name: string,
  defaultAmount: number,
): Promise<void> {
  await db.incomeStreams.add({
    id: crypto.randomUUID(), // built-in browser API: a unique id, no library needed
    name: name.trim(),
    defaultAmount,
    active: true,
  })
}

export async function updateStream(
  id: string,
  patch: Partial<IncomeStream>,
): Promise<void> {
  await db.incomeStreams.update(id, patch)
}

// Deleting a stream also removes its recorded entries, so we never leave behind
// "orphan" income rows pointing at a stream that no longer exists.
export async function deleteStream(id: string): Promise<void> {
  await db.transaction('rw', db.incomeStreams, db.incomeEntries, async () => {
    await db.incomeEntries.where('streamId').equals(id).delete()
    await db.incomeStreams.delete(id)
  })
}

// --- Entry upsert ----------------------------------------------------------

// We give each stream-based entry a deterministic id of `${streamId}:${month}`.
// That means there can only ever be ONE entry per stream per month, and saving
// the same row again simply overwrites it (an "upsert" = update-or-insert).
function entryId(streamId: string, month: MonthKey): string {
  return `${streamId}:${month}`
}

// Record (or clear) how much a stream paid in a given month.
//   amount > 0  -> save/overwrite the entry
//   amount <= 0 -> remove the entry, so a zero doesn't clutter the month
export async function setStreamEntry(
  streamId: string,
  month: MonthKey,
  amount: number,
): Promise<void> {
  const id = entryId(streamId, month)
  if (!Number.isFinite(amount) || amount <= 0) {
    await db.incomeEntries.delete(id)
    return
  }
  await db.incomeEntries.put({ id, streamId, month, amount })
}
