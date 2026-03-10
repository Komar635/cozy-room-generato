import { 
  formatPrice, 
  formatDimensions, 
  calculateFootprint,
  calculateVolume,
  isCompatibleWithStyle,
  groupByCategory,
  sortByPrice,
  filterByPriceRange,
  getAveragePrice,
  getPriceRange,
  validateFurnitureItem
} from '../../../lib/furniture-utils'
import { FurnitureItem, FurnitureCategory, RoomStyle } from '../../../types/room'

// Тестовые данные
const mockFurnitureItem: FurnitureItem = {
  id: 'test-sofa-1',
  name: 'Тестовый диван',
  category: FurnitureCategory.FURNITURE,
  price: 45000,
  dimensions: { width: 2.2, height: 0.8, depth: 0.9 },
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  modelUrl: '/models/test-sofa.glb',
  thumbnailUrl: '/images/test-sofa.jpg',
  style: [RoomStyle.SCANDINAVIAN, RoomStyle.MODERN],
  color: 'Серый'
}

const mockFurnitureItems: FurnitureItem[] = [
  mockFurnitureItem,
  {
    ...mockFurnitureItem,
    id: 'test-chair-1',
    name: 'Тестовое кресло',
    price: 25000,
    category: FurnitureCategory.FURNITURE,
    style: [RoomStyle.CLASSIC]
  },
  {
    ...mockFurnitureItem,
    id: 'test-lamp-1',
    name: 'Тестовая лампа',
    price: 8000,
    category: FurnitureCategory.LIGHTING,
    style: [RoomStyle.MODERN]
  }
]

describe('Утилиты для мебели', () => {
  describe('formatPrice', () => {
    test('форматирует цену в рублях', () => {
      expect(formatPrice(45000)).toBe('45 000 ₽')
      expect(formatPrice(1500)).toBe('1 500 ₽')
      expect(formatPrice(0)).toBe('0 ₽')
    })
  })

  describe('formatDimensions', () => {
    test('форматирует размеры', () => {
      const dimensions = { width: 2.2, height: 0.8, depth: 0.9 }
      expect(formatDimensions(dimensions)).toBe('2.2×0.8×0.9 м')
    })
  })

  describe('calculateFootprint', () => {
    test('вычисляет площадь основания', () => {
      const footprint = calculateFootprint(mockFurnitureItem)
      expect(footprint).toBe(2.2 * 0.9) // width * depth
    })
  })

  describe('calculateVolume', () => {
    test('вычисляет объем предмета', () => {
      const volume = calculateVolume(mockFurnitureItem)
      expect(volume).toBe(2.2 * 0.8 * 0.9) // width * height * depth
    })
  })

  describe('isCompatibleWithStyle', () => {
    test('проверяет совместимость со стилем', () => {
      expect(isCompatibleWithStyle(mockFurnitureItem, RoomStyle.SCANDINAVIAN)).toBe(true)
      expect(isCompatibleWithStyle(mockFurnitureItem, RoomStyle.MODERN)).toBe(true)
      expect(isCompatibleWithStyle(mockFurnitureItem, RoomStyle.CLASSIC)).toBe(false)
    })
  })

  describe('groupByCategory', () => {
    test('группирует предметы по категориям', () => {
      const grouped = groupByCategory(mockFurnitureItems)
      
      expect(grouped[FurnitureCategory.FURNITURE]).toHaveLength(2)
      expect(grouped[FurnitureCategory.LIGHTING]).toHaveLength(1)
      expect(grouped[FurnitureCategory.TEXTILE]).toHaveLength(0)
    })
  })

  describe('sortByPrice', () => {
    test('сортирует по цене по возрастанию', () => {
      const sorted = sortByPrice(mockFurnitureItems, true)
      expect(sorted[0].price).toBe(8000)
      expect(sorted[1].price).toBe(25000)
      expect(sorted[2].price).toBe(45000)
    })

    test('сортирует по цене по убыванию', () => {
      const sorted = sortByPrice(mockFurnitureItems, false)
      expect(sorted[0].price).toBe(45000)
      expect(sorted[1].price).toBe(25000)
      expect(sorted[2].price).toBe(8000)
    })
  })

  describe('filterByPriceRange', () => {
    test('фильтрует по диапазону цен', () => {
      const filtered = filterByPriceRange(mockFurnitureItems, 10000, 30000)
      expect(filtered).toHaveLength(1)
      expect(filtered[0].price).toBe(25000)
    })
  })

  describe('getAveragePrice', () => {
    test('вычисляет среднюю цену', () => {
      const average = getAveragePrice(mockFurnitureItems)
      const expectedAverage = Math.round((45000 + 25000 + 8000) / 3)
      expect(average).toBe(expectedAverage)
    })

    test('возвращает 0 для пустого массива', () => {
      expect(getAveragePrice([])).toBe(0)
    })
  })

  describe('getPriceRange', () => {
    test('возвращает диапазон цен', () => {
      const range = getPriceRange(mockFurnitureItems)
      expect(range.min).toBe(8000)
      expect(range.max).toBe(45000)
    })

    test('возвращает 0 для пустого массива', () => {
      const range = getPriceRange([])
      expect(range.min).toBe(0)
      expect(range.max).toBe(0)
    })
  })

  describe('validateFurnitureItem', () => {
    test('валидирует корректный предмет', () => {
      const errors = validateFurnitureItem(mockFurnitureItem)
      expect(errors).toHaveLength(0)
    })

    test('находит ошибки в некорректном предмете', () => {
      const invalidItem = {
        name: '',
        price: -100,
        dimensions: { width: 0, height: -1, depth: 2 }
      }
      
      const errors = validateFurnitureItem(invalidItem)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors).toContain('Название предмета обязательно')
      expect(errors).toContain('Категория предмета обязательна')
      expect(errors).toContain('Цена должна быть положительным числом')
    })
  })
})