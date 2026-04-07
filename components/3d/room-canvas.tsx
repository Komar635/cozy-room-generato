'use client'

import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, Environment, PerspectiveCamera } from '@react-three/drei'
import { Suspense, useEffect, useRef, useState, MutableRefObject, useMemo } from 'react'
import { useRoomStore } from '@/store/room-store'
import { FurnitureItem, Vector3 } from '@/types/room'
import { getOptimalCameraPosition, getDevicePerformanceLevel, getQualitySettings, RENDER_PRESETS } from '@/lib/three-utils'
import { FurnitureManager } from './furniture-manager'
import { DropZone } from './drop-zone'
import { LoadingSpinner } from '@/components/ui/loading'
import * as THREE from 'three'

interface RoomCanvasProps {
  onItemSelect?: (item: FurnitureItem | null) => void
  onItemMove?: (itemId: string, position: Vector3) => void
  onLoad?: () => void
  className?: string
  captureRef?: React.RefObject<HTMLCanvasElement | null>
}

function Room() {
  const { roomDimensions, wallColor, floorColor } = useRoomStore()
  const { width, height, depth } = roomDimensions

  return (
    <group>
      <mesh 
        position={[0, 0, 0]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial 
          color={floorColor}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      <group>
        <mesh position={[0, height / 2, -depth / 2]}>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial 
            color={wallColor}
            transparent 
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        <mesh position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[depth, height]} />
          <meshStandardMaterial 
            color={wallColor}
            transparent 
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        <mesh position={[width / 2, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[depth, height]} />
          <meshStandardMaterial 
            color={wallColor}
            transparent 
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      
      <mesh 
        position={[0, height, 0]} 
        rotation={[Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial 
          color="#f8f8f8" 
          transparent 
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshBasicMaterial 
          color="#cccccc" 
          wireframe 
          transparent 
          opacity={0.3}
        />
      </mesh>
    </group>
  )
}

function CameraController() {
  const { roomDimensions } = useRoomStore()
  
  return (
    <OrbitControls
      makeDefault
      enableDamping={true}
      dampingFactor={0.05}
      minDistance={2}
      maxDistance={50}
      maxPolarAngle={Math.PI / 2 - 0.1}
      target={[0, roomDimensions.height / 2, 0]}
      enableZoom={true}
      enableRotate={true}
      enablePan={true}
      zoomSpeed={1.0}
      rotateSpeed={1.0}
      panSpeed={1.0}
    />
  )
}

function SceneLighting() {
  const { performanceLevel } = useRoomStore()
  
  const lightConfig = useMemo(() => {
    switch (performanceLevel) {
      case 'low':
        return { ambient: 0.8, directional: 0.6, point: 0 }
      case 'medium':
        return { ambient: 0.6, directional: 0.8, point: 0.3 }
      case 'high':
      default:
        return { ambient: 0.6, directional: 0.8, point: 0.3 }
    }
  }, [performanceLevel])

  return (
    <>
      <ambientLight intensity={lightConfig.ambient} color="#ffffff" />
      
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={lightConfig.directional}
        color="#ffffff"
        castShadow={performanceLevel !== 'low'}
        shadow-mapSize-width={performanceLevel === 'high' ? 2048 : performanceLevel === 'medium' ? 1024 : 512}
        shadow-mapSize-height={performanceLevel === 'high' ? 2048 : performanceLevel === 'medium' ? 1024 : 512}
      />
      
      {lightConfig.point > 0 && (
        <pointLight 
          position={[0, 5, 0]} 
          intensity={lightConfig.point}
          color="#fff8e1"
        />
      )}
    </>
  )
}

function FloorGrid() {
  const { performanceLevel } = useRoomStore()
  
  if (performanceLevel === 'low') return null
  
  return (
    <Grid 
      args={[20, 20]} 
      position={[0, -0.001, 0]} 
      cellSize={0.5} 
      cellThickness={0.5} 
      cellColor="#e0e0e0" 
      sectionSize={1} 
      sectionThickness={1} 
      sectionColor="#bdbdbd" 
      fadeDistance={15} 
      fadeStrength={1} 
      followCamera={false} 
      infiniteGrid={false}
    />
  )
}

function SceneContent({ onItemSelect, onItemMove, onLoad }: RoomCanvasProps) {
  useEffect(() => {
    if (onLoad) {
      const timer = setTimeout(onLoad, 500)
      return () => clearTimeout(timer)
    }
  }, [onLoad])

  return (
    <>
      <CameraController />
      <SceneLighting />
      <FloorGrid />
      <Room />
      
      <DropZone onItemDrop={(item, position) => {
        if (onItemMove) {
          onItemMove(item.id, position)
        }
      }} />
      
      <FurnitureManager
        onItemSelect={onItemSelect}
        onItemMove={onItemMove}
      />
      
      <Environment preset="apartment" />
    </>
  )
}

function LoadingFallback() {
  return (
    <div className="flex h-full items-center justify-center rounded-2xl bg-muted/30">
      <div className="space-y-4 text-center">
        <LoadingSpinner size="xl" />
        <p className="text-muted-foreground">Загрузка 3D сцены...</p>
      </div>
    </div>
  )
}

function PreloadingOverlay() {
  const { isPreloadingComplete, loadingState } = useRoomStore()
  
  if (isPreloadingComplete) return null
  
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/75 backdrop-blur-sm">
      <div className="space-y-2 text-center">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">{loadingState.message || 'Загрузка...'}</p>
      </div>
    </div>
  )
}

export default function RoomCanvas({ 
  onItemSelect, 
  onItemMove, 
  onLoad,
  className = "w-full h-full min-h-[400px]",
  captureRef
}: RoomCanvasProps) {
  const [isClient, setIsClient] = useState(false)
  const glRef = useRef<HTMLCanvasElement | null>(null)
  const { performanceLevel } = useRoomStore()
  
  const canvasSettings = useMemo(() => {
    const preset = performanceLevel === 'low' ? RENDER_PRESETS.MOBILE : 
                   performanceLevel === 'medium' ? RENDER_PRESETS.INTERACTIVE : 
                   RENDER_PRESETS.INTERACTIVE
    const quality = getQualitySettings(performanceLevel)
    
    return {
      ...preset,
      antialias: quality.antialias,
      dpr: [1, quality.dpr] as [number, number]
    }
  }, [performanceLevel])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (captureRef && glRef.current) {
      (captureRef as MutableRefObject<HTMLCanvasElement | null>).current = glRef.current
    }
  }, [captureRef])
  
  if (!isClient) {
    return <LoadingFallback />
  }
  
  return (
    <div className={className} style={{ touchAction: 'none' }}>
      <PreloadingOverlay />
      <Canvas
        camera={{
          position: [10, 8, 10],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        shadows={performanceLevel !== 'low'}
        style={{ width: '100%', height: '100%' }}
        gl={{
          antialias: canvasSettings.antialias,
          alpha: true,
          powerPreference: canvasSettings.powerPreference,
          preserveDrawingBuffer: true
        }}
        dpr={canvasSettings.dpr}
        onCreated={({ gl }) => {
          glRef.current = gl.domElement
        }}
      >
        <Suspense fallback={null}>
          <SceneContent 
            onItemSelect={onItemSelect}
            onItemMove={onItemMove}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
