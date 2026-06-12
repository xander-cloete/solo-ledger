// Helpers for working with "month keys" — strings like '2026-06'.
//
// Why strings? Because 'YYYY-MM' values sort and compare correctly as plain
// text ('2026-06' < '2026-07'), which makes the rolling-ledger maths simple:
// we can ask "every month before this one" with a normal string comparison.

import { addMonths, differenceInCalendarMonths, format, parseISO } from 'date-fns'
import type { MonthKey } from '../db/types'

// Turn a month key into a real Date (anchored to the 1st) so date-fns can work
// with it. '2026-06' -> Date(2026-06-01).
function keyToDate(key: MonthKey): Date {
  return parseISO(`${key}-01`)
}

// The month we're in right now, e.g. '2026-06'.
export function currentMonthKey(): MonthKey {
  return format(new Date(), 'yyyy-MM')
}

// Step a month key forwards or backwards by n months.
// addMonthsKey('2026-06', 1) -> '2026-07'; addMonthsKey('2026-01', -1) -> '2025-12'.
export function addMonthsKey(key: MonthKey, n: number): MonthKey {
  return format(addMonths(keyToDate(key), n), 'yyyy-MM')
}

// A friendly label for the UI: '2026-06' -> 'June 2026'.
export function formatMonthLabel(key: MonthKey): string {
  return format(keyToDate(key), 'LLLL yyyy')
}

// A compact label for tight spaces like chart axes: '2026-06' -> 'Jun 26'.
export function formatMonthShort(key: MonthKey): string {
  return format(keyToDate(key), 'LLL yy')
}

// How many whole months from `from` to `to`. Same month -> 0, next month -> 1.
// Used to tell how far into a fixed-term expense a given month is.
export function monthsBetween(from: MonthKey, to: MonthKey): number {
  return differenceInCalendarMonths(keyToDate(to), keyToDate(from))
}

// Every month key in the half-open range [start, endExclusive).
// monthRange('2026-01', '2026-04') -> ['2026-01','2026-02','2026-03'].
// Returns [] if start is not before endExclusive.
export function monthRange(start: MonthKey, endExclusive: MonthKey): MonthKey[] {
  const out: MonthKey[] = []
  let m = start
  while (m < endExclusive) {
    out.push(m)
    m = addMonthsKey(m, 1)
  }
  return out
}
