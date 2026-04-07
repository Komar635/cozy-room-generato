import { RoomProject, FurnitureItem } from '../../types/room'
import { ExportOptions, ExportResult } from '../../types/api'

export interface ProjectExportData {
  project: RoomProject
  exportDate: string
  version: string
  metadata: {
    totalItems: number
    totalCost: number
    roomArea: number
  }
}

export interface ItemListExport {
  items: Array<{
    name: string
    category: string
    price: number
    quantity: number
    subtotal: number
  }>
  summary: {
    totalItems: number
    totalCost: number
    averagePrice: number
  }
}

export class ExportService {
  private static readonly VERSION = '1.0.0'

  /**
   * Экспорт проекта в JSON файл
   */
  static async exportProjectToJSON(project: RoomProject): Promise<ExportResult> {
    try {
      const exportData: ProjectExportData = {
        project,
        exportDate: new Date().toISOString(),
        version: this.VERSION,
        metadata: {
          totalItems: project.furniture.length,
          totalCost: project.furniture.reduce((sum, item) => sum + item.price, 0),
          roomArea: project.roomDimensions.width * project.roomDimensions.depth
        }
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
        error: `Ошибка экспорта в JSON: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      }
    }
  }

  /**
   * Импорт проекта из JSON файла
   */
  static async importProjectFromJSON(file: File): Promise<{ success: boolean; project?: RoomProject; error?: string }> {
    try {
      const text = await file.text()
      const data: ProjectExportData = JSON.parse(text)

      // Валидация структуры файла
      if (!data.project || !data.version) {
        throw new Error('Неверный формат файла проекта')
      }

      // Проверка совместимости версий
      if (data.version !== this.VERSION) {
        console.warn(`Версия файла (${data.version}) отличается от текущей (${this.VERSION})`)
      }

      // Валидация обязательных полей проекта
      const project = data.project
      if (!project.id || !project.name || !project.roomDimensions || !Array.isArray(project.furniture)) {
        throw new Error('Неполные данные проекта')
      }

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
        error: `Ошибка импорта: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      }
    }
  }

  /**
   * Экспорт списка предметов с ценами
   */
  static exportItemList(furniture: FurnitureItem[]): ItemListExport {
    // Группировка одинаковых предметов
    const itemGroups = new Map<string, { item: FurnitureItem; quantity: number }>()
    
    furniture.forEach(item => {
      const key = `${item.name}_${item.price}`
      if (itemGroups.has(key)) {
        itemGroups.get(key)!.quantity++
      } else {
        itemGroups.set(key, { item, quantity: 1 })
      }
    })

    const items = Array.from(itemGroups.values()).map(({ item, quantity }) => ({
      name: item.name,
      category: item.category,
      price: item.price,
      quantity,
      subtotal: item.price * quantity
    }))

    const totalCost = items.reduce((sum, item) => sum + item.subtotal, 0)
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

    return {
      items,
      summary: {
        totalItems,
        totalCost,
        averagePrice: totalItems > 0 ? totalCost / totalItems : 0
      }
    }
  }

  /**
   * Экспорт списка предметов в CSV формат
   */
  static exportItemListToCSV(furniture: FurnitureItem[]): ExportResult {
    try {
      const itemList = this.exportItemList(furniture)
      
      const headers = ['Название', 'Категория', 'Цена за единицу', 'Количество', 'Сумма']
      const csvRows = [
        headers.join(','),
        ...itemList.items.map(item => [
          `"${item.name}"`,
          `"${item.category}"`,
          item.price.toString(),
          item.quantity.toString(),
          item.subtotal.toString()
        ].join(',')),
        '', // Пустая строка
        'Итого:',
        `Всего предметов:,${itemList.summary.totalItems}`,
        `Общая стоимость:,${itemList.summary.totalCost}`,
        `Средняя цена:,${itemList.summary.averagePrice.toFixed(2)}`
      ]

      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

      return {
        success: true,
        data: blob
      }
    } catch (error) {
      return {
        success: false,
        error: `Ошибка экспорта в CSV: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      }
    }
  }

  /**
   * Скачивание файла
   */
  static downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Генерация имени файла для экспорта
   */
  static generateFilename(project: RoomProject, extension: string): string {
    const date = new Date().toISOString().split('T')[0]
    const safeName = project.name.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')
    return `${safeName}_${date}.${extension}`
  }
}