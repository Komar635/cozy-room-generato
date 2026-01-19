import { FurnitureItem, FurnitureCategory, RoomStyle, Vector3 } from '../types/room'
import { generateId } from './three-utils'

// Создание нового предмета мебели
export const createFurnitureItem = (
  name: string,
  category: FurnitureCategory,
  price: number,
  dimensions: { width: number; height: number; depth: number },
  options: {
    position?: Vector3
    rotation?: Vector3
    modelUrl?: string
    thumbnailUrl?: string
    style?: RoomStyle[]
    color?: string
  } = {}
): FurnitureItem => ({
  id: generateId(),
  name,
  category,
  price,
  dimensions,
  position: options.position || { x: 0, y: 0, z: 0 },
  rotation: options.rotation || { x: 0, y: 0, z: 0 },
  modelUrl: options.modelUrl || '',
  thumbnailUrl: options.thumbnailUrl || '',
  style: options.style || [RoomStyle.MODERN],
  color: options.color || '#ffffff'
})

// Фильтрация мебели по категории
export const filterByCategory = (
  furniture: FurnitureItem[], 
  category: FurnitureCategory
): FurnitureItem[] => {
  return furniture.filter(item => item.category === category)
}

// Фильтрация мебели по стилю
export const filterByStyle = (
  furniture: FurnitureItem[], 
  style: RoomStyle
): FurnitureItem[] => {
  return furniture.filter(item => item.style.includes(style))
}

// Фильтрация мебели по ценовому диапазону
export const filterByPriceRange = (
  furniture: FurnitureItem[], 
  minPrice: number, 
  maxPrice: number
): FurnitureItem[] => {
  return furniture.filter(item => item.price >= minPrice && item.price <= maxPrice)
}

// Поиск мебели по названию
export const searchByName = (
  furniture: FurnitureItem[], 
  query: string
): FurnitureItem[] => {
  const lowerQuery = query.toLowerCase()
  return furniture.filter(item => 
    item.name.toLowerCase().includes(lowerQuery)
  )
}

// Сортировка мебели
export const sortFurniture = (
  furniture: FurnitureItem[], 
  sortBy: 'name' | 'price' | 'category',
  order: 'asc' | 'desc' = 'asc'
): FurnitureItem[] => {
  return [...furniture].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'price':
        comparison = a.price - b.price
        break
      case 'category':
        comparison = a.category.localeCompare(b.category)
        break
    }
    
    return order === 'asc' ? comparison : -comparison
  })
}

// Получение статистики по категориям
export const getCategoryStats = (furniture: FurnitureItem[]) => {
  const stats: Record<FurnitureCategory, { count: number; totalPrice: number }> = {
    [FurnitureCategory.FURNITURE]: { count: 0, totalPrice: 0 },
    [FurnitureCategory.TEXTILE]: { count: 0, totalPrice: 0 },
    [FurnitureCategory.DECOR]: { count: 0, totalPrice: 0 },
    [FurnitureCategory.LIGHTING]: { count: 0, totalPrice: 0 },
    [FurnitureCategory.PLANTS]: { count: 0, totalPrice: 0 },
    [FurnitureCategory.APPLIANCES]: { count: 0, totalPrice: 0 }
  }
  
  furniture.forEach(item => {
    stats[item.category].count++
    stats[item.category].totalPrice += item.price
  })
  
  return stats
}

// Форматирование цены в рублях
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

// Расчет процента от бюджета
export const calculateBudgetPercentage = (spent: number, budget: number): number => {
  if (budget === 0) return 0
  return Math.round((spent / budget) * 100)
}

// Получение рекомендуемого бюджета для категории
export const getRecommendedCategoryBudget = (
  totalBudget: number, 
  category: FurnitureCategory
): number => {
  const budgetDistribution: Record<FurnitureCategory, number> = {
    [FurnitureCategory.FURNITURE]: 0.6,    // 60% - основная мебель
    [FurnitureCategory.LIGHTING]: 0.15,    // 15% - освещение
    [FurnitureCategory.TEXTILE]: 0.1,      // 10% - текстиль
    [FurnitureCategory.DECOR]: 0.08,       // 8% - декор
    [FurnitureCategory.APPLIANCES]: 0.05,  // 5% - техника
    [FurnitureCategory.PLANTS]: 0.02       // 2% - растения
  }
  
  return Math.round(totalBudget * budgetDistribution[category])
}

// Проверка совместимости стилей
export const areStylesCompatible = (style1: RoomStyle, style2: RoomStyle): boolean => {
  const compatibilityMatrix: Record<RoomStyle, RoomStyle[]> = {
    [RoomStyle.SCANDINAVIAN]: [RoomStyle.SCANDINAVIAN, RoomStyle.MINIMALIST, RoomStyle.MODERN],
    [RoomStyle.LOFT]: [RoomStyle.LOFT, RoomStyle.MODERN],
    [RoomStyle.CLASSIC]: [RoomStyle.CLASSIC],
    [RoomStyle.MODERN]: [RoomStyle.MODERN, RoomStyle.MINIMALIST, RoomStyle.SCANDINAVIAN, RoomStyle.LOFT],
    [RoomStyle.MINIMALIST]: [RoomStyle.MINIMALIST, RoomStyle.MODERN, RoomStyle.SCANDINAVIAN]
  }
  
  return compatibilityMatrix[style1]?.includes(style2) || false
}