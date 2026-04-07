// Базовые типы для 3D координат
export interface Vector3 {
  x: number
  y: number
  z: number
}

// Размеры комнаты
export interface RoomDimensions {
  width: number
  height: number
  depth: number
}

// Категории мебели
export enum FurnitureCategory {
  FURNITURE = 'furniture',
  TEXTILE = 'textile', 
  DECOR = 'decor',
  LIGHTING = 'lighting',
  PLANTS = 'plants',
  APPLIANCES = 'appliances'
}

// Стили интерьера
export enum RoomStyle {
  SCANDINAVIAN = 'scandinavian',
  LOFT = 'loft',
  CLASSIC = 'classic',
  MODERN = 'modern',
  MINIMALIST = 'minimalist'
}

// Размерные категории для фильтрации
export enum SizeCategory {
  SMALL = 'small',
  MEDIUM = 'medium', 
  LARGE = 'large',
  EXTRA_LARGE = 'extra_large'
}

// Предмет мебели
export interface FurnitureItem {
  id: string
  name: string
  category: FurnitureCategory
  price: number
  dimensions: {
    width: number
    height: number
    depth: number
  }
  position: Vector3
  rotation: Vector3
  modelUrl: string
  thumbnailUrl: string
  style: RoomStyle[]
  color: string
}

// Проект комнаты
export interface RoomProject {
  id: string
  name: string
  roomDimensions: RoomDimensions
  furniture: FurnitureItem[]
  budget: number
  style: RoomStyle
  createdAt: Date
  updatedAt: Date
  wallColor?: string
  floorColor?: string
  accentColor?: string
  ambientIntensity?: number
  directionalIntensity?: number
  lightWarmth?: number
}

// Предложения по оптимизации бюджета (базовый тип)
export interface BudgetOptimizationSuggestion {
  originalItem: FurnitureItem
  suggestedItem: FurnitureItem
  savings: number
  reason: string
}

// Предложения по расстановке (базовый тип)
export interface RoomLayoutSuggestion {
  furniture: FurnitureItem[]
  totalCost: number
  description: string
}