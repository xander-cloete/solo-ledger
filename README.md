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
react-router · vite-plugin-pwa.

## Where your data lives

Everything is stored in IndexedDB under the database name `solo-ledger`. Inspect it in your
browser: **DevTools → Application → IndexedDB → solo-ledger**. Clearing site data wipes it,
so the in-app Export/Import backup (Phase 6) is how you keep it safe.
