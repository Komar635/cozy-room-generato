'use client'

import { useState, useEffect } from 'react'
import { FurnitureItem, Vector3 } from '@/types/room'
import { useRoomStore } from '@/store/room-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Move, RotateCw, Maximize2 } from 'lucide-react'

interface PositionControlsProps {
  item: FurnitureItem | null
  onPositionChange?: (item: FurnitureItem, position: Vector3) => void
  onRotationChange?: (item: FurnitureItem, rotation: Vector3) => void
  onScaleChange?: (item: FurnitureItem, scale: number) => void
  className?: string
}

export function PositionControls({
  item,
  onPositionChange,
  onRotationChange,
  onScaleChange,
  className = ''
}: PositionControlsProps) {
  const { updateFurniture, roomDimensions } = useRoomStore()
  
  const [position, setPosition] = useState<Vector3>({ x: 0, y: 0, z: 0 })
  const [rotation, setRotation] = useState<Vector3>({ x: 0, y: 0, z: 0 })
  const [scale, setScale] = useState(1)

  // Обновляем локальное состояние при изменении выбранного предмета
  useEffect(() => {
    if (item) {
      setPosition(item.position)
      setRotation(item.rotation)
      // Вычисляем текущий масштаб (предполагаем, что изначальные размеры сохранены)
      setScale(1) // Упрощенно, можно добавить сохранение оригинальных размеров
    }
  }, [item])

  if (!item) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500 text-center">
            Выберите предмет для редактирования
          </p>
        </CardContent>
      </Card>
    )
  }

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: string) => {
    const numValue = parseFloat(value) || 0
    const newPosition = { ...position, [axis]: numValue }
    
    // Проверяем границы комнаты
    const maxX = roomDimensions.width - item.dimensions.width
    const maxZ = roomDimensions.depth - item.dimensions.depth
    const maxY = roomDimensions.height - item.dimensions.height
    
    newPosition.x = Math.max(0, Math.min(maxX, newPosition.x))
    newPosition.y = Math.max(0, Math.min(maxY, newPosition.y))
    newPosition.z = Math.max(0, Math.min(maxZ, newPosition.z))
    
    setPosition(newPosition)
    updateFurniture(item.id, { position: newPosition })
    
    if (onPositionChange) {
      onPositionChange(item, newPosition)
    }
  }

  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: string) => {
    const numValue = (parseFloat(value) || 0) * (Math.PI / 180) // Конвертируем градусы в радианы
    const newRotation = { ...rotation, [axis]: numValue }
    
    setRotation(newRotation)
    updateFurniture(item.id, { rotation: newRotation })
    
    if (onRotationChange) {
      onRotationChange(item, newRotation)
    }
  }

  const handleScaleChange = (value: string) => {
    const numValue = Math.max(0.1, Math.min(3.0, parseFloat(value) || 1))
    setScale(numValue)
    
    // Обновляем размеры предмета
    const originalDimensions = item.dimensions // Предполагаем, что это оригинальные размеры
    const newDimensions = {
      width: originalDimensions.width * numValue,
      height: originalDimensions.height * numValue,
      depth: originalDimensions.depth * numValue
    }
    
    updateFurniture(item.id, { dimensions: newDimensions })
    
    if (onScaleChange) {
      onScaleChange(item, numValue)
    }
  }

  const resetPosition = () => {
    const centerPosition = {
      x: roomDimensions.width / 2 - item.dimensions.width / 2,
      y: 0,
      z: roomDimensions.depth / 2 - item.dimensions.depth / 2
    }
    
    setPosition(centerPosition)
    updateFurniture(item.id, { position: centerPosition })
    
    if (onPositionChange) {
      onPositionChange(item, centerPosition)
    }
  }

  const resetRotation = () => {
    const zeroRotation = { x: 0, y: 0, z: 0 }
    setRotation(zeroRotation)
    updateFurniture(item.id, { rotation: zeroRotation })
    
    if (onRotationChange) {
      onRotationChange(item, zeroRotation)
    }
  }

  const resetScale = () => {
    setScale(1)
    // Восстанавливаем оригинальные размеры
    updateFurniture(item.id, { dimensions: item.dimensions })
    
    if (onScaleChange) {
      onScaleChange(item, 1)
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Move className="h-5 w-5" />
          Точное позиционирование
        </CardTitle>
        <p className="text-sm text-gray-600">{item.name}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Позиция */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">Позиция (м)</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={resetPosition}
              className="text-xs"
            >
              По центру
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="pos-x" className="text-xs text-gray-500">X</Label>
              <Input
                id="pos-x"
                type="number"
                step="0.1"
                min="0"
                max={roomDimensions.width - item.dimensions.width}
                value={position.x.toFixed(1)}
                onChange={(e) => handlePositionChange('x', e.target.value)}
                className="text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="pos-y" className="text-xs text-gray-500">Y</Label>
              <Input
                id="pos-y"
                type="number"
                step="0.1"
                min="0"
                max={roomDimensions.height - item.dimensions.height}
                value={position.y.toFixed(1)}
                onChange={(e) => handlePositionChange('y', e.target.value)}
                className="text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="pos-z" className="text-xs text-gray-500">Z</Label>
              <Input
                id="pos-z"
                type="number"
                step="0.1"
                min="0"
                max={roomDimensions.depth - item.dimensions.depth}
                value={position.z.toFixed(1)}
                onChange={(e) => handlePositionChange('z', e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Поворот */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">Поворот (°)</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={resetRotation}
              className="text-xs"
            >
              Сбросить
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="rot-x" className="text-xs text-gray-500">X</Label>
              <Input
                id="rot-x"
                type="number"
                step="15"
                min="-180"
                max="180"
                value={Math.round(rotation.x * (180 / Math.PI))}
                onChange={(e) => handleRotationChange('x', e.target.value)}
                className="text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="rot-y" className="text-xs text-gray-500">Y</Label>
              <Input
                id="rot-y"
                type="number"
                step="15"
                min="-180"
                max="180"
                value={Math.round(rotation.y * (180 / Math.PI))}
                onChange={(e) => handleRotationChange('y', e.target.value)}
                className="text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="rot-z" className="text-xs text-gray-500">Z</Label>
              <Input
                id="rot-z"
                type="number"
                step="15"
                min="-180"
                max="180"
                value={Math.round(rotation.z * (180 / Math.PI))}
                onChange={(e) => handleRotationChange('z', e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Масштаб */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">Масштаб</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={resetScale}
              className="text-xs"
            >
              100%
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.1"
              min="0.1"
              max="3.0"
              value={scale.toFixed(1)}
              onChange={(e) => handleScaleChange(e.target.value)}
              className="text-sm"
            />
            <span className="text-xs text-gray-500 whitespace-nowrap">
              (10% - 300%)
            </span>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRotationChange('y', String((rotation.y * (180 / Math.PI) + 90) % 360))}
            className="flex-1"
          >
            <RotateCw className="h-4 w-4 mr-1" />
            90°
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleScaleChange('1.2')}
            className="flex-1"
          >
            <Maximize2 className="h-4 w-4 mr-1" />
            +20%
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}