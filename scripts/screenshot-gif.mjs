// Capture a scripted demo of VélibMap and assemble into docs/demo.gif.
//
// Prereqs:
//   pnpm dlx playwright@latest install chromium --no-shell
//   pnpm dev   (in another terminal)
//   pnpm add -D pngjs gifenc   (one-time)
//   pnpm screenshot:gif
//
// Pure JS pipeline (no ffmpeg). Encoded with gifenc + 256-color palette.

import { chromium } from 'playwright'
import { PNG } from 'pngjs'
import gifenc from 'gifenc'
const { GIFEncoder, quantize, applyPalette } = gifenc
import { writeFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const URL = process.env.URL ?? 'http://localhost:5173/'
const OUT = process.env.OUT ?? 'docs/demo.gif'

const VIEWPORT = { width: 800, height: 540 }
const FRAME_DELAY_MS = 160 // ~6 fps after 2x downsample
const GIF_COLORS = 96
const FRAME_STRIDE = 2 // keep every Nth captured frame in the final GIF

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

async function captureFor(ms, fps = 10) {
  const interval = Math.round(1000 / fps)
  const start = Number(process.hrtime.bigint() / 1_000_000n)
  while (Number(process.hrtime.bigint() / 1_000_000n) - start < ms) {
    await snap()
    await page.waitForTimeout(interval)
  }
}

console.log('1. initial load')
await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(3500)
await snap()
await snap()

console.log('2. switch to pitched view')
await page.click('button[aria-label="Pitch"]')
await captureFor(1400)

console.log('3. type address')
const input = page.locator('input[placeholder*="Adresse"]').first()
await input.click()
for (const ch of '10 rue de Rivoli') {
  await input.press('End')
  await input.pressSequentially(ch, { delay: 0 })
  await snap()
}
await page.waitForTimeout(1300)
await snap()

console.log('4. pick first suggestion')
await page.evaluate(() => {
  const btn = document.querySelector('aside ul[class*="absolute"] li button')
  btn?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }))
})
await captureFor(1600)

console.log('5. click first nearby station')
const first = page.locator('aside li button').first()
await first.click()
await captureFor(900)

console.log('6. click "Aller à cette station"')
const goBtn = await page.waitForSelector('button:has-text("Aller à cette station")', { timeout: 5000 }).catch(() => null)
if (goBtn) {
  await goBtn.click()
  await captureFor(3500)
} else {
  console.warn('go button not found; capturing extra time anyway')
  await captureFor(2000)
}

await browser.close()

// Drop every Nth frame to halve the GIF size at the cost of frame rate.
const kept = frames.filter((_, i) => i % FRAME_STRIDE === 0)
console.log(`captured ${frames.length} frames; keeping ${kept.length}; encoding GIF…`)

// Decode all frames up front so we can build a single global palette.
const decoded = kept.map((buf) => PNG.sync.read(buf))
const { width, height } = decoded[0]
const concat = Buffer.concat(decoded.map((d) => d.data))
const palette = quantize(concat, GIF_COLORS)

const gif = GIFEncoder()
for (let i = 0; i < decoded.length; i++) {
  const index = applyPalette(decoded[i].data, palette)
  // Only pass the palette on the first frame — gifenc writes it as the global
  // color table and subsequent frames reuse it (much smaller output).
  gif.writeFrame(index, width, height, {
    palette: i === 0 ? palette : undefined,
    delay: FRAME_DELAY_MS,
  })
}
gif.finish()
writeFileSync(OUT, gif.bytes())
console.log(`wrote ${OUT} (${(gif.bytes().length / 1024).toFixed(0)} KB)`)
