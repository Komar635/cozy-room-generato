import { RoomDimensions, RoomStyle, FurnitureItem } from '@/types/room'
import { RoomGPTApiService } from './roomgpt-api'
import { LocalAIService } from './local-ai'
import { STYLE_TEMPLATES, StyleUtils } from '@/lib/data/style-templates'

/**
 * Единый сервис для работы с ИИ рекомендациями
 * Интегрирует RoomGPT API и локальный ИИ с fallback стратегией
 */
export class AIRecommendationService {
  
  /**
   * Получение рекомендаций по мебели с адаптацией под российские цены и стили
   */
  static async getFurnitureRecommendations(params: {
    roomDimensions: RoomDimensions
    style: RoomStyle
    budget: number
    existingFurniture?: FurnitureItem[]
  }) {
    try {
      // Адаптация бюджета под российские реалии и стиль
      const styleRecommendations = StyleUtils.getRecommendedBudget(
        params.style, 
        params.roomDimensions.width * params.roomDimensions.depth
      )
      
      const adaptedParams = {
        ...params,
        budget: Math.max(params.budget, styleRecommendations.min),
        existingFurniture: params.existingFurniture || []
      }

      // Сначала пробуем RoomGPT API
      try {
        const result = await RoomGPTApiService.getFurnitureRecommendations(adaptedParams)
        if (result.success) {
          return this.adaptRecommendationsForRussia(result.data, params.style)
        }
      } catch (error) {
        console.warn('RoomGPT API недоступен, переключаемся на локальный ИИ:', error)
      }

      // Fallback на локальный ИИ с улучшенной поддержкой стилей
      const localResult = LocalAIService.getFurnitureRecommendations(adaptedParams)
      return this.adaptRecommendationsForRussia(localResult.data, params.style)

    } catch (error) {
      console.error('Критическая ошибка получения рекомендаций:', error)
      throw new Error('Не удалось получить рекомендации ИИ')
    }
  }

  /**
   * Оптимизация бюджета с умными предложениями замен с учетом стиля
   */
  static async optimizeBudget(params: {
    currentFurniture: FurnitureItem[]
    targetBudget: number
    currentBudget: number
    style?: RoomStyle
  }) {
    try {
      const overspend = params.currentBudget - params.targetBudget

      if (overspend <= 0) {
        return {
          needsOptimization: false,
          message: 'Бюджет не превышен',
          currency: 'RUB'
        }
      }

      // Сначала пробуем RoomGPT API для умной оптимизации
      try {
        const result = await RoomGPTApiService.optimizeBudget(params)
        if (result.success) {
          return this.adaptBudgetOptimizationForRussia(result.data, params.style)
        }
      } catch (error) {
        console.warn('RoomGPT API недоступен для оптимизации, используем локальный ИИ:', error)
      }

      // Fallback на локальный ИИ с учетом стиля
      const localResult = LocalAIService.optimizeBudget({
        ...params,
        style: params.style
      })
      return this.adaptBudgetOptimizationForRussia(localResult.data, params.style)

    } catch (error) {
      console.error('Критическая ошибка оптимизации бюджета:', error)
      throw new Error('Не удалось оптимизировать бюджет')
    }
  }

  /**
   * Генерация дизайна комнаты с учетом стиля
   */
  static async generateRoomDesign(params: {
    roomDimensions: RoomDimensions
    style: RoomStyle
    budget: number
    preferences?: string[]
  }) {
    try {
      // Адаптация бюджета под стиль
      const styleRecommendations = StyleUtils.getRecommendedBudget(
        params.style, 
        params.roomDimensions.width * params.roomDimensions.depth
      )
      
      const adaptedParams = {
        ...params,
        budget: Math.max(params.budget, styleRecommendations.min)
      }

      // Сначала пробуем RoomGPT API
      try {
        const result = await RoomGPTApiService.generateRoomDesign(adaptedParams)
        if (result.success) {
          return this.adaptDesignForRussia(result.data, params.style)
        }
      } catch (error) {
        console.warn('RoomGPT API недоступен для генерации дизайна, используем локальный ИИ:', error)
      }

      // Fallback на локальный ИИ
      const localResult = LocalAIService.generateRoomLayout(adaptedParams)
      return this.adaptDesignForRussia(localResult.data, params.style)

    } catch (error) {
      console.error('Критическая ошибка генерации дизайна:', error)
      throw new Error('Не удалось сгенерировать дизайн комнаты')
    }
  }

  /**
   * Анализ стиля и соответствия предметов
   */
  static analyzeStyleConsistency(params: {
    selectedStyle: RoomStyle
    currentFurniture: FurnitureItem[]
  }) {
    const { selectedStyle, currentFurniture } = params
    
    const inconsistentItems = currentFurniture.filter(item => {
      // Проверяем соответствие стилю
      if (item.style && Array.isArray(item.style)) {
        return !item.style.includes(selectedStyle)
      }
      
      // Если у предмета нет информации о стиле, проверяем по цвету
      if (item.color) {
        return !StyleUtils.isColorCompatible(item.color, selectedStyle)
      }
      
      return false
    })

    const consistencyScore = currentFurniture.length > 0 
      ? (currentFurniture.length - inconsistentItems.length) / currentFurniture.length 
      : 1

    const template = STYLE_TEMPLATES[selectedStyle]
    
    return {
      consistencyScore,
      isConsistent: consistencyScore >= 0.7,
      inconsistentItems,
      recommendations: inconsistentItems.length > 0 
        ? this.getStyleRecommendations(selectedStyle, inconsistentItems)
        : [],
      message: this.getConsistencyMessage(consistencyScore),
      styleInfo: {
        name: selectedStyle,
        characteristics: template.characteristics,
        colorPalette: template.colorPalette,
        materials: template.materials
      }
    }
  }

  /**
   * Получение рекомендаций по улучшению стиля
   */
  static getStyleImprovementSuggestions(params: {
    selectedStyle: RoomStyle
    currentFurniture: FurnitureItem[]
    roomDimensions: RoomDimensions
    budget: number
  }) {
    const { selectedStyle, currentFurniture, roomDimensions, budget } = params
    const template = STYLE_TEMPLATES[selectedStyle]
    
    // Определяем недостающие категории
    const existingCategories = new Set(currentFurniture.map(item => item.category))
    const priorityFurniture = StyleUtils.getPriorityFurniture(selectedStyle, 5)
    
    const suggestions = priorityFurniture
      .filter(item => !existingCategories.has(item.category as any))
      .map(item => ({
        category: item.category,
        priority: item.priority,
        reason: `Добавьте ${item.category} для завершения стиля ${selectedStyle}`,
        estimatedCost: this.estimateCategoryPrice(item.category, selectedStyle, budget)
      }))
      .sort((a, b) => a.priority - b.priority)

    return {
      suggestions,
      totalEstimatedCost: suggestions.reduce((sum, s) => sum + s.estimatedCost, 0),
      styleTemplate: template,
      canAfford: suggestions.reduce((sum, s) => sum + s.estimatedCost, 0) <= budget * 0.3
    }
  }

  /**
   * Проверка статуса всех ИИ сервисов
   */
  static async checkAIServicesStatus() {
    try {
      const roomgptStatus = await RoomGPTApiService.checkApiStatus()
      
      return {
        roomgpt: roomgptStatus,
        local: {
          available: true,
          hasKey: true,
          message: 'Локальный ИИ всегда доступен с поддержкой стилей'
        },
        recommendation: roomgptStatus.available 
          ? 'Используйте RoomGPT API для лучших результатов'
          : 'Локальный ИИ обеспечит качественную функциональность'
      }
    } catch (error) {
      return {
        roomgpt: { available: false, error: 'Ошибка проверки' },
        local: { available: true, hasKey: true },
        recommendation: 'Используется только локальный ИИ с поддержкой стилей'
      }
    }
  }

  // Приватные методы для адаптации под российский рынок

  private static adaptRecommendationsForRussia(data: any, style: RoomStyle) {
    const template = STYLE_TEMPLATES[style]
    
    return {
      ...data,
      recommendations: data.recommendations?.map((item: any) => ({
        ...item,
        price: Math.round(item.price),
        priceFormatted: this.formatRussianPrice(item.price),
        adaptedForRussia: true,
        styleMatch: item.styleMatch || false,
        styleInfo: {
          selectedStyle: style,
          characteristics: template.characteristics
        }
      })) || [],
      totalEstimatedCost: Math.round(data.totalEstimatedCost || 0),
      totalEstimatedCostFormatted: this.formatRussianPrice(data.totalEstimatedCost || 0),
      currency: 'RUB',
      styleAnalysis: data.styleAnalysis || {
        selectedStyle: style,
        characteristics: template.characteristics,
        colorPalette: template.colorPalette
      }
    }
  }

  private static adaptBudgetOptimizationForRussia(data: any, style?: RoomStyle) {
    return {
      ...data,
      overspend: Math.round(data.overspend || 0),
      overspendFormatted: this.formatRussianPrice(data.overspend || 0),
      optimizations: data.optimizations?.map((opt: any) => ({
        ...opt,
        savings: Math.round(opt.savings),
        savingsFormatted: this.formatRussianPrice(opt.savings),
        originalItem: {
          ...opt.originalItem,
          priceFormatted: this.formatRussianPrice(opt.originalItem.price)
        },
        suggestedItem: {
          ...opt.suggestedItem,
          priceFormatted: this.formatRussianPrice(opt.suggestedItem.price)
        },
        styleConsideration: style ? `Сохраняет стиль ${style}` : 'Базовая замена'
      })) || [],
      totalPossibleSavings: Math.round(data.totalPossibleSavings || 0),
      totalPossibleSavingsFormatted: this.formatRussianPrice(data.totalPossibleSavings || 0),
      currency: 'RUB',
      styleConsideration: data.styleConsideration || 'Оптимизация без учета стиля'
    }
  }

  private static adaptDesignForRussia(data: any, style: RoomStyle) {
    const template = STYLE_TEMPLATES[style]
    
    return {
      ...data,
      estimatedCost: Math.round(data.estimatedCost || 0),
      estimatedCostFormatted: this.formatRussianPrice(data.estimatedCost || 0),
      currency: 'RUB',
      adaptedForRussia: true,
      styleInfo: data.styleInfo || {
        name: style,
        characteristics: template.characteristics,
        colorPalette: template.colorPalette,
        materials: template.materials
      }
    }
  }

  private static formatRussianPrice(price: number): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(price)
  }

  private static getStyleRecommendations(style: RoomStyle, inconsistentItems: FurnitureItem[]) {
    const template = STYLE_TEMPLATES[style]
    const styleDescription = this.getStyleDescription(style)

    return inconsistentItems.map(item => ({
      itemId: item.id,
      itemName: item.name,
      issue: `Не соответствует стилю ${style}`,
      suggestion: `Замените на предмет в стиле: ${styleDescription}`,
      colorSuggestion: `Рекомендуемые цвета: ${template.colorPalette.slice(0, 3).join(', ')}`,
      materialSuggestion: `Материалы: ${template.materials.primary}, ${template.materials.secondary}`
    }))
  }

  private static getStyleDescription(style: RoomStyle): string {
    const descriptions = {
      scandinavian: 'светлые тона, натуральное дерево, минимализм',
      loft: 'металл, кирпич, индустриальный стиль',
      classic: 'традиционные формы, натуральные материалы, элегантность',
      modern: 'чистые линии, современные материалы, функциональность',
      minimalist: 'простота, функциональность, минимум деталей'
    }
    return descriptions[style] || 'современный стиль'
  }

  private static getConsistencyMessage(score: number): string {
    if (score >= 0.9) return 'Отличное соответствие стилю!'
    if (score >= 0.7) return 'Хорошее соответствие стилю'
    if (score >= 0.5) return 'Частичное соответствие стилю'
    return 'Стиль требует доработки'
  }

  private static estimateCategoryPrice(category: string, style: RoomStyle, budget: number): number {
    const basePrice = {
      seating: 30000,
      furniture: 20000,
      lighting: 8000,
      textile: 5000,
      decor: 3000,
      plants: 2000,
      storage: 15000,
      appliances: 25000
    }

    const styleMultiplier = {
      scandinavian: 1.0,
      loft: 1.2,
      classic: 1.5,
      modern: 1.1,
      minimalist: 0.8
    }

    const base = basePrice[category as keyof typeof basePrice] || 10000
    const multiplier = styleMultiplier[style] || 1.0
    
    return Math.min(Math.round(base * multiplier), budget * 0.3)
  }
}