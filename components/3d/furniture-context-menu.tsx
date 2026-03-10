'use client'

import { useState, useEffect } from 'react'
import { FurnitureItem } from '@/types/room'
import { useRoomStore } from '@/store/room-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  RotateCw, 
  Copy, 
  Trash2, 
  Move, 
  ZoomIn, 
  ZoomOut,
  Settings
} from 'lucide-react'

interface FurnitureContextMenuProps {
  item: FurnitureItem | null
  position: { x: number; y: number }
  visible: boolean
  onClose: () => void
  onRotate?: (item: FurnitureItem) => void
  onCopy?: (item: FurnitureItem) => void
  onDelete?: (item: FurnitureItem) => void
  onScale?: (item: FurnitureItem, scale: number) => void
}

export function FurnitureContextMenu({
  item,
  position,
  visible,
  onClose,
  onRotate,
  onCopy,
  onDelete,
  onScale
}: FurnitureContextMenuProps) {
  const { removeFurniture, addFurniture, updateFurniture } = useRoomStore()
  const [scale, setScale] = useState(1)

  useEffect(() => {
    if (visible) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement
        if (!target.closest('[data-context-menu]')) {
          onClose()
        }
      }

      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [visible, onClose])

  if (!visible || !item) return null

  const handleRotate = () => {
    const newRotation = {
      ...item.rotation,
      y: item.rotation.y + Math.PI / 2
    }
    
    updateFurniture(item.id, { rotation: newRotation })
    
    if (onRotate) {
      onRotate({ ...item, rotation: newRotation })
    }
    
    onClose()
  }

  const handleCopy = () => {
    const newItem: FurnitureItem = {
      ...item,
      id: `${item.id.split('_')[0]}_${Date.now()}`,
      position: {
        x: item.position.x + 0.5,
        y: item.position.y,
        z: item.position.z + 0.5
      }
    }
    
    addFurniture(newItem)
    
    if (onCopy) {
      onCopy(newItem)
    }
    
    onClose()
  }

  const handleDelete = () => {
    removeFurniture(item.id)
    
    if (onDelete) {
      onDelete(item)
    }
    
    onClose()
  }

  const handleScaleUp = () => {
    const newScale = Math.min(scale + 0.1, 2.0)
    setScale(newScale)
    
    // Обновляем размеры предмета
    const newDimensions = {
      width: item.dimensions.width * newScale,
      height: item.dimensions.height * newScale,
      depth: item.dimensions.depth * newScale
    }
    
    updateFurniture(item.id, { dimensions: newDimensions })
    
    if (onScale) {
      onScale(item, newScale)
    }
  }

  const handleScaleDown = () => {
    const newScale = Math.max(scale - 0.1, 0.5)
    setScale(newScale)
    
    // Обновляем размеры предмета
    const newDimensions = {
      width: item.dimensions.width * newScale,
      height: item.dimensions.height * newScale,
      depth: item.dimensions.depth * newScale
    }
    
    updateFurniture(item.id, { dimensions: newDimensions })
    
    if (onScale) {
      onScale(item, newScale)
    }
  }

  return (
    <Card
      data-context-menu
      className="absolute z-50 shadow-lg border"
      style={{
        left: position.x,
        top: position.y,
        minWidth: '200px'
      }}
    >
      <CardContent className="p-2">
        <div className="space-y-1">
          {/* Заголовок */}
          <div className="px-2 py-1 text-sm font-medium text-gray-700 border-b">
            {item.name}
          </div>
          
          {/* Поворот */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={handleRotate}
          >
            <RotateCw className="h-4 w-4 mr-2" />
            Повернуть на 90°
          </Button>
          
          {/* Копирование */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4 mr-2" />
            Копировать
          </Button>
          
          {/* Масштабирование */}
          <div className="flex items-center gap-1 px-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleScaleDown}
              disabled={scale <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <span className="text-xs text-gray-600 flex-1 text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleScaleUp}
              disabled={scale >= 2.0}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Разделитель */}
          <div className="border-t my-1" />
          
          {/* Удаление */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Удалить
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}