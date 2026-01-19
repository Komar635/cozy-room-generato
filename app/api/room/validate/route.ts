import { NextRequest, NextResponse } from 'next/server'
import { RoomDimensions } from '@/types/room'
import { ROOM_CONSTANTS } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { width, height, depth }: RoomDimensions = body

    // Валидация размеров на сервере
    const errors: string[] = []

    if (!width || width < ROOM_CONSTANTS.MIN_DIMENSION || width > ROOM_CONSTANTS.MAX_DIMENSION) {
      errors.push(`Ширина должна быть от ${ROOM_CONSTANTS.MIN_DIMENSION} до ${ROOM_CONSTANTS.MAX_DIMENSION} метров`)
    }

    if (!height || height < ROOM_CONSTANTS.MIN_DIMENSION || height > ROOM_CONSTANTS.MAX_DIMENSION) {
      errors.push(`Высота должна быть от ${ROOM_CONSTANTS.MIN_DIMENSION} до ${ROOM_CONSTANTS.MAX_DIMENSION} метров`)
    }

    if (!depth || depth < ROOM_CONSTANTS.MIN_DIMENSION || depth > ROOM_CONSTANTS.MAX_DIMENSION) {
      errors.push(`Глубина должна быть от ${ROOM_CONSTANTS.MIN_DIMENSION} до ${ROOM_CONSTANTS.MAX_DIMENSION} метров`)
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      )
    }

    // Расчет дополнительных параметров
    const floorArea = width * depth
    const volume = width * height * depth
    const wallArea = 2 * (width * height + depth * height)

    return NextResponse.json({
      success: true,
      data: {
        dimensions: { width, height, depth },
        calculations: {
          floorArea: Math.round(floorArea * 10) / 10,
          volume: Math.round(volume * 10) / 10,
          wallArea: Math.round(wallArea * 10) / 10,
          perimeter: Math.round((2 * (width + depth)) * 10) / 10
        }
      }
    })

  } catch (error) {
    console.error('Ошибка валидации комнаты:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}