import { FurnitureItem, FurnitureCategory, RoomStyle, SizeCategory } from '../../types/room'

// Временная база данных для демонстрации (пока не настроен Supabase)
export const FURNITURE_DATABASE: FurnitureItem[] = [
  // МЕБЕЛЬ
  {
    id: 'sofa-scandinavian-1',
    name: 'Диван IKEA FRIHETEN угловой',
    category: FurnitureCategory.FURNITURE,
    price: 45000,
    dimensions: { width: 2.3, height: 0.8, depth: 1.5 },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    modelUrl: '/models/furniture/sofa-scandinavian.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop',
    style: [RoomStyle.SCANDINAVIAN, RoomStyle.MODERN],
    color: 'Светло-серый'
  },
  {
    id: 'armchair-classic-1',
    name: 'Кресло STRANDMON классическое',
    category: FurnitureCategory.FURNITURE,
    price: 28000,
    dimensions: { width: 0.8, height: 1.0, depth: 0.9 },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    modelUrl: '/models/furniture/armchair-classic.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=300&h=200&fit=crop',
    style: [RoomStyle.CLASSIC, RoomStyle.LOFT],
    color: 'Коричневый'
  },
  {
    id: 'coffee-table-modern-1',
    name: 'Столик LACK журнальный белый',
    category: FurnitureCategory.FURNITURE,
    price: 15000,
    dimensions: { width: 1.2, height: 0.4, depth: 0.6 },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    modelUrl: '/models/furniture/coffee-table-modern.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1549497538-303791108f95?w=300&h=200&fit=crop',
    style: [RoomStyle.MODERN, RoomStyle.MINIMALIST],
    color: 'Белый'
  },
  {
    id: 'bookshelf-loft-1',
    name: 'Стеллаж IVAR сосна необработанная',
    category: FurnitureCategory.FURNITURE,
    price: 22000,
    dimensions: { width: 1.5, height: 2.0, depth: 0.4 },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    modelUrl: '/models/furniture/bookshelf-loft.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300&h=200&fit=crop',
    style: [RoomStyle.LOFT, RoomStyle.MODERN],
    color: 'Натуральное дерево'
  },
  {
    id: 'dining-table-classic-1',
    name: 'Стол MÖRBYLÅNGA обеденный дубовый',
    category: FurnitureCategory.FURNITURE,
    price: 35000,
    dimensions: { width: 1.8, height: 0.75, depth: 1.0 },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    modelUrl: '/models/furniture/dining-table-classic.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=300&h=200&fit=crop',
    style: [RoomStyle.CLASSIC, RoomStyle.SCANDINAVIAN],
    color: 'Дуб'
  },

  // ТЕКСТИЛЬ
  {
    id: 'rug-scandinavian-1',
    name: 'Ковер STOCKHOLM геометрический узор',
    category: FurnitureCategory.TEXTILE,
    price: 8500,
    dimensions: { width: 2.0, height: 0.01, depth: 3.0 },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    modelUrl: '/models/textile/rug-scandinavian.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=300&h=200&fit=crop',
    style: [RoomStyle.SCANDINAVIAN, RoomStyle.MODERN],
    color: 'Серо-белый'
  },
  {
    id: 'curtains-classic-1',
    name: 'Шторы SANELA бархатные',
    category: FurnitureCategory.TEXTILE,
    price: 12000,
    dimensions: { width: 2.5, height: 2.7, depth: 0.1 },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    modelUrl: '/models/textile/curtains-classic.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
    style: [RoomStyle.CLASSIC, RoomStyle.LOFT],
    color: 'Темно-синий'
  },
  {
    id: 'pillows-modern-1',
    name: 'Подушки GURLI декоративные набор',
    category: FurnitureCategory.TEXTILE,
    price: 3500,
    dimensions: { width: 0.5, height: 0.1, depth: 0.5 },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    modelUrl: '/models/textile/pillows-modern.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=200&fit=crop',
    style: [RoomStyle.MODERN, RoomStyle.SCANDINAVIAN],
    color: 'Разноцветный'
  },

  // ДЕКОР
  {
    id: 'painting-abstract-1',
    name: 'Картина BJÖRKSTA абстракция в раме',
    category: FurnitureCategory.DECOR,
    price: 7500,
    dimensions: { width: 1.2, height: 0.8, depth: 0.05 },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    modelUrl: '/models/decor/painting-abstract.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&h=200&fit=crop',
    style: [RoomStyle.MODERN, RoomStyle.LOFT],
    color: 'Многоцветный'
  },
  {
    id: 'vase-ceramic-1',
    name: 'Ваза CHILIFRUKT керамическая',
    category: FurnitureCategory.DECOR,
    price: 4200,
    dimensions: { width: 0.3, height: 0.6, depth: 0.3 },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    modelUrl: '/models/decor/vase-ceramic.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop',
    style: [RoomStyle.SCANDINAVIAN, RoomStyle.MINIMALIST],
    color: 'Белый'
  },

  // ОСВЕЩЕНИЕ
  {
    id: 'chandelier-modern-1',
    name: 'Люстра FOTO LED подвесная',
    category: FurnitureCategory.LIGHTING,
    price: 18500,
    dimensions: { width: 0.8, height: 0.6, depth: 0.8 },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    modelUrl: '/models/lighting/chandelier-modern.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=300&h=200&fit=crop',
    style: [RoomStyle.MODERN, RoomStyle.MINIMALIST],
    color: 'Черный'
  },
  {
    id: 'floor-lamp-loft-1',
    name: 'Торшер FOTO напольный металл',
    category: FurnitureCategory.LIGHTING,
    price: 12500,
    dimensions: { width: 0.4, height: 1.6, depth: 0.4 },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    modelUrl: '/models/lighting/floor-lamp-loft.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop',
    style: [RoomStyle.LOFT, RoomStyle.MODERN],
    color: 'Черный/Медь'
  },

  // РАСТЕНИЯ
  {
    id: 'plant-monstera-1',
    name: 'Монстера FEJKA искусственная в горшке',
    category: FurnitureCategory.PLANTS,
    price: 3800,
    dimensions: { width: 0.6, height: 1.5, depth: 0.6 },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    modelUrl: '/models/plants/monstera-large.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?w=300&h=200&fit=crop',
    style: [RoomStyle.SCANDINAVIAN, RoomStyle.MODERN, RoomStyle.LOFT],
    color: 'Зеленый'
  },
  {
    id: 'plant-ficus-1',
    name: 'Фикус FEJKA в кашпо CHILIFRUKT',
    category: FurnitureCategory.PLANTS,
    price: 2500,
    dimensions: { width: 0.4, height: 1.0, depth: 0.4 },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    modelUrl: '/models/plants/ficus-ceramic.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=200&fit=crop',
    style: [RoomStyle.SCANDINAVIAN, RoomStyle.MINIMALIST],
    color: 'Зеленый/Белый'
  },

  // ТЕХНИКА
  {
    id: 'tv-modern-55-1',
    name: 'Телевизор Samsung 55" QLED 4K',
    category: FurnitureCategory.APPLIANCES,
    price: 65000,
    dimensions: { width: 1.23, height: 0.71, depth: 0.08 },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    modelUrl: '/models/appliances/tv-55-modern.glb',
    thumbnailUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300&h=200&fit=crop',
    style: [RoomStyle.MODERN, RoomStyle.MINIMALIST, RoomStyle.LOFT],
    color: 'Черный'
  }
]

// Функции для работы с локальными данными (временно, пока не настроен Supabase)
export const getFurnitureByCategory = async (category: FurnitureCategory) => {
  // Имитируем асинхронность
  await new Promise(resolve => setTimeout(resolve, 100))
  return FURNITURE_DATABASE.filter(item => item.category === category)
}

// Расширенный поиск с поддержкой фильтров
export const searchFurnitureAdvanced = async (
  query: string,
  filters: {
    categories?: FurnitureCategory[]
    minPrice?: number
    maxPrice?: number
    colors?: string[]
    styles?: RoomStyle[]
    sizeCategories?: SizeCategory[]
  }
) => {
  // Имитируем асинхронность
  await new Promise(resolve => setTimeout(resolve, 100))
  
  let results = FURNITURE_DATABASE

  // Поиск по тексту
  if (query.trim()) {
    const lowercaseQuery = query.toLowerCase()
    results = results.filter(item => 
      item.name.toLowerCase().includes(lowercaseQuery) ||
      item.color.toLowerCase().includes(lowercaseQuery)
    )
  }

  // Фильтр по категориям
  if (filters.categories && filters.categories.length > 0) {
    results = results.filter(item => filters.categories!.includes(item.category))
  }

  // Фильтр по цене
  if (filters.minPrice !== undefined) {
    results = results.filter(item => item.price >= filters.minPrice!)
  }
  if (filters.maxPrice !== undefined) {
    results = results.filter(item => item.price <= filters.maxPrice!)
  }

  // Фильтр по цветам
  if (filters.colors && filters.colors.length > 0) {
    results = results.filter(item => filters.colors!.includes(item.color))
  }

  // Фильтр по стилям
  if (filters.styles && filters.styles.length > 0) {
    results = results.filter(item => 
      item.style.some(style => filters.styles!.includes(style))
    )
  }

  // Фильтр по размерам
  if (filters.sizeCategories && filters.sizeCategories.length > 0) {
    results = results.filter(item => {
      const itemSize = getItemSizeCategory(item)
      return filters.sizeCategories!.includes(itemSize)
    })
  }

  return results
}

// Размерные категории для фильтрации
export const sizeCategoryNames = {
  [SizeCategory.SMALL]: 'Маленький',
  [SizeCategory.MEDIUM]: 'Средний',
  [SizeCategory.LARGE]: 'Большой',
  [SizeCategory.EXTRA_LARGE]: 'Очень большой'
}

// Функция определения размерной категории предмета
export const getItemSizeCategory = (item: FurnitureItem): SizeCategory => {
  const volume = item.dimensions.width * item.dimensions.height * item.dimensions.depth
  
  if (volume <= 0.5) return SizeCategory.SMALL
  if (volume <= 2.0) return SizeCategory.MEDIUM
  if (volume <= 5.0) return SizeCategory.LARGE
  return SizeCategory.EXTRA_LARGE
}

// Фильтрация по размерным категориям
export const getFurnitureBySizeCategories = async (categories: SizeCategory[]) => {
  await new Promise(resolve => setTimeout(resolve, 100))
  
  if (categories.length === 0) return FURNITURE_DATABASE
  
  return FURNITURE_DATABASE.filter(item => {
    const itemSize = getItemSizeCategory(item)
    return categories.includes(itemSize)
  })
}

// Поиск по ID
export const getFurnitureById = async (id: string) => {
  await new Promise(resolve => setTimeout(resolve, 100))
  return FURNITURE_DATABASE.find(item => item.id === id) || null
}

// Статистика по категориям
export const getCategoryStats = async () => {
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const stats: Record<string, any> = {}

  Object.values(FurnitureCategory).forEach(category => {
    const items = FURNITURE_DATABASE.filter(item => item.category === category)
    if (items.length > 0) {
      const prices = items.map(item => item.price)
      stats[category] = {
        count: items.length,
        avgPrice: Math.round(prices.reduce((sum, price) => sum + price, 0) / items.length),
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices)
      }
    }
  })

  return stats
}