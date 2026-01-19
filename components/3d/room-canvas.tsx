'use client'

import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, Environment, PerspectiveCamera } from '@react-three/drei'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useRoomStore } from '@/store/room-store'
import { FurnitureItem, Vector3 } from '@/types/room'
import { getOptimalCameraPosition, getOptimalCameraTarget, getDevicePerformanceLevel, getQualitySettings } from '@/lib/three-utils'
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
  const { camera, size } = useThree()
  const { roomDimensions } = useRoomStore()
  const controlsRef = useRef<any>()
  
  useEffect(() => {
    // Адаптивное позиционирование камеры в зависимости от размеров комнаты
    const optimalPosition = getOptimalCameraPosition(roomDimensions)
    const optimalTarget = getOptimalCameraTarget(roomDimensions)
    
    camera.position.set(optimalPosition.x, optimalPosition.y, optimalPosition.z)
    camera.lookAt(optimalTarget.x, optimalTarget.y, optimalTarget.z)
    
    // Обновляем контролы
    if (controlsRef.current) {
      controlsRef.current.target.set(optimalTarget.x, optimalTarget.y, optimalTarget.z)
      controlsRef.current.update()
    }
  }, [camera, roomDimensions])
  
  // Адаптивный рендеринг для разных размеров экрана
  useEffect(() => {
    const aspect = size.width / size.height
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = aspect
      camera.updateProjectionMatrix()
    }
  }, [camera, size])
  
  const maxDimension = Math.max(roomDimensions.width, roomDimensions.depth, roomDimensions.height)
  const target = getOptimalCameraTarget(roomDimensions)
  
  return (
    <OrbitControls 
      ref={controlsRef}
      enablePan={true} 
      enableZoom={true} 
      enableRotate={true}
      minDistance={Math.max(maxDimension * 0.5, 3)}
      maxDistance={Math.max(maxDimension * 3, 50)}
      target={[target.x, target.y, target.z]}
      enableDamping={true}
      dampingFactor={0.05}
      autoRotate={false}
      makeDefault={true}
      // Ограничения для более удобной навигации
      maxPolarAngle={Math.PI * 0.9} // Не позволяем камере заходить под пол
      minPolarAngle={Math.PI * 0.1}  // Не позволяем смотреть сверху вниз
    />
  )
}

// Компонент освещения сцены
function SceneLighting() {
  const { roomDimensions } = useRoomStore()
  const [qualitySettings, setQualitySettings] = useState(getQualitySettings('medium'))
  
  useEffect(() => {
    const performanceLevel = getDevicePerformanceLevel()
    setQualitySettings(getQualitySettings(performanceLevel))
  }, [])
  
  return (
    <>
      {/* Основное освещение */}
      <ambientLight intensity={0.4} color="#ffffff" />
      
      {/* Направленный свет (имитация солнца) */}
      <directionalLight 
        position={[roomDimensions.width, roomDimensions.height * 1.5, roomDimensions.depth]} 
        intensity={0.8}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={qualitySettings.shadowMapSize}
        shadow-mapSize-height={qualitySettings.shadowMapSize}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-roomDimensions.width}
        shadow-camera-right={roomDimensions.width}
        shadow-camera-top={roomDimensions.depth}
        shadow-camera-bottom={-roomDimensions.depth}
      />
      
      {/* Дополнительное мягкое освещение */}
      <pointLight 
        position={[0, roomDimensions.height * 0.8, 0]} 
        intensity={0.3}
        color="#fff8e1"
        distance={roomDimensions.width * 2}
        decay={2}
      />
    </>
  )
}

// Компонент сетки пола
function FloorGrid() {
  const { roomDimensions } = useRoomStore()
  const maxDimension = Math.max(roomDimensions.width, roomDimensions.depth)
  
  return (
    <Grid 
      args={[maxDimension * 2, maxDimension * 2]} 
      position={[0, -0.001, 0]} 
      cellSize={0.5} 
      cellThickness={0.5} 
      cellColor="#e0e0e0" 
      sectionSize={1} 
      sectionThickness={1} 
      sectionColor="#bdbdbd" 
      fadeDistance={maxDimension * 1.5} 
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
  const { roomDimensions } = useRoomStore()
  const [isClient, setIsClient] = useState(false)
  const [qualitySettings, setQualitySettings] = useState(getQualitySettings('medium'))
  
  // Проверяем, что мы на клиенте (избегаем SSR проблем)
  useEffect(() => {
    setIsClient(true)
    
    // Определяем производительность устройства и настраиваем качество
    const performanceLevel = getDevicePerformanceLevel()
    setQualitySettings(getQualitySettings(performanceLevel))
  }, [])
  
  if (!isClient) {
    return <LoadingFallback />
  }
  
  const optimalPosition = getOptimalCameraPosition(roomDimensions)
  
  return (
    <div className={className}>
      <Canvas
        camera={{ 
          position: [optimalPosition.x, optimalPosition.y, optimalPosition.z],
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        shadows
        style={{ width: '100%', height: '100%' }}
        gl={{ 
          antialias: qualitySettings.antialias,
          alpha: false,
          powerPreference: "high-performance"
        }}
        dpr={[1, qualitySettings.dpr]} // Адаптивное разрешение для производительности
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