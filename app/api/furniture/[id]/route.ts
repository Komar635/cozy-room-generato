import { NextRequest, NextResponse } from 'next/server'
import { FurnitureAPI } from '@/lib/services/furniture-api'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID товара не указан' },
        { status: 400 }
      )
    }

    // Получаем конкретный товар
    const item = await FurnitureAPI.getFurnitureItem(id)

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Товар не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: item
    })

  } catch (error) {
    console.error('Ошибка получения товара:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка получения данных о товаре' 
      },
      { status: 500 }
    )
  }
}