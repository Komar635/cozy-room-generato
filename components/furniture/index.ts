// Экспорт всех компонентов каталога мебели
export { FurnitureLibrary } from './furniture-library'
export { FurnitureGrid } from './furniture-grid'
export { FurnitureCard } from './furniture-card'
export { CategoryTabs } from './category-tabs'
export { CategorySettings } from './category-settings'

// Экспорт базы данных мебели
export { 
  FURNITURE_DATABASE,
  getFurnitureByCategory,
  getFurnitureByStyle,
  getFurnitureByPriceRange,
  searchFurniture,
  getFurnitureById,
  getCategoryStats
} from '../../lib/data/furniture-database'