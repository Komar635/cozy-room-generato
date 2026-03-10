import { NextRequest, NextResponse } from 'next/server'
import { FurnitureAPI } from '@/lib/services/furniture-api'

export async function GET(request: NextRequest) {
  try {
    // Получаем все категории
    const categories = await FurnitureAPI.getCategories()

    return NextResponse.json({
      success: true,
      data: categories
    })

  } catch (error) {
    console.error('Ошибка получения категорий:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка получения категорий' 
      },
      { status: 500 }
    )
  }
}