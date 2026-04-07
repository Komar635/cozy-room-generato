import { RoomStyle } from '../../types/room'

export interface StyleTemplate {
  wallColor: string
  floorColor: string
  accentColor: string
  lighting: {
    ambientIntensity: number
    directionalIntensity: number
    warmth: number // 0-1, где 1 = теплый свет
  }
  materials: {
    primary: string
    secondary: string
    accent: string
  }
  defaultFurniture: Array<{
    id: string
    position: { x: number; y: number; z: number }
    rotation: { x: number; y: number; z: number }
    priority: number // 1-5, где 1 = обязательный предмет
    category: string
  }>
  colorPalette: string[]
  characteristics: {
    brightness: number // 0-1
    contrast: number // 0-1
    warmth: number // 0-1
    luxury: number // 0-1
  }
}

export const STYLE_TEMPLATES: Record<RoomStyle, StyleTemplate> = {
  [RoomStyle.SCANDINAVIAN]: {
    wallColor: '#F5F5F5',
    floorColor: '#E8DCC4',
    accentColor: '#8B7355',
    lighting: {
      ambientIntensity: 0.7,
      directionalIntensity: 0.5,
      warmth: 0.6
    },
    materials: {
      primary: 'wood',
      secondary: 'fabric',
      accent: 'metal'
    },
    defaultFurniture: [
      { 
        id: 'sofa-scandinavian-1', 
        position: { x: 0.5, y: 0, z: 0.2 }, 
        rotation: { x: 0, y: 0, z: 0 },
        priority: 1,
        category: 'seating'
      },
      { 
        id: 'rug-scandinavian-1', 
        position: { x: 0.5, y: 0, z: 0.5 }, 
        rotation: { x: 0, y: 0, z: 0 },
        priority: 2,
        category: 'textile'
      },
      { 
        id: 'plant-ficus-1', 
        position: { x: 0.1, y: 0, z: 0.1 }, 
        rotation: { x: 0, y: 0, z: 0 },
        priority: 3,
        category: 'plants'
      },
      { 
        id: 'vase-ceramic-1', 
        position: { x: 0.9, y: 0, z: 0.9 }, 
        rotation: { x: 0, y: 0, z: 0 },
        priority: 4,
        category: 'decor'
      },
      { 
        id: 'wooden-shelf-1', 
        position: { x: 0.1, y: 0.5, z: 0.05 }, 
        rotation: { x: 0, y: 0, z: 0 },
        priority: 3,
        category: 'storage'
      }
    ],
    colorPalette: ['#FFFFFF', '#F5F5F5', '#E8DCC4', '#D3D3D3', '#8B7355', '#A0A0A0'],
    characteristics: {
      brightness: 0.9,
      contrast: 0.3,
      warmth: 0.7,
      luxury: 0.4
    }
  },
  
  [RoomStyle.LOFT]: {
    wallColor: '#4A4A4A',
    floorColor: '#333333',
    accentColor: '#CD853F',
    lighting: {
      ambientIntensity: 0.4,
      directionalIntensity: 0.6,
      warmth: 0.4
    },
    materials: {
      primary: 'metal',
      secondary: 'brick',
      accent: 'leather'
    },
    defaultFurniture: [
      { 
        id: 'bookshelf-loft-1', 
        position: { x: 0.1, y: 0, z: 0.5 }, 
        rotation: { x: 0, y: 1.57, z: 0 },
        priority: 2,
        category: 'storage'
      },
      { 
        id: 'floor-lamp-loft-1', 
        position: { x: 0.1, y: 0, z: 0.1 }, 
        rotation: { x: 0, y: 0.78, z: 0 },
        priority: 1,
        category: 'lighting'
      },
      { 
        id: 'table_001', 
        position: { x: 0.5, y: 0, z: 0.5 }, 
        rotation: { x: 0, y: 0, z: 0 },
        priority: 1,
        category: 'furniture'
      },
      { 
        id: 'painting-abstract-1', 
        position: { x: 0.5, y: 0.6, z: 0.05 }, 
        rotation: { x: 0, y: 0, z: 0 },
        priority: 3,
        category: 'decor'
      },
      { 
        id: 'leather-chair-1', 
        position: { x: 0.8, y: 0, z: 0.3 }, 
        rotation: { x: 0, y: -0.5, z: 0 },
        priority: 2,
        category: 'seating'
      }
    ],
    colorPalette: ['#2C2C2C', '#4A4A4A', '#8B4513', '#CD853F', '#A0522D', '#696969'],
    characteristics: {
      brightness: 0.3,
      contrast: 0.8,
      warmth: 0.4,
      luxury: 0.6
    }
  },
  
  [RoomStyle.CLASSIC]: {
    wallColor: '#E3DAC9',
    floorColor: '#5D4037',
    accentColor: '#8B4513',
    lighting: {
      ambientIntensity: 0.6,
      directionalIntensity: 0.4,
      warmth: 0.8
    },
    materials: {
      primary: 'wood',
      secondary: 'fabric',
      accent: 'gold'
    },
    defaultFurniture: [
      { 
        id: 'armchair-classic-1', 
        position: { x: 0.3, y: 0, z: 0.3 }, 
        rotation: { x: 0, y: 0.5, z: 0 },
        priority: 1,
        category: 'seating'
      },
      { 
        id: 'dining-table-classic-1', 
        position: { x: 0.7, y: 0, z: 0.3 }, 
        rotation: { x: 0, y: 0, z: 0 },
        priority: 1,
        category: 'furniture'
      },
      { 
        id: 'curtains-classic-1', 
        position: { x: 0.5, y: 0.5, z: 0.95 }, 
        rotation: { x: 0, y: 0, z: 0 },
        priority: 2,
        category: 'textile'
      },
      { 
        id: 'chandelier-classic-1', 
        position: { x: 0.5, y: 0.8, z: 0.5 }, 
        rotation: { x: 0, y: 0, z: 0 },
        priority: 2,
        category: 'lighting'
      },
      { 
        id: 'mirror-ornate-1', 
        position: { x: 0.05, y: 0.6, z: 0.5 }, 
        rotation: { x: 0, y: 1.57, z: 0 },
        priority: 3,
        category: 'decor'
      }
    ],
    colorPalette: ['#F5F5DC', '#E3DAC9', '#DEB887', '#D2691E', '#8B4513', '#654321'],
    characteristics: {
      brightness: 0.6,
      contrast: 0.5,
      warmth: 0.8,
      luxury: 0.9
    }
  },
  
  [RoomStyle.MODERN]: {
    wallColor: '#FFFFFF',
    floorColor: '#D3D3D3',
    accentColor: '#4169E1',
    lighting: {
      ambientIntensity: 0.5,
      directionalIntensity: 0.5,
      warmth: 0.3
    },
    materials: {
      primary: 'glass',
      secondary: 'metal',
      accent: 'plastic'
    },
    defaultFurniture: [
      { 
        id: 'sofa-modern-1', 
        position: { x: 0.5, y: 0, z: 0.2 }, 
        rotation: { x: 0, y: 0, z: 0 },
        priority: 1,
        category: 'seating'
      },
      { 
        id: 'coffee-table-modern-1', 
        position: { x: 0.5, y: 0, z: 0.5 }, 
        rotation: { x: 0, y: 0, z: 0 },
        priority: 1,
        category: 'furniture'
      },
      { 
        id: 'tv-modern-55-1', 
        position: { x: 0.5, y: 0.5, z: 0.05 }, 
        rotation: { x: 0, y: 0, z: 0 },
        priority: 2,
        category: 'appliances'
      },
      { 
        id: 'led-strip-1', 
        position: { x: 0.5, y: 0.9, z: 0.5 }, 
        rotation: { x: 0, y: 0, z: 0 },
        priority: 3,
        category: 'lighting'
      },
      { 
        id: 'abstract-art-1', 
        position: { x: 0.2, y: 0.6, z: 0.05 }, 
        rotation: { x: 0, y: 0, z: 0 },
        priority: 4,
        category: 'decor'
      }
    ],
    colorPalette: ['#FFFFFF', '#F8F8F8', '#E0E0E0', '#C0C0C0', '#808080', '#4169E1'],
    characteristics: {
      brightness: 0.8,
      contrast: 0.7,
      warmth: 0.3,
      luxury: 0.7
    }
  },
  
  [RoomStyle.MINIMALIST]: {
    wallColor: '#FAFAFA',
    floorColor: '#F0F0F0',
    accentColor: '#696969',
    lighting: {
      ambientIntensity: 0.8,
      directionalIntensity: 0.4,
      warmth: 0.5
    },
    materials: {
      primary: 'concrete',
      secondary: 'wood',
      accent: 'steel'
    },
    defaultFurniture: [
      { 
        id: 'coffee-table-minimal-1', 
        position: { x: 0.5, y: 0, z: 0.5 }, 
        rotation: { x: 0, y: 0, z: 0 },
        priority: 1,
        category: 'furniture'
      },
      { 
        id: 'floor-lamp-minimal-1', 
        position: { x: 0.9, y: 0, z: 0.1 }, 
        rotation: { x: 0, y: 0, z: 0 },
        priority: 2,
        category: 'lighting'
      },
      { 
        id: 'single-plant-1', 
        position: { x: 0.1, y: 0, z: 0.9 }, 
        rotation: { x: 0, y: 0, z: 0 },
        priority: 3,
        category: 'plants'
      }
    ],
    colorPalette: ['#FFFFFF', '#FAFAFA', '#F5F5F5', '#E6E6FA', '#D3D3D3', '#696969'],
    characteristics: {
      brightness: 0.9,
      contrast: 0.2,
      warmth: 0.5,
      luxury: 0.3
    }
  }
}

// Утилитарные функции для работы со стилями
export const StyleUtils = {
  /**
   * Получить рекомендуемый бюджет для стиля
   */
  getRecommendedBudget(style: RoomStyle, roomArea: number): { min: number; optimal: number } {
    const baseMultiplier = roomArea / 16 // Базовая площадь 4x4м
    
    const budgetMap = {
      [RoomStyle.SCANDINAVIAN]: { min: 25000, optimal: 70000 },
      [RoomStyle.LOFT]: { min: 35000, optimal: 90000 },
      [RoomStyle.CLASSIC]: { min: 50000, optimal: 120000 },
      [RoomStyle.MODERN]: { min: 30000, optimal: 80000 },
      [RoomStyle.MINIMALIST]: { min: 20000, optimal: 60000 }
    }
    
    const base = budgetMap[style]
    return {
      min: Math.round(base.min * baseMultiplier),
      optimal: Math.round(base.optimal * baseMultiplier)
    }
  },

  /**
   * Получить приоритетную мебель для стиля
   */
  getPriorityFurniture(style: RoomStyle, maxItems: number = 5) {
    const template = STYLE_TEMPLATES[style]
    return template.defaultFurniture
      .sort((a, b) => a.priority - b.priority)
      .slice(0, maxItems)
  },

  /**
   * Проверить совместимость цвета со стилем
   */
  isColorCompatible(color: string, style: RoomStyle): boolean {
    const template = STYLE_TEMPLATES[style]
    return template.colorPalette.some(paletteColor => 
      this.colorDistance(color, paletteColor) < 50
    )
  },

  /**
   * Вычислить расстояние между цветами (упрощенно)
   */
  colorDistance(color1: string, color2: string): number {
    // Упрощенное вычисление расстояния между цветами
    // В реальном приложении можно использовать более точные алгоритмы
    return Math.abs(parseInt(color1.slice(1), 16) - parseInt(color2.slice(1), 16)) / 16777215 * 100
  },

  /**
   * Получить характеристики стиля
   */
  getStyleCharacteristics(style: RoomStyle) {
    return STYLE_TEMPLATES[style].characteristics
  }
}
