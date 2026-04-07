import * as THREE from 'three'
import { Vector3 } from '../types/room'

// Создание материалов
export const createBasicMaterial = (color: string, opacity = 1) => {
  return new THREE.MeshStandardMaterial({
    color,
    transparent: opacity < 1,
    opacity
  })
}

export const createWireframeMaterial = (color: string) => {
  return new THREE.MeshBasicMaterial({
    color,
    wireframe: true
  })
}

// Утилиты для ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9)
}

// Конвертация углов
export const degreesToRadians = (degrees: number) => {
  return degrees * (Math.PI / 180)
}

export const radiansToDegrees = (radians: number) => {
  return radians * (180 / Math.PI)
}

// Работа с 3D координатами
export const createVector3 = (x = 0, y = 0, z = 0): Vector3 => ({
  x, y, z
})

export const vector3ToThree = (vector: Vector3): THREE.Vector3 => {
  return new THREE.Vector3(vector.x, vector.y, vector.z)
}

export const threeToVector3 = (vector: THREE.Vector3): Vector3 => ({
  x: vector.x,
  y: vector.y,
  z: vector.z
})

export const addVectors = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z
})

export const subtractVectors = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z
})

export const multiplyVector = (vector: Vector3, scalar: number): Vector3 => ({
  x: vector.x * scalar,
  y: vector.y * scalar,
  z: vector.z * scalar
})

export const vectorLength = (vector: Vector3): number => {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z)
}

export const normalizeVector = (vector: Vector3): Vector3 => {
  const length = vectorLength(vector)
  if (length === 0) return { x: 0, y: 0, z: 0 }
  
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length
  }
}

export const dotProduct = (a: Vector3, b: Vector3): number => {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

export const crossProduct = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x
})

export const distanceBetweenPoints = (a: Vector3, b: Vector3): number => {
  return vectorLength(subtractVectors(a, b))
}

// Проверка пересечений (простая AABB проверка)
export const checkAABBCollision = (
  pos1: Vector3, 
  size1: Vector3, 
  pos2: Vector3, 
  size2: Vector3
): boolean => {
  return (
    pos1.x < pos2.x + size2.x &&
    pos1.x + size1.x > pos2.x &&
    pos1.y < pos2.y + size2.y &&
    pos1.y + size1.y > pos2.y &&
    pos1.z < pos2.z + size2.z &&
    pos1.z + size1.z > pos2.z
  )
}

// Проверка, находится ли точка внутри комнаты
export const isPointInRoom = (
  point: Vector3, 
  roomDimensions: { width: number; height: number; depth: number }
): boolean => {
  return (
    point.x >= 0 && point.x <= roomDimensions.width &&
    point.y >= 0 && point.y <= roomDimensions.height &&
    point.z >= 0 && point.z <= roomDimensions.depth
  )
}

// Ограничение позиции объекта границами комнаты
export const clampToRoom = (
  position: Vector3,
  objectSize: Vector3,
  roomDimensions: { width: number; height: number; depth: number }
): Vector3 => {
  return {
    x: Math.max(0, Math.min(roomDimensions.width - objectSize.x, position.x)),
    y: Math.max(0, Math.min(roomDimensions.height - objectSize.y, position.y)),
    z: Math.max(0, Math.min(roomDimensions.depth - objectSize.z, position.z))
  }
}

// Округление координат до сетки
export const snapToGrid = (position: Vector3, gridSize = 0.1): Vector3 => ({
  x: Math.round(position.x / gridSize) * gridSize,
  y: Math.round(position.y / gridSize) * gridSize,
  z: Math.round(position.z / gridSize) * gridSize
})

// Утилиты для адаптивного рендеринга
export const getOptimalCameraPosition = (roomDimensions: { width: number; height: number; depth: number }): Vector3 => {
  const maxDimension = Math.max(roomDimensions.width, roomDimensions.depth, roomDimensions.height)
  const distance = Math.max(maxDimension * 2, 10) // Увеличиваем дистанцию
  
  return {
    x: distance * 0.7,
    y: distance * 0.5,
    z: distance * 0.7
  }
}

export const getOptimalCameraTarget = (roomDimensions: { width: number; height: number; depth: number }): Vector3 => {
  return {
    x: 0,
    y: roomDimensions.height / 3, // Смотрим чуть выше пола
    z: 0
  }
}

// Проверка производительности устройства
export const getDevicePerformanceLevel = (): 'low' | 'medium' | 'high' => {
  // Простая эвристика на основе доступных возможностей
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
  
  if (!gl) return 'low'
  
  const renderer = gl.getParameter(gl.RENDERER) || ''
  const vendor = gl.getParameter(gl.VENDOR) || ''
  
  // Проверяем мощность GPU
  if (renderer.includes('Intel') && !renderer.includes('Iris')) {
    return 'low'
  }
  
  if (renderer.includes('Mali') || renderer.includes('Adreno')) {
    return 'medium'
  }
  
  return 'high'
}

// Настройки качества в зависимости от производительности
export const getQualitySettings = (performanceLevel: 'low' | 'medium' | 'high') => {
  switch (performanceLevel) {
    case 'low':
      return {
        shadowMapSize: 512,
        antialias: false,
        dpr: 1,
        maxLights: 2
      }
    case 'medium':
      return {
        shadowMapSize: 1024,
        antialias: true,
        dpr: 1.5,
        maxLights: 4
      }
    case 'high':
      return {
        shadowMapSize: 2048,
        antialias: true,
        dpr: 2,
        maxLights: 6
      }
  }
}

// ============================================
// ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ 3D
// ============================================

// Константы для LOD
export const LOD_DISTANCES = {
  HIGH: 5,    // Высокая детализация до 5 метров
  MEDIUM: 15, // Средняя до 15 метров
  LOW: 30     // Низкая до 30 метров
}

export type LODLevel = 'high' | 'medium' | 'low'

// Утилиты для LOD
export const getLODLevel = (distance: number): LODLevel => {
  if (distance < LOD_DISTANCES.HIGH) return 'high'
  if (distance < LOD_DISTANCES.MEDIUM) return 'medium'
  return 'low'
}

export const getLODDistance = (level: LODLevel): number => {
  switch (level) {
    case 'high': return LOD_DISTANCES.HIGH
    case 'medium': return LOD_DISTANCES.MEDIUM
    case 'low': return Infinity
  }
}

// Менеджер загрузки 3D моделей с lazy loading
class ModelLoaderManager {
  private cache = new Map<string, unknown>()
  private loading = new Map<string, Promise<unknown>>()
  private loadedCount = 0

  async loadModel(url: string): Promise<unknown> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!
    }

    if (this.loading.has(url)) {
      return this.loading.get(url)!
    }

    const loadPromise = import('three/examples/jsm/loaders/GLTFLoader.js').then(async ({ GLTFLoader }) => {
      const loader = new GLTFLoader()
      try {
        const gltf = await new Promise<unknown>((resolve, reject) => {
          loader.load(
            url,
            resolve,
            (progress) => {
              // Loading progress
            },
            reject
          )
        })
        this.cache.set(url, gltf)
        this.loadedCount++
        return gltf
      } catch (error) {
        this.loading.delete(url)
        throw error
      }
    })

    this.loading.set(url, loadPromise as Promise<unknown>)
    return loadPromise
  }

  isCached(url: string): boolean {
    return this.cache.has(url)
  }

  getCacheSize(): number {
    return this.cache.size
  }

  getLoadedCount(): number {
    return this.loadedCount
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const modelLoader = new ModelLoaderManager()

// Preloader для популярной мебели
class FurniturePreloader {
  private popularItems: string[] = [
    'sofa_modern_001',
    'chair_classic_001',
    'table_dining_001',
    'bed_standard_001',
    'shelf_bookshelf_001',
    'lamp_floor_001',
    'rug_area_001',
    'plant_potted_001'
  ]
  private preloadedItems = new Set<string>()
  private isPreloading = false

  async preload(popularFurnitureIds?: string[]): Promise<void> {
    if (this.isPreloading) return
    this.isPreloading = true

    const itemsToPreload = popularFurnitureIds || this.popularItems

    for (const itemId of itemsToPreload) {
      if (this.preloadedItems.has(itemId)) continue

      const { FURNITURE_DATABASE } = await import('./data/furniture-database')
      const item = FURNITURE_DATABASE.find(f => f.id === itemId)

      if (item?.modelUrl) {
        try {
          await modelLoader.loadModel(item.modelUrl)
          this.preloadedItems.add(itemId)
        } catch (error) {
          console.warn(`Failed to preload ${itemId}:`, error)
        }
      }
    }

    this.isPreloading = false
  }

  isPreloaded(itemId: string): boolean {
    return this.preloadedItems.has(itemId)
  }

  getPreloadedCount(): number {
    return this.preloadedItems.size
  }
}

export const furniturePreloader = new FurniturePreloader()

// Оптимизация текстур
export const getOptimizedTextureSettings = (performanceLevel: 'low' | 'medium' | 'high') => {
  switch (performanceLevel) {
    case 'low':
      return {
        format: 6408, // RGBAFormat fallback
        maxMipmapLevel: 0,
        anisotropy: 1,
        quality: 0.5
      }
    case 'medium':
      return {
        format: 6408,
        maxMipmapLevel: 1,
        anisotropy: 4,
        quality: 0.75
      }
    case 'high':
      return {
        format: undefined, // Auto format
        maxMipmapLevel: undefined,
        anisotropy: 16,
        quality: 1
      }
  }
}

// Утилиты для Frustum Culling
export const createFrustumChecker = (camera: THREE.Camera) => {
  const frustum = new THREE.Frustum()
  const projScreenMatrix = new THREE.Matrix4()

  return {
    check: (object: THREE.Object3D): boolean => {
      projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
      frustum.setFromProjectionMatrix(projScreenMatrix)
      return frustum.containsPoint(object.position)
    },
    checkMany: (objects: THREE.Object3D[]): THREE.Object3D[] => {
      projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
      frustum.setFromProjectionMatrix(projScreenMatrix)

      return objects.filter(obj => {
        if (!obj.geometry) return true
        const boundingSphere = new THREE.Sphere()
        obj.geometry.computeBoundingSphere()
        if (obj.geometry.boundingSphere) {
          boundingSphere.copy(obj.geometry.boundingSphere)
          boundingSphere.applyMatrix4(obj.matrixWorld)
          return frustum.intersectsSphere(boundingSphere)
        }
        return true
      })
    }
  }
}

// Утилиты для debounce обновлений
export const createDebouncedUpdate = (delay: number = 100) => {
  let timeoutId: NodeJS.Timeout | null = null

  return (callback: () => void) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(callback, delay)
  }
}

// Настройки рендеринга для разных сценариев
export const RENDER_PRESETS = {
  INTERACTIVE: {
    antialias: true,
    powerPreference: 'high-performance',
    stencil: false,
    depth: true
  },
  STATIC: {
    antialias: true,
    powerPreference: 'low-power',
    stencil: false,
    depth: true
  },
  MOBILE: {
    antialias: false,
    powerPreference: 'low-power',
    stencil: false,
    depth: true
  }
}