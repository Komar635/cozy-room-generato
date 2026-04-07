import { RoomDimensions, RoomStyle, FurnitureItem, FurnitureCategory } from '@/types/room'
import { STYLE_TEMPLATES, StyleUtils } from '@/lib/data/style-templates'

// Локальный "ИИ" на основе правил - работает бесплатно навсегда
export class LocalAIService {
  
  /**
   * Умные рекомендации мебели на основе правил и стилей
   */
  static getFurnitureRecommendations(params: {
    roomDimensions: RoomDimensions
    style: RoomStyle
    budget: number
    existingFurniture?: FurnitureItem[]
  }) {
    const { roomDimensions, style, budget, existingFurniture = [] } = params
    const area = roomDimensions.width * roomDimensions.depth
    const recommendations: any[] = []

    // Получаем характеристики стиля
    const styleCharacteristics = StyleUtils.getStyleCharacteristics(style)
    const template = STYLE_TEMPLATES[style]

    // Анализируем существующую мебель
    const existingCategories = new Set(existingFurniture.map(item => item.category))

    // Правила на основе площади комнаты и стиля
    if (area < 10) {
      // Маленькая комната - компактная мебель
      if (!existingCategories.has(FurnitureCategory.FURNITURE)) {
        recommendations.push({
          id: `compact_sofa_${style}`,
          name: this.getStyleSpecificName('Компактный диван', style),
          category: 'furniture',
          price: Math.min(budget * 0.4, this.getStylePriceMultiplier(style) * 30000),
          reason: `Компактная мебель идеально подходит для небольших пространств в стиле ${style}`,
          confidence: 0.9,
          styleMatch: true
        })
      }

      if (!existingCategories.has(FurnitureCategory.LIGHTING)) {
        recommendations.push({
          id: `compact_lighting_${style}`,
          name: this.getStyleSpecificName('Настенный светильник', style),
          category: 'lighting',
          price: Math.min(budget * 0.15, this.getStylePriceMultiplier(style) * 8000),
          reason: `Настенное освещение экономит место и соответствует стилю ${style}`,
          confidence: 0.8,
          styleMatch: true
        })
      }
    } else if (area >= 10 && area < 20) {
      // Средняя комната
      if (!existingCategories.has(FurnitureCategory.FURNITURE)) {
        recommendations.push({
          id: `medium_sofa_${style}`,
          name: this.getStyleSpecificName('Диван 3-местный', style),
          category: 'furniture',
          price: Math.min(budget * 0.5, this.getStylePriceMultiplier(style) * 40000),
          reason: `Оптимальный размер для комнаты в стиле ${style}`,
          confidence: 0.9,
          styleMatch: true
        })
      }

      if (!existingCategories.has(FurnitureCategory.FURNITURE) || existingFurniture.filter(f => f.category === FurnitureCategory.FURNITURE).length < 2) {
        recommendations.push({
          id: `coffee_table_${style}`,
          name: this.getStyleSpecificName('Журнальный столик', style),
          category: 'furniture',
          price: Math.min(budget * 0.2, this.getStylePriceMultiplier(style) * 15000),
          reason: `Дополняет зону отдыха в стиле ${style}`,
          confidence: 0.8,
          styleMatch: true
        })
      }
    } else {
      // Большая комната
      if (!existingCategories.has(FurnitureCategory.FURNITURE)) {
        recommendations.push({
          id: `large_sofa_${style}`,
          name: this.getStyleSpecificName('Угловой диван', style),
          category: 'furniture',
          price: Math.min(budget * 0.6, this.getStylePriceMultiplier(style) * 60000),
          reason: `Максимально использует пространство большой комнаты в стиле ${style}`,
          confidence: 0.9,
          styleMatch: true
        })
      }

      if (!existingCategories.has(FurnitureCategory.FURNITURE) || existingFurniture.filter(f => f.category === FurnitureCategory.FURNITURE).length < 3) {
        recommendations.push({
          id: `armchair_${style}`,
          name: this.getStyleSpecificName('Кресло', style),
          category: 'furniture',
          price: Math.min(budget * 0.25, this.getStylePriceMultiplier(style) * 20000),
          reason: `Дополнительное место для сидения в стиле ${style}`,
          confidence: 0.7,
          styleMatch: true
        })
      }
    }

    // Стиль-специфичные рекомендации
    const styleRecommendations = this.getStyleSpecificRecommendations(style, budget, existingCategories)
    recommendations.push(...styleRecommendations)

    // Всегда рекомендуем освещение и растения, если их нет
    if (!existingCategories.has(FurnitureCategory.LIGHTING)) {
      recommendations.push({
        id: `lighting_${style}`,
        name: this.getStyleSpecificName('Освещение', style),
        category: 'lighting',
        price: Math.min(budget * 0.1, this.getStylePriceMultiplier(style) * 10000),
        reason: `Создает правильную атмосферу для стиля ${style}`,
        confidence: 0.8,
        styleMatch: true
      })
    }

    if (!existingCategories.has(FurnitureCategory.PLANTS) && style !== RoomStyle.MINIMALIST) {
      recommendations.push({
        id: `plant_${style}`,
        name: this.getStyleSpecificName('Комнатное растение', style),
        category: 'plants',
        price: Math.min(budget * 0.05, 3000),
        reason: `Добавляет жизни в интерьер стиля ${style}`,
        confidence: 0.9,
        styleMatch: true
      })
    }

    // Сортируем по соответствию стилю и уверенности
    const sortedRecommendations = recommendations
      .sort((a, b) => {
        if (a.styleMatch && !b.styleMatch) return -1
        if (!a.styleMatch && b.styleMatch) return 1
        return b.confidence - a.confidence
      })
      .slice(0, 5)

    return {
      success: true,
      data: {
        recommendations: sortedRecommendations,
        totalEstimatedCost: sortedRecommendations.reduce((sum, item) => sum + item.price, 0),
        budgetUtilization: sortedRecommendations.reduce((sum, item) => sum + item.price, 0) / budget,
        source: 'local-ai',
        styleAnalysis: {
          selectedStyle: style,
          characteristics: styleCharacteristics,
          colorPalette: template.colorPalette
        }
      }
    }
  }

  /**
   * Оптимизация бюджета с учетом стиля
   */
  static optimizeBudget(params: {
    currentFurniture: FurnitureItem[]
    targetBudget: number
    currentBudget: number
    style?: RoomStyle
  }) {
    const { currentFurniture, targetBudget, currentBudget, style } = params
    const overspend = currentBudget - targetBudget

    if (overspend <= 0) {
      return {
        success: true,
        data: {
          needsOptimization: false,
          message: 'Бюджет не превышен'
        }
      }
    }

    // Находим предметы для замены с учетом стиля
    const expensiveItems = currentFurniture
      .filter(item => item.price > 10000)
      .sort((a, b) => b.price - a.price)

    const optimizations = expensiveItems.slice(0, 3).map(item => {
      const discountRate = style ? this.getStyleOptimizationRate(style, item) : 0.4
      const newPrice = Math.round(item.price * (1 - discountRate))
      
      return {
        originalItem: item,
        suggestedItem: {
          ...item,
          id: `budget_${item.id}`,
          name: `${item.name} (${style ? 'стильная ' : ''}эконом версия)`,
          price: newPrice
        },
        savings: item.price - newPrice,
        reason: style 
          ? `Аналогичный предмет в стиле ${style} с лучшим соотношением цена-качество`
          : 'Аналогичный предмет с лучшим соотношением цена-качество'
      }
    })

    return {
      success: true,
      data: {
        needsOptimization: true,
        overspend,
        optimizations,
        totalPossibleSavings: optimizations.reduce((sum, opt) => sum + opt.savings, 0),
        source: 'local-ai',
        styleConsideration: style ? `Оптимизация с сохранением стиля ${style}` : 'Базовая оптимизация'
      }
    }
  }

  /**
   * Генерация планировки комнаты с учетом стиля
   */
  static generateRoomLayout(params: {
    roomDimensions: RoomDimensions
    style: RoomStyle
    budget: number
  }) {
    const { roomDimensions, style, budget } = params
    const template = STYLE_TEMPLATES[style]
    const furniture = []

    // Используем приоритетную мебель из шаблона стиля
    const priorityFurniture = StyleUtils.getPriorityFurniture(style, 5)
    
    priorityFurniture.forEach(item => {
      // Адаптируем позицию под размеры комнаты
      const adaptedPosition = {
        x: item.position.x * roomDimensions.width,
        y: item.position.y,
        z: item.position.z * roomDimensions.depth
      }

      furniture.push({
        type: item.category,
        position: adaptedPosition,
        rotation: item.rotation,
        recommended: true,
        priority: item.priority,
        styleMatch: true
      })
    })

    return {
      success: true,
      data: {
        layout: { furniture },
        colorScheme: template.colorPalette,
        lighting: template.lighting,
        materials: template.materials,
        estimatedCost: Math.min(budget * 0.8, this.getStylePriceMultiplier(style) * 50000),
        confidence: 0.9,
        source: 'local-ai',
        styleInfo: {
          name: style,
          characteristics: template.characteristics
        }
      }
    }
  }

  // Вспомогательные методы для работы со стилями

  private static getStyleSpecificRecommendations(style: RoomStyle, budget: number, existingCategories: Set<FurnitureCategory>) {
    const styleItems: Record<RoomStyle, any[]> = {
      scandinavian: [
        !existingCategories.has(FurnitureCategory.FURNITURE) ? {
          id: 'wooden_shelf_scand',
          name: 'Деревянная полка из березы',
          category: 'furniture',
          price: Math.min(budget * 0.15, 8000),
          reason: 'Натуральное дерево - основа скандинавского стиля',
          confidence: 0.9,
          styleMatch: true
        } : null,
        !existingCategories.has(FurnitureCategory.TEXTILE) ? {
          id: 'wool_rug_scand',
          name: 'Шерстяной ковер светлых тонов',
          category: 'textile',
          price: Math.min(budget * 0.12, 6000),
          reason: 'Натуральные материалы и светлые тона скандинавского стиля',
          confidence: 0.8,
          styleMatch: true
        } : null
      ].filter(Boolean),
      
      loft: [
        !existingCategories.has(FurnitureCategory.FURNITURE) ? {
          id: 'metal_shelf_loft',
          name: 'Металлическая полка в индустриальном стиле',
          category: 'furniture',
          price: Math.min(budget * 0.18, 12000),
          reason: 'Индустриальный металл - ключевой элемент лофт стиля',
          confidence: 0.9,
          styleMatch: true
        } : null,
        !existingCategories.has(FurnitureCategory.LIGHTING) ? {
          id: 'industrial_lamp_loft',
          name: 'Промышленный светильник',
          category: 'lighting',
          price: Math.min(budget * 0.15, 10000),
          reason: 'Промышленное освещение подчеркивает лофт эстетику',
          confidence: 0.9,
          styleMatch: true
        } : null
      ].filter(Boolean),
      
      classic: [
        !existingCategories.has(FurnitureCategory.FURNITURE) ? {
          id: 'wooden_cabinet_classic',
          name: 'Деревянный комод с резьбой',
          category: 'furniture',
          price: Math.min(budget * 0.3, 25000),
          reason: 'Классическая мебель из натурального дерева с декоративными элементами',
          confidence: 0.8,
          styleMatch: true
        } : null,
        !existingCategories.has(FurnitureCategory.TEXTILE) ? {
          id: 'velvet_curtains_classic',
          name: 'Бархатные шторы',
          category: 'textile',
          price: Math.min(budget * 0.2, 15000),
          reason: 'Роскошные ткани подчеркивают классический стиль',
          confidence: 0.8,
          styleMatch: true
        } : null
      ].filter(Boolean),
      
      modern: [
        !existingCategories.has(FurnitureCategory.FURNITURE) ? {
          id: 'glass_table_modern',
          name: 'Стеклянный столик с металлическими ножками',
          category: 'furniture',
          price: Math.min(budget * 0.2, 15000),
          reason: 'Современные материалы и чистые линии модерн стиля',
          confidence: 0.8,
          styleMatch: true
        } : null,
        !existingCategories.has(FurnitureCategory.APPLIANCES) ? {
          id: 'smart_tv_modern',
          name: 'Умный телевизор',
          category: 'appliances',
          price: Math.min(budget * 0.25, 30000),
          reason: 'Современные технологии - часть модерн стиля',
          confidence: 0.7,
          styleMatch: true
        } : null
      ].filter(Boolean),
      
      minimalist: [
        !existingCategories.has(FurnitureCategory.FURNITURE) ? {
          id: 'simple_shelf_minimal',
          name: 'Простая полка без декора',
          category: 'furniture',
          price: Math.min(budget * 0.1, 6000),
          reason: 'Минимум деталей и максимум функциональности',
          confidence: 0.9,
          styleMatch: true
        } : null
      ].filter(Boolean)
    }

    return styleItems[style] || []
  }

  private static getStyleSpecificName(baseName: string, style: RoomStyle): string {
    const styleModifiers: Record<RoomStyle, string> = {
      scandinavian: 'в скандинавском стиле',
      loft: 'в стиле лофт',
      classic: 'в классическом стиле',
      modern: 'в современном стиле',
      minimalist: 'в стиле минимализм'
    }
    
    return `${baseName} ${styleModifiers[style]}`
  }

  private static getStylePriceMultiplier(style: RoomStyle): number {
    const multipliers: Record<RoomStyle, number> = {
      scandinavian: 1.0,
      loft: 1.2,
      classic: 1.5,
      modern: 1.1,
      minimalist: 0.8
    }
    
    return multipliers[style] || 1.0
  }

  private static getStyleOptimizationRate(style: RoomStyle, item: FurnitureItem): number {
    // Разные стили имеют разные возможности для оптимизации
    const baseRate = 0.4
    
    if (item.style && item.style.includes(style)) {
      // Если предмет уже соответствует стилю, меньше возможностей для оптимизации
      return baseRate * 0.7
    }
    
    const styleRates: Record<RoomStyle, number> = {
      scandinavian: 0.3, // Меньше оптимизации - качество важно
      loft: 0.5, // Больше возможностей для замен
      classic: 0.2, // Классика требует качества
      modern: 0.4, // Средние возможности
      minimalist: 0.6 // Больше всего возможностей для упрощения
    }
    
    return styleRates[style] || baseRate
  }
}