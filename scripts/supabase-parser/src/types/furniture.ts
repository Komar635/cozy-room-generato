// Типы для парсера мебели

export interface ParsedFurnitureItem {
  source: string
  external_id: string
  name: string
  price: number
  rating?: number
  reviews_count?: number
  brand?: string
  url: string
  images: string[]
  availability: boolean
  category: string
  parsed_at: Date
  old_price?: number
  article?: string
  description?: string
  characteristics?: string[]
  dimensions?: {
    width?: number
    height?: number
    depth?: number
  }
}

export interface ProcessedFurnitureItem {
  id?: string
  name: string
  slug: string
  category_id: string
  brand_id: string
  width_cm?: number
  height_cm?: number
  depth_cm?: number
  weight_kg?: number
  color?: string
  material?: string
  style?: string
  price_min: number
  price_avg: number
  price_max: number
  main_image_url?: string
  images_urls?: string[]
  description?: string
  features?: string[]
  is_active: boolean
}

export interface PriceSourceData {
  furniture_item_id: string
  source_name: string
  source_url: string
  price: number
  availability: boolean
  rating?: number
  reviews_count?: number
}

export interface CategoryData {
  name: string
  slug: string
  description?: string
}

export interface BrandData {
  name: string
  country?: string
  website?: string
}

export interface ProcessingResult {
  processedItems: Array<{ id: string; action: string }>
  errors: Array<{ product: string; error: string }>
}

export interface ParsingStats {
  totalItems: number
  recentItems: number
  categories: number
  brands: number
}

// Enum для источников данных
export enum DataSource {
  WILDBERRIES = 'wildberries',
  OZON = 'ozon',
  HOFF = 'hoff',
  MNOGOMEBELI = 'mnogomebeli'
}

// Enum для категорий мебели (соответствует базе данных)
export enum FurnitureCategory {
  SOFAS_CHAIRS = 'sofas-chairs',
  TABLES = 'tables',
  WARDROBES_SHELVES = 'wardrobes-shelves',
  BEDS = 'beds',
  CHAIRS = 'chairs',
  DRESSERS_CABINETS = 'dressers-cabinets',
  DECOR = 'decor',
  LIGHTING = 'lighting',
  TEXTILES = 'textiles',
  KIDS_FURNITURE = 'kids-furniture'
}

// Маппинг категорий
export const CATEGORY_MAPPING: Record<string, FurnitureCategory> = {
  'диван': FurnitureCategory.SOFAS_CHAIRS,
  'кресло': FurnitureCategory.SOFAS_CHAIRS,
  'софа': FurnitureCategory.SOFAS_CHAIRS,
  'стол': FurnitureCategory.TABLES,
  'столик': FurnitureCategory.TABLES,
  'шкаф': FurnitureCategory.WARDROBES_SHELVES,
  'стеллаж': FurnitureCategory.WARDROBES_SHELVES,
  'гардероб': FurnitureCategory.WARDROBES_SHELVES,
  'кровать': FurnitureCategory.BEDS,
  'матрас': FurnitureCategory.BEDS,
  'стул': FurnitureCategory.CHAIRS,
  'табурет': FurnitureCategory.CHAIRS,
  'комод': FurnitureCategory.DRESSERS_CABINETS,
  'тумба': FurnitureCategory.DRESSERS_CABINETS,
  'светильник': FurnitureCategory.LIGHTING,
  'лампа': FurnitureCategory.LIGHTING,
  'люстра': FurnitureCategory.LIGHTING,
  'ковер': FurnitureCategory.TEXTILES,
  'штора': FurnitureCategory.TEXTILES,
  'подушка': FurnitureCategory.TEXTILES
}

// Названия категорий на русском
export const CATEGORY_NAMES: Record<FurnitureCategory, string> = {
  [FurnitureCategory.SOFAS_CHAIRS]: 'Диваны и кресла',
  [FurnitureCategory.TABLES]: 'Столы',
  [FurnitureCategory.WARDROBES_SHELVES]: 'Шкафы и стеллажи',
  [FurnitureCategory.BEDS]: 'Кровати',
  [FurnitureCategory.CHAIRS]: 'Стулья',
  [FurnitureCategory.DRESSERS_CABINETS]: 'Комоды и тумбы',
  [FurnitureCategory.DECOR]: 'Декор и аксессуары',
  [FurnitureCategory.LIGHTING]: 'Освещение',
  [FurnitureCategory.TEXTILES]: 'Текстиль',
  [FurnitureCategory.KIDS_FURNITURE]: 'Детская мебель'
}