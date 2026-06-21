import type { SortKey } from '../db/types'
import { SORT_OPTIONS } from '../lib/sort'
import { Eyebrow } from './ui'

/*
  The little "view" toolbar that sits under each page's heading: a row of
  toggle chips for choosing which display sections show, plus a Sort dropdown.
  Shared so Expenses, Income and Investments all look and behave the same.
*/

export interface SectionOption {
  key: string
  label: string
  on: boolean
  toggle: () => void
}

export function ViewToolbar({
  sections,
  sort,
  onSortChange,
}: {
  sections: SectionOption[]
  sort: SortKey
  onSortChange: (key: SortKey) => void
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Eyebrow className="mr-1">Show</Eyebrow>
        {sections.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={s.toggle}
            aria-pressed={s.on}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              s.on
                ? 'border-primary bg-primary text-primary-fg'
                : 'border-border text-muted hover:text-fg'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <SortSelect value={sort} onChange={onSortChange} />
    </div>
  )
}

export function SortSelect({
  value,
  onChange,
}: {
  value: SortKey
  onChange: (key: SortKey) => void
}) {
  return (
    <label className="inline-flex items-center gap-2 text-xs text-muted">
      <span className="uppercase tracking-[0.18em]">Sort</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-fg outline-none focus:border-primary"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
