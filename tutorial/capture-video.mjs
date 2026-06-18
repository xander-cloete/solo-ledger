// Captures an "authentic phone recording" of the app: a 9:16 mobile viewport that
// scrolls through each theme's dashboard. Writes numbered frames; build-video.mjs
// (or the ffmpeg call printed at the end) encodes them to MP4.
//
// Run with the dev server up:  node tutorial/capture-video.mjs

import puppeteer from 'puppeteer-core'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync, rmSync } from 'node:fs'

const HERE = dirname(fileURLToPath(import.meta.url))
const FRAMES = join(HERE, 'shots', 'video')
rmSync(FRAMES, { recursive: true, force: true })
mkdirSync(FRAMES, { recursive: true })
const CHROME = '/usr/bin/google-chrome-stable'
const BASE = 'http://localhost:5173'

const THEMES = [
  'japandi', 'tokyo-night', 'cyberpunk', 'manga', 'art-deco', 'neoclassical',
  'pixel', 'terminal', 'catppuccin-latte', 'clean', 'sketch', 'bauhaus',
  'mixed-media', 'utilitarian',
]

// (same seed as gallery.mjs)
function seedData() {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('solo-ledger')
    open.onerror = () => reject(open.error)
    open.onsuccess = () => {
      const db = open.result
      const stores = ['settings', 'incomeStreams', 'incomeEntries', 'expenses', 'expenseItems', 'portfolios', 'portfolioBalances', 'transactions', 'monthState']
      const tx = db.transaction(stores, 'readwrite')
      const put = (s, rec) => tx.objectStore(s).put(rec)
      stores.forEach((s) => tx.objectStore(s).clear())
      put('settings', { id: 'app', currency: 'NAD', currencySymbol: 'N$', startingBalance: 8500, ledgerStartMonth: '2026-01', activeTheme: 'japandi', notifications: { yearlyThreeMonths: true, yearlyOneMonth: true }, gamification: true, reduceMotion: false })
      put('incomeStreams', { id: 's1', name: 'Freelance design', defaultAmount: 9000, active: true })
      put('incomeStreams', { id: 's2', name: 'Tutoring', defaultAmount: 2500, active: true })
      const months = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06']
      const s1 = [8200, 9000, 7600, 10500, 9800, 11200]
      const s2 = [2500, 2500, 0, 2500, 3000, 2500]
      months.forEach((m, i) => { put('incomeEntries', { id: `e1-${m}`, streamId: 's1', month: m, amount: s1[i] }); if (s2[i] > 0) put('incomeEntries', { id: `e2-${m}`, streamId: 's2', month: m, amount: s2[i] }) })
      put('expenses', { id: 'x1', name: 'Rent', type: 'monthlyFixed', amount: 4200, term: null, startMonth: '2026-01', hasItems: false })
      put('expenses', { id: 'x2', name: 'Groceries', type: 'monthlyFixed', amount: 2800, term: null, startMonth: '2026-01', hasItems: false })
      put('expenses', { id: 'x3', name: 'Phone & internet', type: 'monthlyFixed', amount: 650, term: null, startMonth: '2026-01', hasItems: false })
      put('expenses', { id: 'x4', name: 'Car insurance', type: 'yearly', amount: 6000, dueDate: '2026-09-01', startMonth: '2026-01', hasItems: false })
      put('expenses', { id: 'x5', name: 'New laptop', type: 'oneOff', amount: 14500, startMonth: '2026-04', hasItems: false })
      put('portfolios', { id: 'p1', name: 'Index fund (S&P 500)', initialDate: '2026-01-15', initialAmount: 15000 })
      put('portfolios', { id: 'p2', name: 'Emergency savings', initialDate: '2026-01-10', initialAmount: 6000 })
      const bal = [['p1', '2026-01-31', 15200], ['p1', '2026-02-28', 15800], ['p1', '2026-03-31', 15400], ['p1', '2026-04-30', 16600], ['p1', '2026-05-31', 17300], ['p1', '2026-06-15', 18250], ['p2', '2026-01-31', 6000], ['p2', '2026-03-31', 6500], ['p2', '2026-06-15', 7200]]
      bal.forEach(([pid, date, balance], i) => put('portfolioBalances', { id: `b${i}`, portfolioId: pid, date, balance }))
      tx.oncomplete = () => { db.close(); resolve(true) }
      tx.onerror = () => reject(tx.error)
    }
  })
}
function setTheme(id) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('solo-ledger')
    open.onerror = () => reject(open.error)
    open.onsuccess = () => {
      const db = open.result
      const tx = db.transaction('settings', 'readwrite')
      const store = tx.objectStore('settings')
      const get = store.get('app')
      get.onsuccess = () => { const s = get.result; s.activeTheme = id; store.put(s) }
      tx.oncomplete = () => { db.close(); resolve(true) }
      tx.onerror = () => reject(tx.error)
    }
  })
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
let n = 0
const pad = (i) => String(i).padStart(4, '0')

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--force-color-profile=srgb', '--hide-scrollbars'] })
const page = await browser.newPage()
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
// 432x768 CSS px (< 768 => the app's mobile layout) at 2.5x => crisp 1080x1920 (9:16).
await page.setViewport({ width: 432, height: 768, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true })

const shot = async () => { await page.screenshot({ path: join(FRAMES, `frame-${pad(n++)}.png`) }) }

console.log('· opening app + seeding…')
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
// In the mobile layout the sidebar wordmark is hidden; the bottom nav shows "Dashboard".
await page.waitForFunction(() => document.body.innerText.includes('Dashboard'), { timeout: 15000 })
await page.evaluate(seedData)

const HOLD_TOP = 7      // frames paused at the top (lets the eye land)
const SCROLL_STEPS = 26 // frames of downward scroll
const HOLD_BOTTOM = 4   // frames paused at the bottom

for (const id of THEMES) {
  await page.evaluate(setTheme, id)
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => document.body.innerText.includes('NET WORTH') || document.body.innerText.includes('Net worth'), { timeout: 15000 }).catch(() => {})
  await wait(1100)

  const maxScroll = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - window.innerHeight))
  await page.evaluate(() => window.scrollTo(0, 0))
  await wait(120)
  for (let i = 0; i < HOLD_TOP; i++) await shot()
  for (let i = 1; i <= SCROLL_STEPS; i++) {
    // ease-in-out so the scroll starts and stops gently, like a thumb flick settling
    const t = i / SCROLL_STEPS
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(maxScroll * eased))
    await wait(35)
    await shot()
  }
  for (let i = 0; i < HOLD_BOTTOM; i++) await shot()
  console.log(`· ${id} (${n} frames so far)`)
}

await browser.close()
console.log(`done — ${n} frames in tutorial/shots/video/`)
console.log('Encode with:\n  ffmpeg -y -framerate 30 -i tutorial/shots/video/frame-%04d.png \\\n    -c:v libx264 -pix_fmt yuv420p -movflags +faststart tutorial/solo-ledger-reel.mp4')
