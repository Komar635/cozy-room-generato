/** @jest-environment node */

import { POST as optimizeBudgetPost } from '@/app/api/ai/budget-optimization/route'
import { POST as recommendationsPost } from '@/app/api/ai/recommendations/route'
import { POST as roomValidatePost } from '@/app/api/room/validate/route'
import { RoomGPTApiService } from '@/lib/services/roomgpt-api'
import { LocalAIService } from '@/lib/services/local-ai'
import { FurnitureCategory, RoomStyle } from '@/types/room'

jest.mock('@/lib/services/roomgpt-api', () => ({
  RoomGPTApiService: {
    getFurnitureRecommendations: jest.fn(),
    optimizeBudget: jest.fn()
  }
}))

jest.mock('@/lib/services/local-ai', () => ({
  LocalAIService: {
    getFurnitureRecommendations: jest.fn(),
    optimizeBudget: jest.fn(),
    generateRoomLayout: jest.fn()
  }
}))

const mockedRoomGPTApiService = RoomGPTApiService as jest.Mocked<typeof RoomGPTApiService>
const mockedLocalAIService = LocalAIService as jest.Mocked<typeof LocalAIService>

const createRequest = (body: unknown) =>
  new Request('http://localhost/api/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }) as any

const furnitureItem = {
  id: 'chair-1',
  name: 'Accent chair',
  category: FurnitureCategory.FURNITURE,
  price: 45000,
  dimensions: { width: 1, height: 1, depth: 1 },
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  modelUrl: '',
  thumbnailUrl: '',
  style: [RoomStyle.MODERN],
  color: 'gray'
}

describe('AI API route integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('recommendations route returns adapted ruble pricing from primary service', async () => {
    mockedRoomGPTApiService.getFurnitureRecommendations.mockResolvedValue({
      success: true,
      data: {
        recommendations: [
          {
            id: 'rec-1',
            name: 'Modern sofa',
            category: 'furniture',
            price: 24999.4,
            reason: 'Fits the room',
            confidence: 0.9
          }
        ],
        source: 'openai'
      }
    } as any)

    const response = await recommendationsPost(
      createRequest({
        roomDimensions: { width: 4, height: 3, depth: 5 },
        style: RoomStyle.MODERN,
        budget: 60000,
        existingFurniture: []
      })
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.source).toBe('openai')
    expect(json.data.currency).toBe('RUB')
    expect(json.data.totalEstimatedCost).toBe(24999)
    expect(json.data.recommendations[0]).toEqual(
      expect.objectContaining({
        price: 24999,
        priceFormatted: expect.stringContaining('₽')
      })
    )
  })

  test('recommendations route falls back to local AI when primary service fails', async () => {
    mockedRoomGPTApiService.getFurnitureRecommendations.mockRejectedValue(new Error('network down'))
    mockedLocalAIService.getFurnitureRecommendations.mockReturnValue({
      success: true,
      data: {
        recommendations: [
          {
            id: 'local-1',
            name: 'Compact sofa',
            category: 'furniture',
            price: 18000,
            reason: 'Fallback result',
            confidence: 0.8
          }
        ],
        source: 'local-ai'
      }
    } as any)

    const response = await recommendationsPost(
      createRequest({
        roomDimensions: { width: 3, height: 2.7, depth: 3 },
        style: RoomStyle.SCANDINAVIAN,
        budget: 10000
      })
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(mockedLocalAIService.getFurnitureRecommendations).toHaveBeenCalledWith(
      expect.objectContaining({ budget: 10000 })
    )
    expect(json.data.source).toBe('local-ai')
    expect(json.data.budgetUtilization).toBeGreaterThan(0)
  })

  test('budget optimization route returns formatted savings from AI integration', async () => {
    mockedRoomGPTApiService.optimizeBudget.mockResolvedValue({
      success: true,
      data: {
        needsOptimization: true,
        totalPossibleSavings: 12000,
        source: 'openai',
        optimizations: [
          {
            originalItem: furnitureItem,
            suggestedItem: {
              ...furnitureItem,
              id: 'chair-1-budget',
              name: 'Accent chair economy',
              price: 33000
            },
            savings: 12000,
            reason: 'Lower-cost alternative'
          }
        ]
      }
    } as any)

    const response = await optimizeBudgetPost(
      createRequest({
        currentFurniture: [furnitureItem],
        targetBudget: 30000,
        currentBudget: 45000
      })
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.needsOptimization).toBe(true)
    expect(json.data.overspend).toBe(15000)
    expect(json.data.totalPossibleSavings).toBe(12000)
    expect(json.data.optimizations[0].savingsFormatted).toContain('₽')
    expect(json.data.optimizations[0].originalItem.priceFormatted).toContain('₽')
  })

  test('room validation route calculates derived room metrics', async () => {
    const response = await roomValidatePost(
      createRequest({ width: 5, height: 3, depth: 4 })
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.calculations).toEqual({
      floorArea: 20,
      volume: 60,
      wallArea: 54,
      perimeter: 18
    })
  })
})
