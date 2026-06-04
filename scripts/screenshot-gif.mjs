// Capture a scripted demo of VélibMap and assemble into docs/demo.gif.
//
// Prereqs:
//   pnpm dlx playwright@latest install chromium --no-shell
//   pnpm dev   (in another terminal)
//   pnpm add -D pngjs gifenc   (one-time)
//   pnpm screenshot:gif
//
// Capture strategy: we pre-setup the app state silently (type address, pick
// the closest station, popup open) BEFORE starting to record. The GIF then
// only contains the interesting bit: pitch toggle, "Aller à cette station"
// click, and the OSRM walking route rendering. Slower delay (200 ms / 5 fps)
// makes each step easy to read while keeping the file small.

import { chromium } from 'playwright'
import { PNG } from 'pngjs'
import gifenc from 'gifenc'
import { writeFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const { GIFEncoder, quantize, applyPalette } = gifenc

const URL = process.env.URL ?? 'http://localhost:5173/'
const OUT = process.env.OUT ?? 'docs/demo.gif'

const VIEWPORT = { width: 720, height: 480 }
const FRAME_DELAY_MS = 200 // 5 fps
const GIF_COLORS = 96

function findChromium() {
  const cache = join(homedir(), 'Library', 'Caches', 'ms-playwright')
  if (!existsSync(cache)) return null
  const dirs = readdirSync(cache).filter((d) => d.startsWith('chromium-'))
  for (const d of dirs.sort().reverse()) {
    const exe = join(
      cache,
      d,
      'chrome-mac-x64',
      'Google Chrome for Testing.app',
      'Contents',
      'MacOS',
      'Google Chrome for Testing',
    )
    if (existsSync(exe)) return exe
  }
  return null
}

const exe = findChromium()
if (!exe) {
  console.error('Full Chromium not found. Run: pnpm dlx playwright@latest install chromium --no-shell')
  process.exit(1)
}

const browser = await chromium.launch({
  executablePath: exe,
  headless: true,
  args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'],
})
const ctx = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 1,
})
const page = await ctx.newPage()

const frames = []
async function snap() {
  const buf = await page.screenshot({ type: 'png' })
  frames.push(buf)
}
async function captureFor(ms, fps = 5) {
  const interval = Math.round(1000 / fps)
  const start = Number(process.hrtime.bigint() / 1_000_000n)
  while (Number(process.hrtime.bigint() / 1_000_000n) - start < ms) {
    await snap()
    await page.waitForTimeout(interval)
  }
}

console.log('pre-setup (silent): load app')
await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(3500)

console.log('pre-setup (silent): fill address')
const input = page.locator('input[placeholder*="Adresse"]').first()
await input.click()
await input.pressSequentially('10 rue de Rivoli', { delay: 10 })
await page.waitForTimeout(1300)

console.log('pre-setup (silent): pick suggestion')
await page.evaluate(() => {
  const btn = document.querySelector('aside ul[class*="absolute"] li button')
  btn?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }))
})
await page.waitForTimeout(1500)

console.log('pre-setup (silent): click nearest station to open popup')
await page.locator('aside li button').first().click()
await page.waitForTimeout(1100)

console.log('--- START CAPTURE ---')
console.log('1. hold initial popup state')
await snap()
await snap()
await snap()
await snap()

console.log('2. toggle pitched 3D view')
await page.click('button[aria-label="Pitch"]')
await captureFor(1800, 5)

console.log('3. click "Aller à cette station"')
const goBtn = await page
  .waitForSelector('button:has-text("Aller à cette station")', { timeout: 5000 })
  .catch(() => null)
if (goBtn) {
  await goBtn.click()
  await captureFor(3800, 5)
}

console.log('4. hold final route state')
await snap()
await snap()
await snap()
await snap()

await browser.close()
console.log(`captured ${frames.length} frames; encoding GIF…`)

const decoded = frames.map((buf) => PNG.sync.read(buf))
const { width, height } = decoded[0]
const concat = Buffer.concat(decoded.map((d) => d.data))
const palette = quantize(concat, GIF_COLORS)

const gif = GIFEncoder()
for (let i = 0; i < decoded.length; i++) {
  const index = applyPalette(decoded[i].data, palette)
  gif.writeFrame(index, width, height, {
    palette: i === 0 ? palette : undefined,
    delay: FRAME_DELAY_MS,
  })
}
gif.finish()
writeFileSync(OUT, gif.bytes())
console.log(`wrote ${OUT} (${(gif.bytes().length / 1024).toFixed(0)} KB)`)
