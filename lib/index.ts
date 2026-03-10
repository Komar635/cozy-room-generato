// Экспорт всех утилитарных функций
export * from './three-utils'
export * from './furniture-utils'
export * from './constants'

// Экспорт сервисов API
export * from './services/room-api'
export * from './services/ai-api'

// Переэкспорт основных функций для удобства
export {
  createVector3,
  vector3ToThree,
  threeToVector3,
  addVectors,
  subtractVectors,
  distanceBetweenPoints,
  checkAABBCollision,
  isPointInRoom,
  clampToRoom,
  snapToGrid
} from './three-utils'

export {
  formatPrice,
  formatDimensions,
  calculateFootprint,
  calculateVolume,
  isCompatibleWithStyle,
  getPrimaryStyle,
  groupByCategory,
  groupByStyle,
  sortByPrice,
  sortByName,
  filterByPriceRange,
  filterByMaxDimensions,
  findSimilarItems,
  getAveragePrice,
  getPriceRange,
  generatePlacedItemId,
  fitsInRoom,
  getRecommendedWallDistance,
  validateFurnitureItem
} from './furniture-utils'

export {
  BUDGET_CONSTANTS,
  ROOM_CONSTANTS,
  CATEGORY_NAMES,
  STYLE_NAMES,
  STYLE_DESCRIPTIONS
} from './constants'