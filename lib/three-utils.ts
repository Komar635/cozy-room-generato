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
  const distance = Math.max(maxDimension * 1.5, 8)
  
  return {
    x: distance,
    y: distance * 0.7,
    z: distance
  }
}

export const getOptimalCameraTarget = (roomDimensions: { width: number; height: number; depth: number }): Vector3 => {
  return {
    x: 0,
    y: roomDimensions.height / 2,
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