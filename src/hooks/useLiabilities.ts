import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Liability, LiabilityBalance, LiabilityRate } from '../db/types'

/*
  Reads + writes for liabilities (debts) and their two kinds of dated snapshot:
  the outstanding BALANCE (shrinks as you repay) and the interest RATE (changes
  when, say, the repo rate moves). This mirrors usePortfolios.ts — a liability is
  the negative-net-worth twin of a portfolio.

  Key difference from a portfolio: a liability has no rate FIELD on its record;
  the rate lives entirely in dated snapshots so history is preserved. That's why
  createLiability writes the first rate snapshot alongside the new record — a
  liability with no rate at all would read as 0%.
*/

// All liabilities. Order doesn't matter here — every page sorts them itself via
// the user's view preference — so we avoid requiring a `name` index.
export function useLiabilities(): Liability[] {
  return useLiveQuery(() => db.liabilities.toArray(), []) ?? []
}

// One liability's balance snapshots, newest first. `liabilityId` is an index so
// the query is fast; we sort in memory because `date` isn't a compound index.
export function useLiabilityBalances(liabilityId: string): LiabilityBalance[] {
  return (
    useLiveQuery(
      () =>
        db.liabilityBalances
          .where('liabilityId')
          .equals(liabilityId)
          .toArray()
          .then((rows) => rows.sort((a, b) => b.date.localeCompare(a.date))),
      [liabilityId],
    ) ?? []
  )
}

// One liability's rate snapshots, newest first (newest = the rate in effect now).
export function useLiabilityRates(liabilityId: string): LiabilityRate[] {
  return (
    useLiveQuery(
      () =>
        db.liabilityRates
          .where('liabilityId')
          .equals(liabilityId)
          .toArray()
          .then((rows) => rows.sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))),
      [liabilityId],
    ) ?? []
  )
}

// --- Liability CRUD --------------------------------------------------------

// Create a liability AND its opening interest-rate snapshot in one transaction,
// so a new debt always has a rate on record. `initialAnnualRate` is dated from
// the liability's opening date — that's when this rate started applying.
export async function createLiability(
  liability: Liability,
  initialAnnualRate: number,
): Promise<void> {
  await db.transaction('rw', [db.liabilities, db.liabilityRates], async () => {
    await db.liabilities.put(liability)
    await db.liabilityRates.put({
      id: crypto.randomUUID(),
      liabilityId: liability.id,
      effectiveDate: liability.openingDate,
      annualRate: initialAnnualRate,
    })
  })
}

// Overwrite a liability record (the edit form builds the whole record). Rate and
// balance snapshots are untouched — those are managed via their own writers.
export async function saveLiability(liability: Liability): Promise<void> {
  await db.liabilities.put(liability)
}

// Patch a few fields on an existing liability without clobbering the rest (reads
// the current record first), e.g. updating just the monthly repayment.
export async function updateLiability(
  id: string,
  patch: Partial<Liability>,
): Promise<void> {
  const current = await db.liabilities.get(id)
  if (!current) return
  await db.liabilities.put({ ...current, ...patch })
}

// Delete a liability and all its snapshots in one transaction. No linked-ledger
// cascade (unlike portfolios): v1 liabilities don't auto-create expenses/income.
export async function deleteLiability(id: string): Promise<void> {
  await db.transaction(
    'rw',
    [db.liabilities, db.liabilityBalances, db.liabilityRates],
    async () => {
      await db.liabilityBalances.where('liabilityId').equals(id).delete()
      await db.liabilityRates.where('liabilityId').equals(id).delete()
      await db.liabilities.delete(id)
    },
  )
}

// --- Balance snapshots -----------------------------------------------------

// Record (or overwrite) what you still owe on a date. The newest one is "now".
export async function addBalanceSnapshot(
  liabilityId: string,
  date: string,
  balance: number,
): Promise<void> {
  await db.liabilityBalances.put({
    id: crypto.randomUUID(),
    liabilityId,
    date,
    balance,
  })
}

export async function deleteBalanceSnapshot(id: string): Promise<void> {
  await db.liabilityBalances.delete(id)
}

// --- Rate snapshots --------------------------------------------------------

// Record a new interest rate from a given date — e.g. after a repo-rate change.
// The newest effective date is the rate in force today.
export async function addRateSnapshot(
  liabilityId: string,
  effectiveDate: string,
  annualRate: number,
): Promise<void> {
  await db.liabilityRates.put({
    id: crypto.randomUUID(),
    liabilityId,
    effectiveDate,
    annualRate,
  })
}

export async function deleteRateSnapshot(id: string): Promise<void> {
  await db.liabilityRates.delete(id)
}
