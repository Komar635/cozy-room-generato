import { NextRequest, NextResponse } from 'next/server'
import { RoomProject } from '@/types/room'

export async function POST(request: NextRequest) {
  try {
    const project: RoomProject = await request.json()

    // Валидация проекта
    if (!project.name || !project.roomDimensions) {
      return NextResponse.json(
        { success: false, error: 'Неполные данные проекта' },
        { status: 400 }
      )
    }

    // В будущем здесь будет сохранение в базу данных
    // Пока возвращаем успешный ответ с ID
    const savedProject = {
      ...project,
      id: project.id || `project_${Date.now()}`,
      updatedAt: new Date()
    }

    return NextResponse.json({
      success: true,
      data: savedProject
    })

  } catch (error) {
    console.error('Ошибка сохранения проекта:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка сохранения проекта' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('id')

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'ID проекта не указан' },
        { status: 400 }
      )
    }

    // В будущем здесь будет загрузка из базы данных
    // Пока возвращаем заглушку
    return NextResponse.json({
      success: false,
      error: 'Проект не найден'
    }, { status: 404 })

  } catch (error) {
    console.error('Ошибка загрузки проекта:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка загрузки проекта' },
      { status: 500 }
    )
  }
}