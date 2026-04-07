import { NextRequest, NextResponse } from 'next/server'
import { RoomStyle, RoomDimensions } from '@/types/room'
import { RoomGPTApiService } from '@/lib/services/roomgpt-api'
import { LocalAIService } from '@/lib/services/local-ai'

type RoomDesignRequestBody = {
  roomDimensions: RoomDimensions
  style: RoomStyle
  budget: number
  preferences?: string[]
}

export async function POST(request: NextRequest) {
  let roomDimensions: RoomDimensions | null = null
  let style: RoomStyle | null = null
  let budget = 0
  let preferences: string[] = []

  try {
    const body: RoomDesignRequestBody = await request.json()
    roomDimensions = body.roomDimensions
    style = body.style
    budget = body.budget
    preferences = body.preferences ?? []

    if (!roomDimensions || !style || !budget) {
      return NextResponse.json(
        { success: false, error: 'РќРµРїРѕР»РЅС‹Рµ РґР°РЅРЅС‹Рµ РґР»СЏ РіРµРЅРµСЂР°С†РёРё РґРёР·Р°Р№РЅР°' },
        { status: 400 }
      )
    }

    const adaptedBudget = Math.max(budget, 15000)
    const validatedRoomDimensions = roomDimensions
    const validatedStyle = style

    let designResult = await RoomGPTApiService.generateRoomDesign({
      roomDimensions: validatedRoomDimensions,
      style: validatedStyle,
      budget: adaptedBudget,
      preferences
    }).catch((error) => {
      console.warn('RoomGPT API РЅРµРґРѕСЃС‚СѓРїРµРЅ РґР»СЏ РіРµРЅРµСЂР°С†РёРё РґРёР·Р°Р№РЅР°, РёСЃРїРѕР»СЊР·СѓРµРј Р»РѕРєР°Р»СЊРЅС‹Р№ РР:', error)

      return LocalAIService.generateRoomLayout({
        roomDimensions: validatedRoomDimensions,
        style: validatedStyle,
        budget: adaptedBudget
      })
    })

    if (!designResult.success) {
      designResult = LocalAIService.generateRoomLayout({
        roomDimensions: validatedRoomDimensions,
        style: validatedStyle,
        budget: adaptedBudget
      })
    }

    const estimatedCost =
      'estimatedCost' in designResult.data && typeof designResult.data.estimatedCost === 'number'
        ? designResult.data.estimatedCost
        : adaptedBudget * 0.8

    const adaptedDesign = {
      ...designResult.data,
      estimatedCost: Math.round(estimatedCost),
      estimatedCostFormatted: new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0
      }).format(estimatedCost),
      currency: 'RUB',
      adaptedForRussia: true
    }

    return NextResponse.json({
      success: true,
      data: adaptedDesign
    })
  } catch (error) {
    console.error('РћС€РёР±РєР° РіРµРЅРµСЂР°С†РёРё РґРёР·Р°Р№РЅР°:', error)

    try {
      if (!roomDimensions || !style) {
        throw new Error('Missing fallback input for local room design')
      }

      const fallbackResult = LocalAIService.generateRoomLayout({
        roomDimensions,
        style,
        budget
      })

      return NextResponse.json({
        success: true,
        data: {
          ...fallbackResult.data,
          fallback: true,
          message: 'РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ Р»РѕРєР°Р»СЊРЅР°СЏ РіРµРЅРµСЂР°С†РёСЏ РґРёР·Р°Р№РЅР° РёР·-Р·Р° РѕС€РёР±РєРё API',
          currency: 'RUB'
        }
      })
    } catch {
      return NextResponse.json(
        { success: false, error: 'РљСЂРёС‚РёС‡РµСЃРєР°СЏ РѕС€РёР±РєР° РіРµРЅРµСЂР°С†РёРё РґРёР·Р°Р№РЅР°' },
        { status: 500 }
      )
    }
  }
}
