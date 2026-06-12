# Solo Ledger

A private, **local-first** personal finance PWA. All your data lives on your own device
(in the browser's IndexedDB) — it never touches any server. See `PROJECT_PLAN.md` for the
full phase-by-phase build guide.

## Run it

This project uses **pnpm** (via corepack). If `pnpm` isn't found, enable it once:

```bash
corepack enable pnpm
```

Then, from the project folder (`~/Projects/solo-ledger`):

```bash
# Install dependencies (first time only)
pnpm install

# Start the dev server with hot-reload — open the printed http://localhost URL
pnpm dev

# Type-check + build the production bundle into dist/
pnpm build

# Preview the production build locally
pnpm preview
```

## Tech

Vite · React · TypeScript · Tailwind CSS (CSS-variable theming) · Dexie (IndexedDB) ·
react-router · Recharts (dashboard charts) · Zod (backup validation) · vite-plugin-pwa.

## Where your data lives

Everything is stored in IndexedDB under the database name `solo-ledger`. Inspect it in your
browser: **DevTools → Application → IndexedDB → solo-ledger**. Clearing site data wipes it,
so the in-app Export/Import backup is how you keep it safe.

## Reminders

Yearly expenses (insurance, renewals…) are easy to forget, so Solo Ledger warns you ahead of
each one. On the **Settings → Reminders** section you can switch on a heads-up **3 months** and/or
**1 month** before a yearly expense is due. Active reminders appear in a banner at the top of the
**Dashboard** when you open the app, and — if you click **Enable browser notifications** — your
device can alert you too (best-effort; the in-app banner always works regardless).

## Backing up your data

On the **Settings** page, the **Backup** section lets you:

- **Export backup** — download every table as one timestamped JSON file
  (`solo-ledger-backup-YYYY-MM-DD_HHMM.json`). Keep it somewhere safe.
- **Import backup…** — pick a backup file. It's validated with Zod first, then shows a
  per-table count and an overwrite warning; confirming **replaces all current data** with the
  file's contents in one all-or-nothing database transaction.

To test a full round-trip: export → DevTools → Application → Clear site data → reload →
import the file → confirm everything is back.
