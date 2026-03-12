import { NextRequest, NextResponse } from 'next/server'
import { RoomStyle, RoomDimensions } from '@/types/room'
import { RoomGPTApiService } from '@/lib/services/roomgpt-api'

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

    // Вызов реального сервиса (с поддержкой fallback)
    const aiResult = await RoomGPTApiService.getFurnitureRecommendations({
      roomDimensions,
      style,
      budget,
      existingFurniture
    })

    if (!aiResult.success) {
      return NextResponse.json(
        { success: false, error: 'Не удалось получить рекомендации' },
        { status: 500 }
      )
    }

    const recommendations = aiResult.data.recommendations
    const totalEstimatedCost = recommendations.reduce((sum: number, item: any) => sum + item.price, 0)

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        totalEstimatedCost,
        budgetUtilization: totalEstimatedCost / budget,
        source: aiResult.data.source || 'local'
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