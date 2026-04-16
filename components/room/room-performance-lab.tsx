'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Scene from '@/components/3d/scene'
import WebGLDiagnostics from '@/components/3d/webgl-diagnostics'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createRoomPerformanceBaselineProject } from '@/lib/fixtures/room-performance-baseline'
import { PerformanceCaptureReport, PerformanceCaptureRequest } from '@/lib/three-performance'
import { useRoomStore } from '@/store/room-store'

declare global {
  interface Window {
    __ROOM_3D_PERF_LAST_REPORT__?: PerformanceCaptureReport
    __ROOM_3D_PERF_STATUS__?: 'idle' | 'ready' | 'running' | 'complete'
  }
}

const BASELINE_CAPTURE_MS = 12000

const formatMetric = (value: number | undefined, suffix = '') => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'n/a'
  }

  return `${value.toFixed(2)}${suffix}`
}

export default function RoomPerformanceLab() {
  const searchParams = useSearchParams()
  const loadProject = useRoomStore((state) => state.loadProject)
  const performanceLevel = useRoomStore((state) => state.performanceLevel)
  const roomDimensions = useRoomStore((state) => state.roomDimensions)
  const furniture = useRoomStore((state) => state.furniture)
  const [sceneReady, setSceneReady] = useState(false)
  const [sceneLoadTimeMs, setSceneLoadTimeMs] = useState<number | null>(null)
  const [report, setReport] = useState<PerformanceCaptureReport | null>(null)
  const [capture, setCapture] = useState<PerformanceCaptureRequest | null>(null)

  useEffect(() => {
    loadProject(createRoomPerformanceBaselineProject())
  }, [loadProject])

  useEffect(() => {
    window.__ROOM_3D_PERF_STATUS__ = sceneReady ? 'ready' : 'idle'
  }, [sceneReady])

  const durationMs = useMemo(() => {
    const rawDuration = searchParams.get('duration')
    const parsedDuration = rawDuration ? Number(rawDuration) : BASELINE_CAPTURE_MS
    return Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : BASELINE_CAPTURE_MS
  }, [searchParams])

  const startCapture = useCallback(() => {
    setReport(null)
    window.__ROOM_3D_PERF_STATUS__ = 'running'
    setCapture({
      id: `baseline-${Date.now()}`,
      scenario: 'baseline-orbit',
      durationMs,
      sceneLoadTimeMs: sceneLoadTimeMs ?? undefined,
      sampleIntervalMs: 250,
      orbitRadius: 10,
      orbitHeight: Math.max(roomDimensions.height + 3, 6),
      orbitSpeed: 0.55
    })
  }, [durationMs, roomDimensions.height, sceneLoadTimeMs])

  useEffect(() => {
    const shouldAutorun = searchParams.get('autorun') === '1'

    if (!shouldAutorun || !sceneReady || capture || report) {
      return
    }

    const timer = window.setTimeout(() => {
      startCapture()
    }, 400)

    return () => window.clearTimeout(timer)
  }, [capture, report, sceneReady, searchParams, startCapture])

  const handleCaptureComplete = useCallback((nextReport: PerformanceCaptureReport) => {
    setCapture(null)
    setReport(nextReport)
    window.__ROOM_3D_PERF_LAST_REPORT__ = nextReport
    window.__ROOM_3D_PERF_STATUS__ = 'complete'
  }, [])

  const downloadReport = useCallback(() => {
    if (!report) {
      return
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `3d-performance-${report.captureId}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [report])

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Badge variant="outline" className="w-fit border-amber-500/30 bg-amber-500/10 text-amber-700">
              3D performance baseline
            </Badge>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">3D performance lab</h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                Reproducible baseline capture for the main room scene with a fixed fixture and automated camera orbit.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/room">
              <Button variant="outline">Back to room</Button>
            </Link>
            <Button onClick={startCapture} disabled={!sceneReady || Boolean(capture)}>
              {capture ? 'Capture running...' : 'Run baseline capture'}
            </Button>
            <Button variant="outline" onClick={downloadReport} disabled={!report}>
              Download JSON
            </Button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
          <Card className="overflow-hidden border-border/70 bg-card/90 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.95)]">
            <CardHeader className="pb-3">
              <CardTitle>Main scenario canvas</CardTitle>
              <CardDescription>
                Fixture: {roomDimensions.width}m x {roomDimensions.depth}m x {roomDimensions.height}m, {furniture.length} items, {durationMs / 1000}s orbit.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[540px] min-h-[420px] w-full overflow-hidden border-t border-border/60 bg-muted/20">
                <Scene
                  onLoad={() => {
                    setSceneReady(true)
                    setSceneLoadTimeMs((currentValue) => currentValue ?? performance.now())
                  }}
                  className="h-full w-full"
                  performanceCapture={capture}
                  onPerformanceReport={handleCaptureComplete}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Capture setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                  <span>Status</span>
                  <Badge variant="outline">{capture ? 'running' : sceneReady ? 'ready' : 'loading'}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                  <span>Store perf preset</span>
                  <span className="font-medium text-foreground">{performanceLevel}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                  <span>Sampling</span>
                  <span className="font-medium text-foreground">250 ms</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                  <span>Scenario</span>
                  <span className="font-medium text-foreground">baseline-orbit</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                  <span>Scene ready</span>
                  <span className="font-medium text-foreground">{formatMetric(sceneLoadTimeMs ?? undefined, ' ms')}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Latest metrics</CardTitle>
                <CardDescription>Updated after each completed capture.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Avg FPS</div>
                    <div className="mt-1 text-2xl font-semibold">{formatMetric(report?.averageFps)}</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">P95 frame</div>
                    <div className="mt-1 text-2xl font-semibold">{formatMetric(report?.p95FrameTimeMs, ' ms')}</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Max draw calls</div>
                    <div className="mt-1 text-2xl font-semibold">{report?.renderer.maxDrawCalls ?? 'n/a'}</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Max JS heap</div>
                    <div className="mt-1 text-2xl font-semibold">{formatMetric(report?.jsHeap.maxUsedMB, ' MB')}</div>
                  </div>
                </div>

                {report && (
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                    <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Capture details</div>
                    <div className="space-y-1 text-muted-foreground">
                      <p>Frames: {report.frameCount}</p>
                      <p>Samples: {report.sampleCount}</p>
                      <p>Renderer: {report.metadata.renderer}</p>
                      <p>Vendor: {report.metadata.vendor}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <WebGLDiagnostics />
          </div>
        </div>
      </div>
    </main>
  )
}
