// Captures the dashboard in every theme — a visual gallery for social posts.
// Seeds the same demo data once, then for each theme: writes it as the active
// theme, reloads (so the hero ornament + brand mark re-render for that world),
// and screenshots. Run with the dev server up:  node tutorial/gallery.mjs

import puppeteer from 'puppeteer-core'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync } from 'node:fs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, 'shots', 'themes')
mkdirSync(OUT, { recursive: true })
const CHROME = '/usr/bin/google-chrome-stable'
const BASE = 'http://localhost:5173'

// id → filename-friendly label, in a pleasing display order.
const THEMES = [
  'japandi', 'tokyo-night', 'cyberpunk', 'manga', 'art-deco', 'neoclassical',
  'pixel', 'terminal', 'catppuccin-latte', 'clean', 'sketch', 'bauhaus',
  'mixed-media', 'utilitarian',
]

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
      put('portfolios', { id: 'p1', name: 'Index fund (S&P 500)', initialDate: '2026-01-15', initialAmount: 15000, assumedAnnualRate: 9, monthlyContribution: 1500 })
      put('portfolios', { id: 'p2', name: 'Emergency savings', initialDate: '2026-01-10', initialAmount: 6000, assumedAnnualRate: 5, monthlyContribution: 500 })
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

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--force-color-profile=srgb', '--hide-scrollbars'] })
const page = await browser.newPage()
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 })

console.log('· opening app + seeding…')
await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
await page.waitForFunction(() => document.body.innerText.includes('Solo Ledger'), { timeout: 15000 })
await page.evaluate(seedData)

for (const id of THEMES) {
  await page.evaluate(setTheme, id)
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => document.body.innerText.includes('NET WORTH') || document.body.innerText.includes('Net worth'), { timeout: 15000 }).catch(() => {})
  await wait(1300)
  await page.screenshot({ path: join(OUT, `${id}.png`) }) // viewport-only, consistent framing
  console.log(`· ${id}.png`)
}

await browser.close()
console.log('done — gallery in tutorial/shots/themes/')
