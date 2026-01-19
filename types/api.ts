import { FurnitureItem, RoomStyle, RoomDimensions } from './room'

// Типы для RoomGPT API
export interface RoomGPTRequest {
  roomDimensions: RoomDimensions
  style: RoomStyle
  budget: number
  existingFurniture?: FurnitureItem[]
}

export interface RoomGPTResponse {
  recommendations: FurnitureItem[]
  layoutSuggestions: LayoutSuggestion[]
  budgetAnalysis: BudgetAnalysis
}

export interface LayoutSuggestion {
  id: string
  name: string
  description: string
  furniture: FurnitureItem[]
  totalCost: number
  styleMatch: number // 0-100%
}

export interface BudgetAnalysis {
  currentSpending: number
  recommendedSpending: number
  savings: number
  optimizations: OptimizationSuggestion[]
}

export interface OptimizationSuggestion {
  type: 'replace' | 'remove' | 'downgrade'
  originalItem: FurnitureItem
  suggestedItem?: FurnitureItem
  savings: number
  reason: string
  impact: 'low' | 'medium' | 'high'
}

// Типы для поиска и фильтрации
export interface SearchFilters {
  query?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  style?: RoomStyle
  color?: string
  inStock?: boolean
}

export interface SearchResult {
  items: FurnitureItem[]
  totalCount: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Типы для экспорта проекта
export interface ExportOptions {
  format: 'json' | 'pdf' | 'image'
  includeImages: boolean
  includePrices: boolean
  includeLayout: boolean
}

export interface ExportResult {
  success: boolean
  data?: string | Blob
  error?: string
}

// Типы для ошибок API
export interface APIError {
  code: string
  message: string
  details?: Record<string, any>
}

// Типы для состояния загрузки
export interface LoadingState {
  isLoading: boolean
  progress?: number
  message?: string
}

// Типы для уведомлений
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  actions?: NotificationAction[]
}

export interface NotificationAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary'
}