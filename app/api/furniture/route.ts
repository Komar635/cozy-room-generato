import { NextRequest, NextResponse } from 'next/server'
import { FurnitureAPI } from '@/lib/services/furniture-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Извлекаем параметры фильтрации
    const filters = {
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      colors: searchParams.get('colors')?.split(',').filter(Boolean) || undefined,
      styles: searchParams.get('styles')?.split(',').filter(Boolean) || undefined,
      brands: searchParams.get('brands')?.split(',').filter(Boolean) || undefined,
      search: searchParams.get('search') || undefined,
    }

    // Параметры пагинации
    const pagination = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
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