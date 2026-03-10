import { FurnitureItem, FurnitureCategory, RoomStyle } from '../types/room'

/**
 * Утилиты для работы с мебелью
 */

/**
 * Форматирование цены в рублях
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

/**
 * Форматирование размеров мебели
 */
export function formatDimensions(dimensions: { width: number; height: number; depth: number }): string {
  const { width, height, depth } = dimensions
  return `${width}×${height}×${depth} м`
}

/**
 * Вычисление площади предмета (для размещения)
 */
export function calculateFootprint(item: FurnitureItem): number {
  return item.dimensions.width * item.dimensions.depth
}

/**
 * Вычисление объема предмета
 */
export function calculateVolume(item: FurnitureItem): number {
  const { width, height, depth } = item.dimensions
  return width * height * depth
}

/**
 * Проверка совместимости предмета со стилем
 */
export function isCompatibleWithStyle(item: FurnitureItem, style: RoomStyle): boolean {
  return item.style.includes(style)
}

/**
 * Получение основного стиля предмета
 */
export function getPrimaryStyle(item: FurnitureItem): RoomStyle {
  return item.style[0] || RoomStyle.MODERN
}

/**
 * Группировка предметов по категориям
 */
export function groupByCategory(items: FurnitureItem[]): Record<FurnitureCategory, FurnitureItem[]> {
  const groups = {} as Record<FurnitureCategory, FurnitureItem[]>
  
  // Инициализируем все категории пустыми массивами
  Object.values(FurnitureCategory).forEach(category => {
    groups[category] = []
  })
  
  // Группируем предметы
  items.forEach(item => {
    groups[item.category].push(item)
  })
  
  return groups
}

/**
 * Группировка предметов по стилям
 */
export function groupByStyle(items: FurnitureItem[]): Record<RoomStyle, FurnitureItem[]> {
  const groups = {} as Record<RoomStyle, FurnitureItem[]>
  
  // Инициализируем все стили пустыми массивами
  Object.values(RoomStyle).forEach(style => {
    groups[style] = []
  })
  
  // Группируем предметы (предмет может быть в нескольких группах)
  items.forEach(item => {
    item.style.forEach(style => {
      groups[style].push(item)
    })
  })
  
  return groups
}

/**
 * Сортировка предметов по цене
 */
export function sortByPrice(items: FurnitureItem[], ascending: boolean = true): FurnitureItem[] {
  return [...items].sort((a, b) => {
    return ascending ? a.price - b.price : b.price - a.price
  })
}

/**
 * Сортировка предметов по названию
 */
export function sortByName(items: FurnitureItem[], ascending: boolean = true): FurnitureItem[] {
  return [...items].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name, 'ru')
    return ascending ? comparison : -comparison
  })
}

/**
 * Фильтрация по диапазону цен
 */
export function filterByPriceRange(
  items: FurnitureItem[], 
  minPrice: number, 
  maxPrice: number
): FurnitureItem[] {
  return items.filter(item => item.price >= minPrice && item.price <= maxPrice)
}

/**
 * Фильтрация по размерам (максимальные размеры)
 */
export function filterByMaxDimensions(
  items: FurnitureItem[],
  maxWidth: number,
  maxHeight: number,
  maxDepth: number
): FurnitureItem[] {
  return items.filter(item => 
    item.dimensions.width <= maxWidth &&
    item.dimensions.height <= maxHeight &&
    item.dimensions.depth <= maxDepth
  )
}

/**
 * Поиск похожих предметов по стилю и категории
 */
export function findSimilarItems(
  targetItem: FurnitureItem,
  allItems: FurnitureItem[],
  limit: number = 5
): FurnitureItem[] {
  return allItems
    .filter(item => 
      item.id !== targetItem.id && // Исключаем сам предмет
      (item.category === targetItem.category || // Та же категория
       item.style.some(style => targetItem.style.includes(style))) // Общие стили
    )
    .slice(0, limit)
}

/**
 * Вычисление средней цены по категории
 */
export function getAveragePrice(items: FurnitureItem[]): number {
  if (items.length === 0) return 0
  const total = items.reduce((sum, item) => sum + item.price, 0)
  return Math.round(total / items.length)
}

/**
 * Получение диапазона цен
 */
export function getPriceRange(items: FurnitureItem[]): { min: number; max: number } {
  if (items.length === 0) return { min: 0, max: 0 }
  
  const prices = items.map(item => item.price)
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  }
}

/**
 * Создание уникального ID для размещенного предмета
 */
export function generatePlacedItemId(originalId: string): string {
  return `${originalId}_placed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Проверка, помещается ли предмет в комнату
 */
export function fitsInRoom(
  item: FurnitureItem,
  roomWidth: number,
  roomDepth: number,
  roomHeight: number
): boolean {
  return (
    item.dimensions.width <= roomWidth &&
    item.dimensions.depth <= roomDepth &&
    item.dimensions.height <= roomHeight
  )
}

/**
 * Получение рекомендуемого расстояния от стен
 */
export function getRecommendedWallDistance(item: FurnitureItem): number {
  // Рекомендуемые расстояния в метрах
  switch (item.category) {
    case FurnitureCategory.FURNITURE:
      return 0.3 // 30 см для мебели
    case FurnitureCategory.APPLIANCES:
      return 0.2 // 20 см для техники
    case FurnitureCategory.PLANTS:
      return 0.1 // 10 см для растений
    default:
      return 0.15 // 15 см по умолчанию
  }
}

/**
 * Валидация данных предмета мебели
 */
export function validateFurnitureItem(item: Partial<FurnitureItem>): string[] {
  const errors: string[] = []
  
  if (!item.name || item.name.trim().length === 0) {
    errors.push('Название предмета обязательно')
  }
  
  if (!item.category) {
    errors.push('Категория предмета обязательна')
  }
  
  if (!item.price || item.price <= 0) {
    errors.push('Цена должна быть положительным числом')
  }
  
  if (!item.dimensions) {
    errors.push('Размеры предмета обязательны')
  } else {
    if (item.dimensions.width <= 0 || item.dimensions.height <= 0 || item.dimensions.depth <= 0) {
      errors.push('Все размеры должны быть положительными числами')
    }
  }
  
  if (!item.style || item.style.length === 0) {
    errors.push('Предмет должен иметь хотя бы один стиль')
  }
  
  return errors
}