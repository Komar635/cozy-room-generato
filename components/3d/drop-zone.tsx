'use client'

import { useState, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Plane } from '@react-three/drei'
import { useRoomStore } from '@/store/room-store'
import { FurnitureItem, Vector3 } from '@/types/room'
import { generatePlacedItemId } from '@/lib/furniture-utils'
import { snapToGrid, clampToRoom } from '@/lib/three-utils'
import * as THREE from 'three'

interface DropZoneProps {
  onItemDrop?: (item: FurnitureItem, position: Vector3) => void
}

export function DropZone({ onItemDrop }: DropZoneProps) {
  const { camera, raycaster, gl } = useThree()
  const { roomDimensions, addFurniture, canAddItem } = useRoomStore()
  
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    const canvas = gl.domElement
    
    const handleDrop = (event: DragEvent) => {
      event.preventDefault()
      setIsDragOver(false)
      
      try {
        const itemData = event.dataTransfer?.getData('application/json')
        if (!itemData) return
        
        const item: FurnitureItem = JSON.parse(itemData)
        
        if (!canAddItem(item.price)) {
          return
        }
        
        // Получаем позицию мыши относительно canvas
        const rect = canvas.getBoundingClientRect()
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        
        // Создаем луч от камеры
        raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
        
        // Находим пересечение с полом (y = 0)
        const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
        const intersectionPoint = new THREE.Vector3()
        raycaster.ray.intersectPlane(floorPlane, intersectionPoint)
        
        if (intersectionPoint) {
          let dropPosition = {
            x: intersectionPoint.x,
            y: 0,
            z: intersectionPoint.z
          }
          
          // Привязка к сетке
          dropPosition = snapToGrid(dropPosition, 0.1)
          
          // Ограничиваем границами комнаты
          const itemSize = {
            x: item.dimensions.width,
            y: item.dimensions.height,
            z: item.dimensions.depth
          }
          
          dropPosition = clampToRoom(dropPosition, itemSize, roomDimensions)
          
          // Создаем новый предмет с уникальным ID
          const newItem: FurnitureItem = {
            ...item,
            id: generatePlacedItemId(item.id),
            position: dropPosition
          }
          
          // Добавляем в сцену
          addFurniture(newItem)
          
          if (onItemDrop) {
            onItemDrop(newItem, dropPosition)
          }
        }
      } catch (error) {
        console.error('Ошибка при размещении предмета:', error)
      }
    }

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault()
      setIsDragOver(true)
    }

    const handleDragEnter = (event: DragEvent) => {
      event.preventDefault()
      setIsDragOver(true)
    }

    const handleDragLeave = (event: DragEvent) => {
      event.preventDefault()
      // Проверяем, что мышь действительно покинула canvas
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX
      const y = event.clientY
      
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setIsDragOver(false)
      }
    }

    canvas.addEventListener('drop', handleDrop)
    canvas.addEventListener('dragover', handleDragOver)
    canvas.addEventListener('dragenter', handleDragEnter)
    canvas.addEventListener('dragleave', handleDragLeave)

    return () => {
      canvas.removeEventListener('drop', handleDrop)
      canvas.removeEventListener('dragover', handleDragOver)
      canvas.removeEventListener('dragenter', handleDragEnter)
      canvas.removeEventListener('dragleave', handleDragLeave)
    }
  }, [camera, raycaster, gl, roomDimensions, addFurniture, canAddItem, onItemDrop])

  return (
    <>
      {/* Визуальная подсветка зоны drop */}
      {isDragOver && (
        <Plane
          args={[roomDimensions.width, roomDimensions.depth]}
          position={[0, 0.002, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <meshBasicMaterial
            color="#4dabf7"
            transparent
            opacity={0.2}
          />
        </Plane>
      )}
    </>
  )
}