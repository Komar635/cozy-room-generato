import { buildPerformanceReport, calculatePercentile } from '@/lib/three-performance'

describe('three performance reporting', () => {
  test('calculates percentiles from ordered values', () => {
    expect(calculatePercentile([50, 60, 45, 55], 5)).toBe(45)
    expect(calculatePercentile([50, 60, 45, 55], 95)).toBe(60)
  })

  test('builds aggregated performance report', () => {
    const report = buildPerformanceReport({
      captureId: 'baseline-1',
      durationMs: 12000,
      frameCount: 720,
      capturedAt: '2026-04-16T12:00:00.000Z',
      metadata: {
        route: '/room/performance',
        scenario: 'baseline-orbit',
        performanceLevel: 'high',
        sceneLoadTimeMs: 540,
        roomDimensions: { width: 6, height: 3, depth: 5 },
        furnitureCount: 10,
        devicePixelRatio: 1,
        userAgent: 'jest',
        webglVersion: 'WebGL 1.0',
        renderer: 'Test Renderer',
        vendor: 'Test Vendor'
      },
      samples: [
        {
          timestampMs: 250,
          fps: 60,
          frameTimeMs: 16.67,
          drawCalls: 14,
          triangles: 320,
          geometries: 24,
          textures: 1,
          jsHeapUsedMB: 20,
          jsHeapLimitMB: 2048
        },
        {
          timestampMs: 500,
          fps: 58,
          frameTimeMs: 17.24,
          drawCalls: 16,
          triangles: 340,
          geometries: 24,
          textures: 1,
          jsHeapUsedMB: 21,
          jsHeapLimitMB: 2048
        },
        {
          timestampMs: 750,
          fps: 55,
          frameTimeMs: 18.18,
          drawCalls: 15,
          triangles: 330,
          geometries: 25,
          textures: 2,
          jsHeapUsedMB: 22,
          jsHeapLimitMB: 2048
        }
      ]
    })

    expect(report.averageFps).toBeCloseTo(57.67, 2)
    expect(report.minFps).toBe(55)
    expect(report.p95FrameTimeMs).toBe(18.18)
    expect(report.renderer.maxDrawCalls).toBe(16)
    expect(report.renderer.maxTriangles).toBe(340)
    expect(report.jsHeap.maxUsedMB).toBe(22)
  })
})
