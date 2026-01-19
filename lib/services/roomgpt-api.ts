import { RoomDimensions, RoomStyle, FurnitureItem } from '@/types/room'
import { HuggingFaceApiService } from './huggingface-api'

// Реальные API для дизайна интерьера
export class RoomGPTApiService {
  private static replicateToken = process.env.REPLICATE_API_TOKEN
  private static openaiKey = process.env.OPENAI_API_KEY
  private static huggingfaceKey = process.env.HUGGINGFACE_API_KEY

  /**
   * Генерация дизайна комнаты через Replicate API
   */
  static async generateRoomDesign(params: {
    roomDimensions: RoomDimensions
    style: RoomStyle
    budget: number
    preferences?: string[]
  }) {
    try {
      // Проверяем наличие Replicate токена
      if (!this.replicateToken) {
        console.warn('Replicate API токен не настроен, используем fallback')
        return this.getFallbackDesign(params)
      }

      const prompt = `Interior design of a ${params.style} style room, ${params.roomDimensions.width}x${params.roomDimensions.depth}m, budget ${params.budget} rubles, modern furniture arrangement`

      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.replicateToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: "jagilley/controlnet-hough", // Модель для дизайна интерьера
          input: {
            prompt: prompt,
            image: null, // Можно добавить базовое изображение комнаты
            num_samples: 1,
            image_resolution: 512,
            strength: 1.0,
            guidance_scale: 9.0,
            seed: Math.floor(Math.random() * 1000000)
          }
        }),
      })

      if (!response.ok) {
        throw new Error(`Replicate API ошибка: ${response.status}`)
      }

      const result = await response.json()
      
      return {
        success: true,
        data: {
          predictionId: result.id,
          status: result.status,
          layout: this.generateLayoutFromAI(params),
          colorScheme: this.getStyleColors(params.style),
          estimatedCost: Math.min(params.budget * 0.8, 50000),
          confidence: 0.9,
          source: 'replicate'
        }
      }
    } catch (error) {
      console.error('Ошибка Replicate API:', error)
      return this.getFallbackDesign(params)
    }
  }

  /**
   * Получение рекомендаций по мебели через OpenAI
   */
  static async getFurnitureRecommendations(params: {
    roomDimensions: RoomDimensions
    style: RoomStyle
    budget: number
    existingFurniture?: FurnitureItem[]
  }) {
    try {
      if (!this.openaiKey) {
        console.warn('OpenAI API ключ не настроен, используем fallback')
        return this.getFallbackRecommendations(params)
      }

      const prompt = `Порекомендуй мебель для комнаты ${params.roomDimensions.width}x${params.roomDimensions.depth}м в стиле ${params.style} с бюджетом ${params.budget} рублей. Верни JSON с массивом объектов: {name, category, price, reason}`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Ты эксперт по дизайну интерьера. Отвечай только в формате JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API ошибка: ${response.status}`)
      }

      const result = await response.json()
      const content = result.choices[0]?.message?.content

      try {
        const recommendations = JSON.parse(content)
        return {
          success: true,
          data: {
            recommendations: recommendations.map((rec: any, index: number) => ({
              id: `ai_${index}`,
              ...rec,
              confidence: 0.8
            })),
            source: 'openai'
          }
        }
      } catch (parseError) {
        console.error('Ошибка парсинга OpenAI ответа:', parseError)
        return this.getFallbackRecommendations(params)
      }
    } catch (error) {
      console.error('Ошибка получения рекомендаций:', error)
      return this.getFallbackRecommendations(params)
    }
  }

  /**
   * Генерация изображения комнаты через HuggingFace Stable Diffusion
   */
  static async generateRoomImage(params: {
    roomDescription: string
    style: RoomStyle
    dimensions: RoomDimensions
  }) {
    try {
      // Сначала пробуем HuggingFace (бесплатно)
      if (this.huggingfaceKey) {
        return await HuggingFaceApiService.generateRoomImage({
          roomDescription: params.roomDescription,
          style: params.style,
          dimensions: params.dimensions
        })
      }

      // Fallback на Replicate
      if (!this.replicateToken) {
        throw new Error('Ни один API для генерации изображений не настроен')
      }

      const prompt = `${params.roomDescription} in ${params.style} style, room size ${params.dimensions.width}x${params.dimensions.depth}m, interior design, high quality, realistic`

      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.replicateToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
          input: {
            prompt: prompt,
            negative_prompt: "blurry, low quality, distorted",
            width: 512,
            height: 512,
            num_outputs: 1,
            guidance_scale: 7.5,
            num_inference_steps: 50
          }
        }),
      })

      if (!response.ok) {
        throw new Error(`Replicate API ошибка: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Ошибка генерации изображения:', error)
      throw error
    }
  }

  /**
   * Проверка статуса API
   */
  static async checkApiStatus() {
    const status = {
      replicate: {
        available: !!this.replicateToken,
        hasKey: !!this.replicateToken
      },
      openai: {
        available: !!this.openaiKey,
        hasKey: !!this.openaiKey
      },
      huggingface: {
        available: !!this.huggingfaceKey,
        hasKey: !!this.huggingfaceKey
      }
    }

    // Проверяем доступность Replicate API
    if (this.replicateToken) {
      try {
        const response = await fetch('https://api.replicate.com/v1/models', {
          headers: {
            'Authorization': `Token ${this.replicateToken}`,
          },
        })
        status.replicate.available = response.ok
      } catch (error) {
        status.replicate.available = false
      }
    }

    return {
      available: status.replicate.available || status.openai.available || status.huggingface.available,
      services: status,
      hasAnyKey: status.replicate.hasKey || status.openai.hasKey || status.huggingface.hasKey
    }
  }

  // Вспомогательные методы
  private static generateLayoutFromAI(params: any) {
    const { roomDimensions } = params
    const area = roomDimensions.width * roomDimensions.depth
    
    // Умная расстановка мебели на основе размеров комнаты
    const furniture = []
    
    if (area > 15) {
      furniture.push({
        type: 'sofa',
        position: { x: roomDimensions.width * 0.3, y: 0, z: roomDimensions.depth * 0.3 },
        rotation: { x: 0, y: 0, z: 0 },
        recommended: true
      })
    }
    
    furniture.push({
      type: 'table',
      position: { x: roomDimensions.width * 0.6, y: 0, z: roomDimensions.depth * 0.6 },
      rotation: { x: 0, y: 0, z: 0 },
      recommended: true
    })
    
    if (area > 20) {
      furniture.push({
        type: 'chair',
        position: { x: roomDimensions.width * 0.8, y: 0, z: roomDimensions.depth * 0.4 },
        rotation: { x: 0, y: Math.PI / 4, z: 0 },
        recommended: true
      })
    }
    
    return { furniture }
  }
  private static getFallbackDesign(params: any) {
    const { roomDimensions, style, budget } = params
    const area = roomDimensions.width * roomDimensions.depth

    return {
      success: true,
      data: {
        layout: {
          furniture: [
            {
              type: 'sofa',
              position: { x: 1, y: 0, z: 1 },
              rotation: { x: 0, y: 0, z: 0 },
              recommended: area > 15
            },
            {
              type: 'table',
              position: { x: 2, y: 0, z: 2 },
              rotation: { x: 0, y: 0, z: 0 },
              recommended: true
            }
          ]
        },
        colorScheme: this.getStyleColors(style),
        estimatedCost: Math.min(budget * 0.8, 50000),
        confidence: 0.7,
        fallback: true,
        message: 'Используются локальные рекомендации (RoomGPT API недоступен)'
      }
    }
  }

  private static getFallbackRecommendations(params: any) {
    return {
      success: true,
      data: {
        recommendations: [
          {
            id: 'fallback_1',
            name: `Диван для стиля ${params.style}`,
            category: 'furniture',
            price: Math.min(params.budget * 0.4, 45000),
            reason: 'Подходит для выбранного стиля и размера комнаты',
            confidence: 0.6,
            fallback: true
          }
        ],
        fallback: true,
        message: 'Используются локальные рекомендации (RoomGPT API недоступен)'
      }
    }
  }

  private static getStyleColors(style: RoomStyle): string[] {
    const colorSchemes = {
      scandinavian: ['#FFFFFF', '#F5F5F5', '#E8E8E8'],
      loft: ['#2C2C2C', '#8B4513', '#CD853F'],
      classic: ['#F5F5DC', '#DEB887', '#D2691E'],
      modern: ['#FFFFFF', '#808080', '#4169E1'],
      minimalist: ['#FFFFFF', '#F8F8FF', '#E6E6FA']
    }
    return colorSchemes[style] || colorSchemes.modern
  }
}