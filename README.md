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
react-router · Recharts (dashboard charts) · Framer Motion (animation) · self-hosted
variable fonts (@fontsource Fraunces + Hanken Grotesk) · Zod (backup validation) ·
vite-plugin-pwa.

## Where your data lives

Everything is stored in IndexedDB under the database name `solo-ledger`. Inspect it in your
browser: **DevTools → Application → IndexedDB → solo-ledger**. Clearing site data wipes it,
so the in-app Export/Import backup is how you keep it safe.

## Themes

The **Customize** page has a theme switcher. Themes are being re-thought as concept-driven
**"worlds"** — each its own personality (type pairing, texture, a signature ornament, and living
micro-animation), not just a recoloured palette. **Japandi** is the new default and first finished
world: warm-oat *washi*-paper texture with a soft "light through shoji" glow, a hand-brushed *ensō*
that ripples like ink in water on the Dashboard, a vermilion *hanko* seal as the app mark, and
gamification glyphs that live (the level plant sways, the streak flame flickers).

Finished worlds so far, each with its own backdrop, Dashboard signature, app mark, and **page-header
voice** (a bespoke heading style + title rule): **Japandi** (brushed ink), **Cyberpunk Noir** (a
rain-slick neon street — scanlines, a chromatically-split neon ring, a glowing-sign heading + HUD
rule), **Anime / Manga** (a cozy-retro panel inspired by the *gruvu* "girl at the computer" wallpaper —
warm dim room, CRT/lamp glow, the Dashboard hero framed like a black-keyline manga panel, radiating
focus-lines, kira-kira sparkles, a red speech-pop mark, an italic "mis-registered ink" heading +
colour speed-line rule), **Art Deco** (gold on midnight ink — a sunburst fan, a stepped gilt emblem,
uppercase gilt headings + an engraved diamond rule), **Neoclassical** (gold on marble — a gilt laurel
wreath, a medallion mark, engraved serif headings + a Greek-key meander rule), **Pixel Art** (a PC-98
dusk — checkerboard dither, a blocky pixel torii + blinking stars, a pixel-¥ coin, chunky uppercase
headings + a dithered pixel-block rule), **Conceptual Sketch** (graphite on graph paper — a roughed-in
construction circle with dimension marks, a hand-drawn badge, a doubled pencil underline + a red
correction tick), **Bauhaus** (red/yellow/blue + black — the circle/triangle/square trio with a
turning yellow triangle, a geometric mark, lowercase headings + a shapes rule), **Mixed Media** (kraft
collage — a torn-paper + washi-tape + rubber-stamp cluster, a taped tag mark, a mis-printed serif
heading + a tape-strip rule), and **Utilitarian** (Swiss-industrial — a print registration target, a
stamped label mark, all-caps spec headings + a dimension-line rule), **Terminal** (a CRT — green
scanlines + phosphor bloom + tube vignette, an oscilloscope trace with a sweeping beam, a phosphor
prompt mark with a blinking cursor, a `>` command-prompt heading + ASCII rule), and **Tokyo Night** (a
deep night sky — stars + a horizon city-glow, a glowing crescent moon with twinkling stars, a
gradient-¥ mark, a blue→violet skyline-gradient heading + a city-lights rule), **Clean** (airy
editorial — a sunlit paper wash, a swaying botanical sprig, a sage ring mark, a refined serif heading
+ a hairline-and-dot rule), and **Catppuccin Latte** (soft pastel bokeh — a breathing sleeping cat, a
mauve badge with cat ears, a mauve-tinted serif heading + a pastel-dots rule). Every shipped theme is
now a full world.

Each theme is a block of CSS variables in `src/index.css` plus an entry in `src/theme/themes.ts`;
per-theme decoration lives in `src/components/ThemeSignature.tsx` (Dashboard signature) and
`BrandMark.tsx` (app mark), while each world's **page-header treatment** is a branch in the
`BrushStroke` rule (`src/components/ui.tsx`) plus a `[data-theme='…'] .page-title` block in
`index.css`. The overall look is editorial and typography-led (think Kinfolk / Papier / Apple) with
subtle, unobtrusive motion that **always respects reduce-motion** (OS setting or the in-app toggle).
Shared design primitives (eyebrow labels, page headers, the brush-stroke + ink-rule motifs,
hover-lift cards) live in `src/components/ui.tsx`.

## Progress (gamification)

The Dashboard shows a quiet **Your progress** card with three gentle motivators, all derived
from your real figures (nothing extra is stored):

- **Level** — a garden that grows with your net worth (🌱 Seedling up to 👑 Magnate), with a bar
  showing progress to the next tier.
- **Savings streak** — how many completed months in a row you've finished without overspending.
- **This month** — how much of this month's income your expenses have used, and whether you're
  on track.

Don't want it? Switch it off under **Customize → Progress & achievements** for a plain dashboard.

## Motion

The app uses small, calm **Framer Motion** touches: pages cross-fade as you navigate,
Dashboard cards ease in, and key figures (net worth, your rolling balance) count up
smoothly when they change. Nothing bounces or demands attention.

Prefer it still? Two ways to calm it down: your device's system **"reduce motion"**
accessibility setting is always respected, and there's a **Customize → Motion → Reduce
motion** switch to turn movement off in-app regardless of the OS setting.

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
