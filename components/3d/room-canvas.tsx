'use client'

import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, Environment, PerspectiveCamera } from '@react-three/drei'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useRoomStore } from '@/store/room-store'
import { FurnitureItem, Vector3 } from '@/types/room'
import { getOptimalCameraPosition, getOptimalCameraTarget, getDevicePerformanceLevel, getQualitySettings } from '@/lib/three-utils'
import { FurnitureManager } from './furniture-manager'
import { DropZone } from './drop-zone'
import * as THREE from 'three'

interface RoomCanvasProps {
  onItemSelect?: (item: FurnitureItem | null) => void
  onItemMove?: (itemId: string, position: Vector3) => void
  className?: string
}

// Компонент для отображения пустой комнаты (пол, стены, потолок)
function Room() {
  const { roomDimensions } = useRoomStore()
  const { width, height, depth } = roomDimensions

  return (
    <group>
      {/* Пол */}
      <mesh 
        position={[0, 0, 0]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial 
          color="#f5f5f0" 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Стены */}
      <group>
        {/* Задняя стена */}
        <mesh position={[0, height / 2, -depth / 2]}>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Левая стена */}
        <mesh position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[depth, height]} />
          <meshStandardMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Правая стена */}
        <mesh position={[width / 2, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[depth, height]} />
          <meshStandardMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      
      {/* Потолок */}
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
      
      {/* Каркас комнаты для лучшего понимания размеров */}
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

// Компонент для управления камерой и орбитальных контролов
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

// Компонент освещения сцены
function SceneLighting() {
  return (
    <>
      {/* Основное освещение */}
      <ambientLight intensity={0.6} color="#ffffff" />
      
      {/* Направленный свет */}
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={0.8}
        color="#ffffff"
      />
      
      {/* Дополнительное мягкое освещение */}
      <pointLight 
        position={[0, 5, 0]} 
        intensity={0.3}
        color="#fff8e1"
      />
    </>
  )
}

// Компонент сетки пола
function FloorGrid() {
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

// Основной компонент содержимого сцены
function SceneContent({ onItemSelect, onItemMove }: RoomCanvasProps) {
  return (
    <>
      {/* Контроллер камеры */}
      <CameraController />
      
      {/* Освещение */}
      <SceneLighting />
      
      {/* Сетка пола */}
      <FloorGrid />
      
      {/* Комната */}
      <Room />
      
      {/* Зона для drag & drop */}
      <DropZone onItemDrop={(item, position) => {
        if (onItemMove) {
          onItemMove(item.id, position)
        }
      }} />
      
      {/* Менеджер мебели */}
      <FurnitureManager
        onItemSelect={onItemSelect}
        onItemMove={onItemMove}
      />
      
      {/* Окружение для реалистичного освещения */}
      <Environment preset="apartment" />
    </>
  )
}

// Компонент загрузки
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600">Загрузка 3D сцены...</p>
      </div>
    </div>
  )
}

// Основной компонент RoomCanvas
export default function RoomCanvas({ 
  onItemSelect, 
  onItemMove, 
  className = "w-full h-full min-h-[400px]" 
}: RoomCanvasProps) {
  const [isClient, setIsClient] = useState(false)
  
  // Проверяем, что мы на клиенте (избегаем SSR проблем)
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  if (!isClient) {
    return <LoadingFallback />
  }
  
  return (
    <div className={className} style={{ touchAction: 'none' }}>
      <Canvas
        camera={{
          position: [10, 8, 10],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        shadows
        style={{ width: '100%', height: '100%' }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
        dpr={[1, 2]}
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