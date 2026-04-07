import { NextRequest, NextResponse } from 'next/server'
import { RoomStyle, RoomDimensions } from '@/types/room'
import { RoomGPTApiService } from '@/lib/services/roomgpt-api'
import { LocalAIService } from '@/lib/services/local-ai'

type RecommendationRequestBody = {
  roomDimensions: RoomDimensions
  style: RoomStyle
  budget: number
  existingFurniture?: any[]
}

export async function POST(request: NextRequest) {
  let roomDimensions: RoomDimensions | null = null
  let style: RoomStyle | null = null
  let budget = 0
  let existingFurniture: any[] = []

  try {
    const body: RecommendationRequestBody = await request.json()
    roomDimensions = body.roomDimensions
    style = body.style
    budget = body.budget
    existingFurniture = body.existingFurniture ?? []

    if (!roomDimensions || !style || !budget) {
      return NextResponse.json(
        { success: false, error: 'РќРµРїРѕР»РЅС‹Рµ РґР°РЅРЅС‹Рµ РґР»СЏ СЂРµРєРѕРјРµРЅРґР°С†РёР№' },
        { status: 400 }
      )
    }

    const adaptedBudget = Math.max(budget, 10000)
    const validatedRoomDimensions = roomDimensions
    const validatedStyle = style

    let aiResult = await RoomGPTApiService.getFurnitureRecommendations({
      roomDimensions: validatedRoomDimensions,
      style: validatedStyle,
      budget: adaptedBudget,
      existingFurniture
    }).catch((error) => {
      console.warn('RoomGPT API РЅРµРґРѕСЃС‚СѓРїРµРЅ, РёСЃРїРѕР»СЊР·СѓРµРј Р»РѕРєР°Р»СЊРЅС‹Р№ РР:', error)

      return LocalAIService.getFurnitureRecommendations({
        roomDimensions: validatedRoomDimensions,
        style: validatedStyle,
        budget: adaptedBudget,
        existingFurniture
      })
    })

    if (!aiResult.success) {
      aiResult = LocalAIService.getFurnitureRecommendations({
        roomDimensions: validatedRoomDimensions,
        style: validatedStyle,
        budget: adaptedBudget,
        existingFurniture
      })
    }

    const recommendations = aiResult.data.recommendations
    const totalEstimatedCost = recommendations.reduce((sum: number, item: any) => sum + item.price, 0)
    const source = 'source' in aiResult.data ? aiResult.data.source : 'local'

    const adaptedRecommendations = recommendations.map((item: any) => ({
      ...item,
      price: Math.round(item.price),
      priceFormatted: new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0
      }).format(item.price)
    }))

    return NextResponse.json({
      success: true,
      data: {
        recommendations: adaptedRecommendations,
        totalEstimatedCost: Math.round(totalEstimatedCost),
        budgetUtilization: totalEstimatedCost / adaptedBudget,
        source,
        currency: 'RUB',
        adaptedForRussia: true
      }
    })
  } catch (error) {
    console.error('РћС€РёР±РєР° РїРѕР»СѓС‡РµРЅРёСЏ СЂРµРєРѕРјРµРЅРґР°С†РёР№:', error)

    try {
      if (!roomDimensions || !style) {
        throw new Error('Missing fallback input for local recommendations')
      }

      const fallbackResult = LocalAIService.getFurnitureRecommendations({
        roomDimensions,
        style,
        budget,
        existingFurniture
      })

      return NextResponse.json({
        success: true,
        data: {
          ...fallbackResult.data,
          fallback: true,
          message: 'РСЃРїРѕР»СЊР·СѓСЋС‚СЃСЏ Р»РѕРєР°Р»СЊРЅС‹Рµ СЂРµРєРѕРјРµРЅРґР°С†РёРё РёР·-Р·Р° РѕС€РёР±РєРё API'
        }
      })
    } catch {
      return NextResponse.json(
        { success: false, error: 'РљСЂРёС‚РёС‡РµСЃРєР°СЏ РѕС€РёР±РєР° РїРѕР»СѓС‡РµРЅРёСЏ СЂРµРєРѕРјРµРЅРґР°С†РёР№' },
        { status: 500 }
      )
    }
  }
}
