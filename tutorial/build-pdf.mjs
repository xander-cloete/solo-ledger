// Renders guide.html into a print-ready PDF using your installed Chrome.
// Run after capture.mjs has produced the screenshots:  node tutorial/build-pdf.mjs

import puppeteer from 'puppeteer-core'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const CHROME = '/usr/bin/google-chrome-stable'
const htmlPath = join(HERE, 'guide.html')
const out = join(HERE, 'Solo-Ledger-User-Guide.pdf')

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--force-color-profile=srgb'],
})
const page = await browser.newPage()
// file:// so the <img src="shots/…"> paths resolve from disk.
await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' })
// Give the web fonts a moment to load so headings render as Fraunces.
await page.evaluateHandle('document.fonts.ready')
await new Promise((r) => setTimeout(r, 600))

await page.pdf({
  path: out,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
})

await browser.close()
console.log(`done — ${out}`)
