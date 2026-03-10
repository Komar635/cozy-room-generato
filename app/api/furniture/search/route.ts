import { NextRequest, NextResponse } from 'next/server'
import { FurnitureAPI } from '@/lib/services/furniture-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 10

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Поисковый запрос должен содержать минимум 2 символа'
      }, { status: 400 })
    }

    // Выполняем поиск
    const results = await FurnitureAPI.searchFurniture(query.trim(), limit)

    return NextResponse.json({
      success: true,
      data: {
        query: query.trim(),
        results,
        total: results.length
      }
    })

  } catch (error) {
    console.error('Ошибка поиска мебели:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка выполнения поиска' 
      },
      { status: 500 }
    )
  }
}