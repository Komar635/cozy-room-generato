import { NextRequest, NextResponse } from 'next/server'
import { RoomStyle, RoomDimensions } from '@/types/room'
import { RoomGPTApiService } from '@/lib/services/roomgpt-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      roomDescription,
      style,
      dimensions
    }: {
      roomDescription: string
      style: RoomStyle
      dimensions: RoomDimensions
    } = body

    // Валидация входных данных
    if (!roomDescription || !style || !dimensions) {
      return NextResponse.json(
        { success: false, error: 'Неполные данные для генерации изображения' },
        { status: 400 }
      )
    }

    // Проверяем доступность API для генерации изображений
    const apiStatus = await RoomGPTApiService.checkApiStatus()
    
    if (!apiStatus.available) {
      return NextResponse.json({
        success: false,
        error: 'API для генерации изображений недоступен',
        data: {
          message: 'Для генерации изображений требуется настройка Replicate или HuggingFace API',
          suggestion: 'Используйте 3D предпросмотр для визуализации комнаты',
          availableServices: apiStatus.services,
          hasAnyKey: apiStatus.hasAnyKey
        }
      })
    }

    try {
      // Генерируем изображение через RoomGPT API
      const imageResult = await RoomGPTApiService.generateRoomImage({
        roomDescription,
        style,
        dimensions
      })

      return NextResponse.json({
        success: true,
        data: {
          ...imageResult,
          source: 'roomgpt-api',
          adaptedForRussia: true
        }
      })

    } catch (error) {
      console.error('Ошибка генерации изображения:', error)
      
      return NextResponse.json({
        success: false,
        error: 'Не удалось сгенерировать изображение',
        data: {
          message: 'Сервис генерации изображений временно недоступен',
          suggestion: 'Попробуйте позже или используйте 3D предпросмотр',
          fallback: true
        }
      })
    }

  } catch (error) {
    console.error('Критическая ошибка генерации изображения:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Критическая ошибка генерации изображения',
        data: {
          message: 'Внутренняя ошибка сервера',
          suggestion: 'Обратитесь к администратору'
        }
      },
      { status: 500 }
    )
  }
}