'use client'

import { useState, useEffect } from 'react'
import { useRoomStore } from '@/store/room-store'
import { RoomDimensions } from '@/types/room'
import { ROOM_CONSTANTS } from '@/lib/constants'
import { RoomApiService } from '@/lib/services/room-api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface RoomCreatorProps {
  onRoomCreated?: (dimensions: RoomDimensions) => void
}

export default function RoomCreator({ onRoomCreated }: RoomCreatorProps) {
  const { roomDimensions, setRoomDimensions } = useRoomStore()
  
  // Локальное состояние для формы
  const [formData, setFormData] = useState<RoomDimensions>(roomDimensions)
  const [errors, setErrors] = useState<Partial<Record<keyof RoomDimensions, string>>>({})
  const [isValid, setIsValid] = useState(true)
  const [isValidating, setIsValidating] = useState(false)
  const [serverCalculations, setServerCalculations] = useState<any>(null)

  // Валидация размеров
  const validateDimension = (value: number, fieldName: keyof RoomDimensions): string | null => {
    if (isNaN(value) || value <= 0) {
      return 'Значение должно быть положительным числом'
    }
    if (value < ROOM_CONSTANTS.MIN_DIMENSION) {
      return `Минимальный размер: ${ROOM_CONSTANTS.MIN_DIMENSION} м`
    }
    if (value > ROOM_CONSTANTS.MAX_DIMENSION) {
      return `Максимальный размер: ${ROOM_CONSTANTS.MAX_DIMENSION} м`
    }
    return null
  }

  // Валидация всей формы
  const validateForm = (dimensions: RoomDimensions) => {
    const newErrors: Partial<Record<keyof RoomDimensions, string>> = {}
    
    const widthError = validateDimension(dimensions.width, 'width')
    const heightError = validateDimension(dimensions.height, 'height')
    const depthError = validateDimension(dimensions.depth, 'depth')
    
    if (widthError) newErrors.width = widthError
    if (heightError) newErrors.height = heightError
    if (depthError) newErrors.depth = depthError
    
    setErrors(newErrors)
    const valid = Object.keys(newErrors).length === 0
    setIsValid(valid)
    return valid
  }

  // Обработка изменения значений
  const handleInputChange = (field: keyof RoomDimensions, value: string) => {
    const numValue = parseFloat(value) || 0
    const newFormData = { ...formData, [field]: numValue }
    setFormData(newFormData)
    
    // Валидация в реальном времени
    validateForm(newFormData)
    
    // Обновление store в реальном времени для предпросмотра
    setRoomDimensions(newFormData)
  }

  // Валидация через API
  const validateWithServer = async (dimensions: RoomDimensions) => {
    try {
      setIsValidating(true)
      const result = await RoomApiService.validateRoom(dimensions)
      
      if (result.success) {
        setServerCalculations(result.data.calculations)
        setErrors({})
        setIsValid(true)
        return true
      }
    } catch (error: any) {
      console.error('Ошибка валидации:', error)
      if (error.message.includes('400')) {
        setErrors({ width: 'Ошибка валидации на сервере' })
      }
      setIsValid(false)
      return false
    } finally {
      setIsValidating(false)
    }
  }

  // Применение размеров
  const handleApplyDimensions = async () => {
    if (validateForm(formData)) {
      const serverValid = await validateWithServer(formData)
      if (serverValid) {
        setRoomDimensions(formData)
        onRoomCreated?.(formData)
      }
    }
  }

  // Сброс к значениям по умолчанию
  const handleReset = () => {
    const defaultDimensions: RoomDimensions = {
      width: ROOM_CONSTANTS.DEFAULT_WIDTH,
      height: ROOM_CONSTANTS.DEFAULT_HEIGHT,
      depth: ROOM_CONSTANTS.DEFAULT_DEPTH
    }
    setFormData(defaultDimensions)
    setRoomDimensions(defaultDimensions)
    setErrors({})
    setIsValid(true)
  }

  // Синхронизация с store при изменении извне
  useEffect(() => {
    setFormData(roomDimensions)
    validateForm(roomDimensions)
  }, [roomDimensions])

  // Расчет площади и объема для предпросмотра
  const floorArea = formData.width * formData.depth
  const volume = formData.width * formData.height * formData.depth

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Создание комнаты</CardTitle>
        <CardDescription>
          Укажите размеры комнаты в метрах. Изменения отображаются в реальном времени.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Поле ширины */}
        <div className="space-y-2">
          <Label htmlFor="width">Ширина (м)</Label>
          <Input
            id="width"
            type="number"
            min={ROOM_CONSTANTS.MIN_DIMENSION}
            max={ROOM_CONSTANTS.MAX_DIMENSION}
            step="0.1"
            value={formData.width}
            onChange={(e) => handleInputChange('width', e.target.value)}
            className={errors.width ? 'border-red-500' : ''}
            placeholder="Введите ширину"
          />
          {errors.width && (
            <p className="text-sm text-red-500">{errors.width}</p>
          )}
        </div>

        {/* Поле высоты */}
        <div className="space-y-2">
          <Label htmlFor="height">Высота (м)</Label>
          <Input
            id="height"
            type="number"
            min={ROOM_CONSTANTS.MIN_DIMENSION}
            max={ROOM_CONSTANTS.MAX_DIMENSION}
            step="0.1"
            value={formData.height}
            onChange={(e) => handleInputChange('height', e.target.value)}
            className={errors.height ? 'border-red-500' : ''}
            placeholder="Введите высоту"
          />
          {errors.height && (
            <p className="text-sm text-red-500">{errors.height}</p>
          )}
        </div>

        {/* Поле глубины */}
        <div className="space-y-2">
          <Label htmlFor="depth">Глубина (м)</Label>
          <Input
            id="depth"
            type="number"
            min={ROOM_CONSTANTS.MIN_DIMENSION}
            max={ROOM_CONSTANTS.MAX_DIMENSION}
            step="0.1"
            value={formData.depth}
            onChange={(e) => handleInputChange('depth', e.target.value)}
            className={errors.depth ? 'border-red-500' : ''}
            placeholder="Введите глубину"
          />
          {errors.depth && (
            <p className="text-sm text-red-500">{errors.depth}</p>
          )}
        </div>

        {/* Предпросмотр размеров */}
        {isValid && (
          <div className="p-3 bg-muted rounded-md space-y-1">
            <h4 className="font-medium text-sm">Предпросмотр:</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Размеры: {formData.width} × {formData.height} × {formData.depth} м</p>
              {serverCalculations ? (
                <>
                  <p>Площадь пола: {serverCalculations.floorArea} м² (сервер)</p>
                  <p>Объем: {serverCalculations.volume} м³ (сервер)</p>
                  <p>Периметр: {serverCalculations.perimeter} м</p>
                </>
              ) : (
                <>
                  <p>Площадь пола: {floorArea.toFixed(1)} м² (локально)</p>
                  <p>Объем: {volume.toFixed(1)} м³ (локально)</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Кнопки управления */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleApplyDimensions}
            disabled={!isValid || isValidating}
            className="flex-1"
          >
            {isValidating ? 'Проверка...' : 'Применить'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="flex-1"
            disabled={isValidating}
          >
            Сброс
          </Button>
        </div>

        {/* Подсказки */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Размеры от {ROOM_CONSTANTS.MIN_DIMENSION} до {ROOM_CONSTANTS.MAX_DIMENSION} метров</p>
          <p>• Изменения отображаются в 3D сцене в реальном времени</p>
          <p>• Используйте шаг 0.1 м для точной настройки</p>
        </div>
      </CardContent>
    </Card>
  )
}