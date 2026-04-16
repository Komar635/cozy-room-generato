import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import process from 'node:process'
import { chromium } from '@playwright/test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const baseUrl = process.env.PERF_BASE_URL ?? 'http://127.0.0.1:3100'
const outputDir = path.join(repoRoot, 'docs', 'perf-evidence')
const outputPath = path.join(outputDir, '3d-performance-baseline.json')
const durationMs = Number(process.env.PERF_DURATION_MS ?? '12000')
const serverCommand = process.env.PERF_SERVER_COMMAND ?? 'npm run dev -- --hostname 127.0.0.1 --port 3100'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const isServerReady = async (url) => {
  try {
    const response = await fetch(url, { redirect: 'manual' })
    return response.ok || response.status === 307 || response.status === 308
  } catch {
    return false
  }
}

const waitForServer = async (url, timeoutMs = 120000) => {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    if (await isServerReady(url)) {
      return
    }

    await wait(1000)
  }

  throw new Error(`Timed out waiting for ${url}`)
}

const shell = process.platform === 'win32' ? 'cmd.exe' : 'sh'
const shellArgs = process.platform === 'win32'
  ? ['/d', '/s', '/c', serverCommand]
  : ['-lc', serverCommand]

let serverProcess = null
const shouldStartServer = !(await isServerReady(baseUrl))

if (shouldStartServer) {
  serverProcess = spawn(shell, shellArgs, {
    cwd: repoRoot,
    env: process.env,
    stdio: 'inherit'
  })
}

let browser

try {
  await waitForServer(baseUrl)

  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  await page.goto(`${baseUrl}/room/performance?autorun=1&duration=${durationMs}`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000
  })

  await page.waitForFunction(() => window.__ROOM_3D_PERF_STATUS__ === 'complete', undefined, {
    timeout: durationMs + 20000
  })

  const report = await page.evaluate(() => window.__ROOM_3D_PERF_LAST_REPORT__)

  if (!report) {
    throw new Error('Performance report was not produced by the page.')
  }

  await mkdir(outputDir, { recursive: true })
  await writeFile(outputPath, JSON.stringify(report, null, 2), 'utf8')

  console.log(`Saved 3D performance evidence to ${outputPath}`)
  console.log(`Avg FPS: ${report.averageFps}`)
  console.log(`P95 frame time: ${report.p95FrameTimeMs} ms`)
  console.log(`Max draw calls: ${report.renderer.maxDrawCalls}`)
  console.log(`Max JS heap: ${report.jsHeap.maxUsedMB ?? 'n/a'} MB`)
} finally {
  if (browser) {
    await browser.close()
  }

  if (serverProcess) {
    serverProcess.kill('SIGTERM')
  }
}
