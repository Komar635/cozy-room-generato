import { NextRequest, NextResponse } from 'next/server'
import { RoomStyle, RoomDimensions } from '@/types/room'

// Заглушка для будущей интеграции с RoomGPT API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      roomDimensions, 
      style, 
      budget, 
      existingFurniture = [] 
    }: {
      roomDimensions: RoomDimensions
      style: RoomStyle
      budget: number
      existingFurniture: any[]
    } = body

    // Валидация входных данных
    if (!roomDimensions || !style || !budget) {
      return NextResponse.json(
        { success: false, error: 'Неполные данные для рекомендаций' },
        { status: 400 }
      )
    }

    // TODO: Интеграция с RoomGPT API (задача 9)
    // Пока возвращаем заглушку
    const mockRecommendations = [
      {
        id: 'rec_1',
        name: 'Диван угловой',
        category: 'furniture',
        price: 45000,
        reason: 'Подходит для выбранного стиля и размера комнаты',
        confidence: 0.9
      },
      {
        id: 'rec_2', 
        name: 'Журнальный столик',
        category: 'furniture',
        price: 12000,
        reason: 'Дополняет диван и вписывается в бюджет',
        confidence: 0.8
      }
    ]

    return NextResponse.json({
      success: true,
      data: {
        recommendations: mockRecommendations,
        totalEstimatedCost: mockRecommendations.reduce((sum, item) => sum + item.price, 0),
        budgetUtilization: mockRecommendations.reduce((sum, item) => sum + item.price, 0) / budget
      }
    })

  } catch (error) {
    console.error('Ошибка получения рекомендаций:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка получения рекомендаций ИИ' },
      { status: 500 }
    )
  }
}