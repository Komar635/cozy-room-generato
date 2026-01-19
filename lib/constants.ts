import { FurnitureCategory, RoomStyle } from '../types/room'

// Константы для бюджета
export const BUDGET_CONSTANTS = {
  DEFAULT_BUDGET: 100000, // 100к рублей
  WARNING_THRESHOLD: 1000, // 1к рублей - начало буферной зоны
  MAX_OVERSPEND: 10000,    // 10к рублей - максимальное превышение
  MIN_BUDGET: 10000,       // 10к рублей - минимальный бюджет
  MAX_BUDGET: 10000000     // 10млн рублей - максимальный бюджет
} as const

// Константы для комнаты
export const ROOM_CONSTANTS = {
  MIN_DIMENSION: 1,        // 1 метр - минимальный размер
  MAX_DIMENSION: 20,       // 20 метров - максимальный размер
  DEFAULT_WIDTH: 4,        // 4 метра - ширина по умолчанию
  DEFAULT_HEIGHT: 3,       // 3 метра - высота по умолчанию
  DEFAULT_DEPTH: 4,        // 4 метра - глубина по умолчанию
  GRID_SIZE: 0.1          // 10 см - размер сетки для привязки
} as const

// Названия категорий на русском
export const CATEGORY_NAMES: Record<FurnitureCategory, string> = {
  [FurnitureCategory.FURNITURE]: 'Мебель',
  [FurnitureCategory.TEXTILE]: 'Текстиль',
  [FurnitureCategory.DECOR]: 'Декор',
  [FurnitureCategory.LIGHTING]: 'Освещение',
  [FurnitureCategory.PLANTS]: 'Растения',
  [FurnitureCategory.APPLIANCES]: 'Техника'
}

// Названия стилей на русском
export const STYLE_NAMES: Record<RoomStyle, string> = {
  [RoomStyle.SCANDINAVIAN]: 'Скандинавский',
  [RoomStyle.LOFT]: 'Лофт',
  [RoomStyle.CLASSIC]: 'Классика',
  [RoomStyle.MODERN]: 'Современный',
  [RoomStyle.MINIMALIST]: 'Минимализм'
}

// Описания стилей
export const STYLE_DESCRIPTIONS: Record<RoomStyle, string> = {
  [RoomStyle.SCANDINAVIAN]: 'Светлые тона, натуральные материалы, функциональность',
  [RoomStyle.LOFT]: 'Индустриальные элементы, открытые пространства, кирпич и металл',
  [RoomStyle.CLASSIC]: 'Элегантность, симметрия, качественные материалы',
  [RoomStyle.MODERN]: 'Чистые линии, современные технологии, минимум декора',
  [RoomStyle.MINIMALIST]: 'Простота, функциональность, максимум свободного пространства'
}

// Цветовые схемы для стилей
export const STYLE_COLOR_SCHEMES: Record<RoomStyle, string[]> = {
  [RoomStyle.SCANDINAVIAN]: ['#FFFFFF', '#F5F5F5', '#E8E8E8', '#D3D3D3', '#8B7355'],
  [RoomStyle.LOFT]: ['#2C2C2C', '#4A4A4A', '#8B4513', '#CD853F', '#A0522D'],
  [RoomStyle.CLASSIC]: ['#F5F5DC', '#DEB887', '#D2691E', '#8B4513', '#654321'],
  [RoomStyle.MODERN]: ['#FFFFFF', '#000000', '#808080', '#C0C0C0', '#4169E1'],
  [RoomStyle.MINIMALIST]: ['#FFFFFF', '#F8F8FF', '#E6E6FA', '#D3D3D3', '#696969']
}

// Иконки для категорий (Lucide React)
export const CATEGORY_ICONS: Record<FurnitureCategory, string> = {
  [FurnitureCategory.FURNITURE]: 'Armchair',
  [FurnitureCategory.TEXTILE]: 'Shirt',
  [FurnitureCategory.DECOR]: 'Palette',
  [FurnitureCategory.LIGHTING]: 'Lightbulb',
  [FurnitureCategory.PLANTS]: 'TreePine',
  [FurnitureCategory.APPLIANCES]: 'Tv'
}

// Настройки 3D сцены
export const SCENE_CONSTANTS = {
  CAMERA_FOV: 75,
  CAMERA_NEAR: 0.1,
  CAMERA_FAR: 1000,
  CAMERA_POSITION: { x: 5, y: 5, z: 5 },
  AMBIENT_LIGHT_INTENSITY: 0.6,
  DIRECTIONAL_LIGHT_INTENSITY: 0.8,
  DIRECTIONAL_LIGHT_POSITION: { x: 10, y: 10, z: 5 }
} as const

// Настройки производительности
export const PERFORMANCE_CONSTANTS = {
  MAX_FURNITURE_ITEMS: 100,    // Максимальное количество предметов
  LOD_DISTANCES: [5, 15, 30],  // Расстояния для LOD
  FRUSTUM_CULLING: true,       // Включить frustum culling
  SHADOW_MAP_SIZE: 2048        // Размер карты теней
} as const