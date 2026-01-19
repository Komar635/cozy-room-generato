import { RoomDimensions, RoomProject } from '@/types/room'

export class RoomApiService {
  private static baseUrl = '/api/room'

  /**
   * Валидация размеров комнаты на сервере
   */
  static async validateRoom(dimensions: RoomDimensions) {
    try {
      const response = await fetch(`${this.baseUrl}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dimensions),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Ошибка валидации')
      }

      return result
    } catch (error) {
      console.error('Ошибка валидации комнаты:', error)
      throw error
    }
  }

  /**
   * Сохранение проекта комнаты
   */
  static async saveProject(project: RoomProject) {
    try {
      const response = await fetch(`${this.baseUrl}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Ошибка сохранения')
      }

      return result.data
    } catch (error) {
      console.error('Ошибка сохранения проекта:', error)
      throw error
    }
  }

  /**
   * Загрузка проекта комнаты
   */
  static async loadProject(projectId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/save?id=${projectId}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Ошибка загрузки')
      }

      return result.data
    } catch (error) {
      console.error('Ошибка загрузки проекта:', error)
      throw error
    }
  }
}