import { RoomProject } from '../../types/room'

export interface StoredProject {
  id: string
  name: string
  lastModified: string
  size: number // размер в байтах
}

export class LocalStorageService {
  private static readonly PROJECT_PREFIX = 'room_project_'
  private static readonly PROJECT_LIST_KEY = 'room_projects_list'
  private static readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024 // 5MB лимит

  /**
   * Сохранение проекта в localStorage
   */
  static saveProject(project: RoomProject): { success: boolean; error?: string } {
    try {
      const projectData = JSON.stringify(project)
      const projectSize = new Blob([projectData]).size

      // Проверка размера
      if (projectSize > this.MAX_STORAGE_SIZE) {
        return {
          success: false,
          error: 'Проект слишком большой для локального сохранения'
        }
      }

      // Проверка доступного места
      const availableSpace = this.getAvailableSpace()
      if (projectSize > availableSpace) {
        return {
          success: false,
          error: 'Недостаточно места в локальном хранилище'
        }
      }

      const key = this.PROJECT_PREFIX + project.id
      localStorage.setItem(key, projectData)

      // Обновление списка проектов
      this.updateProjectsList(project, projectSize)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: `Ошибка сохранения: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      }
    }
  }

  /**
   * Загрузка проекта из localStorage
   */
  static loadProject(projectId: string): { success: boolean; project?: RoomProject; error?: string } {
    try {
      const key = this.PROJECT_PREFIX + projectId
      const projectData = localStorage.getItem(key)

      if (!projectData) {
        return {
          success: false,
          error: 'Проект не найден'
        }
      }

      const project: RoomProject = JSON.parse(projectData)
      
      // Восстановление дат
      project.createdAt = new Date(project.createdAt)
      project.updatedAt = new Date(project.updatedAt)

      return {
        success: true,
        project
      }
    } catch (error) {
      return {
        success: false,
        error: `Ошибка загрузки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      }
    }
  }

  /**
   * Удаление проекта из localStorage
   */
  static deleteProject(projectId: string): { success: boolean; error?: string } {
    try {
      const key = this.PROJECT_PREFIX + projectId
      localStorage.removeItem(key)

      // Обновление списка проектов
      const projectsList = this.getProjectsList()
      const updatedList = projectsList.filter(p => p.id !== projectId)
      localStorage.setItem(this.PROJECT_LIST_KEY, JSON.stringify(updatedList))

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: `Ошибка удаления: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      }
    }
  }

  /**
   * Получение списка сохраненных проектов
   */
  static getProjectsList(): StoredProject[] {
    try {
      const listData = localStorage.getItem(this.PROJECT_LIST_KEY)
      return listData ? JSON.parse(listData) : []
    } catch (error) {
      console.error('Ошибка получения списка проектов:', error)
      return []
    }
  }

  /**
   * Проверка существования проекта
   */
  static projectExists(projectId: string): boolean {
    const key = this.PROJECT_PREFIX + projectId
    return localStorage.getItem(key) !== null
  }

  /**
   * Получение информации о хранилище
   */
  static getStorageInfo(): {
    used: number
    available: number
    total: number
    projectsCount: number
  } {
    const projectsList = this.getProjectsList()
    const used = projectsList.reduce((sum, project) => sum + project.size, 0)
    const available = this.MAX_STORAGE_SIZE - used
    
    return {
      used,
      available,
      total: this.MAX_STORAGE_SIZE,
      projectsCount: projectsList.length
    }
  }

  /**
   * Очистка всех проектов
   */
  static clearAllProjects(): { success: boolean; error?: string } {
    try {
      const projectsList = this.getProjectsList()
      
      // Удаление всех проектов
      projectsList.forEach(project => {
        const key = this.PROJECT_PREFIX + project.id
        localStorage.removeItem(key)
      })

      // Очистка списка
      localStorage.removeItem(this.PROJECT_LIST_KEY)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: `Ошибка очистки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      }
    }
  }

  /**
   * Экспорт всех проектов в один файл
   */
  static exportAllProjects(): { success: boolean; data?: Blob; error?: string } {
    try {
      const projectsList = this.getProjectsList()
      const projects: RoomProject[] = []

      // Загрузка всех проектов
      for (const storedProject of projectsList) {
        const result = this.loadProject(storedProject.id)
        if (result.success && result.project) {
          projects.push(result.project)
        }
      }

      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        projects
      }

      const jsonString = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })

      return {
        success: true,
        data: blob
      }
    } catch (error) {
      return {
        success: false,
        error: `Ошибка экспорта: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      }
    }
  }

  // Приватные методы

  private static updateProjectsList(project: RoomProject, size: number): void {
    const projectsList = this.getProjectsList()
    const existingIndex = projectsList.findIndex(p => p.id === project.id)

    const storedProject: StoredProject = {
      id: project.id,
      name: project.name,
      lastModified: new Date().toISOString(),
      size
    }

    if (existingIndex >= 0) {
      projectsList[existingIndex] = storedProject
    } else {
      projectsList.push(storedProject)
    }

    localStorage.setItem(this.PROJECT_LIST_KEY, JSON.stringify(projectsList))
  }

  private static getAvailableSpace(): number {
    const storageInfo = this.getStorageInfo()
    return storageInfo.available
  }
}