// Экспорт всех типов для удобного импорта
export * from './room'
export * from './api'

// Переэкспорт основных типов для обратной совместимости
export type {
  Vector3,
  RoomDimensions,
  FurnitureItem,
  RoomProject,
  FurnitureCategory,
  RoomStyle
} from './room'

export type {
  SearchFilters,
  SearchResult,
  ExportOptions,
  ExportResult,
  Notification,
  LoadingState
} from './api'