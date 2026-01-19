import { NextRequest, NextResponse } from 'next/server'
import { FurnitureItem } from '@/types/room'

// Заглушка для будущей интеграции с RoomGPT API для оптимизации бюджета
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      currentFurniture, 
      targetBudget, 
      currentBudget 
    }: {
      currentFurniture: FurnitureItem[]
      targetBudget: number
      currentBudget: number
    } = body

    // Валидация
    if (!currentFurniture || !targetBudget) {
      return NextResponse.json(
        { success: false, error: 'Неполные данные для оптимизации' },
        { status: 400 }
      )
    }

    const overspend = currentBudget - targetBudget

    if (overspend <= 0) {
      return NextResponse.json({
        success: true,
        data: {
          needsOptimization: false,
          message: 'Бюджет не превышен'
        }
      })
    }

    // TODO: Интеграция с RoomGPT API для поиска альтернатив (задача 9)
    // Пока возвращаем заглушку
    const mockOptimizations = currentFurniture
      .filter(item => item.price > 10000) // Только дорогие предметы
      .map(item => ({
        originalItem: item,
        suggestedItem: {
          ...item,
          id: `alt_${item.id}`,
          name: `${item.name} (эконом)`,
          price: Math.round(item.price * 0.7) // 30% скидка
        },
        savings: Math.round(item.price * 0.3),
        reason: 'Аналогичный предмет с лучшим соотношением цена-качество'
      }))

    return NextResponse.json({
      success: true,
      data: {
        needsOptimization: true,
        overspend,
        optimizations: mockOptimizations,
        totalPossibleSavings: mockOptimizations.reduce((sum, opt) => sum + opt.savings, 0)
      }
    })

  } catch (error) {
    console.error('Ошибка оптимизации бюджета:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка оптимизации бюджета' },
      { status: 500 }
    )
  }
}