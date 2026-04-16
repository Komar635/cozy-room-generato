'use client'

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useRoomStore } from '@/store/room-store'
import {
  PerformanceCaptureRequest,
  PerformanceCaptureReport,
  PerformanceSample,
  buildPerformanceReport
} from '@/lib/three-performance'

interface RoomPerformanceProbeProps {
  capture: PerformanceCaptureRequest | null
  onComplete?: (report: PerformanceCaptureReport) => void
}

type BrowserPerformanceMemory = {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

type ExtendedPerformance = Performance & {
  memory?: BrowserPerformanceMemory
}

export function RoomPerformanceProbe({ capture, onComplete }: RoomPerformanceProbeProps) {
  const { gl, camera } = useThree()
  const { roomDimensions, furniture, performanceLevel } = useRoomStore()
  const activeCaptureIdRef = useRef<string | null>(null)
  const startedAtRef = useRef<number>(0)
  const lastSampleAtRef = useRef<number>(0)
  const frameCountRef = useRef(0)
  const samplesRef = useRef<PerformanceSample[]>([])

  useEffect(() => {
    if (!capture) {
      gl.info.autoReset = true
      activeCaptureIdRef.current = null
      startedAtRef.current = 0
      lastSampleAtRef.current = 0
      frameCountRef.current = 0
      samplesRef.current = []
      return
    }

    if (capture.id === activeCaptureIdRef.current) {
      return
    }

    gl.info.autoReset = false
    gl.info.reset()
    activeCaptureIdRef.current = capture.id
    startedAtRef.current = 0
    lastSampleAtRef.current = 0
    frameCountRef.current = 0
    samplesRef.current = []

    return () => {
      gl.info.autoReset = true
      gl.info.reset()
    }
  }, [capture, gl])

  useFrame((state, delta) => {
    if (!capture || activeCaptureIdRef.current !== capture.id) {
      return
    }

    const now = performance.now()

    if (startedAtRef.current === 0) {
      startedAtRef.current = now
      lastSampleAtRef.current = now
    }

    frameCountRef.current += 1

    const elapsedMs = now - startedAtRef.current
    const orbitRadius = capture.orbitRadius ?? 10
    const orbitHeight = capture.orbitHeight ?? Math.max(roomDimensions.height + 3, 6)
    const orbitSpeed = capture.orbitSpeed ?? 0.55
    const orbitAngle = (elapsedMs / 1000) * orbitSpeed

    camera.position.set(
      Math.cos(orbitAngle) * orbitRadius,
      orbitHeight,
      Math.sin(orbitAngle) * orbitRadius
    )
    camera.lookAt(0, roomDimensions.height / 2, 0)

    const sampleIntervalMs = capture.sampleIntervalMs ?? 250
    if (now - lastSampleAtRef.current >= sampleIntervalMs) {
      const perf = window.performance as ExtendedPerformance
      const heapMemory = perf.memory

      samplesRef.current.push({
        timestampMs: elapsedMs,
        fps: delta > 0 ? 1 / delta : 0,
        frameTimeMs: delta * 1000,
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        jsHeapUsedMB: heapMemory ? heapMemory.usedJSHeapSize / (1024 * 1024) : undefined,
        jsHeapLimitMB: heapMemory ? heapMemory.jsHeapSizeLimit / (1024 * 1024) : undefined
      })

      gl.info.reset()
      lastSampleAtRef.current = now
    }

    if (elapsedMs < capture.durationMs) {
      return
    }

    const context = gl.getContext()
    const debugInfo = context.getExtension('WEBGL_debug_renderer_info')
    const renderer = debugInfo
      ? context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : context.getParameter(context.RENDERER)
    const vendor = debugInfo
      ? context.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      : context.getParameter(context.VENDOR)

    const report = buildPerformanceReport({
      captureId: capture.id,
      durationMs: capture.durationMs,
      frameCount: frameCountRef.current,
      samples: samplesRef.current,
      metadata: {
        route: window.location.pathname,
        scenario: capture.scenario,
        performanceLevel,
        sceneLoadTimeMs: capture.sceneLoadTimeMs,
        roomDimensions,
        furnitureCount: furniture.length,
        devicePixelRatio: window.devicePixelRatio,
        userAgent: navigator.userAgent,
        webglVersion: String(context.getParameter(context.VERSION)),
        renderer: String(renderer),
        vendor: String(vendor)
      }
    })

    activeCaptureIdRef.current = null
    gl.info.autoReset = true
    gl.info.reset()
    startedAtRef.current = 0
    lastSampleAtRef.current = 0
    frameCountRef.current = 0
    samplesRef.current = []
    onComplete?.(report)
  }, 1)

  return null
}
