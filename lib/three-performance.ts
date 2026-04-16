import { RoomDimensions } from '@/types/room'

export interface PerformanceSample {
  timestampMs: number
  fps: number
  frameTimeMs: number
  drawCalls: number
  triangles: number
  geometries: number
  textures: number
  jsHeapUsedMB?: number
  jsHeapLimitMB?: number
}

export interface PerformanceCaptureMetadata {
  route: string
  scenario: string
  performanceLevel: 'low' | 'medium' | 'high'
  sceneLoadTimeMs?: number
  roomDimensions: RoomDimensions
  furnitureCount: number
  devicePixelRatio: number
  userAgent: string
  webglVersion: string
  renderer: string
  vendor: string
}

export interface PerformanceCaptureRequest {
  id: string
  scenario: string
  durationMs: number
  sceneLoadTimeMs?: number
  sampleIntervalMs?: number
  orbitRadius?: number
  orbitHeight?: number
  orbitSpeed?: number
}

export interface PerformanceCaptureReport {
  captureId: string
  capturedAt: string
  durationMs: number
  frameCount: number
  sampleCount: number
  averageFps: number
  minFps: number
  p5Fps: number
  maxFps: number
  averageFrameTimeMs: number
  p95FrameTimeMs: number
  maxFrameTimeMs: number
  renderer: {
    averageDrawCalls: number
    maxDrawCalls: number
    averageTriangles: number
    maxTriangles: number
    maxGeometries: number
    maxTextures: number
  }
  jsHeap: {
    startUsedMB?: number
    endUsedMB?: number
    maxUsedMB?: number
    limitMB?: number
  }
  metadata: PerformanceCaptureMetadata
  samples: PerformanceSample[]
}

interface BuildPerformanceReportInput {
  captureId: string
  durationMs: number
  frameCount: number
  samples: PerformanceSample[]
  metadata: PerformanceCaptureMetadata
  capturedAt?: string
}

const roundMetric = (value: number | undefined, digits = 2) => {
  if (value === undefined || Number.isNaN(value)) {
    return undefined
  }

  return Number(value.toFixed(digits))
}

export const calculatePercentile = (values: number[], percentile: number) => {
  if (values.length === 0) {
    return 0
  }

  const sortedValues = [...values].sort((a, b) => a - b)
  const boundedPercentile = Math.min(100, Math.max(0, percentile))
  const index = Math.ceil((boundedPercentile / 100) * sortedValues.length) - 1

  return sortedValues[Math.max(0, index)]
}

export const buildPerformanceReport = ({
  captureId,
  durationMs,
  frameCount,
  samples,
  metadata,
  capturedAt = new Date().toISOString()
}: BuildPerformanceReportInput): PerformanceCaptureReport => {
  const fpsValues = samples.map((sample) => sample.fps)
  const frameTimes = samples.map((sample) => sample.frameTimeMs)
  const drawCalls = samples.map((sample) => sample.drawCalls)
  const triangles = samples.map((sample) => sample.triangles)
  const geometries = samples.map((sample) => sample.geometries)
  const textures = samples.map((sample) => sample.textures)
  const heapValues = samples
    .map((sample) => sample.jsHeapUsedMB)
    .filter((value): value is number => typeof value === 'number')
  const heapLimits = samples
    .map((sample) => sample.jsHeapLimitMB)
    .filter((value): value is number => typeof value === 'number')

  const average = (values: number[]) => {
    if (values.length === 0) {
      return 0
    }

    return values.reduce((total, value) => total + value, 0) / values.length
  }

  return {
    captureId,
    capturedAt,
    durationMs,
    frameCount,
    sampleCount: samples.length,
    averageFps: roundMetric(average(fpsValues)) ?? 0,
    minFps: roundMetric(Math.min(...fpsValues)) ?? 0,
    p5Fps: roundMetric(calculatePercentile(fpsValues, 5)) ?? 0,
    maxFps: roundMetric(Math.max(...fpsValues)) ?? 0,
    averageFrameTimeMs: roundMetric(average(frameTimes)) ?? 0,
    p95FrameTimeMs: roundMetric(calculatePercentile(frameTimes, 95)) ?? 0,
    maxFrameTimeMs: roundMetric(Math.max(...frameTimes)) ?? 0,
    renderer: {
      averageDrawCalls: roundMetric(average(drawCalls)) ?? 0,
      maxDrawCalls: roundMetric(Math.max(...drawCalls), 0) ?? 0,
      averageTriangles: roundMetric(average(triangles), 0) ?? 0,
      maxTriangles: roundMetric(Math.max(...triangles), 0) ?? 0,
      maxGeometries: roundMetric(Math.max(...geometries), 0) ?? 0,
      maxTextures: roundMetric(Math.max(...textures), 0) ?? 0
    },
    jsHeap: {
      startUsedMB: roundMetric(heapValues[0]),
      endUsedMB: roundMetric(heapValues[heapValues.length - 1]),
      maxUsedMB: roundMetric(heapValues.length > 0 ? Math.max(...heapValues) : undefined),
      limitMB: roundMetric(heapLimits.length > 0 ? Math.max(...heapLimits) : undefined)
    },
    metadata,
    samples
  }
}
