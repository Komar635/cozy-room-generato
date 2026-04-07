'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OptimizedFurnitureItem } from './optimized-furniture-item'
import { useRoomStore } from '@/store/room-store'
import { FurnitureItem, Vector3 } from '@/types/room'
import { modelLoader, getQualitySettings } from '@/lib/three-utils'
import * as THREE from 'three'

interface FurnitureManagerProps {
  onItemSelect?: (item: FurnitureItem | null) => void
  onItemMove?: (itemId: string, position: Vector3) => void
  onItemRotate?: (itemId: string, rotation: Vector3) => void
  onItemScale?: (itemId: string, scale: number) => void
}

function FrustumCullingController({ children }: { children: (visibleIds: Set<string>) => React.ReactNode }) {
  const { camera } = useThree()
  const { furniture, performanceLevel } = useRoomStore()
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set())
  const frustumRef = useRef(new THREE.Frustum())
  const projScreenMatrixRef = useRef(new THREE.Matrix4())

  useFrame(() => {
    if (performanceLevel === 'low' || furniture.length === 0) {
      setVisibleIds(new Set(furniture.map(f => f.id)))
      return
    }

    projScreenMatrixRef.current.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    )
    frustumRef.current.setFromProjectionMatrix(projScreenMatrixRef.current)

    const visible = new Set<string>()
    
    furniture.forEach(item => {
      const position = new THREE.Vector3(item.position.x, item.position.y + item.dimensions.height / 2, item.position.z)
      const maxRadius = Math.max(item.dimensions.width, item.dimensions.height, item.dimensions.depth) / 2
      const boundingSphere = new THREE.Sphere(position, maxRadius)
      
      if (frustumRef.current.intersectsSphere(boundingSphere)) {
        visible.add(item.id)
      }
    })

    if (visible.size !== visibleIds.size || ![...visible].every(id => visibleIds.has(id))) {
      setVisibleIds(visible)
    }
  })

  return <>{children(visibleIds)}</>
}

function LazyModelLoader({ item, children }: { item: FurnitureItem; children: (loaded: boolean) => React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!item.modelUrl) {
      setIsLoaded(true)
      return
    }

    if (modelLoader.isCached(item.modelUrl)) {
      setIsLoaded(true)
      return
    }

    setIsLoading(true)
    modelLoader.loadModel(item.modelUrl)
      .then(() => setIsLoaded(true))
      .catch(() => setIsLoaded(true))
      .finally(() => setIsLoading(false))
  }, [item.modelUrl])

  return <>{children(isLoaded && !isLoading)}</>
}

export function FurnitureManager({
  onItemSelect,
  onItemMove,
  onItemRotate,
  onItemScale
}: FurnitureManagerProps) {
  const { furniture, performanceLevel, isPreloadingComplete, initPerformanceOptimization, preloadPopularFurniture } = useRoomStore()
  const [loadedModels, setLoadedModels] = useState<Set<string>>(new Set())

  const qualitySettings = useMemo(() => {
    return getQualitySettings(performanceLevel)
  }, [performanceLevel])

  useEffect(() => {
    initPerformanceOptimization()
    if (!isPreloadingComplete) {
      preloadPopularFurniture()
    }
  }, [])

  useEffect(() => {
    const loadMissingModels = async () => {
      for (const item of furniture) {
        if (item.modelUrl && !loadedModels.has(item.id) && !modelLoader.isCached(item.modelUrl)) {
          try {
            await modelLoader.loadModel(item.modelUrl)
            setLoadedModels(prev => new Set(prev).add(item.id))
          } catch (error) {
            console.warn(`Failed to load model for ${item.name}:`, error)
          }
        }
      }
    }

    loadMissingModels()
  }, [furniture])

  return (
    <group>
      <FrustumCullingController>
        {(_visibleIds) => (
          <group>
            {furniture.map((item) => (
              <LazyModelLoader key={item.id} item={item}>
                {(_isModelLoaded) => (
                  <OptimizedFurnitureItem
                    item={item}
                    onSelect={onItemSelect}
                    onMove={onItemMove}
                    onRotate={onItemRotate}
                    onScale={onItemScale}
                  />
                )}
              </LazyModelLoader>
            ))}
          </group>
        )}
      </FrustumCullingController>
    </group>
  )
}