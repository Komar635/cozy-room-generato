'use client'

import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { FurnitureItem, Vector3 } from '@/types/room'
import { useRoomStore } from '@/store/room-store'
import { formatPrice } from '@/lib/furniture-utils'
import { checkAABBCollision, clampToRoom, snapToGrid } from '@/lib/three-utils'

interface CulledFurnitureItemProps {
  item: FurnitureItem
  onMove?: (itemId: string, position: Vector3) => void
  onSelect?: (item: FurnitureItem | null) => void
  onRotate?: (itemId: string, rotation: Vector3) => void
  onScale?: (itemId: string, scale: number) => void
}

export function CulledFurnitureItem({
  item,
  onMove,
  onSelect,
  onRotate,
  onScale
}: CulledFurnitureItemProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const textRef = useRef<THREE.Mesh>(null)
  const { camera, raycaster, pointer } = useThree()
  const frustumRef = useRef(new THREE.Frustum())
  const projScreenMatrixRef = useRef(new THREE.Matrix4())
  const [isVisible, setIsVisible] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showPrice, setShowPrice] = useState(false)
  const [dragOffset, setDragOffset] = useState<Vector3>({ x: 0, y: 0, z: 0 })
  const [lodLevel, setLodLevel] = useState<'high' | 'medium' | 'low'>('high')

  const { roomDimensions, furniture, selectedItem, updateFurniture, performanceLevel } = useRoomStore()

  const isSelected = selectedItem?.id === item.id

  useFrame(() => {
    if (!meshRef.current) return

    projScreenMatrixRef.current.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    )
    frustumRef.current.setFromProjectionMatrix(projScreenMatrixRef.current)

    const distance = camera.position.distanceTo(meshRef.current.position)
    let newLOD: 'high' | 'medium' | 'low' = 'high'
    if (distance > 20) newLOD = 'low'
    else if (distance > 8) newLOD = 'medium'

    if (newLOD !== lodLevel) {
      setLodLevel(newLOD)
    }

    if (!isDragging && !isHovered) {
      const boundingSphere = new THREE.Sphere(meshRef.current.position.clone(), 1)
      const visible = frustumRef.current.intersectsSphere(boundingSphere)
      if (visible !== isVisible) {
        setIsVisible(visible)
      }
    }
  })

  const getItemColor = () => {
    if (isDragging) return '#ff6b6b'
    if (isSelected) return '#4dabf7'
    if (isHovered) return '#69db7c'
    return '#868e96'
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

  const handlePointerDown = (event: { stopPropagation: () => void }) => {
    event.stopPropagation()
    if (!meshRef.current) return

    setIsDragging(true)
    setShowPrice(true)
    setIsVisible(true)

    if (onSelect) {
      onSelect(item)
    }
  }

  const handlePointerMove = (event: { stopPropagation: () => void; intersections?: { point: THREE.Vector3 }[] }) => {
    if (!isDragging || !meshRef.current) return

    event.stopPropagation()

    const intersection = event.intersections?.[0]
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

  const handlePointerUp = (event: { stopPropagation: () => void }) => {
    event.stopPropagation()
    setIsDragging(false)

    setTimeout(() => {
      setShowPrice(false)
    }, 2000)
  }

  const handlePointerEnter = (event: { stopPropagation: () => void }) => {
    event.stopPropagation()
    setIsHovered(true)
    setShowPrice(true)
    setIsVisible(true)
    document.body.style.cursor = 'grab'
  }

  const handlePointerLeave = (event: { stopPropagation: () => void }) => {
    event.stopPropagation()
    if (!isDragging) {
      setIsHovered(false)
      setShowPrice(false)
      document.body.style.cursor = 'default'
    }
  }

  const handleDoubleClick = (event: { stopPropagation: () => void }) => {
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

  const geometrySegments = lodLevel === 'high' ? 32 : lodLevel === 'medium' ? 16 : 8

  if (!isVisible && !isDragging && !isHovered) {
    return null
  }

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
          color={getItemColor()}
          transparent
          opacity={isDragging ? 0.7 : 0.8}
          roughness={0.7}
          metalness={0.1}
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
        <mesh ref={textRef} position={[0, item.dimensions.height + 0.3, 0]}>
          <planeGeometry args={[0.8, 0.2]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
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
