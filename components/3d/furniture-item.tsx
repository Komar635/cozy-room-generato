'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber'
import { Box, Text } from '@react-three/drei'
import { FurnitureItem, Vector3 } from '@/types/room'
import { useRoomStore } from '@/store/room-store'
import { formatPrice } from '@/lib/furniture-utils'
import { checkAABBCollision, clampToRoom, snapToGrid } from '@/lib/three-utils'
import * as THREE from 'three'

interface FurnitureItem3DProps {
  item: FurnitureItem
  onMove?: (itemId: string, position: Vector3) => void
  onSelect?: (item: FurnitureItem | null) => void
  onRotate?: (itemId: string, rotation: Vector3) => void
  onScale?: (itemId: string, scale: number) => void
}

export function FurnitureItem3D({ 
  item, 
  onMove, 
  onSelect, 
  onRotate, 
  onScale 
}: FurnitureItem3DProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const textRef = useRef<THREE.Mesh>(null)
  const { camera, raycaster, pointer } = useThree()
  
  const { 
    roomDimensions, 
    furniture, 
    selectedItem, 
    updateFurniture 
  } = useRoomStore()
  
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showPrice, setShowPrice] = useState(false)
  const [dragOffset, setDragOffset] = useState<Vector3>({ x: 0, y: 0, z: 0 })
  
  const isSelected = selectedItem?.id === item.id
  
  // Цвета для разных состояний
  const getItemColor = () => {
    if (isDragging) return '#ff6b6b'
    if (isSelected) return '#4dabf7'
    if (isHovered) return '#69db7c'
    return '#868e96'
  }
  
  // Проверка коллизий с другими предметами
  const checkCollisions = (newPosition: Vector3): boolean => {
    const itemSize = {
      x: item.dimensions.width,
      y: item.dimensions.height,
      z: item.dimensions.depth
    }
    
    return furniture.some(otherItem => {
      if (otherItem.id === item.id) return false
      
      const otherSize = {
        x: otherItem.dimensions.width,
        y: otherItem.dimensions.height,
        z: otherItem.dimensions.depth
      }
      
      return checkAABBCollision(newPosition, itemSize, otherItem.position, otherSize)
    })
  }
  
  // Обработка начала перетаскивания
  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    
    if (!meshRef.current) return
    
    setIsDragging(true)
    setShowPrice(true)
    
    // Выбираем предмет
    if (onSelect) {
      onSelect(item)
    }
    
    // Вычисляем смещение от центра объекта до точки клика
    const intersection = event.intersections[0]
    if (intersection) {
      const clickPoint = intersection.point
      const objectPosition = meshRef.current.position
      
      setDragOffset({
        x: clickPoint.x - objectPosition.x,
        y: clickPoint.y - objectPosition.y,
        z: clickPoint.z - objectPosition.z
      })
    }
  }
  
  // Обработка перетаскивания
  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !meshRef.current) return
    
    event.stopPropagation()
    
    // Получаем позицию мыши в мировых координатах
    const intersection = event.intersections[0]
    if (intersection) {
      let newPosition = {
        x: intersection.point.x - dragOffset.x,
        y: item.position.y, // Сохраняем высоту
        z: intersection.point.z - dragOffset.z
      }
      
      // Привязка к сетке
      newPosition = snapToGrid(newPosition, 0.1)
      
      // Ограничиваем границами комнаты
      const itemSize = {
        x: item.dimensions.width,
        y: item.dimensions.height,
        z: item.dimensions.depth
      }
      
      newPosition = clampToRoom(newPosition, itemSize, roomDimensions)
      
      // Проверяем коллизии
      const hasCollision = checkCollisions(newPosition)
      
      if (!hasCollision) {
        // Обновляем позицию в реальном времени
        meshRef.current.position.set(newPosition.x, newPosition.y, newPosition.z)
        
        // Обновляем состояние
        updateFurniture(item.id, { position: newPosition })
        
        if (onMove) {
          onMove(item.id, newPosition)
        }
      }
    }
  }
  
  // Обработка окончания перетаскивания
  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    setIsDragging(false)
    
    // Скрываем цену через 2 секунды
    setTimeout(() => {
      setShowPrice(false)
    }, 2000)
  }
  
  // Обработка наведения
  const handlePointerEnter = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    setIsHovered(true)
    setShowPrice(true)
    document.body.style.cursor = 'grab'
  }
  
  const handlePointerLeave = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    if (!isDragging) {
      setIsHovered(false)
      setShowPrice(false)
      document.body.style.cursor = 'default'
    }
  }
  
  // Обработка двойного клика для поворота
  const handleDoubleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    
    const newRotation = {
      ...item.rotation,
      y: item.rotation.y + Math.PI / 2 // Поворот на 90 градусов
    }
    
    updateFurniture(item.id, { rotation: newRotation })
    
    if (onRotate) {
      onRotate(item.id, newRotation)
    }
  }
  
  // Обновляем курсор при перетаскивании
  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'grabbing'
    } else {
      document.body.style.cursor = 'default'
    }
    
    return () => {
      document.body.style.cursor = 'default'
    }
  }, [isDragging])
  
  return (
    <group position={[item.position.x, item.position.y, item.position.z]}>
      {/* Основной меш предмета */}
      <Box
        ref={meshRef}
        args={[item.dimensions.width, item.dimensions.height, item.dimensions.depth]}
        position={[0, item.dimensions.height / 2, 0]}
        rotation={[item.rotation.x, item.rotation.y, item.rotation.z]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onDoubleClick={handleDoubleClick}
      >
        <meshStandardMaterial
          color={getItemColor()}
          transparent
          opacity={isDragging ? 0.7 : 0.8}
          roughness={0.7}
          metalness={0.1}
        />
      </Box>
      
      {/* Контур для выделения */}
      {(isSelected || isHovered) && (
        <Box
          args={[
            item.dimensions.width + 0.02,
            item.dimensions.height + 0.02,
            item.dimensions.depth + 0.02
          ]}
          position={[0, item.dimensions.height / 2, 0]}
          rotation={[item.rotation.x, item.rotation.y, item.rotation.z]}
        >
          <meshBasicMaterial
            color={isSelected ? '#4dabf7' : '#69db7c'}
            wireframe
            transparent
            opacity={0.5}
          />
        </Box>
      )}
      
      {/* Отображение цены */}
      {showPrice && (
        <Text
          ref={textRef}
          position={[0, item.dimensions.height + 0.3, 0]}
          fontSize={0.2}
          color="#2d3748"
          anchorX="center"
          anchorY="middle"
        >
          {formatPrice(item.price)}
        </Text>
      )}
      
      {/* Тень на полу */}
      <mesh
        position={[0, 0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[item.dimensions.width, item.dimensions.depth]} />
        <shadowMaterial
          transparent
          opacity={0.2}
        />
      </mesh>
    </group>
  )
}