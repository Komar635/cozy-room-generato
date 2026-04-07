'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { FurnitureItem, Vector3 } from '@/types/room'
import { useRoomStore } from '@/store/room-store'
import { formatPrice } from '@/lib/furniture-utils'
import { checkAABBCollision, clampToRoom, snapToGrid } from '@/lib/three-utils'
import { LODLevel, getLODLevel } from '@/lib/three-utils'

interface OptimizedFurnitureItemProps {
  item: FurnitureItem
  onMove?: (itemId: string, position: Vector3) => void
  onSelect?: (item: FurnitureItem | null) => void
  onRotate?: (itemId: string, rotation: Vector3) => void
  onScale?: (itemId: string, scale: number) => void
}

export function OptimizedFurnitureItem({
  item,
  onMove,
  onSelect,
  onRotate,
  onScale
}: OptimizedFurnitureItemProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()
  const [lodLevel, setLodLevel] = useState<LODLevel>('high')
  const [isVisible, setIsVisible] = useState(true)
  const frustumRef = useRef(new THREE.Frustum())
  const projScreenMatrixRef = useRef(new THREE.Matrix4())
  
  const { roomDimensions, furniture, selectedItem, updateFurniture, performanceLevel } = useRoomStore()
  
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showPrice, setShowPrice] = useState(false)
  const [dragOffset, setDragOffset] = useState<Vector3>({ x: 0, y: 0, z: 0 })
  
  const isSelected = selectedItem?.id === item.id

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

  useFrame(() => {
    if (!meshRef.current) return

    const distance = camera.position.distanceTo(meshRef.current.position)
    const newLOD = getLODLevel(distance)
    
    if (newLOD !== lodLevel) {
      setLodLevel(newLOD)
    }

    if (performanceLevel !== 'low') {
      projScreenMatrixRef.current.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      )
      frustumRef.current.setFromProjectionMatrix(projScreenMatrixRef.current)

      if (!isDragging && !isHovered) {
        const boundingSphere = new THREE.Sphere(meshRef.current.position.clone(), 2)
        const visible = frustumRef.current.intersectsSphere(boundingSphere)
        if (visible !== isVisible) {
          setIsVisible(visible)
        }
      }
    }
  })

  const shouldRender = isVisible || isDragging || isHovered

  if (!shouldRender) {
    return null
  }

  const getItemColor = () => {
    if (isDragging) return '#ff6b6b'
    if (isSelected) return '#4dabf7'
    if (isHovered) return '#69db7c'
    return '#868e96'
  }

  const getGeometrySegments = () => {
    switch (lodLevel) {
      case 'high': return 32
      case 'medium': return 16
      case 'low': return 8
    }
  }

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

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    
    if (!meshRef.current) return
    
    setIsDragging(true)
    setShowPrice(true)
    
    if (onSelect) {
      onSelect(item)
    }
    
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

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !meshRef.current) return
    
    event.stopPropagation()
    
    const intersection = event.intersections[0]
    if (intersection) {
      let newPosition = {
        x: intersection.point.x - dragOffset.x,
        y: item.position.y,
        z: intersection.point.z - dragOffset.z
      }
      
      newPosition = snapToGrid(newPosition, 0.1)
      
      const itemSize = {
        x: item.dimensions.width,
        y: item.dimensions.height,
        z: item.dimensions.depth
      }
      
      newPosition = clampToRoom(newPosition, itemSize, roomDimensions)
      
      const hasCollision = checkCollisions(newPosition)
      
      if (!hasCollision) {
        meshRef.current.position.set(newPosition.x, newPosition.y, newPosition.z)
        updateFurniture(item.id, { position: newPosition })
        
        if (onMove) {
          onMove(item.id, newPosition)
        }
      }
    }
  }

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    setIsDragging(false)
    
    setTimeout(() => {
      setShowPrice(false)
    }, 2000)
  }

  const handlePointerEnter = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    setIsHovered(true)
    setShowPrice(true)
    setIsVisible(true)
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

  const handleDoubleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    
    const newRotation = {
      ...item.rotation,
      y: item.rotation.y + Math.PI / 2
    }
    
    updateFurniture(item.id, { rotation: newRotation })
    
    if (onRotate) {
      onRotate(item.id, newRotation)
    }
  }

  const segments = getGeometrySegments()
  const color = getItemColor()

  return (
    <group position={[item.position.x, item.position.y, item.position.z]}>
      <mesh
        ref={meshRef}
        position={[0, item.dimensions.height / 2, 0]}
        rotation={[item.rotation.x, item.rotation.y, item.rotation.z]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onDoubleClick={handleDoubleClick}
      >
        <boxGeometry args={[
          item.dimensions.width,
          item.dimensions.height,
          item.dimensions.depth
        ]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={isDragging ? 0.7 : 0.8}
          roughness={lodLevel === 'high' ? 0.7 : lodLevel === 'medium' ? 0.8 : 1}
          metalness={lodLevel === 'high' ? 0.1 : lodLevel === 'medium' ? 0.05 : 0}
        />
      </mesh>

      {(isSelected || isHovered) && (
        <mesh
          position={[0, item.dimensions.height / 2, 0]}
          rotation={[item.rotation.x, item.rotation.y, item.rotation.z]}
        >
          <boxGeometry args={[
            item.dimensions.width + 0.02,
            item.dimensions.height + 0.02,
            item.dimensions.depth + 0.02
          ]} />
          <meshBasicMaterial
            color={isSelected ? '#4dabf7' : '#69db7c'}
            wireframe
            transparent
            opacity={0.5}
          />
        </mesh>
      )}

      {showPrice && (
        <Text
          position={[0, item.dimensions.height + 0.3, 0]}
          fontSize={0.2}
          color="#2d3748"
          anchorX="center"
          anchorY="middle"
          scale={lodLevel === 'low' ? 0.8 : 1}
        >
          {formatPrice(item.price)}
        </Text>
      )}

      {lodLevel !== 'low' && (
        <mesh
          position={[0, 0.001, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[item.dimensions.width, item.dimensions.depth]} />
          <shadowMaterial transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  )
}