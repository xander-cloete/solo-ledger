# Solo Ledger — Project Plan & Phase Guide

> A private, **local-first** personal finance PWA. All data lives on the user's own
> device (IndexedDB); nothing is stored on any server. This file is the living guide —
> each phase has a ready-to-paste kickoff prompt.

## Progress

- [x] **Phase 0 — Foundations & scaffold** ✅ (Vite + React + TS, Tailwind theming, Dexie DB, router shell, Settings page, PWA)
- [ ] Phase 1 — Income & the rolling ledger ← **next**
- [ ] Phase 2 — Expenses (3 types)
- [ ] Phase 3 — Micro-expenses (nested items)
- [ ] Phase 4 — Investments + linked transactions
- [ ] Phase 5 — Dashboard
- [ ] Phase 6 — Backup (Export / Import)
- [ ] Phase 7 — Reminders / notifications
- [ ] Phase 8 — Theming engine (full)
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

- **settings** — `currency`, `currencySymbol`, `startingBalance`, `activeTheme`, `notifications`
- **incomeStreams** — `id`, `name`, `defaultAmount`, `active`
- **incomeEntries** — `id`, `streamId`, `month`, `amount`, `note?`, `sourceTxnId?`
- **expenses** — `id`, `name`, `type` (`yearly`|`monthlyFixed`|`oneOff`), `amount`, `dueDate?`, `term?`, `startMonth`, `hasItems`, `linkedPortfolioId?`
- **expenseItems** — `id`, `expenseId`, `name`, `qty`, `unitPrice`, `store`, `frequency`
- **portfolios** — `id`, `name`, `initialDate`, `initialAmount`
- **portfolioBalances** — `id`, `portfolioId`, `date`, `balance`
- **transactions** — `id`, `month`, `type`, `amount`, `fromPortfolioId?`, `toPortfolioId?`, `relatedExpenseId?`, `relatedIncomeId?`
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
