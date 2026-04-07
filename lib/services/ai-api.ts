import { RoomDimensions, RoomStyle, FurnitureItem } from '@/types/room'
import { AIRecommendationService } from './ai-recommendation-service'

export class AIApiService {
  private static baseUrl = '/api/ai'

  /**
   * Получение рекомендаций ИИ по мебели
   * Использует новый AIRecommendationService с RoomGPT интеграцией
   */
  static async getRecommendations(params: {
    roomDimensions: RoomDimensions
    style: RoomStyle
    budget: number
    existingFurniture?: FurnitureItem[]
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Ошибка получения рекомендаций')
      }

      return result.data
    } catch (error) {
      console.error('Ошибка API рекомендаций:', error)
      
      // Критический fallback - прямое обращение к сервису
      try {
        return await AIRecommendationService.getFurnitureRecommendations(params)
      } catch (fallbackError) {
        throw new Error('Критическая ошибка получения рекомендаций')
      }
    }
  }

  /**
   * Генерация дизайна комнаты
   */
  static async generateRoomDesign(params: {
    roomDimensions: RoomDimensions
    style: RoomStyle
    budget: number
    preferences?: string[]
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/room-design`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Ошибка генерации дизайна')
      }

      return result.data
    } catch (error) {
      console.error('Ошибка API генерации дизайна:', error)
      
      // Критический fallback
      try {
        return await AIRecommendationService.generateRoomDesign(params)
      } catch (fallbackError) {
        throw new Error('Критическая ошибка генерации дизайна')
      }
    }
  }

  /**
   * Оптимизация бюджета с помощью ИИ
   */
  static async optimizeBudget(params: {
    currentFurniture: FurnitureItem[]
    targetBudget: number
    currentBudget: number
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/budget-optimization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Ошибка оптимизации бюджета')
      }

      return result.data
    } catch (error) {
      console.error('Ошибка API оптимизации бюджета:', error)
      
      // Критический fallback
      try {
        return await AIRecommendationService.optimizeBudget(params)
      } catch (fallbackError) {
        throw new Error('Критическая ошибка оптимизации бюджета')
      }
    }
  }

  /**
   * Генерация изображения комнаты
   */
  static async generateRoomImage(params: {
    roomDescription: string
    style: RoomStyle
    dimensions: RoomDimensions
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/image-generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const result = await response.json()
      
      if (!response.ok) {
        // Для генерации изображений нет локального fallback
        return {
          success: false,
          message: result.data?.message || 'Генерация изображений недоступна',
          suggestion: result.data?.suggestion || 'Используйте 3D предпросмотр'
        }
      }

      return result.data
    } catch (error) {
      console.error('Ошибка API генерации изображений:', error)
      return {
        success: false,
        message: 'Сервис генерации изображений недоступен',
        suggestion: 'Используйте 3D предпросмотр для визуализации'
      }
    }
  }

  /**
   * Анализ стиля и соответствия
   */
  static analyzeStyleConsistency(params: {
    selectedStyle: RoomStyle
    currentFurniture: FurnitureItem[]
  }) {
    return AIRecommendationService.analyzeStyleConsistency(params)
  }

  /**
   * Проверка статуса ИИ сервисов
   */
  static async checkAIStatus() {
    return await AIRecommendationService.checkAIServicesStatus()
  }
}