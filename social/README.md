# Solo Ledger — Social Launch Kit

Two ready-to-run campaigns, tailored per platform:

- [`linkedin-campaign.md`](linkedin-campaign.md) — professional, build-in-public, career-building. Longer copy, fewer hashtags, networking-first.
- [`instagram-campaign.md`](instagram-campaign.md) — visual-first, aesthetic-led. Carousels, Reels, Stories, punchy captions.

## Status: live & open source ✅

- **Live app:** https://solo-ledger-finance.netlify.app (auto-deploys from `main`).
- **Code:** public on GitHub under the MIT license — free to use, share and build on.
- The campaigns already use the real link; "link in bio" → set that URL in your IG bio.

## Visual assets you already have

- `tutorial/shots/*.png` — clean screenshots of every screen (Dashboard, Income,
  Expenses, Investments, Customize, Settings) in the default theme.
- `tutorial/Solo-Ledger-User-Guide.pdf` — the 8-page guide (great for a LinkedIn
  document post — LinkedIn renders PDFs as swipeable carousels natively).

### Want a theme gallery / Reel?
The strongest Instagram visual is the 14 themes. Ask me to generate a multi-theme
screenshot set (one dashboard per theme) or a short theme-switching screen recording,
and I'll script it the same way `tutorial/capture.mjs` works.

## What the app actually is (your source of truth for copy)

- A **private, offline-first personal-finance app** (installable PWA).
- **All data lives on the device** (in-browser, IndexedDB) — no account, no server,
  no tracking. Backup/restore via a file.
- **Rolling monthly ledger** (last month's leftover carries forward), **net-worth
  tracking** (cash + investments) with a 12-month chart.
- **Income streams**, **three expense types** (monthly / yearly / one-off) + itemising,
  **investment portfolios that separate real growth from deposits**, **yearly-bill
  reminders**, and a quiet **gamification** layer (level, saving streak, budget).
- **14 full theme "worlds"** — each with its own palette, animated backdrop, dashboard
  ornament and typographic voice.
- Built with **React 19 + TypeScript + Vite + Tailwind + Dexie + Framer Motion**,
  as a **first-year CS student**, paired with **Claude Code**.
