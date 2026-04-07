import { NextRequest, NextResponse } from 'next/server'
import { FurnitureItem } from '@/types/room'
import { RoomGPTApiService } from '@/lib/services/roomgpt-api'
import { LocalAIService } from '@/lib/services/local-ai'

type BudgetOptimizationRequestBody = {
  currentFurniture: FurnitureItem[]
  targetBudget: number
  currentBudget: number
}

export async function POST(request: NextRequest) {
  let currentFurniture: FurnitureItem[] = []
  let targetBudget = 0
  let currentBudget = 0

  try {
    const body: BudgetOptimizationRequestBody = await request.json()
    currentFurniture = body.currentFurniture
    targetBudget = body.targetBudget
    currentBudget = body.currentBudget

    if (!currentFurniture || !targetBudget) {
      return NextResponse.json(
        { success: false, error: 'РќРµРїРѕР»РЅС‹Рµ РґР°РЅРЅС‹Рµ РґР»СЏ РѕРїС‚РёРјРёР·Р°С†РёРё' },
        { status: 400 }
      )
    }

    const adaptedTargetBudget = Math.max(targetBudget, 5000)
    const overspend = currentBudget - adaptedTargetBudget

    if (overspend <= 0) {
      return NextResponse.json({
        success: true,
        data: {
          needsOptimization: false,
          message: 'Р‘СЋРґР¶РµС‚ РЅРµ РїСЂРµРІС‹С€РµРЅ',
          currency: 'RUB'
        }
      })
    }

    let optimizationResult = await RoomGPTApiService.optimizeBudget({
      currentFurniture,
      targetBudget: adaptedTargetBudget,
      currentBudget
    }).catch((error) => {
      console.warn('RoomGPT API РЅРµРґРѕСЃС‚СѓРїРµРЅ РґР»СЏ РѕРїС‚РёРјРёР·Р°С†РёРё, РёСЃРїРѕР»СЊР·СѓРµРј Р»РѕРєР°Р»СЊРЅС‹Р№ РР:', error)

      return LocalAIService.optimizeBudget({
        currentFurniture,
        targetBudget: adaptedTargetBudget,
        currentBudget
      })
    })

    if (!optimizationResult.success) {
      optimizationResult = LocalAIService.optimizeBudget({
        currentFurniture,
        targetBudget: adaptedTargetBudget,
        currentBudget
      })
    }

    const adaptedOptimizations = optimizationResult.data.optimizations?.map((opt: any) => ({
      ...opt,
      originalItem: {
        ...opt.originalItem,
        priceFormatted: new Intl.NumberFormat('ru-RU', {
          style: 'currency',
          currency: 'RUB',
          maximumFractionDigits: 0
        }).format(opt.originalItem.price)
      },
      suggestedItem: {
        ...opt.suggestedItem,
        priceFormatted: new Intl.NumberFormat('ru-RU', {
          style: 'currency',
          currency: 'RUB',
          maximumFractionDigits: 0
        }).format(opt.suggestedItem.price)
      },
      savingsFormatted: new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0
      }).format(opt.savings)
    })) || []
    const source = 'source' in optimizationResult.data ? optimizationResult.data.source : 'local'

    return NextResponse.json({
      success: true,
      data: {
        needsOptimization: true,
        overspend: Math.round(overspend),
        overspendFormatted: new Intl.NumberFormat('ru-RU', {
          style: 'currency',
          currency: 'RUB',
          maximumFractionDigits: 0
        }).format(overspend),
        optimizations: adaptedOptimizations,
        totalPossibleSavings: Math.round(optimizationResult.data.totalPossibleSavings || 0),
        totalPossibleSavingsFormatted: new Intl.NumberFormat('ru-RU', {
          style: 'currency',
          currency: 'RUB',
          maximumFractionDigits: 0
        }).format(optimizationResult.data.totalPossibleSavings || 0),
        source,
        currency: 'RUB',
        adaptedForRussia: true
      }
    })
  } catch (error) {
    console.error('РћС€РёР±РєР° РѕРїС‚РёРјРёР·Р°С†РёРё Р±СЋРґР¶РµС‚Р°:', error)

    try {
      const fallbackResult = LocalAIService.optimizeBudget({
        currentFurniture,
        targetBudget,
        currentBudget
      })

      return NextResponse.json({
        success: true,
        data: {
          ...fallbackResult.data,
          fallback: true,
          message: 'РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ Р»РѕРєР°Р»СЊРЅР°СЏ РѕРїС‚РёРјРёР·Р°С†РёСЏ РёР·-Р·Р° РѕС€РёР±РєРё API',
          currency: 'RUB'
        }
      })
    } catch {
      return NextResponse.json(
        { success: false, error: 'РљСЂРёС‚РёС‡РµСЃРєР°СЏ РѕС€РёР±РєР° РѕРїС‚РёРјРёР·Р°С†РёРё Р±СЋРґР¶РµС‚Р°' },
        { status: 500 }
      )
    }
  }
}
