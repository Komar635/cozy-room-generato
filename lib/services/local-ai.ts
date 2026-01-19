import { RoomDimensions, RoomStyle, FurnitureItem, FurnitureCategory } from '@/types/room'

// Локальный "ИИ" на основе правил - работает бесплатно навсегда
export class LocalAIService {
  
  /**
   * Умные рекомендации мебели на основе правил
   */
  static getFurnitureRecommendations(params: {
    roomDimensions: RoomDimensions
    style: RoomStyle
    budget: number
    existingFurniture?: FurnitureItem[]
  }) {
    const { roomDimensions, style, budget } = params
    const area = roomDimensions.width * roomDimensions.depth
    const recommendations: any[] = []

    // Правила на основе площади комнаты
    if (area < 10) {
      // Маленькая комната
      recommendations.push(
        {
          id: 'small_sofa',
          name: 'Компактный диван',
          category: 'furniture',
          price: Math.min(budget * 0.4, 35000),
          reason: 'Идеально подходит для небольших пространств',
          confidence: 0.9
        },
        {
          id: 'folding_table',
          name: 'Складной столик',
          category: 'furniture', 
          price: Math.min(budget * 0.15, 8000),
          reason: 'Экономит место, можно убрать при необходимости',
          confidence: 0.8
        }
      )
    } else if (area >= 10 && area < 20) {
      // Средняя комната
      recommendations.push(
        {
          id: 'medium_sofa',
          name: 'Диван 3-местный',
          category: 'furniture',
          price: Math.min(budget * 0.5, 45000),
          reason: 'Оптимальный размер для комнаты такой площади',
          confidence: 0.9
        },
        {
          id: 'coffee_table',
          name: 'Журнальный столик',
          category: 'furniture',
          price: Math.min(budget * 0.2, 15000),
          reason: 'Дополняет диван и создает уютную зону',
          confidence: 0.8
        }
      )
    } else {
      // Большая комната
      recommendations.push(
        {
          id: 'corner_sofa',
          name: 'Угловой диван',
          category: 'furniture',
          price: Math.min(budget * 0.6, 65000),
          reason: 'Максимально использует пространство большой комнаты',
          confidence: 0.9
        },
        {
          id: 'armchair',
          name: 'Кресло',
          category: 'furniture',
          price: Math.min(budget * 0.25, 25000),
          reason: 'Дополнительное место для сидения',
          confidence: 0.7
        }
      )
    }

    // Правила на основе стиля
    const styleRecommendations = this.getStyleSpecificItems(style, budget)
    recommendations.push(...styleRecommendations)

    // Всегда рекомендуем освещение и растения
    recommendations.push(
      {
        id: 'lamp',
        name: this.getLampForStyle(style),
        category: 'lighting',
        price: Math.min(budget * 0.1, 12000),
        reason: 'Создает правильную атмосферу освещения',
        confidence: 0.8
      },
      {
        id: 'plant',
        name: 'Комнатное растение',
        category: 'plants',
        price: Math.min(budget * 0.05, 3000),
        reason: 'Добавляет жизни и свежести в интерьер',
        confidence: 0.9
      }
    )

    return {
      success: true,
      data: {
        recommendations: recommendations.slice(0, 5), // Максимум 5 рекомендаций
        totalEstimatedCost: recommendations.reduce((sum, item) => sum + item.price, 0),
        budgetUtilization: recommendations.reduce((sum, item) => sum + item.price, 0) / budget,
        source: 'local-ai'
      }
    }
  }

  /**
   * Оптимизация бюджета на основе правил
   */
  static optimizeBudget(params: {
    currentFurniture: FurnitureItem[]
    targetBudget: number
    currentBudget: number
  }) {
    const { currentFurniture, targetBudget, currentBudget } = params
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

    // Находим самые дорогие предметы для замены
    const expensiveItems = currentFurniture
      .filter(item => item.price > 15000)
      .sort((a, b) => b.price - a.price)

    const optimizations = expensiveItems.slice(0, 3).map(item => ({
      originalItem: item,
      suggestedItem: {
        ...item,
        id: `budget_${item.id}`,
        name: `${item.name} (эконом версия)`,
        price: Math.round(item.price * 0.6) // 40% скидка
      },
      savings: Math.round(item.price * 0.4),
      reason: 'Аналогичный предмет с лучшим соотношением цена-качество'
    }))

    return {
      success: true,
      data: {
        needsOptimization: true,
        overspend,
        optimizations,
        totalPossibleSavings: optimizations.reduce((sum, opt) => sum + opt.savings, 0),
        source: 'local-ai'
      }
    }
  }

  /**
   * Генерация планировки комнаты
   */
  static generateRoomLayout(params: {
    roomDimensions: RoomDimensions
    style: RoomStyle
    budget: number
  }) {
    const { roomDimensions, style } = params
    const furniture = []

    // Основная мебель по центру
    if (roomDimensions.width > 3 && roomDimensions.depth > 3) {
      furniture.push({
        type: 'sofa',
        position: { 
          x: roomDimensions.width * 0.3, 
          y: 0, 
          z: roomDimensions.depth * 0.4 
        },
        rotation: { x: 0, y: 0, z: 0 },
        recommended: true
      })
    }

    // Столик перед диваном
    furniture.push({
      type: 'table',
      position: { 
        x: roomDimensions.width * 0.5, 
        y: 0, 
        z: roomDimensions.depth * 0.6 
      },
      rotation: { x: 0, y: 0, z: 0 },
      recommended: true
    })

    // Дополнительная мебель для больших комнат
    const area = roomDimensions.width * roomDimensions.depth
    if (area > 20) {
      furniture.push({
        type: 'chair',
        position: { 
          x: roomDimensions.width * 0.8, 
          y: 0, 
          z: roomDimensions.depth * 0.3 
        },
        rotation: { x: 0, y: Math.PI / 4, z: 0 },
        recommended: true
      })
    }

    return {
      success: true,
      data: {
        layout: { furniture },
        colorScheme: this.getStyleColors(style),
        estimatedCost: Math.min(params.budget * 0.8, 50000),
        confidence: 0.8,
        source: 'local-ai'
      }
    }
  }

  // Вспомогательные методы
  private static getStyleSpecificItems(style: RoomStyle, budget: number) {
    const styleItems: Record<RoomStyle, any[]> = {
      scandinavian: [
        {
          id: 'wooden_shelf',
          name: 'Деревянная полка',
          category: 'furniture',
          price: Math.min(budget * 0.15, 8000),
          reason: 'Натуральное дерево идеально для скандинавского стиля',
          confidence: 0.9
        }
      ],
      loft: [
        {
          id: 'metal_shelf',
          name: 'Металлическая полка',
          category: 'furniture', 
          price: Math.min(budget * 0.18, 12000),
          reason: 'Индустриальный металл подчеркивает лофт стиль',
          confidence: 0.9
        }
      ],
      classic: [
        {
          id: 'wooden_cabinet',
          name: 'Деревянный комод',
          category: 'furniture',
          price: Math.min(budget * 0.3, 25000),
          reason: 'Классическая мебель из натурального дерева',
          confidence: 0.8
        }
      ],
      modern: [
        {
          id: 'glass_table',
          name: 'Стеклянный столик',
          category: 'furniture',
          price: Math.min(budget * 0.2, 15000),
          reason: 'Современные материалы для модерн стиля',
          confidence: 0.8
        }
      ],
      minimalist: [
        {
          id: 'simple_shelf',
          name: 'Простая полка',
          category: 'furniture',
          price: Math.min(budget * 0.1, 6000),
          reason: 'Минимум деталей для чистого стиля',
          confidence: 0.9
        }
      ]
    }

    return styleItems[style] || []
  }

  private static getLampForStyle(style: RoomStyle): string {
    const lamps: Record<RoomStyle, string> = {
      scandinavian: 'Деревянный торшер',
      loft: 'Металлический светильник',
      classic: 'Классическая настольная лампа',
      modern: 'LED панель',
      minimalist: 'Простой торшер'
    }
    return lamps[style] || 'Настольная лампа'
  }

  private static getStyleColors(style: RoomStyle): string[] {
    const colorSchemes: Record<RoomStyle, string[]> = {
      scandinavian: ['#FFFFFF', '#F5F5F5', '#E8E8E8', '#D3D3D3', '#8B7355'],
      loft: ['#2C2C2C', '#4A4A4A', '#8B4513', '#CD853F', '#A0522D'],
      classic: ['#F5F5DC', '#DEB887', '#D2691E', '#8B4513', '#654321'],
      modern: ['#FFFFFF', '#000000', '#808080', '#C0C0C0', '#4169E1'],
      minimalist: ['#FFFFFF', '#F8F8FF', '#E6E6FA', '#D3D3D3', '#696969']
    }
    return colorSchemes[style] || colorSchemes.modern
  }
}