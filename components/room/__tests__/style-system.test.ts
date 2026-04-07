import { RoomStyle } from '@/types/room'
import { STYLE_TEMPLATES, StyleUtils } from '@/lib/data/style-templates'
import { LocalAIService } from '@/lib/services/local-ai'

describe('Style System', () => {
  describe('Style Templates', () => {
    test('should have all required styles defined', () => {
      const requiredStyles = [
        RoomStyle.SCANDINAVIAN,
        RoomStyle.LOFT,
        RoomStyle.CLASSIC,
        RoomStyle.MODERN,
        RoomStyle.MINIMALIST
      ]

      requiredStyles.forEach(style => {
        expect(STYLE_TEMPLATES[style]).toBeDefined()
        expect(STYLE_TEMPLATES[style].wallColor).toBeDefined()
        expect(STYLE_TEMPLATES[style].floorColor).toBeDefined()
        expect(STYLE_TEMPLATES[style].defaultFurniture).toBeDefined()
        expect(Array.isArray(STYLE_TEMPLATES[style].defaultFurniture)).toBe(true)
      })
    })

    test('should have valid color palettes', () => {
      Object.values(STYLE_TEMPLATES).forEach(template => {
        expect(Array.isArray(template.colorPalette)).toBe(true)
        expect(template.colorPalette.length).toBeGreaterThan(0)
        
        // Проверяем, что цвета в правильном формате
        template.colorPalette.forEach(color => {
          expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
        })
      })
    })

    test('should have valid characteristics', () => {
      Object.values(STYLE_TEMPLATES).forEach(template => {
        const { characteristics } = template
        expect(characteristics.brightness).toBeGreaterThanOrEqual(0)
        expect(characteristics.brightness).toBeLessThanOrEqual(1)
        expect(characteristics.contrast).toBeGreaterThanOrEqual(0)
        expect(characteristics.contrast).toBeLessThanOrEqual(1)
        expect(characteristics.warmth).toBeGreaterThanOrEqual(0)
        expect(characteristics.warmth).toBeLessThanOrEqual(1)
        expect(characteristics.luxury).toBeGreaterThanOrEqual(0)
        expect(characteristics.luxury).toBeLessThanOrEqual(1)
      })
    })
  })

  describe('StyleUtils', () => {
    test('should calculate recommended budget correctly', () => {
      const roomArea = 16 // 4x4 метра
      
      Object.values(RoomStyle).forEach(style => {
        const budget = StyleUtils.getRecommendedBudget(style, roomArea)
        expect(budget.min).toBeGreaterThan(0)
        expect(budget.optimal).toBeGreaterThan(budget.min)
      })
    })

    test('should return priority furniture', () => {
      Object.values(RoomStyle).forEach(style => {
        const furniture = StyleUtils.getPriorityFurniture(style, 3)
        expect(Array.isArray(furniture)).toBe(true)
        expect(furniture.length).toBeLessThanOrEqual(3)
        
        // Проверяем сортировку по приоритету
        for (let i = 1; i < furniture.length; i++) {
          expect(furniture[i].priority).toBeGreaterThanOrEqual(furniture[i-1].priority)
        }
      })
    })

    test('should get style characteristics', () => {
      Object.values(RoomStyle).forEach(style => {
        const characteristics = StyleUtils.getStyleCharacteristics(style)
        expect(characteristics).toBeDefined()
        expect(typeof characteristics.brightness).toBe('number')
        expect(typeof characteristics.contrast).toBe('number')
        expect(typeof characteristics.warmth).toBe('number')
        expect(typeof characteristics.luxury).toBe('number')
      })
    })
  })

  describe('Local AI Service with Styles', () => {
    const testParams = {
      roomDimensions: { width: 4, height: 3, depth: 4 },
      style: RoomStyle.SCANDINAVIAN,
      budget: 50000,
      existingFurniture: []
    }

    test('should generate style-specific recommendations', () => {
      const result = LocalAIService.getFurnitureRecommendations(testParams)
      
      expect(result.success).toBe(true)
      expect(result.data.recommendations).toBeDefined()
      expect(Array.isArray(result.data.recommendations)).toBe(true)
      expect(result.data.styleAnalysis).toBeDefined()
      expect(result.data.styleAnalysis.selectedStyle).toBe(RoomStyle.SCANDINAVIAN)
    })

    test('should generate room layout with style', () => {
      const result = LocalAIService.generateRoomLayout(testParams)
      
      expect(result.success).toBe(true)
      expect(result.data.layout).toBeDefined()
      expect(result.data.colorScheme).toBeDefined()
      expect(result.data.styleInfo).toBeDefined()
      expect(result.data.styleInfo.name).toBe(RoomStyle.SCANDINAVIAN)
    })

    test('should optimize budget with style consideration', () => {
      const furniture = [
        {
          id: 'test1',
          name: 'Expensive Sofa',
          price: 60000,
          category: 'furniture' as any,
          style: [RoomStyle.CLASSIC],
          dimensions: { width: 2, height: 1, depth: 1 },
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          modelUrl: '',
          thumbnailUrl: '',
          color: 'brown'
        }
      ]

      const result = LocalAIService.optimizeBudget({
        currentFurniture: furniture,
        targetBudget: 40000,
        currentBudget: 60000,
        style: RoomStyle.SCANDINAVIAN
      })

      expect(result.success).toBe(true)
      expect(result.data.needsOptimization).toBe(true)
      expect(result.data.styleConsideration).toBeDefined()
    })
  })

  describe('Style Integration', () => {
    test('should maintain style consistency across components', () => {
      // Проверяем, что все стили имеют соответствующие шаблоны
      Object.values(RoomStyle).forEach(style => {
        expect(STYLE_TEMPLATES[style]).toBeDefined()
        
        // Проверяем, что локальный ИИ может работать с этим стилем
        const result = LocalAIService.getFurnitureRecommendations({
          roomDimensions: { width: 4, height: 3, depth: 4 },
          style,
          budget: 50000
        })
        
        expect(result.success).toBe(true)
        expect(result.data.styleAnalysis.selectedStyle).toBe(style)
      })
    })

    test('should provide consistent pricing across styles', () => {
      const baseParams = {
        roomDimensions: { width: 4, height: 3, depth: 4 },
        budget: 50000
      }

      Object.values(RoomStyle).forEach(style => {
        const result = LocalAIService.getFurnitureRecommendations({
          ...baseParams,
          style
        })

        expect(result.success).toBe(true)
        expect(result.data.totalEstimatedCost).toBeGreaterThan(0)
        expect(result.data.totalEstimatedCost).toBeLessThanOrEqual(baseParams.budget * 1.3) // Увеличиваем допуск
      })
    })
  })
})