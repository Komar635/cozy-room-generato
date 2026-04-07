import { NextRequest, NextResponse } from 'next/server'
import { RoomGPTApiService } from '@/lib/services/roomgpt-api'
import { AIRecommendationService } from '@/lib/services/ai-recommendation-service'

export async function GET(request: NextRequest) {
  try {
    // Проверяем статус всех ИИ сервисов
    const aiStatus = await AIRecommendationService.checkAIServicesStatus()
    
    // Дополнительная информация о настройке
    const configuration = {
      hasReplicateKey: !!process.env.REPLICATE_API_TOKEN,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasHuggingFaceKey: !!process.env.HUGGINGFACE_API_KEY,
      minBudget: process.env.MIN_BUDGET_RUB || '10000',
      minDesignBudget: process.env.MIN_DESIGN_BUDGET_RUB || '15000',
      currency: process.env.CURRENCY || 'RUB',
      locale: process.env.LOCALE || 'ru-RU'
    }

    // Рекомендации по настройке
    const recommendations = []
    
    if (!configuration.hasReplicateKey && !configuration.hasHuggingFaceKey) {
      recommendations.push({
        type: 'warning',
        message: 'Для генерации изображений настройте Replicate или HuggingFace API',
        action: 'Добавьте REPLICATE_API_TOKEN или HUGGINGFACE_API_KEY в .env файл'
      })
    }
    
    if (!configuration.hasOpenAIKey) {
      recommendations.push({
        type: 'info',
        message: 'Для улучшенных рекомендаций настройте OpenAI API',
        action: 'Добавьте OPENAI_API_KEY в .env файл'
      })
    }
    
    if (aiStatus.roomgpt?.available) {
      recommendations.push({
        type: 'success',
        message: 'RoomGPT API доступен - используются улучшенные рекомендации',
        action: 'Все работает отлично!'
      })
    } else {
      recommendations.push({
        type: 'info',
        message: 'Используется локальный ИИ - базовая функциональность доступна',
        action: 'Для расширенных возможностей настройте внешние API'
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        aiServices: aiStatus,
        configuration,
        recommendations,
        adaptedForRussia: true,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Ошибка проверки статуса ИИ сервисов:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка проверки статуса ИИ сервисов',
        data: {
          localAI: { available: true, message: 'Локальный ИИ всегда доступен' }
        }
      },
      { status: 500 }
    )
  }
}