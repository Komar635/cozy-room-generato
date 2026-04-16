'use client'

import { forwardRef, useImperativeHandle, useRef } from 'react'
import RoomCanvas from './room-canvas'
import { PerformanceCaptureReport, PerformanceCaptureRequest } from '@/lib/three-performance'
import { FurnitureItem, Vector3 } from '@/types/room'

interface SceneProps {
  onItemSelect?: (item: FurnitureItem | null) => void
  onItemMove?: (itemId: string, position: Vector3) => void
  onLoad?: () => void
  className?: string
  performanceCapture?: PerformanceCaptureRequest | null
  onPerformanceReport?: (report: PerformanceCaptureReport) => void
}

export interface SceneRef {
  captureImage?: () => string | null
}

const Scene = forwardRef<SceneRef, SceneProps>(function Scene({ 
  onItemSelect, 
  onItemMove,
  onLoad,
  className = "w-full h-full min-h-[400px]",
  performanceCapture,
  onPerformanceReport
}, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useImperativeHandle(ref, () => ({
    captureImage: () => {
      const canvas = canvasRef.current || document.querySelector('canvas') as HTMLCanvasElement
      if (canvas) {
        try {
          return canvas.toDataURL('image/png', 1.0)
        } catch {
          return null
        }
      }
      return null
    }
  }), [])

  return (
    <div className={className} style={{ minHeight: '400px' }}>
      <RoomCanvas 
        onItemSelect={onItemSelect}
        onItemMove={onItemMove}
        onLoad={onLoad}
        className="w-full h-full"
        captureRef={canvasRef}
        performanceCapture={performanceCapture}
        onPerformanceReport={onPerformanceReport}
      />
    </div>
  )
})

export default Scene
