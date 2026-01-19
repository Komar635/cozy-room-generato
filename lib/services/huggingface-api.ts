// HuggingFace Stable Diffusion API интеграция
export class HuggingFaceApiService {
  private static apiKey = process.env.HUGGINGFACE_API_KEY
  private static baseUrl = 'https://api-inference.huggingface.co/models'
  
  // Проверенные рабочие модели (2024)
  private static models = {
    compvis: 'CompVis/stable-diffusion-v1-4',
    stabilityai: 'stabilityai/stable-diffusion-2-1', 
    dreamlike: 'dreamlike-art/dreamlike-diffusion-1.0',
    dreamshaper: 'Lykon/DreamShaper'
  }

  /**
   * Генерация изображения интерьера через Stable Diffusion
   */
  static async generateRoomImage(params: {
    roomDescription: string
    style: string
    dimensions: { width: number; height: number; depth: number }
  }) {
    try {
      if (!this.apiKey) {
        throw new Error('HuggingFace API ключ не настроен')
      }

      const prompt = `Interior design, ${params.roomDescription}, ${params.style} style, room ${params.dimensions.width}x${params.dimensions.depth}m, modern furniture, high quality, realistic, professional photography`

      // Пробуем рабочие модели по порядку
      const modelsToTry = [
        this.models.compvis,        // Самая стабильная
        this.models.stabilityai,    // Официальная
        this.models.dreamlike,      // Для интерьеров
        this.models.dreamshaper     // Популярная
      ]

      let lastError = null

      for (const model of modelsToTry) {
        try {
          const response = await fetch(`${this.baseUrl}/${model}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputs: prompt,
              parameters: {
                negative_prompt: "blurry, low quality, distorted, ugly, bad anatomy",
                num_inference_steps: 50,
                guidance_scale: 7.5,
                width: 512,
                height: 512
              }
            }),
          })

          if (response.ok) {
            // HuggingFace возвращает изображение как blob
            const imageBlob = await response.blob()
            const imageUrl = URL.createObjectURL(imageBlob)

            return {
              success: true,
              data: {
                imageUrl,
                prompt,
                model,
                source: 'huggingface'
              }
            }
          } else {
            const errorText = await response.text()
            lastError = `${model}: ${response.status} - ${errorText}`
            console.warn(`Модель ${model} недоступна, пробуем следующую...`)
            continue
          }
        } catch (error) {
          lastError = `${model}: ${error}`
          console.warn(`Ошибка с моделью ${model}:`, error)
          continue
        }
      }

      throw new Error(`Все модели недоступны. Последняя ошибка: ${lastError}`)
    } catch (error) {
      console.error('Ошибка HuggingFace API:', error)
      throw error
    }
  }

  /**
   * Получение рекомендаций через DialoGPT
   */
  static async getFurnitureRecommendations(params: {
    roomDimensions: { width: number; height: number; depth: number }
    style: string
    budget: number
  }) {
    try {
      if (!this.apiKey) {
        throw new Error('HuggingFace API ключ не настроен')
      }

      const prompt = `Recommend furniture for ${params.roomDimensions.width}x${params.roomDimensions.depth}m room in ${params.style} style with ${params.budget} rubles budget:`

      const response = await fetch(`${this.baseUrl}/microsoft/DialoGPT-medium`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {
            past_user_inputs: [],
            generated_responses: [],
            text: prompt
          },
          parameters: {
            max_length: 200,
            temperature: 0.7,
            do_sample: true
          }
        }),
      })

      if (!response.ok) {
        throw new Error(`HuggingFace API ошибка: ${response.status}`)
      }

      const result = await response.json()
      
      return {
        success: true,
        data: {
          recommendations: this.parseRecommendations(result.generated_text || ''),
          source: 'huggingface-dialogpt'
        }
      }
    } catch (error) {
      console.error('Ошибка получения рекомендаций HuggingFace:', error)
      throw error
    }
  }

  /**
   * Проверка доступности API
   */
  static async checkApiStatus() {
    try {
      if (!this.apiKey) {
        return {
          available: false,
          hasKey: false,
          error: 'API ключ не настроен'
        }
      }

      // Проверяем доступность через простой запрос к первой модели
      const response = await fetch(`${this.baseUrl}/${this.models.compvis}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: "test",
          parameters: { num_inference_steps: 1 }
        }),
      })

      return {
        available: response.status !== 401 && response.status !== 403,
        hasKey: true,
        status: response.status,
        model: this.models.compvis
      }
    } catch (error) {
      return {
        available: false,
        hasKey: !!this.apiKey,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Вспомогательные методы
  private static parseRecommendations(text: string) {
    // Простой парсер рекомендаций из текста
    const items = text.split(',').map(item => item.trim()).filter(item => item.length > 0)
    
    return items.slice(0, 5).map((item, index) => ({
      id: `hf_${index}`,
      name: item,
      category: 'furniture',
      price: Math.floor(Math.random() * 50000) + 10000, // Случайная цена для демо
      reason: 'Рекомендовано HuggingFace AI',
      confidence: 0.7
    }))
  }
}