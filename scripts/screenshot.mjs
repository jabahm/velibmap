// Regenerate docs/thumbnail.png from a locally-running dev server.
//
// Prereq once:  pnpm dlx playwright@latest install chromium --no-shell
// Then:         pnpm dev   (in another terminal)
//               pnpm screenshot
//
// Uses Playwright's full Chromium build (not chrome-headless-shell, which
// can't render MapLibre's WebGL canvas).

import { chromium } from 'playwright'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const URL = process.env.URL ?? 'http://localhost:5173/'
const OUT = process.env.OUT ?? 'docs/thumbnail.png'

function findChromium() {
  const cache = join(homedir(), 'Library', 'Caches', 'ms-playwright')
  if (!existsSync(cache)) return null
  const dirs = readdirSync(cache).filter((d) => d.startsWith('chromium-'))
  for (const d of dirs.sort().reverse()) {
    const macX64 = join(
      cache,
      d,
      'chrome-mac-x64',
      'Google Chrome for Testing.app',
      'Contents',
      'MacOS',
      'Google Chrome for Testing',
    )
    if (existsSync(macX64)) return macX64
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
  viewport: { width: 1200, height: 800 },
  deviceScaleFactor: 2,
})
const page = await ctx.newPage()
await page.goto(URL, { waitUntil: 'networkidle' })

// Let the map style + stations render before snapping.
await page.waitForTimeout(4000)
await page.screenshot({ path: OUT, fullPage: false })
await browser.close()
console.log('wrote', OUT)
