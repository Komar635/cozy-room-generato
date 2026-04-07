'use client'

import { useRef, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { FurnitureItem, Vector3 } from '@/types/room'
import { getLODLevel, LODLevel } from '@/lib/three-utils'
import { useRoomStore } from '@/store/room-store'

interface LODFurnitureItemProps {
  item: FurnitureItem
  onMove?: (itemId: string, position: Vector3) => void
  onSelect?: (item: FurnitureItem | null) => void
  onRotate?: (itemId: string, rotation: Vector3) => void
  children: (lodLevel: LODLevel, isVisible: boolean) => React.ReactNode
}

export function LODFurnitureItem({ 
  item, 
  children 
}: LODFurnitureItemProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const [lodLevel, setLodLevel] = useState<LODLevel>('high')
  const [isVisible, setIsVisible] = useState(true)
  const frustumRef = useRef(new THREE.Frustum())
  const projScreenMatrixRef = useRef(new THREE.Matrix4())
  const { performanceLevel } = useRoomStore()

  useFrame(() => {
    if (!groupRef.current) return

    const distance = camera.position.distanceTo(groupRef.current.position)
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

      const boundingSphere = new THREE.Sphere(groupRef.current.position.clone(), 2)
      const visible = frustumRef.current.intersectsSphere(boundingSphere)
      if (visible !== isVisible) {
        setIsVisible(visible)
      }
    }
  })

  return (
    <group ref={groupRef} position={[item.position.x, item.position.y, item.position.z]}>
      {children(lodLevel, isVisible)}
    </group>
  )
}

interface OptimizedGeometryProps {
  lodLevel: LODLevel
  width: number
  height: number
  depth: number
}

export function OptimizedGeometry({ lodLevel, width, height, depth }: OptimizedGeometryProps) {
  const geometryParams = useMemo(() => {
    switch (lodLevel) {
      case 'high':
        return { widthSegments: 32, heightSegments: 32, depthSegments: 32 }
      case 'medium':
        return { widthSegments: 16, heightSegments: 16, depthSegments: 16 }
      case 'low':
        return { widthSegments: 8, heightSegments: 8, depthSegments: 8 }
    }
  }, [lodLevel])

  return (
    <boxGeometry args={[width, height, depth, geometryParams.widthSegments, geometryParams.heightSegments, geometryParams.depthSegments]} />
  )
}

interface OptimizedMaterialProps {
  lodLevel: LODLevel
  color: string
  isDragging?: boolean
}

export function OptimizedMaterial({ lodLevel, color, isDragging = false }: OptimizedMaterialProps) {
  const materialParams = useMemo(() => {
    switch (lodLevel) {
      case 'high':
        return { roughness: 0.7, metalness: 0.1, wireframe: false }
      case 'medium':
        return { roughness: 0.8, metalness: 0.05, wireframe: false }
      case 'low':
        return { roughness: 1, metalness: 0, wireframe: false }
    }
  }, [lodLevel])

  return (
    <meshStandardMaterial
      color={color}
      transparent
      opacity={isDragging ? 0.7 : 0.8}
      roughness={materialParams.roughness}
      metalness={materialParams.metalness}
    />
  )
}

interface OptimizedShadowProps {
  lodLevel: LODLevel
  width: number
  depth: number
}

export function OptimizedShadow({ lodLevel, width, depth }: OptimizedShadowProps) {
  if (lodLevel === 'low') return null

  return (
    <mesh
      position={[0, 0.001, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[width, depth]} />
      <shadowMaterial transparent opacity={0.2} />
    </mesh>
  )
}

export { getLODLevel }
export type { LODLevel }