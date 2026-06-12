# Solo Ledger — Project Plan & Phase Guide

> A private, **local-first** personal finance PWA. All data lives on the user's own
> device (IndexedDB); nothing is stored on any server. This file is the living guide —
> each phase has a ready-to-paste kickoff prompt.

## Working conventions

- **This is a living document.** Update `PROJECT_PLAN.md` (and any other docs — `README.md`,
  course notes, etc.) as decisions, data-model fields, or plans change mid-phase.
- **Docs are updated after _every single phase_** — both locally and committed/pushed to git.
  No phase is "done" until the docs reflect reality and the change is on `main`. This keeps us
  always on track and the repo always tells the truth about where we are.

## Progress

- [x] **Phase 0 — Foundations & scaffold** ✅ (Vite + React + TS, Tailwind theming, Dexie DB, router shell, Settings page, PWA)
- [x] **Phase 1 — Income & the rolling ledger** ✅ (income streams CRUD, per-month entries, month switcher, live rolling-ledger balance)
- [x] **Phase 2 — Expenses (3 types)** ✅ (yearly/monthly-fixed/one-off with placement rules, add/edit/delete, wired into the ledger; shared MonthSwitcher + LedgerCard components)
- [x] **Phase 3 — Micro-expenses (nested items)** ✅ (monthly expenses can be "itemised"; items have qty/unit-price/store/frequency and roll up — weekly = ×52/12, twice-monthly = ×2, monthly = ×1 — into the parent's monthly amount, kept in sync so the ledger needs no changes; plus a Monthly Staples view grouped by store)
- [x] **Phase 4 — Investments + linked transactions** ✅ (portfolios with manual balance snapshots; net-growth in N$ and % all-time + over 1mo/3mo/1yr separating gains from contributions; linked transactions — Contribute creates a one-off expense + tops up the balance, Withdraw creates income + reduces the balance, both undoable from either side)
- [x] **Phase 5 — Dashboard** ✅ (read-only overview — a net-worth hero (liquid budget balance + total investment value), breakdown cards with all-time investment growth, a "this month" income/expenses/net row, and a Recharts net-worth-over-time area chart. All figures reuse the Phase 1 ledger maths and Phase 4 investment maths via a single `useDashboard` hook; the page stores **no new data** — it's a live mirror, so it can never disagree with the other pages.)
- [x] **Phase 6 — Backup (Export / Import)** ✅ (a Backup section on Settings — Export bundles every Dexie table into one versioned JSON file the user downloads; Import reads a chosen file, validates it with **Zod** before touching the DB, shows a per-table count + overwrite warning, then on confirm replaces the whole database inside a single all-or-nothing transaction. Logic in `src/lib/backup.ts`, UI in `src/components/BackupSection.tsx`. No new tables — backup just mirrors the existing ones.)
- [x] **Phase 7 — Reminders / notifications** ✅ (yearly expenses get a heads-up 3 months and 1 month before they're due. Pure rules in `src/lib/reminders.ts` find each yearly expense's next due month and emit a reminder when it's exactly 3 or 1 month(s) out, each gated by its Settings toggle. Shown in an in-app banner at the top of the Dashboard (`RemindersBanner`, session-dismissible) and, best-effort, as browser notifications fired from `Layout` on open — de-duped via localStorage so they don't re-nag, and a no-op without permission. Prefs + an "Enable browser notifications" control live in a Reminders section on Settings (`RemindersSettings`). Reuses the existing `settings.notifications` fields — no new tables.)
- [ ] Phase 8 — Theming engine (full) ← **next**
- [ ] Phase 9 — Gamification (optional quiet layer)
- [ ] Phase 10 — Animation & live elements polish
- [ ] Phase 11 — Deploy to home server

---

## Decisions locked in during scoping

- **Local-first PWA** — React + Vite + **TypeScript**.
- Hosted as **static files on the home server** (nginx/Caddy). No backend, no server DB.
- All user data lives **on the user's own device** in **IndexedDB** (via **Dexie**).
  Data never leaves the device → strongest possible privacy.
- **Export/Import JSON backup** is a first-class feature (users back up their own data).
- **Service worker** (via `vite-plugin-pwa`) → installable app + automatic updates.
- **Rolling-ledger** balance: each month inherits last month's leftover; user sets a starting balance.
- **Simple net growth** for investments: `balance − (money in − money out)`, in N$ and %.
- **Single, configurable currency**, default N$ (Namibian Dollar).
- Yearly-expense reminders (3 months + 1 month prior): **in-app + best-effort browser notifications**.
- **Theming engine** (CSS variables) built early; ship 2–3 themes, add the rest over time.
- Single user ("just me") for now — **no authentication needed yet**.

## Tech stack

| Concern | Choice | Why |
|---|---|---|
| Build tool | **Vite** | Fast dev server + bundler |
| UI library | **React** + TypeScript | Career-valuable; type safety for money maths |
| Routing | **react-router-dom** | Switch between tabs |
| Local database | **Dexie** (IndexedDB) | Friendly wrapper over the browser's on-device DB |
| Reactive data | **dexie-react-hooks** | UI auto-updates when stored data changes |
| Styling + themes | **Tailwind CSS** + CSS variables | Theme by swapping variables |
| PWA / offline / updates | **vite-plugin-pwa** | Service worker + install manifest |
| Charts | **Recharts** (added in Phase 5) | Simple React charts |
| Animation | **Framer Motion** (Phase 10) | Minimal, tasteful transitions |
| Dates | **date-fns** | Month/period maths |
| Validation | **Zod** | Validate forms + imported backup files |

## Data model (Dexie tables — `src/db/types.ts` + `src/db/db.ts`)

- **settings** — `currency`, `currencySymbol`, `startingBalance`, `ledgerStartMonth`, `activeTheme`, `notifications`
  (`ledgerStartMonth` added in Phase 1: the month `startingBalance` is the opening balance for — the ledger's anchor)
- **incomeStreams** — `id`, `name`, `defaultAmount`, `active`
- **incomeEntries** — `id`, `streamId?`, `month`, `amount`, `note?`, `sourceTxnId?`
  (Phase 4: `streamId` is now optional — divest income has no stream and is set with `sourceTxnId`; the ledger sums all entries regardless of stream, and the Income page lists divest income in its own read-only "From investments" section)
- **expenses** — `id`, `name`, `type` (`yearly`|`monthlyFixed`|`oneOff`), `amount`, `dueDate?`, `term?`, `startMonth`, `hasItems`, `linkedPortfolioId?`
  (Phase 2: which months an expense lands on is computed by rules in `src/lib/expenses.ts`, not stored — yearly = due-date month each year; monthlyFixed = from `startMonth` for `term` months or until cancelled; oneOff = `startMonth` only)
- **expenseItems** — `id`, `expenseId`, `name`, `qty`, `unitPrice`, `store`, `frequency`
  (Phase 3: roll-up rules in `src/lib/items.ts`; an item's monthly cost = `qty × unitPrice × timesPerMonth` where weekly = 52/12, twiceMonthly = 2, monthly = 1. CRUD in `src/hooks/useItems.ts` keeps the parent expense's `amount` in sync after every change, so the rolling ledger stays untouched. An expense is itemised when `hasItems` is true — only offered for `monthlyFixed` expenses.)
- **portfolios** — `id`, `name`, `initialDate`, `initialAmount`
- **portfolioBalances** — `id`, `portfolioId`, `date`, `balance`
  (Phase 4: manual snapshots; newest `date` = current value. Auto-bumps from a transaction use id `bal:<txnId>` and a full-ISO `date` so they sort newest and can be removed with their transaction. Growth maths in `src/lib/investments.ts`)
- **transactions** — `id`, `month`, `type`, `amount`, `fromPortfolioId?`, `toPortfolioId?`, `relatedExpenseId?`, `relatedIncomeId?`
  (Phase 4: `invest`/`divest` are the linked-transaction records. Contribute → one-off expense (`relatedExpenseId`, expense has `linkedPortfolioId`) + balance bump; Withdraw → income entry (`relatedIncomeId`, entry has `sourceTxnId`) + balance drop. Ops in `src/hooks/useInvestments.ts`; deleting an expense or portfolio cascades to undo the links)
- **monthState** — `month`, `carryIn`, `carryOut`

The **transactions** table makes "divest shows as income here AND a deduction there" work
cleanly — every money movement is one linked record (simplified double-entry accounting).

---

## Phase kickoff prompts

**Phase 1 — Income & rolling ledger:** "Build Phase 1 of Solo Ledger: an Income page where I
create/edit/delete named income streams, add monthly income entries, switch between months, and
see the rolling-ledger running balance (starting balance + carry-in + income − expenses →
carry-out into next month). Use Dexie + dexie-react-hooks; explain new concepts."

**Phase 2 — Expenses (3 types):** "Build Phase 2: an Expenses page supporting yearly,
monthly-fixed (with a term or run-until-cancelled), and one-off expenses; monthly-fixed
auto-carries; yearly expenses appear in their due-date month; everything deducts from the
rolling ledger."

**Phase 3 — Micro-expenses:** "Build Phase 3: let an expense contain micro-expense items
(qty, unit price, store, frequency) that roll up into one budget line, plus a Monthly Staples
view grouped by store."

**Phase 4 — Investments:** "Build Phase 4: portfolios with manual balance entries, simple
net-growth calc (N$ and %) over month/quarter/year, and linked transactions so divesting adds
income + reduces the portfolio, and an investment-expense reduces the budget + tops up a portfolio."

**Phase 5 — Dashboard:** "Build Phase 5: a clean dashboard overview — net worth, total balances,
this month's income and expenses, and a growth chart (Recharts)."

**Phase 6 — Backup:** "Build Phase 6: Export all data to a JSON file and Import to restore,
validated with Zod."

**Phase 7 — Reminders:** "Build Phase 7: yearly-expense reminders 3 months and 1 month prior —
an in-app reminders area shown on open, plus best-effort browser notifications, with prefs in Settings."

**Phase 8 — Theming:** "Build Phase 8: a Customization page with a theme switcher and 2–3 launch
themes (Clean/Japandi, Omarchy/Tokyo Night, Terminal), built so adding more themes later is cheap."

**Phase 9 — Gamification:** "Build Phase 9: a quiet, optional gamification layer — savings
streaks, budget-adherence progress, and a 'level up as net worth grows' element."

**Phase 10 — Animation:** "Build Phase 10: minimal, tasteful Framer Motion transitions and
theme-aware live accents — calm, never distracting."

**Phase 11 — Deploy:** "Help me deploy Solo Ledger to my home server as static files behind
nginx/Caddy, and verify PWA install + auto-update on my phone."

## Verifying any phase

- `pnpm dev` → use the feature in the browser; reload to confirm data persists.
- Inspect stored data: DevTools → Application → IndexedDB → `solo-ledger`.
- From Phase 6 on: export → clear site data → import → confirm full restore.
