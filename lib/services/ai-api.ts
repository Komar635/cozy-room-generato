import { RoomDimensions, RoomStyle, FurnitureItem } from '@/types/room'
import { LocalAIService } from './local-ai'

export class AIApiService {
  private static baseUrl = '/api/ai'

  /**
   * Получение рекомендаций ИИ по мебели
   * Использует локальный ИИ как основной, внешние API как дополнение
   */
  static async getRecommendations(params: {
    roomDimensions: RoomDimensions
    style: RoomStyle
    budget: number
    existingFurniture?: FurnitureItem[]
  }) {
    try {
      // Всегда используем локальный ИИ (работает бесплатно навсегда)
      const localResult = LocalAIService.getFurnitureRecommendations(params)
      
      if (localResult.success) {
        return localResult.data
      }

      // Fallback на API (если локальный ИИ не сработал)
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
      console.error('Ошибка получения рекомендаций ИИ:', error)
      
      // Последний fallback - всегда работающий локальный ИИ
      const localResult = LocalAIService.getFurnitureRecommendations(params)
      return localResult.data
    }
  }

  /**
   * Генерация дизайна комнаты (локальный ИИ)
   */
  static async generateRoomDesign(params: {
    roomDimensions: RoomDimensions
    style: RoomStyle
    budget: number
    preferences?: string[]
  }) {
    try {
      // Используем локальный ИИ для генерации планировки
      return LocalAIService.generateRoomLayout(params)
    } catch (error) {
      console.error('Ошибка генерации дизайна:', error)
      throw error
    }
  }

  /**
   * Оптимизация бюджета (локальный ИИ)
   */
  static async optimizeBudget(params: {
    currentFurniture: FurnitureItem[]
    targetBudget: number
    currentBudget: number
  }) {
    try {
      return LocalAIService.optimizeBudget(params)
    } catch (error) {
      console.error('Ошибка оптимизации бюджета:', error)
      throw error
    }
  }

  /**
   * Генерация изображения комнаты (заглушка для локального использования)
   */
  static async generateRoomImage(params: {
    roomDescription: string
    style: RoomStyle
    dimensions: RoomDimensions
  }) {
    // Для локального использования возвращаем заглушку
    return {
      success: true,
      data: {
        imageUrl: null,
        message: 'Генерация изображений доступна только с внешними API (Replicate, OpenAI)',
        suggestion: 'Используйте 3D предпросмотр для визуализации комнаты',
        source: 'local-fallback'
      }
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
      console.error('Ошибка оптимизации бюджета:', error)
      throw error
    }
  }
}