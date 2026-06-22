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
- [x] **Phase 8 — Theming engine (full)** ✅ (a Customization page (`/customize`, new nav item) with a live theme switcher — three launch themes ship as CSS-variable blocks in `index.css`: **Clean** (Japandi, default/light), **Tokyo Night** (Omarchy-inspired dark), and **Terminal** (green-on-black monospace, sharper corners). A data-driven registry in `src/theme/themes.ts` lists each theme + swatch colours so the picker draws previews and adding a theme later is one entry + one CSS block. Picking a theme saves `settings.activeTheme`; `ThemeProvider` writes `data-theme` to `<html>` and the app restyles instantly, falling back to the default if a saved id is unknown. Themes also swap the font and card radius, not just colours. No new tables.)
  _Catalogue later expanded to **10 themes** (after Phase 10): added Rosé Pine, Gruvbox, Nord,
  Dracula (dark), Catppuccin Latte, Solarized Light, and Parchment (light; serif face) — each one
  exactly the promised "one CSS block + one registry entry", proving out the Phase 8 design._
- [x] **Phase 9 — Gamification (optional quiet layer)** ✅ (a calm "Your progress" card on the Dashboard with three mechanics, all pure read-derivations that store nothing: a **garden Level** that grows with net worth (🌱 Seedling → 👑 Magnate, with progress to the next tier), a **savings streak** of consecutive completed months you didn't overspend (income − expenses ≥ 0; leading empty months trimmed, the in-progress month excluded), and **budget adherence** for the live month (this month's expenses vs income, on-track/over). Logic in `src/lib/gamification.ts`, wired via `useGamification` which reuses `useDashboard`'s net-worth/this-month figures. It's **opt-out** via a new `settings.gamification` toggle on the Customize page.)
- [x] **Phase 10 — Animation & live elements polish** ✅ (minimal, theme-aware **Framer Motion** motion, all presentation-only — no new tables. Shared variants/timings live in `src/lib/motion.ts`. Pages cross-fade: `Layout` swaps `<Outlet />` for `useOutlet()` + `useLocation()` inside `AnimatePresence` (`mode="wait"`). The Dashboard's cards stagger-fade in, and key figures count up smoothly via a `CountUp` component (`animate()` writing to the DOM, not React state, so 60fps doesn't cause 60 renders) — used for the net-worth hero and the rolling-ledger balance. Gamification progress bars grow to their width and the level emoji pops on tier-up. Reduce-motion is honoured from **both** the OS `prefers-reduced-motion` query **and** a new Customize-page "Reduce motion" toggle, combined in the `useReduceMotion` hook and applied app-wide via `MotionConfig reducedMotion`; the new `settings.reduceMotion` field is backfilled by `ensureSettings`.)
- [~] **Design overhaul (between Phase 10 & 11)** — editorial + refined-fintech direction (refs: Kinfolk/Papier/Pitch, Apple-clean), subtle-but-elevated motion. Two self-hosted variable fonts bundled for offline (**Fraunces** display, **Hanken Grotesk** body); each theme now carries its own **type personality** via a new `--font-display` token (Terminal mono, Parchment full-serif, Nord/Dracula/Tokyo all-grotesque, the warm themes Fraunces-serif). Shared editorial primitives in `src/components/ui.tsx` (`Eyebrow`, `SectionLabel`, `PageHeader`, `hoverLift`/`LiftCard`) applied across every page; Dashboard rebuilt as the flagship (display-font hero with theme-tinted glow, count-up figures, hover-lift panels). Presentation-only — no data/logic touched. Themes are being **re-thought as concept-driven "worlds"**, not palette swaps: a decoration architecture (`ThemeSignature`, theme-aware `BrandMark`, theme-scoped backdrop CSS, reduce-motion-gated ambient motion) lets each theme carry its own texture, signature ornament, and living micro-animation. **Japandi** shipped first (default): warm-oat washi-paper backdrop + shoji-light glow, a hand-brushed ensō (animated ink-ripple) on the Dashboard, a vermilion hanko-seal brand mark, and living gamification glyphs (leaf sways, flame flickers). The editorial language was also carried across **every page**: content widened + centered (max-w-5xl, no more empty void), a brushed `BrushStroke` accent under each page title, an `InkRule` hand-drawn divider, an editorial rebuild of the rolling-ledger card, and subtle list-row hover life. _In progress: Anime/Manga, Art Deco, Cyberpunk noir worlds to the same bar; then prune the derivative dev-palette themes (Nord/Dracula/Gruvbox/Solarized)._
- [x] **Post-launch UX pass — list focus, inline edit & view controls** ✅ (driven by real use of the live app. **Expenses:** the "Your expenses" list now defaults to the selected month — one-off entries from other months no longer clutter the current budget — with a **This month / All-time** toggle for the full history; editing an expense happens **inline in the list** instead of hijacking the top form, so long lists no longer mean scrolling up. **All three money pages** (Income, Expenses, Investments) gained a shared **view toolbar** (`src/components/ViewControls.tsx`): "Show" chips toggle which display sections appear, and a "Sort" dropdown orders every list by name / amount / date, asc or desc (generic sorter in `src/lib/sort.ts`, `SortKey` + `ViewPrefs` in types). Choices persist in `settings.view`; add/edit forms are never hidden so you can't lock yourself out. PDF user guide + screenshots regenerated to match.)
- [x] **Phase 11 — Projections (forward net-worth)** ✅ (a look *forward* to balance the look *backward* `investments.ts` already gives. New pure engine `src/lib/projections.ts`: `deriveAnnualRate` works out a portfolio's real growth rate from its own history using a **money-weighted return (IRR, solved by bisection)** — it backs out every contribution/withdrawal so deposits aren't mistaken for market gains; `project` compounds a value forward month-by-month (annual rate converted to an equivalent monthly one so "8%/yr" lands exactly), with an optional monthly contribution; `effectiveRate` picks override → derived → **6% default**, and `projectCombined` sums several portfolios. Two optional fields on `Portfolio` carry the assumptions: `assumedAnnualRate` (override %) and `monthlyContribution` — both unindexed, so no DB migration, and `savePortfolio`/the edit form preserve them via a new `updatePortfolio(id, patch)` merge-writer. **Dashboard:** the existing `NetWorthChart` was extended to draw a dashed projection line that joins the solid history at a "now" divider, plus 1/3/5yr horizon chips (investments-only — each portfolio compounds, liquid held flat). **Investments:** a per-portfolio **Project** panel with an editable rate (pre-filled from the derived figure, "use my history" reset) and monthly contribution, previewing 1/3/5/10yr live as you type. Verified visually against seeded data.)
- [x] **Phase 12 — Liabilities (debts + net-worth counterweight)** ✅ (the missing fourth net-worth component — debts pull it *down*. A new `liabilities` table mirrors `Portfolio` (`Liability`: name, `kind`, opening balance/date, optional `monthlyRepayment`), with two dated-snapshot tables that mirror `PortfolioBalance`: `liabilityBalances` (what you still owe — newest wins) and `liabilityRates` (the annual interest rate — each repo-rate change is one dated record, so history is preserved). Additive Dexie `version(2)` — no data migration. New pure engine `src/lib/liabilities.ts`: `currentOwed`/`owedOn` (newest-snapshot-on-or-before, like the investment maths), `rateOn`/`currentRate`, `totalOwed`, and a forward view — `projectBalance` (debt shrinks as interest accrues and the repayment chips it down) + `payoffSummary` (months-to-payoff + total interest, with a "never pays off" guard when the repayment can't cover interest). CRUD in `src/hooks/useLiabilities.ts`; `createLiability` writes the record **and** its opening rate snapshot atomically (the rate lives only in snapshots). **Dashboard:** `useDashboard` subtracts each debt's outstanding balance at every month-end so net worth nets out debt; the hero gained a "Debt" panel; the forward projection subtracts each liability's *projected* balance too, so the dashed line stays continuous at "now". **New Liabilities page** (`/liabilities`, new nav item): a debt-tinted "Total owed" hero with a debt-weighted blended rate, per-debt cards with a shrinking-debt progress bar, live payoff estimate, and **Update balance / Update rate / Project / History** panels. Backup (`backup.ts`) now round-trips the three new tables (optional in the schema so older backups still import) — and the same pass fixed a pre-existing gap where portfolio projection fields weren't backed up. Settings `view.liabilities` added; `ensureSettings`/`useSettings` now deep-merge `view` so a page added later backfills its sub-key instead of crashing older installs. Verified visually against seeded data.)
- [ ] Phase 13 — Deploy to home server ← **next**

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
| Animation | **Framer Motion** (added Phase 10) | Minimal, tasteful transitions |
| Fonts | **@fontsource** Fraunces + Hanken Grotesk (design overhaul) | Self-hosted variable fonts → distinctive type, still offline-safe |
| Dates | **date-fns** | Month/period maths |
| Validation | **Zod** | Validate forms + imported backup files |

## Data model (Dexie tables — `src/db/types.ts` + `src/db/db.ts`)

- **settings** — `currency`, `currencySymbol`, `startingBalance`, `ledgerStartMonth`, `activeTheme`, `notifications`, `gamification`, `reduceMotion`, `view`
  (`ledgerStartMonth` added in Phase 1: the month `startingBalance` is the opening balance for — the ledger's anchor. `gamification` added in Phase 9: opt-out toggle for the progress layer. `reduceMotion` added in Phase 10: opt-in switch to disable animations (OS `prefers-reduced-motion` is also always respected). `view` added in the post-launch UX pass: per-page section-visibility + sort preferences (`ViewPrefs` in `src/db/types.ts`). `ensureSettings` backfills any field missing from an older saved row, so installs from an earlier phase keep working — and `useSettings` also merges defaults on read, so a partial or externally-seeded row never crashes a page. Phase 12: both now merge `view` **one level deep**, so a page added later (e.g. `view.liabilities`) backfills its sub-key on an old row instead of resolving to `undefined`.)
- **incomeStreams** — `id`, `name`, `defaultAmount`, `active`
- **incomeEntries** — `id`, `streamId?`, `month`, `amount`, `note?`, `sourceTxnId?`
  (Phase 4: `streamId` is now optional — divest income has no stream and is set with `sourceTxnId`; the ledger sums all entries regardless of stream, and the Income page lists divest income in its own read-only "From investments" section)
- **expenses** — `id`, `name`, `type` (`yearly`|`monthlyFixed`|`oneOff`), `amount`, `dueDate?`, `term?`, `startMonth`, `hasItems`, `linkedPortfolioId?`
  (Phase 2: which months an expense lands on is computed by rules in `src/lib/expenses.ts`, not stored — yearly = due-date month each year; monthlyFixed = from `startMonth` for `term` months or until cancelled; oneOff = `startMonth` only)
- **expenseItems** — `id`, `expenseId`, `name`, `qty`, `unitPrice`, `store`, `frequency`
  (Phase 3: roll-up rules in `src/lib/items.ts`; an item's monthly cost = `qty × unitPrice × timesPerMonth` where weekly = 52/12, twiceMonthly = 2, monthly = 1. CRUD in `src/hooks/useItems.ts` keeps the parent expense's `amount` in sync after every change, so the rolling ledger stays untouched. An expense is itemised when `hasItems` is true — only offered for `monthlyFixed` expenses.)
- **portfolios** — `id`, `name`, `initialDate`, `initialAmount`, `assumedAnnualRate?`, `monthlyContribution?`
  (Phase 11: the two optional fields carry the projection assumptions; both unindexed, so adding them needed no migration.)
- **portfolioBalances** — `id`, `portfolioId`, `date`, `balance`
  (Phase 4: manual snapshots; newest `date` = current value. Auto-bumps from a transaction use id `bal:<txnId>` and a full-ISO `date` so they sort newest and can be removed with their transaction. Growth maths in `src/lib/investments.ts`)
- **liabilities** — `id`, `name`, `kind` (`homeLoan`|`vehicle`|`loan`|`creditCard`|`overdraft`|`other`), `openingBalance`, `openingDate`, `monthlyRepayment?`
- **liabilityBalances** — `id`, `liabilityId`, `date`, `balance`
- **liabilityRates** — `id`, `liabilityId`, `effectiveDate`, `annualRate`
  (Phase 12: a liability is the mirror of a portfolio — the *negative* side of net worth. Outstanding balance and interest rate are each dated snapshots (newest-on-or-before wins), so a repo-rate change is just a new `liabilityRates` row and history stays accurate. The rate lives **only** in snapshots, so `createLiability` writes the opening rate alongside the record. Maths in `src/lib/liabilities.ts`; CRUD in `src/hooks/useLiabilities.ts`. Added in Dexie `version(2)` — purely additive, no data migration.)
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
