import * as THREE from 'three'

export interface ImageExportOptions {
  width?: number
  height?: number
  quality?: number // 0.1 - 1.0
  format?: 'png' | 'jpeg' | 'webp'
  backgroundColor?: string
}

export interface CameraSettings {
  position: THREE.Vector3
  target: THREE.Vector3
  fov?: number
}

export class ImageExportService {
  private static readonly DEFAULT_OPTIONS: Required<ImageExportOptions> = {
    width: 1920,
    height: 1080,
    quality: 0.9,
    format: 'png',
    backgroundColor: '#ffffff'
  }

  /**
   * Экспорт 3D сцены в изображение
   */
  static async exportSceneToImage(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    options: ImageExportOptions = {}
  ): Promise<{ success: boolean; blob?: Blob; error?: string }> {
    try {
      const opts = { ...this.DEFAULT_OPTIONS, ...options }
      
      // Сохранение текущих настроек рендерера
      const originalSize = renderer.getSize(new THREE.Vector2())
      const originalPixelRatio = renderer.getPixelRatio()

      // Настройка рендерера для экспорта
      renderer.setSize(opts.width, opts.height)
      renderer.setPixelRatio(1) // Для четкого изображения

      // Рендеринг сцены
      renderer.render(scene, camera)

      // Получение данных изображения
      const canvas = renderer.domElement
      const blob = await this.canvasToBlob(canvas, opts)

      // Восстановление настроек рендерера
      renderer.setSize(originalSize.x, originalSize.y)
      renderer.setPixelRatio(originalPixelRatio)

      return {
        success: true,
        blob
      }
    } catch (error) {
      return {
        success: false,
        error: `Ошибка экспорта изображения: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      }
    }
  }

  /**
   * Создание превью изображения с несколькими ракурсами
   */
  static async createMultiViewPreview(
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    roomDimensions: { width: number; height: number; depth: number },
    options: ImageExportOptions = {}
  ): Promise<{ success: boolean; blob?: Blob; error?: string }> {
    try {
      const opts = { ...this.DEFAULT_OPTIONS, ...options }
      
      // Создание камер для разных ракурсов
      const cameras = this.createPreviewCameras(roomDimensions)
      
      // Создание canvas для композиции
      const compositeCanvas = document.createElement('canvas')
      const ctx = compositeCanvas.getContext('2d')!
      
      const viewWidth = opts.width / 2
      const viewHeight = opts.height / 2
      
      compositeCanvas.width = opts.width
      compositeCanvas.height = opts.height
      
      // Заливка фона
      ctx.fillStyle = opts.backgroundColor
      ctx.fillRect(0, 0, opts.width, opts.height)

      // Рендеринг каждого ракурса
      const originalSize = renderer.getSize(new THREE.Vector2())
      renderer.setSize(viewWidth, viewHeight)

      for (let i = 0; i < cameras.length; i++) {
        renderer.render(scene, cameras[i])
        
        const x = (i % 2) * viewWidth
        const y = Math.floor(i / 2) * viewHeight
        
        ctx.drawImage(renderer.domElement, x, y, viewWidth, viewHeight)
      }

      // Восстановление размера рендерера
      renderer.setSize(originalSize.x, originalSize.y)

      // Конвертация в blob
      const blob = await this.canvasToBlob(compositeCanvas, opts)

      return {
        success: true,
        blob
      }
    } catch (error) {
      return {
        success: false,
        error: `Ошибка создания превью: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      }
    }
  }

  /**
   * Экспорт с оптимальным ракурсом комнаты
   */
  static async exportOptimalView(
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    roomDimensions: { width: number; height: number; depth: number },
    options: ImageExportOptions = {}
  ): Promise<{ success: boolean; blob?: Blob; error?: string }> {
    try {
      // Создание оптимальной камеры
      const camera = this.createOptimalCamera(roomDimensions)
      
      return await this.exportSceneToImage(scene, camera, renderer, options)
    } catch (error) {
      return {
        success: false,
        error: `Ошибка экспорта оптимального вида: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      }
    }
  }

  // Приватные методы

  private static async canvasToBlob(
    canvas: HTMLCanvasElement,
    options: Required<ImageExportOptions>
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const mimeType = `image/${options.format}`
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Не удалось создать blob из canvas'))
          }
        },
        mimeType,
        options.quality
      )
    })
  }

  private static createPreviewCameras(roomDimensions: { width: number; height: number; depth: number }): THREE.PerspectiveCamera[] {
    const { width, height, depth } = roomDimensions
    const maxDim = Math.max(width, depth)
    const distance = maxDim * 1.5

    const cameras: THREE.PerspectiveCamera[] = []

    // Изометрический вид (сверху-спереди-справа)
    const isoCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
    isoCamera.position.set(distance * 0.7, height * 1.2, distance * 0.7)
    isoCamera.lookAt(width / 2, 0, depth / 2)
    cameras.push(isoCamera)

    // Вид спереди
    const frontCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
    frontCamera.position.set(width / 2, height / 2, distance)
    frontCamera.lookAt(width / 2, height / 2, 0)
    cameras.push(frontCamera)

    // Вид сбоку
    const sideCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
    sideCamera.position.set(distance, height / 2, depth / 2)
    sideCamera.lookAt(0, height / 2, depth / 2)
    cameras.push(sideCamera)

    // Вид сверху
    const topCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
    topCamera.position.set(width / 2, height * 2, depth / 2)
    topCamera.lookAt(width / 2, 0, depth / 2)
    cameras.push(topCamera)

    return cameras
  }

  private static createOptimalCamera(roomDimensions: { width: number; height: number; depth: number }): THREE.PerspectiveCamera {
    const { width, height, depth } = roomDimensions
    const maxDim = Math.max(width, depth)
    const distance = maxDim * 1.2

    const camera = new THREE.PerspectiveCamera(60, 16/9, 0.1, 1000)
    
    // Позиция для красивого изометрического вида
    camera.position.set(
      width * 0.8,
      height * 0.8,
      depth * 0.8
    )
    
    // Смотрим в центр комнаты
    camera.lookAt(width / 2, height / 3, depth / 2)
    
    return camera
  }

  /**
   * Получение оптимальных настроек камеры для комнаты
   */
  static getOptimalCameraSettings(roomDimensions: { width: number; height: number; depth: number }): CameraSettings {
    const { width, height, depth } = roomDimensions
    
    return {
      position: new THREE.Vector3(width * 0.8, height * 0.8, depth * 0.8),
      target: new THREE.Vector3(width / 2, height / 3, depth / 2),
      fov: 60
    }
  }

  /**
   * Создание водяного знака на изображении
   */
  static addWatermark(
    canvas: HTMLCanvasElement,
    text: string = 'Создатель Уютных Комнат',
    options: {
      position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
      fontSize?: number
      color?: string
      opacity?: number
    } = {}
  ): void {
    const ctx = canvas.getContext('2d')!
    const opts = {
      position: 'bottom-right' as const,
      fontSize: 16,
      color: '#ffffff',
      opacity: 0.7,
      ...options
    }

    ctx.save()
    
    ctx.font = `${opts.fontSize}px Arial`
    ctx.fillStyle = opts.color
    ctx.globalAlpha = opts.opacity
    
    const textMetrics = ctx.measureText(text)
    const textWidth = textMetrics.width
    const textHeight = opts.fontSize
    
    const padding = 10
    let x: number, y: number
    
    switch (opts.position) {
      case 'bottom-right':
        x = canvas.width - textWidth - padding
        y = canvas.height - padding
        break
      case 'bottom-left':
        x = padding
        y = canvas.height - padding
        break
      case 'top-right':
        x = canvas.width - textWidth - padding
        y = textHeight + padding
        break
      case 'top-left':
        x = padding
        y = textHeight + padding
        break
    }
    
    ctx.fillText(text, x, y)
    ctx.restore()
  }
}