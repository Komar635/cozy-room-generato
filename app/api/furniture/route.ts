import { NextRequest, NextResponse } from 'next/server'
import { FurnitureAPI } from '@/lib/services/furniture-api'
import { parseCsvParam, parseOptionalNumberParam, parsePositiveIntegerParam } from '@/app/api/furniture/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Извлекаем параметры фильтрации
    const filters = {
      category: searchParams.get('category') || undefined,
      minPrice: parseOptionalNumberParam(searchParams.get('minPrice')),
      maxPrice: parseOptionalNumberParam(searchParams.get('maxPrice')),
      colors: parseCsvParam(searchParams.get('colors')),
      styles: parseCsvParam(searchParams.get('styles')),
      brands: parseCsvParam(searchParams.get('brands')),
      search: searchParams.get('search') || undefined,
    }

    // Параметры пагинации
    const pagination = {
      page: parsePositiveIntegerParam(searchParams.get('page'), 1),
      limit: parsePositiveIntegerParam(searchParams.get('limit'), 20),
    }

    // Получаем данные из Supabase
    const result = await FurnitureAPI.getFurnitureItems(filters, pagination)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Ошибка API furniture:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка получения данных о мебели' 
      },
      { status: 500 }
    )
  }
}

// POST для добавления новой мебели (только для парсера)
export async function POST(request: NextRequest) {
  try {
    // Здесь можно добавить аутентификацию для парсера
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Логика добавления мебели через парсер
    // Это будет использоваться парсером для добавления новых товаров
    
    return NextResponse.json({
      success: true,
      message: 'Товар добавлен'
    })

  } catch (error) {
    console.error('Ошибка добавления мебели:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка добавления мебели' 
      },
      { status: 500 }
    )
  }
}
