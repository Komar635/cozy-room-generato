// Бесплатные API сервисы для долгосрочного использования
export class FreeApisService {
  
  /**
   * Unsplash API - фото интерьеров (50k запросов/месяц бесплатно)
   */
  static async getInteriorPhotos(query: string = 'interior design') {
    try {
      const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || 'demo'
      
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`,
        {
          headers: {
            'Authorization': `Client-ID ${accessKey}`
          }
        }
      )
      
      if (!response.ok) {
        throw new Error('Unsplash API недоступен')
      }
      
      const data = await response.json()
      
      return {
        success: true,
        photos: data.results.map((photo: any) => ({
          id: photo.id,
          url: photo.urls.regular,
          thumb: photo.urls.thumb,
          description: photo.alt_description || 'Interior design',
          author: photo.user.name,
          source: 'unsplash'
        }))
      }
    } catch (error) {
      console.error('Ошибка Unsplash API:', error)
      
      // Fallback на Lorem Picsum
      return this.getFallbackImages(query)
    }
  }

  /**
   * JSONBin.io - хранение каталога мебели (100k запросов/месяц бесплатно)
   */
  static async getFurnitureCatalog() {
    try {
      const binId = process.env.NEXT_PUBLIC_JSONBIN_ID || 'demo'
      const apiKey = process.env.NEXT_PUBLIC_JSONBIN_KEY || 'demo'
      
      const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
        headers: {
          'X-Master-Key': apiKey
        }
      })
      
      if (!response.ok) {
        throw new Error('JSONBin API недоступен')
      }
      
      const data = await response.json()
      
      return {
        success: true,
        furniture: data.record.furniture || [],
        source: 'jsonbin'
      }
    } catch (error) {
      console.error('Ошибка JSONBin API:', error)
      
      // Fallback на локальный каталог
      return this.getLocalFurnitureCatalog()
    }
  }

  /**
   * Lorem Picsum - заглушки изображений (безлимитно бесплатно)
   */
  static getFallbackImages(query: string) {
    const images = Array.from({ length: 12 }, (_, i) => ({
      id: `fallback_${i}`,
      url: `https://picsum.photos/800/600?random=${i}&blur=1`,
      thumb: `https://picsum.photos/200/150?random=${i}&blur=1`,
      description: `${query} inspiration ${i + 1}`,
      author: 'Lorem Picsum',
      source: 'picsum'
    }))
    
    return {
      success: true,
      photos: images
    }
  }

  /**
   * Локальный каталог мебели (работает всегда)
   */
  static getLocalFurnitureCatalog() {
    const furniture = [
      {
        id: 'sofa_001',
        name: 'Диван угловой Скандинавия',
        category: 'furniture',
        price: 45000,
        style: ['scandinavian', 'modern'],
        dimensions: { width: 2.4, height: 0.8, depth: 1.6 },
        image: 'https://picsum.photos/400/300?random=1',
        description: 'Удобный угловой диван в скандинавском стиле'
      },
      {
        id: 'table_001',
        name: 'Журнальный столик Лофт',
        category: 'furniture',
        price: 12000,
        style: ['loft', 'modern'],
        dimensions: { width: 1.2, height: 0.4, depth: 0.6 },
        image: 'https://picsum.photos/400/300?random=2',
        description: 'Стильный журнальный столик из дерева и металла'
      },
      {
        id: 'chair_001',
        name: 'Кресло Классик',
        category: 'furniture',
        price: 25000,
        style: ['classic', 'modern'],
        dimensions: { width: 0.8, height: 1.1, depth: 0.9 },
        image: 'https://picsum.photos/400/300?random=3',
        description: 'Элегантное кресло в классическом стиле'
      },
      {
        id: 'lamp_001',
        name: 'Торшер Минимализм',
        category: 'lighting',
        price: 8000,
        style: ['minimalist', 'modern'],
        dimensions: { width: 0.3, height: 1.6, depth: 0.3 },
        image: 'https://picsum.photos/400/300?random=4',
        description: 'Стильный торшер в стиле минимализм'
      },
      {
        id: 'plant_001',
        name: 'Фикус Бенджамина',
        category: 'plants',
        price: 3500,
        style: ['scandinavian', 'modern', 'minimalist'],
        dimensions: { width: 0.4, height: 1.2, depth: 0.4 },
        image: 'https://picsum.photos/400/300?random=5',
        description: 'Живое растение для уюта в доме'
      }
    ]
    
    return {
      success: true,
      furniture,
      source: 'local'
    }
  }

  /**
   * Проверка доступности бесплатных API
   */
  static async checkFreeApisStatus() {
    const results = {
      unsplash: false,
      jsonbin: false,
      picsum: true // Всегда работает
    }
    
    // Проверяем Unsplash
    try {
      const response = await fetch('https://api.unsplash.com/photos?per_page=1')
      results.unsplash = response.status !== 401 && response.status !== 403
    } catch {
      results.unsplash = false
    }
    
    // Проверяем JSONBin
    try {
      const response = await fetch('https://api.jsonbin.io/v3/c')
      results.jsonbin = response.ok
    } catch {
      results.jsonbin = false
    }
    
    return results
  }
}