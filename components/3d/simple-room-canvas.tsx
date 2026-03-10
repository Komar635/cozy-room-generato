'use client'

import { Canvas } from '@react-three/fiber'
import { Plane, Grid } from '@react-three/drei'
import { Suspense, useState, useEffect } from 'react'
import { FurnitureItem, Vector3 } from '@/types/room'
import { useRoomStore } from '@/store/room-store'
import { SimpleFurnitureItem } from './simple-furniture-item'

interface SimpleRoomCanvasProps {
  onItemSelect?: (item: FurnitureItem | null) => void
  onItemMove?: (itemId: string, position: Vector3) => void
  className?: string
}

// Простая комната
function SimpleRoom() {
  return (
    <group>
      {/* Пол */}
      <Plane 
        args={[8, 8]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]}
      >
        <meshStandardMaterial color="#f5f5f0" />
      </Plane>
      
      {/* Стены */}
      <Plane args={[8, 3]} position={[0, 1.5, -4]}>
        <meshStandardMaterial color="#ffffff" />
      </Plane>
      
      <Plane args={[8, 3]} position={[-4, 1.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <meshStandardMaterial color="#ffffff" />
      </Plane>
      
      {/* Сетка для ориентации */}
      <Grid 
        args={[10, 10]} 
        position={[0, 0.01, 0]} 
        cellSize={0.5} 
        cellColor="#e0e0e0" 
        sectionColor="#bdbdbd" 
      />
    </group>
  )
}

// Менеджер мебели
function FurnitureManager({ onItemSelect }: { onItemSelect?: (item: FurnitureItem | null) => void }) {
  const { furniture } = useRoomStore()

  return (
    <group>
      {furniture.map((item) => (
        <SimpleFurnitureItem
          key={item.id}
          item={item}
          onSelect={onItemSelect}
        />
      ))}
    </group>
  )
}

export default function SimpleRoomCanvas({ 
  onItemSelect, 
  onItemMove, 
  className = "w-full h-full" 
}: SimpleRoomCanvasProps) {
  const [isClient, setIsClient] = useState(false)
  
  // Проверяем, что мы на клиенте (избегаем SSR проблем)
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  if (!isClient) {
    return <div className="flex items-center justify-center h-full">Загрузка...</div>
  }
  
  return (
    <div className={className}>
      <Canvas
        camera={{ 
          position: [10, 8, 10], // ТОЧНО как в рабочем RoomCanvas
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        shadows={false} // Отключаем тени для производительности
        style={{ width: '100%', height: '100%' }}
        gl={{ 
          antialias: false,
          alpha: false,
          powerPreference: "default"
        }}
        dpr={1} // Фиксированное разрешение
      >
        <Suspense fallback={null}>
          {/* Освещение */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          
          {/* ПОЛНОСТЬЮ ОТКЛЮЧАЕМ OrbitControls */}
          
          <SimpleRoom />
          <FurnitureManager onItemSelect={onItemSelect} />
        </Suspense>
      </Canvas>
    </div>
  )
}